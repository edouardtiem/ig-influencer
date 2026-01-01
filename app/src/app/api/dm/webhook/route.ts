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

// Verify request is from ManyChat (optional security)
const MANYCHAT_WEBHOOK_SECRET = process.env.MANYCHAT_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
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
    const payload: ManyChateWebhookPayload = await request.json();
    
    // Validate required fields
    if (!payload.subscriber?.id || !payload.last_input_text) {
      console.error('❌ Invalid payload:', JSON.stringify(payload).substring(0, 200));
      return NextResponse.json(
        { error: 'Invalid payload: missing subscriber.id or last_input_text' },
        { status: 400 }
      );
    }

    // Log incoming message
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📨 INCOMING DM`);
    console.log(`From: @${payload.subscriber.ig_username || payload.subscriber.name}`);
    console.log(`Message: "${payload.last_input_text}"`);
    console.log(`${'='.repeat(50)}`);

    // Process DM and generate response
    const result = await processDM(payload);

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

