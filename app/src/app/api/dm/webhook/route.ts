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

    // Process DM and generate response
    const result = await processDM(payload);

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

    // Natural delay: 15-35 seconds with variance
    // This simulates a real person checking their phone, thinking, and typing
    const baseDelay = 15000; // 15 seconds minimum
    const variance = Math.random() * 20000; // 0-20 seconds variance
    const totalDelay = baseDelay + variance; // 15-35 seconds total
    
    const elapsed = Date.now() - startTime;
    const remainingDelay = Math.max(0, totalDelay - elapsed);
    
    if (remainingDelay > 0) {
      console.log(`⏳ Natural delay: ${Math.round(remainingDelay / 1000)}s`);
      await new Promise(resolve => setTimeout(resolve, remainingDelay));
    }

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
    });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    
    // Return fallback response for mapping
    return NextResponse.json({
      success: false,
      response: "Hey 🖤 Sorry, got distracted. What were you saying?",
      lead_stage: 'cold',
      message_count: 0,
      strategy: 'engage',
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

