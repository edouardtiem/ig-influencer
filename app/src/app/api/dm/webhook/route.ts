// ===========================================
// DM WEBHOOK — ManyChat → Elena AI
// ===========================================
// 
// This endpoint receives DMs from ManyChat and responds
// using Claude AI with Elena's personality.
//
// ManyChat Setup:
// 1. Create Custom Action in ManyChat
// 2. Set URL to: https://your-domain.com/api/dm/webhook
// 3. Map fields: subscriber.*, last_input_text
// 4. Use response in ManyChat action
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { processDM, ManyChateWebhookPayload } from '@/lib/elena-dm';
import { supabase } from '@/lib/supabase';

// Verify request is from ManyChat (optional security)
const MANYCHAT_WEBHOOK_SECRET = process.env.MANYCHAT_WEBHOOK_SECRET;

// ===========================================
// IN-MEMORY LOCK TO PREVENT RACE CONDITIONS
// ===========================================
// When multiple webhooks arrive simultaneously for the same user,
// only the first one should process. Others should skip.
// Key format: "userId:messageHash"
const processingLocks = new Map<string, number>();
const LOCK_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Try to acquire a lock for processing a message
 * Returns true if lock acquired, false if already processing
 */
function tryAcquireLock(userId: string, messageHash: string): boolean {
  const lockKey = `${userId}:${messageHash}`;
  const now = Date.now();
  
  // Clean up expired locks
  for (const [key, timestamp] of processingLocks.entries()) {
    if (now - timestamp > LOCK_TIMEOUT_MS) {
      processingLocks.delete(key);
    }
  }
  
  // Check if already locked
  if (processingLocks.has(lockKey)) {
    const lockTime = processingLocks.get(lockKey)!;
    if (now - lockTime < LOCK_TIMEOUT_MS) {
      console.log(`🔒 LOCK EXISTS for ${lockKey} (${Math.round((now - lockTime) / 1000)}s ago)`);
      return false;
    }
  }
  
  // Acquire lock
  processingLocks.set(lockKey, now);
  console.log(`🔓 LOCK ACQUIRED for ${lockKey}`);
  return true;
}

/**
 * Release a lock after processing
 */
function releaseLock(userId: string, messageHash: string): void {
  const lockKey = `${userId}:${messageHash}`;
  processingLocks.delete(lockKey);
  console.log(`🔓 LOCK RELEASED for ${lockKey}`);
}

/**
 * Simple hash function for message content
 */
function hashMessage(message: string): string {
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Check if DM system is paused
 */
async function isDMSystemPaused(): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('elena_settings')
      .select('value')
      .eq('key', 'dm_system')
      .single();
    
    return data?.value?.paused === true;
  } catch {
    // If error, assume not paused to avoid blocking
    return false;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // ===========================================
    // KILL SWITCH — Check if DM system is paused
    // ===========================================
    const paused = await isDMSystemPaused();
    if (paused) {
      console.log('⏸️ DM SYSTEM PAUSED — Not responding');
      return NextResponse.json({
        success: true,
        skip: true,
        response: '',
        reason: 'DM system paused',
      });
    }

    // Optional: Verify webhook secret
    if (MANYCHAT_WEBHOOK_SECRET) {
      const signature = request.headers.get('x-manychat-signature');
      // ManyChat doesn't use standard HMAC, so this is basic check
      // You can implement more robust verification if needed
      if (!signature && process.env.NODE_ENV === 'production') {
        console.warn('⚠️ Missing ManyChat signature in production');
      }
    }

    // Parse payload
    const rawPayload = await request.json();
    
    // Log full payload for debugging story replies
    console.log('📦 RAW PAYLOAD:', JSON.stringify(rawPayload, null, 2).substring(0, 1000));
    
    // Extract message text - try multiple fields for story replies
    // ManyChat may send story reply text in different fields
    const messageText = 
      rawPayload.last_input_text || 
      rawPayload.story_reply?.text ||
      rawPayload.story_mention?.text ||
      rawPayload.message?.text ||
      rawPayload.text ||
      // For story replies, check if there's an attachment with text
      rawPayload.last_message?.text ||
      rawPayload.attachment?.payload?.text ||
      '';
    
    // Build normalized payload
    const payload: ManyChateWebhookPayload = {
      ...rawPayload,
      last_input_text: messageText,
    };
    
    // Validate required fields
    if (!payload.subscriber?.id) {
      console.error('❌ Invalid payload: missing subscriber.id');
      console.error('Full payload:', JSON.stringify(rawPayload).substring(0, 500));
      return NextResponse.json(
        { error: 'Invalid payload: missing subscriber.id' },
        { status: 400 }
      );
    }
    
    // If no message text found, log and skip (don't error)
    if (!messageText || messageText.trim() === '') {
      console.warn('⚠️ No message text found in payload');
      console.warn('Payload keys:', Object.keys(rawPayload));
      console.warn('Full payload:', JSON.stringify(rawPayload).substring(0, 800));
      return NextResponse.json({
        success: true,
        skip: true,
        response: '',
        reason: 'No message text found - possibly unsupported message type',
      });
    }

    // Log incoming message
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📨 INCOMING DM`);
    console.log(`From: @${payload.subscriber.ig_username || payload.subscriber.name}`);
    console.log(`Message: "${payload.last_input_text}"`);
    console.log(`${'='.repeat(50)}`);

    // ===========================================
    // RACE CONDITION PREVENTION — In-Memory Lock
    // ===========================================
    const userId = payload.subscriber.id;
    const messageHash = hashMessage(messageText);
    
    if (!tryAcquireLock(userId, messageHash)) {
      console.log(`⚠️ RACE CONDITION BLOCKED — Another webhook is already processing this message`);
      return NextResponse.json({
        success: true,
        skip: true,
        response: '',
        reason: 'Race condition prevented - duplicate webhook blocked',
      });
    }

    // Process DM and generate response
    let result;
    try {
      result = await processDM(payload);
    } finally {
      // Always release lock after processing
      releaseLock(userId, messageHash);
    }

    // Check if we should skip (deduplication/cooldown)
    if (!result.response || result.response.trim() === '') {
      console.log(`\n⏭️ SKIPPING RESPONSE (deduplication/cooldown)`);
      console.log(`${'='.repeat(50)}\n`);
      
      // Return skip signal to ManyChat - don't send any message
      return NextResponse.json({
        success: true,
        skip: true,
        response: '',
        reason: result.analysis.modeReason,
      });
    }

    // Log response
    const duration = Date.now() - startTime;
    console.log(`\n✅ RESPONSE GENERATED (${duration}ms)`);
    console.log(`Strategy: ${result.strategy}`);
    console.log(`Stage: ${result.contact.stage}`);
    console.log(`Response: "${result.response.substring(0, 100)}..."`);
    if (result.shouldStop) {
      console.log(`🛑 CONVERSATION LIMIT REACHED - Will stop after this message`);
    }
    console.log(`${'='.repeat(50)}\n`);

    // ⚠️ NO DELAY IN WEBHOOK - Vercel has 10s timeout!
    // Put delay in ManyChat flow using "Delay" block before Send Message
    // Recommended: 15-30 seconds delay in ManyChat
    
    // Calculate suggested delay for ManyChat (random 15-35s)
    const suggestedDelay = Math.round(15 + Math.random() * 20);

    // Return response in simple format for Response Mapping
    // The Send Message block will use {{elena_response}} from mapping
    // DO NOT use v2 format with messages[] as it auto-sends!
    return NextResponse.json({
      success: true,
      response: result.response,
      lead_stage: result.contact.stage,
      message_count: result.contact.message_count,
      strategy: result.strategy,
      should_stop: result.shouldStop || false,
      suggested_delay_seconds: suggestedDelay, // For ManyChat Delay block
    });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    
    // DON'T send fallback message - it creates loops when repeated
    // Instead, skip silently to avoid spamming the user
    return NextResponse.json({
      success: false,
      skip: true,
      response: '',
      reason: 'Webhook error - skipping to avoid fallback loop',
    });
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/dm/webhook',
    description: 'ManyChat webhook for Elena DM automation',
    usage: {
      method: 'POST',
      body: {
        subscriber: {
          id: 'string (required)',
          ig_username: 'string (optional)',
          name: 'string (optional)',
          profile_pic: 'string (optional)',
        },
        last_input_text: 'string (required)',
      },
    },
  });
}

