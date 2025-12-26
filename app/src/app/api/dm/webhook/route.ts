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
    console.log(`${'='.repeat(50)}\n`);

    // Return response in ManyChat format
    // ManyChat expects a specific format for Custom Actions
    return NextResponse.json({
      version: 'v2',
      content: {
        messages: [
          {
            type: 'text',
            text: result.response,
          },
        ],
        // Optional: Set custom fields in ManyChat
        set_field_value: [
          {
            field_name: 'elena_lead_stage',
            value: result.contact.stage,
          },
          {
            field_name: 'elena_message_count',
            value: result.contact.message_count,
          },
        ],
      },
    });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    
    // Return error but still provide a response for ManyChat
    return NextResponse.json({
      version: 'v2',
      content: {
        messages: [
          {
            type: 'text',
            text: "Hey 🖤 Donne-moi une seconde, je reviens...",
          },
        ],
      },
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

