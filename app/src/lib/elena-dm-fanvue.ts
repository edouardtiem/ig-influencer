/**
 * Elena DM Automation for Fanvue
 * 
 * Full chat automation with:
 * - Venice AI (uncensored) for responses
 * - Long-term memory for personalization
 * - Language detection
 * - PPV closing system
 * - Purchase tracking
 */

import { supabase } from './supabase';
import { sendMessage, sendPPVMessage } from './fanvue';
import { generateElenaFanvueResponse, VeniceMessage, isVeniceConfigured } from './venice';
import { detectLanguageFromMessage, updateFanvueContactLanguage } from './fanvue-language';
import { getOrCreateProfile, FanvueUserProfile } from './fanvue-memory';

// ===========================================
// TYPES
// ===========================================

export type FanvueLeadStage = 'cold' | 'warm' | 'hot' | 'pitched' | 'paid';

export interface FanvueDMContact {
  id: string;
  fanvue_user_id: string;
  fanvue_chat_id: string | null;
  username: string | null;
  profile_pic: string | null;
  stage: FanvueLeadStage;
  score: number;
  message_count: number;
  our_message_count: number;
  first_contact_at: string | null;
  last_contact_at: string | null;
  last_user_message_at: string | null;
  detected_language: string | null;
  language_confidence: number;
  ppv_pitched_at: string | null;
  ppv_bought_at: string | null;
  total_revenue: number;
  is_stopped: boolean;
  stopped_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FanvueDMMessage {
  id: string;
  contact_id: string;
  direction: 'incoming' | 'outgoing';
  content: string;
  intent: string | null;
  sentiment: string | null;
  is_question: boolean;
  mentions_ppv: boolean;
  response_strategy: string | null;
  response_time_ms: number | null;
  stage_at_time: string | null;
  fanvue_message_id: string | null;
  created_at: string;
}

export interface PPVContent {
  id: string;
  post_uuid: string | null;
  name: string;
  description: string | null;
  price: number;
  category: string;
  cloudinary_url: string | null;
  teaser_url: string | null;
  tags: string[] | null;
  target_tone: string[] | null;
}

export interface FanvueWebhookPayload {
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
    [key: string]: unknown;
  };
  timestamp: string;
}

// ===========================================
// CONSTANTS
// ===========================================

// Message caps per stage
const MESSAGE_CAPS: Record<FanvueLeadStage, number> = {
  cold: 20,
  warm: 40,
  hot: 60,
  pitched: 20,
  paid: 200,
};

// When to start PPV teasing
const PPV_TEASE_STARTS_AT: Record<FanvueLeadStage, number> = {
  cold: 100,   // Never in cold
  warm: 8,     // Start teasing at message 8
  hot: 1,      // Always tease in hot
  pitched: 1,  // Always in pitched
  paid: 10,    // After 10 messages for upsell
};

// ===========================================
// DATABASE FUNCTIONS
// ===========================================

/**
 * Get or create a Fanvue DM contact
 */
export async function getOrCreateFanvueContact(
  fanvueUserId: string,
  chatId?: string | null,
  username?: string | null
): Promise<FanvueDMContact> {
  // Try to find existing
  const { data: existing, error: findError } = await supabase
    .from('fanvue_dm_contacts')
    .select('*')
    .eq('fanvue_user_id', fanvueUserId)
    .single();

  if (existing && !findError) {
    // Update chat_id if provided
    if (chatId && !existing.fanvue_chat_id) {
      const { data: updated } = await supabase
        .from('fanvue_dm_contacts')
        .update({
          fanvue_chat_id: chatId,
          username: username || existing.username,
          last_contact_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
      return updated || existing;
    }
    return existing;
  }

  // Create new
  const { data: created, error: createError } = await supabase
    .from('fanvue_dm_contacts')
    .insert({
      fanvue_user_id: fanvueUserId,
      fanvue_chat_id: chatId,
      username,
      stage: 'cold',
      score: 0,
      message_count: 0,
      our_message_count: 0,
      first_contact_at: new Date().toISOString(),
      last_contact_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (createError) {
    console.error('[Fanvue DM] Error creating contact:', createError);
    throw new Error(`Failed to create contact: ${createError.message}`);
  }

  return created;
}

/**
 * Save a message to the database
 */
export async function saveFanvueMessage(
  contactId: string,
  direction: 'incoming' | 'outgoing',
  content: string,
  metadata?: {
    intent?: string;
    sentiment?: string;
    is_question?: boolean;
    mentions_ppv?: boolean;
    response_strategy?: string;
    response_time_ms?: number;
    stage_at_time?: string;
    fanvue_message_id?: string;
  }
): Promise<FanvueDMMessage> {
  const { data, error } = await supabase
    .from('fanvue_dm_messages')
    .insert({
      contact_id: contactId,
      direction,
      content,
      ...metadata,
    })
    .select()
    .single();

  if (error) {
    console.error('[Fanvue DM] Error saving message:', error);
    throw new Error(`Failed to save message: ${error.message}`);
  }

  return data;
}

/**
 * Get conversation history
 */
export async function getFanvueConversationHistory(
  contactId: string,
  limit: number = 20
): Promise<FanvueDMMessage[]> {
  const { data, error } = await supabase
    .from('fanvue_dm_messages')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Fanvue DM] Error fetching history:', error);
    return [];
  }

  return (data || []).reverse();
}

/**
 * Update contact after message
 */
export async function updateFanvueContactAfterMessage(
  contactId: string,
  isIncoming: boolean
): Promise<FanvueDMContact> {
  const { data: contact, error: fetchError } = await supabase
    .from('fanvue_dm_contacts')
    .select('*')
    .eq('id', contactId)
    .single();

  if (fetchError || !contact) {
    throw new Error('Contact not found');
  }

  const newMessageCount = (contact.message_count || 0) + (isIncoming ? 1 : 0);
  const newOurMessageCount = (contact.our_message_count || 0) + (isIncoming ? 0 : 1);

  // Calculate new stage
  let newStage = contact.stage;
  if (!['pitched', 'paid'].includes(contact.stage)) {
    if (newMessageCount >= 12) {
      newStage = 'hot';
    } else if (newMessageCount >= 5) {
      newStage = 'warm';
    }
  }

  const updates: Record<string, unknown> = {
    message_count: newMessageCount,
    our_message_count: newOurMessageCount,
    stage: newStage,
    last_contact_at: new Date().toISOString(),
  };

  if (isIncoming) {
    updates.last_user_message_at = new Date().toISOString();
  }

  const { data: updated, error: updateError } = await supabase
    .from('fanvue_dm_contacts')
    .update(updates)
    .eq('id', contactId)
    .select()
    .single();

  if (updateError) {
    throw new Error('Failed to update contact');
  }

  return updated;
}

/**
 * Mark contact as PPV pitched
 */
export async function markAsPPVPitched(contactId: string): Promise<void> {
  await supabase
    .from('fanvue_dm_contacts')
    .update({
      stage: 'pitched',
      ppv_pitched_at: new Date().toISOString(),
    })
    .eq('id', contactId);
}

/**
 * Mark contact as stopped
 */
export async function markFanvueContactStopped(contactId: string): Promise<void> {
  await supabase
    .from('fanvue_dm_contacts')
    .update({
      is_stopped: true,
      stopped_at: new Date().toISOString(),
    })
    .eq('id', contactId);
}

// ===========================================
// PPV FUNCTIONS
// ===========================================

/**
 * Get available PPV content for a user (not yet purchased)
 */
export async function getAvailablePPV(
  contactId: string,
  profile?: FanvueUserProfile | null
): Promise<PPVContent[]> {
  // Get purchased PPV post UUIDs
  const { data: purchases } = await supabase
    .from('fanvue_purchases')
    .select('post_uuid')
    .eq('contact_id', contactId);

  const purchasedUuids = purchases?.map(p => p.post_uuid) || [];

  // Get available PPV
  let query = supabase
    .from('fanvue_ppv_content')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (purchasedUuids.length > 0) {
    query = query.not('post_uuid', 'in', `(${purchasedUuids.join(',')})`);
  }

  const { data: available } = await query;

  if (!available || available.length === 0) {
    return [];
  }

  // If we have profile preferences, prioritize matching content
  if (profile?.content_preferences?.length || profile?.tone_preference) {
    return available.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Match content preferences
      if (profile.content_preferences) {
        const tagsA = a.tags || [];
        const tagsB = b.tags || [];
        scoreA += tagsA.filter(t => profile.content_preferences!.includes(t)).length;
        scoreB += tagsB.filter(t => profile.content_preferences!.includes(t)).length;
      }

      // Match tone preference
      if (profile.tone_preference) {
        const tonesA = a.target_tone || [];
        const tonesB = b.target_tone || [];
        if (tonesA.includes(profile.tone_preference)) scoreA += 2;
        if (tonesB.includes(profile.tone_preference)) scoreB += 2;
      }

      return scoreB - scoreA; // Higher score first
    });
  }

  return available;
}

/**
 * Record a purchase
 */
export async function recordPurchase(
  contactId: string,
  postUuid: string,
  price: number
): Promise<void> {
  // Insert purchase
  await supabase
    .from('fanvue_purchases')
    .insert({
      contact_id: contactId,
      post_uuid: postUuid,
      price,
    });

  // Update contact
  const { data: contact } = await supabase
    .from('fanvue_dm_contacts')
    .select('total_revenue')
    .eq('id', contactId)
    .single();

  await supabase
    .from('fanvue_dm_contacts')
    .update({
      stage: 'paid',
      ppv_bought_at: new Date().toISOString(),
      total_revenue: (contact?.total_revenue || 0) + price,
    })
    .eq('id', contactId);

  // Update profile buyer behavior
  const { data: profile } = await supabase
    .from('fanvue_user_profiles')
    .select('total_spent, purchase_count')
    .eq('contact_id', contactId)
    .single();

  if (profile) {
    await supabase
      .from('fanvue_user_profiles')
      .update({
        total_spent: (profile.total_spent || 0) + price,
        purchase_count: (profile.purchase_count || 0) + 1,
        last_purchase_at: new Date().toISOString(),
      })
      .eq('contact_id', contactId);
  }

  // Update PPV stats
  await supabase
    .from('fanvue_ppv_content')
    .update({
      times_purchased: supabase.rpc('increment', { x: 1 }),
    })
    .eq('post_uuid', postUuid);

  console.log(`[Fanvue DM] Purchase recorded: ${postUuid} for ${price / 100}€`);
}

// ===========================================
// INTENT ANALYSIS
// ===========================================

type FanvueIntent = 
  | 'greeting'
  | 'compliment'
  | 'flirt'
  | 'sexual'
  | 'wants_content'
  | 'question'
  | 'objection'
  | 'ai_question'
  | 'other';

interface FanvueIntentAnalysis {
  intent: FanvueIntent;
  sentiment: 'positive' | 'neutral' | 'negative';
  is_question: boolean;
  mentions_ppv: boolean;
  shouldPitchPPV: boolean;
}

/**
 * Analyze message intent
 */
export function analyzeFanvueIntent(
  message: string,
  stage: FanvueLeadStage,
  messageCount: number
): FanvueIntentAnalysis {
  const lowerMessage = message.toLowerCase();
  
  let intent: FanvueIntent = 'other';
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  const is_question = message.includes('?');
  let mentions_ppv = false;
  let shouldPitchPPV = false;

  // Check for PPV mentions
  const ppvKeywords = ['ppv', 'pay', 'buy', 'purchase', 'acheter', 'payer', 'prix', 'price', 'cost'];
  mentions_ppv = ppvKeywords.some(kw => lowerMessage.includes(kw));

  // WANTS_CONTENT: They want more photos/content
  const wantsContentPatterns = [
    'see more', 'voir plus', 'more photos', 'plus de photos', 'more pics',
    'show me', 'montre moi', 'envoie', 'send', 'photo', 'pic', 'image',
    'nude', 'naked', 'nue', 'sexy', 'spicy', 'explicit',
    'what else', 'quoi d\'autre', 'something special', 'quelque chose',
  ];

  // SEXUAL: Explicit sexual content
  const sexualPatterns = [
    'fuck', 'baise', 'sex', 'dick', 'cock', 'pussy', 'bite', 'chatte',
    'cum', 'orgasm', 'masturbate', 'suck', 'lick',
    'want you', 'te veux', 'i want to', 'je veux te',
  ];

  // Check patterns
  if (sexualPatterns.some(p => lowerMessage.includes(p))) {
    intent = 'sexual';
    sentiment = 'positive';
    shouldPitchPPV = stage !== 'cold';
  } else if (wantsContentPatterns.some(p => lowerMessage.includes(p))) {
    intent = 'wants_content';
    sentiment = 'positive';
    shouldPitchPPV = true;
  } else if (['ai', 'bot', 'real', 'vraie', 'robot', 'ia'].some(kw => lowerMessage.includes(kw))) {
    intent = 'ai_question';
  } else if (['no', 'non', 'pas intéressé', 'not interested', 'stop', 'arrête'].some(kw => lowerMessage.includes(kw))) {
    intent = 'objection';
    sentiment = 'negative';
  } else if (['hey', 'hi', 'hello', 'salut', 'coucou', 'bonjour'].some(g => lowerMessage.includes(g)) && lowerMessage.length < 20) {
    intent = 'greeting';
    sentiment = 'positive';
  } else if (['belle', 'beautiful', 'gorgeous', 'magnifique', 'sexy', 'hot', 'cute'].some(c => lowerMessage.includes(c))) {
    intent = 'compliment';
    sentiment = 'positive';
  } else if (['😍', '😘', '❤️', '🔥', '👀'].some(e => message.includes(e))) {
    intent = 'flirt';
    sentiment = 'positive';
  } else if (is_question) {
    intent = 'question';
  }

  // Determine if we should pitch PPV based on stage and message count
  if (!shouldPitchPPV && stage !== 'cold') {
    const teaseAt = PPV_TEASE_STARTS_AT[stage] || 100;
    shouldPitchPPV = messageCount >= teaseAt;
  }

  return {
    intent,
    sentiment,
    is_question,
    mentions_ppv,
    shouldPitchPPV,
  };
}

// ===========================================
// RESPONSE GENERATION
// ===========================================

/**
 * Generate Elena's response
 */
export async function generateFanvueResponse(
  contact: FanvueDMContact,
  incomingMessage: string,
  conversationHistory: FanvueDMMessage[],
  analysis: FanvueIntentAnalysis,
  profile: FanvueUserProfile | null,
  availablePPV: PPVContent[]
): Promise<{ response: string; shouldSendPPV: boolean; ppvContent?: PPVContent }> {
  // Build conversation messages for Venice AI
  const messages: VeniceMessage[] = conversationHistory.slice(-10).map(msg => ({
    role: msg.direction === 'incoming' ? 'user' as const : 'assistant' as const,
    content: msg.content,
  }));

  // Add current message
  messages.push({
    role: 'user',
    content: incomingMessage,
  });

  // Generate response
  const response = await generateElenaFanvueResponse({
    messages,
    language: contact.detected_language,
    profile,
    stage: contact.stage,
    messageCount: contact.message_count,
    hasAvailablePPV: availablePPV.length > 0,
  });

  // Determine if we should send PPV
  let shouldSendPPV = false;
  let ppvContent: PPVContent | undefined;

  if (analysis.shouldPitchPPV && availablePPV.length > 0) {
    // Check if response naturally leads to PPV
    const ppvTriggers = ['special', 'spécial', 'show you', 'te montrer', 'something for you', 'quelque chose pour toi'];
    if (ppvTriggers.some(t => response.toLowerCase().includes(t))) {
      shouldSendPPV = true;
      ppvContent = availablePPV[0]; // Best match (already sorted)
    }
  }

  return {
    response,
    shouldSendPPV,
    ppvContent,
  };
}

// ===========================================
// MAIN HANDLER
// ===========================================

/**
 * Process incoming Fanvue DM
 */
export async function processFanvueDM(payload: FanvueWebhookPayload): Promise<{
  response: string;
  contact: FanvueDMContact;
  analysis: FanvueIntentAnalysis;
  ppvSent?: boolean;
}> {
  const startTime = Date.now();

  const { user_id, username, chat_id, message } = payload.data;

  if (!message || !chat_id) {
    throw new Error('Missing message or chat_id');
  }

  console.log(`[Fanvue DM] Processing from @${username || user_id}: "${message}"`);

  // Check Venice AI configuration
  if (!isVeniceConfigured()) {
    throw new Error('Venice AI not configured');
  }

  // 1. Get or create contact
  const contact = await getOrCreateFanvueContact(user_id, chat_id, username);
  console.log(`[Fanvue DM] Contact stage: ${contact.stage}, messages: ${contact.message_count}`);

  // 2. Check if stopped
  if (contact.is_stopped) {
    console.log(`[Fanvue DM] Contact is stopped, not responding`);
    return {
      response: '',
      contact,
      analysis: {
        intent: 'other',
        sentiment: 'neutral',
        is_question: false,
        mentions_ppv: false,
        shouldPitchPPV: false,
      },
    };
  }

  // 3. Check message limit
  const messageLimit = MESSAGE_CAPS[contact.stage as FanvueLeadStage] || 40;
  if (contact.message_count >= messageLimit) {
    console.log(`[Fanvue DM] Message limit reached (${contact.message_count}/${messageLimit})`);
    await markFanvueContactStopped(contact.id);
    return {
      response: '',
      contact: { ...contact, is_stopped: true },
      analysis: {
        intent: 'other',
        sentiment: 'neutral',
        is_question: false,
        mentions_ppv: false,
        shouldPitchPPV: false,
      },
    };
  }

  // 4. Detect/update language
  await updateFanvueContactLanguage(
    contact.id,
    contact.detected_language,
    contact.language_confidence,
    message
  );

  // 5. Analyze intent
  const analysis = analyzeFanvueIntent(message, contact.stage as FanvueLeadStage, contact.message_count);
  console.log(`[Fanvue DM] Intent: ${analysis.intent}, PPV pitch: ${analysis.shouldPitchPPV}`);

  // 6. Save incoming message
  await saveFanvueMessage(contact.id, 'incoming', message, {
    intent: analysis.intent,
    sentiment: analysis.sentiment,
    is_question: analysis.is_question,
    mentions_ppv: analysis.mentions_ppv,
    stage_at_time: contact.stage,
  });

  // 7. Update contact
  const updatedContact = await updateFanvueContactAfterMessage(contact.id, true);

  // 8. Get profile for personalization
  const profile = await getOrCreateProfile(contact.id);

  // 9. Get available PPV
  const availablePPV = await getAvailablePPV(contact.id, profile);

  // 10. Get conversation history
  const history = await getFanvueConversationHistory(contact.id);

  // 11. Generate response
  const { response, shouldSendPPV, ppvContent } = await generateFanvueResponse(
    updatedContact,
    message,
    history,
    analysis,
    profile,
    availablePPV
  );

  console.log(`[Fanvue DM] Response: "${response.substring(0, 80)}..."`);

  // 12. Send response
  await sendMessage({
    chatId: chat_id,
    text: response,
  });

  // 13. Save outgoing message
  const responseTime = Date.now() - startTime;
  await saveFanvueMessage(updatedContact.id, 'outgoing', response, {
    response_strategy: analysis.intent,
    response_time_ms: responseTime,
    stage_at_time: updatedContact.stage,
  });

  // 14. Update contact after outgoing
  await updateFanvueContactAfterMessage(updatedContact.id, false);

  // 15. Send PPV if appropriate
  let ppvSent = false;
  if (shouldSendPPV && ppvContent && ppvContent.cloudinary_url && ppvContent.post_uuid) {
    try {
      // Small delay before PPV
      await new Promise(resolve => setTimeout(resolve, 2000));

      await sendPPVMessage({
        chatId: chat_id,
        text: `voilà ce que j'ai pour toi... 🖤`,
        mediaUrls: [ppvContent.teaser_url || ppvContent.cloudinary_url],
        price: ppvContent.price,
      });

      await markAsPPVPitched(updatedContact.id);
      ppvSent = true;

      console.log(`[Fanvue DM] PPV sent: ${ppvContent.name} (${ppvContent.price / 100}€)`);
    } catch (error) {
      console.error(`[Fanvue DM] PPV send error:`, error);
    }
  }

  return {
    response,
    contact: updatedContact,
    analysis,
    ppvSent,
  };
}

/**
 * Handle purchase webhook
 */
export async function handleFanvuePurchase(payload: FanvueWebhookPayload): Promise<void> {
  const { user_id, postUuid, price } = payload.data;

  if (!postUuid || !price) {
    console.error('[Fanvue DM] Missing postUuid or price in purchase webhook');
    return;
  }

  // Find contact
  const { data: contact } = await supabase
    .from('fanvue_dm_contacts')
    .select('id')
    .eq('fanvue_user_id', user_id)
    .single();

  if (!contact) {
    console.log(`[Fanvue DM] Purchase from unknown user: ${user_id}`);
    return;
  }

  // Record purchase
  await recordPurchase(contact.id, postUuid, price);

  console.log(`[Fanvue DM] Purchase recorded for user ${user_id}: ${postUuid} (${price / 100}€)`);
}
