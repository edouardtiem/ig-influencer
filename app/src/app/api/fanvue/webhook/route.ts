/**
 * Fanvue Webhook Handler
 * 
 * Receives events from Fanvue and processes them:
 * - follower.created: Send welcome DM to convert free followers to subscribers
 * 
 * Webhook URL: https://ig-influencer.vercel.app/api/fanvue/webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  sendWelcomeDM, 
  verifyWebhookSignature, 
  initTokensFromEnv 
} from '@/lib/fanvue';
import { WELCOME_MESSAGE, WELCOME_PHOTO_URL } from '@/config/fanvue-welcome';

// Fanvue webhook event types
interface FanvueWebhookEvent {
  type: string;
  data: {
    id: string;
    user_id: string;
    username?: string;
    created_at: string;
    [key: string]: unknown;
  };
  timestamp: string;
}

export async function POST(request: NextRequest) {
  console.log('[Fanvue Webhook] Received event');
  
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    
    // Verify webhook signature
    const signature = request.headers.get('x-fanvue-signature') || '';
    const webhookSecret = process.env.FANVUE_WEBHOOK_SECRET;
    
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error('[Fanvue Webhook] Invalid signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }
    
    // Parse event
    const event: FanvueWebhookEvent = JSON.parse(rawBody);
    console.log(`[Fanvue Webhook] Event type: ${event.type}`);
    
    // Initialize tokens from env (for Vercel deployment)
    initTokensFromEnv();
    
    // Handle different event types
    switch (event.type) {
      case 'follower.created':
        return await handleNewFollower(event);
      
      case 'subscriber.created':
        // Could send a different thank you message for new paid subscribers
        console.log(`[Fanvue Webhook] New subscriber: ${event.data.username || event.data.user_id}`);
        return NextResponse.json({ received: true, action: 'subscriber_logged' });
      
      default:
        console.log(`[Fanvue Webhook] Unhandled event type: ${event.type}`);
        return NextResponse.json({ received: true, action: 'ignored' });
    }
    
  } catch (error) {
    console.error('[Fanvue Webhook] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Handle new free follower - send welcome DM to convert to subscriber
 */
async function handleNewFollower(event: FanvueWebhookEvent) {
  const { user_id, username } = event.data;
  
  console.log(`[Fanvue Webhook] New follower: ${username || user_id}`);
  
  // Send welcome DM with teaser photo
  const result = await sendWelcomeDM(
    user_id,
    WELCOME_MESSAGE,
    WELCOME_PHOTO_URL
  );
  
  if (result.success) {
    console.log(`[Fanvue Webhook] Welcome DM sent to ${username || user_id}`);
    return NextResponse.json({ 
      received: true, 
      action: 'welcome_dm_sent',
      chatId: result.chatId,
    });
  } else {
    console.error(`[Fanvue Webhook] Failed to send welcome DM: ${result.error}`);
    // Return 200 anyway to acknowledge receipt (don't retry)
    return NextResponse.json({ 
      received: true, 
      action: 'welcome_dm_failed',
      error: result.error,
    });
  }
}

// Also handle GET for webhook verification (if Fanvue requires it)
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get('challenge');
  
  if (challenge) {
    // Echo back the challenge for webhook verification
    return NextResponse.json({ challenge });
  }
  
  return NextResponse.json({ 
    status: 'Fanvue webhook endpoint',
    events: ['follower.created', 'subscriber.created'],
  });
}

