/**
 * Fanvue Webhook Handler
 * 
 * Receives events from Fanvue and processes them:
 * - follower.created: Send welcome DM to convert free followers to subscribers
 * - message.created: Chat with fans using Grok AI
 * - subscriber.created: Thank new paid subscribers
 * - tip.created: Thank for tips
 * 
 * Webhook URL: https://ig-influencer.vercel.app/api/fanvue/webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  sendWelcomeDM, 
  sendMessage,
  verifyWebhookSignature, 
  initTokensFromEnv 
} from '@/lib/fanvue';
import { WELCOME_MESSAGE, WELCOME_PHOTO_URL } from '@/config/fanvue-welcome';
import { 
  generateElenaFanvueResponse, 
  isAskingForImage, 
  generateElenaImage,
  isGrokConfigured 
} from '@/lib/grok';

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
      
      case 'message.created':
        return await handleNewMessage(event);
      
      case 'subscriber.created':
        return await handleNewSubscriber(event);
      
      case 'tip.created':
        return await handleTip(event);
      
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
 * Handle incoming message - respond with Grok AI
 */
async function handleNewMessage(event: FanvueWebhookEvent) {
  const { user_id, username, chat_id, message } = event.data;
  
  console.log(`[Fanvue Webhook] New message from ${username || user_id}: ${message}`);
  
  if (!chat_id || !message) {
    console.error('[Fanvue Webhook] Missing chat_id or message');
    return NextResponse.json({ received: true, action: 'message_invalid' });
  }
  
  // Check if Grok is configured
  if (!isGrokConfigured()) {
    console.error('[Fanvue Webhook] Grok not configured, cannot respond');
    return NextResponse.json({ received: true, action: 'grok_not_configured' });
  }
  
  try {
    // Check if user is asking for an image
    if (isAskingForImage(message)) {
      // Generate and send image
      console.log('[Fanvue Webhook] User asking for image, generating...');
      
      // First send a teasing text response
      const textResponse = await generateElenaFanvueResponse(message);
      await sendMessage({ chatId: chat_id, text: textResponse });
      
      // Then generate and send the image
      try {
        const imageUrl = await generateElenaImage(message);
        await sendMessage({ chatId: chat_id, text: '💋', mediaUrls: [imageUrl] });
        
        return NextResponse.json({ 
          received: true, 
          action: 'image_sent',
          chatId: chat_id,
        });
      } catch (imageError) {
        console.error('[Fanvue Webhook] Image generation failed:', imageError);
        // Image failed but text was sent
        return NextResponse.json({ 
          received: true, 
          action: 'text_sent_image_failed',
          chatId: chat_id,
        });
      }
    }
    
    // Regular text response
    const response = await generateElenaFanvueResponse(message);
    
    await sendMessage({
      chatId: chat_id,
      text: response,
    });
    
    console.log(`[Fanvue Webhook] Response sent to ${username || user_id}`);
    return NextResponse.json({ 
      received: true, 
      action: 'message_replied',
      chatId: chat_id,
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

// Also handle GET for webhook verification (if Fanvue requires it)
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get('challenge');
  
  if (challenge) {
    // Echo back the challenge for webhook verification
    return NextResponse.json({ challenge });
  }
  
  return NextResponse.json({ 
    status: 'Fanvue webhook endpoint',
    events: ['follower.created', 'message.created', 'subscriber.created', 'tip.created'],
    grokEnabled: isGrokConfigured(),
  });
}

