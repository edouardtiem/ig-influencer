/**
 * Fanvue Webhook Handler
 * 
 * Receives events from Fanvue and processes them:
 * - follower.created: Send welcome DM to convert free followers to subscribers
 * - message.created: Chat with fans using Venice AI (uncensored) + memory + PPV
 * - subscriber.created: Thank new paid subscribers
 * - tip.created: Thank for tips
 * - purchase.created: Track PPV purchases
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
import { isVeniceConfigured } from '@/lib/venice';
import { 
  processFanvueDM, 
  handleFanvuePurchase,
  FanvueWebhookPayload 
} from '@/lib/elena-dm-fanvue';

// Fanvue webhook event types
interface FanvueWebhookEvent {
  type: string;
  data: {
    id: string;
    user_id: string;
    username?: string;
    chat_id?: string;
    message?: string;
    amount?: number;
    postUuid?: string;
    price?: number;
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
    
    // Initialize tokens from Supabase (preferred) or env vars (fallback)
    await initTokensFromEnv();
    
    // Handle different event types
    switch (event.type) {
      case 'follower.created':
        return await handleNewFollower(event);
      
      case 'message.created':
        return await handleNewMessage(event);
      
      case 'subscriber.created':
        return await handleNewSubscriber(event);
      
      case 'tip.created':
        return await handleTip(event);
      
      case 'purchase.created':
        return await handlePurchase(event);
      
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

/**
 * Handle incoming message - respond with Venice AI (uncensored) + memory + PPV
 */
async function handleNewMessage(event: FanvueWebhookEvent) {
  const { user_id, username, chat_id, message } = event.data;
  
  console.log(`[Fanvue Webhook] New message from ${username || user_id}: ${message}`);
  
  if (!chat_id || !message) {
    console.error('[Fanvue Webhook] Missing chat_id or message');
    return NextResponse.json({ received: true, action: 'message_invalid' });
  }
  
  // Check if Venice AI is configured
  if (!isVeniceConfigured()) {
    console.error('[Fanvue Webhook] Venice AI not configured, cannot respond');
    return NextResponse.json({ received: true, action: 'venice_not_configured' });
  }
  
  try {
    // Process with full DM automation (Venice AI + memory + PPV)
    const payload: FanvueWebhookPayload = {
      type: event.type,
      data: event.data,
      timestamp: event.timestamp,
    };
    
    const result = await processFanvueDM(payload);
    
    // Check if response was empty (stopped contact)
    if (!result.response) {
      return NextResponse.json({ 
        received: true, 
        action: 'contact_stopped',
        chatId: chat_id,
      });
    }
    
    console.log(`[Fanvue Webhook] Response sent to ${username || user_id}`);
    return NextResponse.json({ 
      received: true, 
      action: result.ppvSent ? 'message_replied_with_ppv' : 'message_replied',
      chatId: chat_id,
      stage: result.contact.stage,
      intent: result.analysis.intent,
      ppvSent: result.ppvSent || false,
    });
    
  } catch (error) {
    console.error('[Fanvue Webhook] Error responding to message:', error);
    return NextResponse.json({ 
      received: true, 
      action: 'response_failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handle new paid subscriber - send thank you message
 */
async function handleNewSubscriber(event: FanvueWebhookEvent) {
  const { user_id, username } = event.data;
  
  console.log(`[Fanvue Webhook] New subscriber: ${username || user_id}`);
  
  const thankYouMessage = `Hey ${username || 'toi'} ! 💕

Merci de t'être abonné... Tu as bien fait 😏

Maintenant on peut vraiment discuter. N'hésite pas à m'écrire, je suis là pour toi 💋`;

  const result = await sendWelcomeDM(user_id, thankYouMessage);
  
  if (result.success) {
    return NextResponse.json({ 
      received: true, 
      action: 'subscriber_thanked',
      chatId: result.chatId,
    });
  }
  
  return NextResponse.json({ 
    received: true, 
    action: 'subscriber_thank_failed',
    error: result.error,
  });
}

/**
 * Handle tip received - send special thank you
 */
async function handleTip(event: FanvueWebhookEvent) {
  const { user_id, username, amount } = event.data;
  
  console.log(`[Fanvue Webhook] Tip received from ${username || user_id}: ${amount}`);
  
  const tipMessage = `Wow ${username || ''} ! 🥰

Merci pour ce tip, ça me touche vraiment... Tu mérites quelque chose de spécial en retour 💋

Dis-moi ce qui te ferait plaisir 😏`;

  const result = await sendWelcomeDM(user_id, tipMessage);
  
  if (result.success) {
    return NextResponse.json({ 
      received: true, 
      action: 'tip_thanked',
      chatId: result.chatId,
    });
  }
  
  return NextResponse.json({ 
    received: true, 
    action: 'tip_thank_failed',
    error: result.error,
  });
}

/**
 * Handle PPV purchase - track in database
 */
async function handlePurchase(event: FanvueWebhookEvent) {
  const { user_id, username, postUuid, price } = event.data;
  
  console.log(`[Fanvue Webhook] Purchase from ${username || user_id}: ${postUuid} (${price ? price / 100 : 0}€)`);
  
  try {
    const payload: FanvueWebhookPayload = {
      type: event.type,
      data: event.data,
      timestamp: event.timestamp,
    };
    
    await handleFanvuePurchase(payload);
    
    return NextResponse.json({ 
      received: true, 
      action: 'purchase_recorded',
      postUuid,
      price,
    });
    
  } catch (error) {
    console.error('[Fanvue Webhook] Error recording purchase:', error);
    return NextResponse.json({ 
      received: true, 
      action: 'purchase_record_failed',
      error: error instanceof Error ? error.message : 'Unknown error',
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
    events: ['follower.created', 'message.created', 'subscriber.created', 'tip.created', 'purchase.created'],
    veniceEnabled: isVeniceConfigured(),
    version: 'v2-memory-ppv',
  });
}
