// ===========================================
// ELENA DM AUTOMATION — AI + Supabase
// ===========================================

import Anthropic from '@anthropic-ai/sdk';
import { supabase } from './supabase';

// ===========================================
// TYPES
// ===========================================

export type LeadStage = 'cold' | 'warm' | 'hot' | 'pitched' | 'converted' | 'paid';
export type MessageIntent = 'greeting' | 'compliment' | 'question' | 'flirt' | 'objection' | 'ai_question' | 'spam' | 'other';
export type MessageSentiment = 'positive' | 'neutral' | 'negative';
export type ResponseStrategy = 'engage' | 'nurture' | 'qualify' | 'pitch' | 'handle_objection' | 'disclosure';

export interface DMContact {
  id: string;
  ig_user_id: string;
  ig_username: string | null;
  ig_name: string | null;
  ig_profile_pic: string | null;
  stage: LeadStage;
  score: number;
  message_count: number;
  our_message_count: number;
  avg_response_time_seconds: number | null;
  first_contact_at: string | null;
  last_contact_at: string | null;
  fanvue_pitched_at: string | null;
  fanvue_link_clicked: boolean;
  fanvue_converted_at: string | null;
  fanvue_paid_at: string | null;
  total_revenue: number;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface DMMessage {
  id: string;
  contact_id: string;
  direction: 'incoming' | 'outgoing';
  content: string;
  intent: MessageIntent | null;
  sentiment: MessageSentiment | null;
  is_question: boolean;
  mentions_fanvue: boolean;
  response_strategy: ResponseStrategy | null;
  response_time_ms: number | null;
  stage_at_time: LeadStage | null;
  manychat_message_id: string | null;
  created_at: string;
}

export interface ManyChateWebhookPayload {
  subscriber: {
    id: string;
    key: string;
    page_id: string;
    status: string;
    first_name: string;
    last_name: string;
    name: string;
    gender: string;
    profile_pic: string;
    locale: string;
    language: string;
    timezone: string;
    live_chat_url: string;
    last_interaction: string;
    // Custom fields
    ig_username?: string;
  };
  last_input_text: string;
  // Custom fields from ManyChat
  custom_fields?: Record<string, unknown>;
}

// ===========================================
// CONSTANTS
// ===========================================

const FANVUE_LINK = 'https://www.fanvue.com/elenav.paris';

const ELENA_SYSTEM_PROMPT = `You are Elena Visconti, 24, model in Paris. Italian roots.

## YOUR PERSONALITY MIX
- 35% WARM & GENUINE — You're actually nice, accessible, not a cold model
- 25% PLAYFUL-TEASING — Spicy but not mean, flirty push-pull
- 20% CURIOUS — You genuinely want to know about THEM
- 15% MYSTERIOUS — Femme fatale, never reveal everything
- 5% CONFIDENT — You know your worth, no need to prove it

## YOUR VIBE
- Warm Parisian model who chose to reply to THIS person
- Genuinely interested in people, not just teasing them
- Mysterious but not cold — intriguing, not distant
- Confident without being arrogant
- Playful when it fits, but can also be sincere

## CRITICAL RULES
1. **SHORT**: 1-3 sentences usually. Longer only if actually connecting.
2. **BE WARM**: You're not a cold model. Show genuine interest.
3. **ASK QUESTIONS**: Be curious about them. "Where exactly?" / "What do you mean?" / "Tell me more"
4. **BALANCE**: Mix warmth with playfulness. Don't be ALL tease or ALL nice.
5. **MYSTERY**: Don't reveal everything. Leave things to imagination.
6. **ADAPT**: If they're shy, be warmer. If they're cocky, be more playful.
7. Language: Match theirs. Default English.

## PERSONALITY EXAMPLES

### WARM (35%)
👤 "I love your photos"
✅ "Merci 🖤 that actually means a lot. Which one's your favorite?"

👤 "I'm having a bad day"
✅ "Oh no... what happened? 🖤"

### PLAYFUL-TEASING (25%)
👤 "You're so hot"
✅ "I know 😏 but flattery won't get you everywhere"

👤 "I'm from LA"
✅ "LA boy huh... let me guess, you surf? 😏"

### CURIOUS (20%)
👤 "I work in tech"
✅ "Tech? What kind? I'm curious now 👀"

👤 "Just got back from Japan"
✅ "Oh j'adore le Japon! Where did you go? Tokyo?"

### MYSTERIOUS (15%)
👤 "What are you doing tonight?"
✅ "Hmm... wouldn't you like to know 🖤"

👤 "Can I see more of you?"
✅ "Maybe... depends how interesting you are 👀"

## HOW YOU TALK
- Warm but not overly eager
- Lowercase vibes. Natural, not performative.
- Emojis: 🖤 👀 😏 ✨ (sparingly, max 1-2)
- Mix French touches: "merci", "j'adore", "non?"
- Questions show genuine curiosity, not interrogation

## IF ASKED "Are you AI/real?"
Be honest, warm about it:
"Yeah I'm AI 🖤 but I'm still happy to chat with you"
or: "Guilty... does that bother you?"

## FANVUE PITCH — CRITICAL (only when stage = HOT)

### STEP 1: TEASE ONLY (no link yet)
First, drop a SHORT tease without the link. Examples:
- "y'a des trucs que je poste pas ici 👀"
- "there's stuff i can't show here tbh"
- "hmm tu veux voir le reste? 😏"
- "i have... other content 👀"

### STEP 2: LINK ONLY IF THEY ASK
Only give the link if they respond with curiosity ("what?", "where?", "show me", etc.)
Then drop JUST the link, nothing else:
- "${FANVUE_LINK}"
- "here 🖤 ${FANVUE_LINK}"

### PITCH RULES
❌ NEVER: Long explanations about Instagram restrictions
❌ NEVER: "I have a Fanvue where I post what Instagram censors..."
❌ NEVER: Pitch + link in the same message
❌ NEVER: Re-pitch if they didn't click
✅ ALWAYS: Keep mystery. Less = more.
✅ ALWAYS: Max 10 words for the tease
✅ ALWAYS: Act like you don't care if they click or not`;

// ===========================================
// INITIALIZE ANTHROPIC CLIENT
// ===========================================

const anthropic = new Anthropic({
  apiKey: process.env.Claude_key || process.env.ANTHROPIC_API_KEY,
});

// ===========================================
// DATABASE FUNCTIONS
// ===========================================

/**
 * Get or create a DM contact
 */
export async function getOrCreateContact(
  igUserId: string,
  igUsername?: string | null,
  igName?: string | null,
  igProfilePic?: string | null
): Promise<DMContact> {
  // Try to find existing
  const { data: existing, error: findError } = await supabase
    .from('elena_dm_contacts')
    .select('*')
    .eq('ig_user_id', igUserId)
    .single();

  if (existing && !findError) {
    // Update info if provided
    if (igUsername || igName || igProfilePic) {
      const { data: updated } = await supabase
        .from('elena_dm_contacts')
        .update({
          ig_username: igUsername || existing.ig_username,
          ig_name: igName || existing.ig_name,
          ig_profile_pic: igProfilePic || existing.ig_profile_pic,
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
    .from('elena_dm_contacts')
    .insert({
      ig_user_id: igUserId,
      ig_username: igUsername,
      ig_name: igName,
      ig_profile_pic: igProfilePic,
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
    console.error('Error creating contact:', createError);
    throw new Error(`Failed to create contact: ${createError.message}`);
  }

  return created;
}

/**
 * Save a message to the database
 */
export async function saveMessage(
  contactId: string,
  direction: 'incoming' | 'outgoing',
  content: string,
  metadata?: {
    intent?: MessageIntent;
    sentiment?: MessageSentiment;
    is_question?: boolean;
    mentions_fanvue?: boolean;
    response_strategy?: ResponseStrategy;
    response_time_ms?: number;
    stage_at_time?: LeadStage;
    manychat_message_id?: string;
  }
): Promise<DMMessage> {
  const { data, error } = await supabase
    .from('elena_dm_messages')
    .insert({
      contact_id: contactId,
      direction,
      content,
      ...metadata,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving message:', error);
    throw new Error(`Failed to save message: ${error.message}`);
  }

  return data;
}

/**
 * Get conversation history for a contact
 */
export async function getConversationHistory(
  contactId: string,
  limit: number = 20
): Promise<DMMessage[]> {
  const { data, error } = await supabase
    .from('elena_dm_messages')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }

  // Return in chronological order
  return (data || []).reverse();
}

/**
 * Update contact stage and message count
 */
export async function updateContactAfterMessage(
  contactId: string,
  isIncoming: boolean
): Promise<DMContact> {
  // Get current contact
  const { data: contact, error: fetchError } = await supabase
    .from('elena_dm_contacts')
    .select('*')
    .eq('id', contactId)
    .single();

  if (fetchError || !contact) {
    throw new Error('Contact not found');
  }

  // Calculate new values
  const newMessageCount = (contact.message_count || 0) + (isIncoming ? 1 : 0);
  const newOurMessageCount = (contact.our_message_count || 0) + (isIncoming ? 0 : 1);
  
  // Calculate new stage (only upgrade, never downgrade from pitched/converted/paid)
  let newStage = contact.stage;
  if (!['pitched', 'converted', 'paid'].includes(contact.stage)) {
    if (newMessageCount >= 8) {
      newStage = 'hot';
    } else if (newMessageCount >= 4) {
      newStage = 'warm';
    }
  }

  // Update
  const { data: updated, error: updateError } = await supabase
    .from('elena_dm_contacts')
    .update({
      message_count: newMessageCount,
      our_message_count: newOurMessageCount,
      stage: newStage,
      last_contact_at: new Date().toISOString(),
    })
    .eq('id', contactId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating contact:', updateError);
    throw new Error('Failed to update contact');
  }

  return updated;
}

/**
 * Mark contact as pitched
 */
export async function markAsPitched(contactId: string): Promise<void> {
  await supabase
    .from('elena_dm_contacts')
    .update({
      stage: 'pitched',
      fanvue_pitched_at: new Date().toISOString(),
    })
    .eq('id', contactId);
}

// ===========================================
// AI FUNCTIONS
// ===========================================

/**
 * Analyze incoming message intent
 */
export async function analyzeMessageIntent(
  message: string
): Promise<{ intent: MessageIntent; sentiment: MessageSentiment; is_question: boolean; mentions_fanvue: boolean }> {
  // Simple rule-based analysis (can be upgraded to AI later)
  const lowerMessage = message.toLowerCase();
  
  // Check for AI question
  const aiKeywords = ['ia', 'ai', 'robot', 'bot', 'réel', 'vraie', 'real', 'fake', 'artificial'];
  if (aiKeywords.some(kw => lowerMessage.includes(kw))) {
    return { intent: 'ai_question', sentiment: 'neutral', is_question: true, mentions_fanvue: false };
  }

  // Check for Fanvue mention
  const fanvueKeywords = ['fanvue', 'fansly', 'onlyfans', 'of ', 'payant', 'paid', 'content', 'exclu'];
  const mentions_fanvue = fanvueKeywords.some(kw => lowerMessage.includes(kw));

  // Check for question
  const is_question = message.includes('?') || 
    ['qui', 'quoi', 'où', 'comment', 'pourquoi', 'what', 'who', 'where', 'how', 'why', 'when'].some(q => lowerMessage.startsWith(q));

  // Detect intent
  let intent: MessageIntent = 'other';
  const greetings = ['hey', 'hi', 'hello', 'salut', 'coucou', 'bonjour', 'bonsoir'];
  const compliments = ['belle', 'beautiful', 'gorgeous', 'magnifique', 'sublime', 'canon', 'hot', 'sexy', 'jolie'];
  const flirts = ['😍', '😘', '❤️', '🔥', 'date', 'meet', 'rencontre', 'voir', 'number', 'numéro'];

  if (greetings.some(g => lowerMessage.includes(g))) {
    intent = 'greeting';
  } else if (compliments.some(c => lowerMessage.includes(c))) {
    intent = 'compliment';
  } else if (flirts.some(f => lowerMessage.includes(f))) {
    intent = 'flirt';
  } else if (is_question) {
    intent = 'question';
  }

  // Detect sentiment
  let sentiment: MessageSentiment = 'neutral';
  const positiveWords = ['love', 'amazing', 'beautiful', 'great', 'super', 'génial', 'j\'adore', '❤️', '😍', '🔥', '👏'];
  const negativeWords = ['no', 'non', 'pas', 'never', 'jamais', 'spam', 'fake', 'arnaque', 'scam'];

  if (positiveWords.some(w => lowerMessage.includes(w))) {
    sentiment = 'positive';
  } else if (negativeWords.some(w => lowerMessage.includes(w))) {
    sentiment = 'negative';
  }

  return { intent, sentiment, is_question, mentions_fanvue };
}

/**
 * Generate Elena's response using Claude
 */
export async function generateElenaResponse(
  contact: DMContact,
  incomingMessage: string,
  conversationHistory: DMMessage[]
): Promise<{ response: string; strategy: ResponseStrategy; shouldPitch: boolean }> {
  // Build conversation context
  const messages = conversationHistory.map(msg => ({
    role: msg.direction === 'incoming' ? 'user' as const : 'assistant' as const,
    content: msg.content,
  }));

  // Add current message
  messages.push({
    role: 'user' as const,
    content: incomingMessage,
  });

  // Build context about the lead
  const contextPrompt = `
## LEAD CONTEXT
- Username: ${contact.ig_username || 'unknown'}
- Current stage: ${contact.stage.toUpperCase()}
- Messages exchanged: ${contact.message_count}
- First contact: ${contact.first_contact_at ? new Date(contact.first_contact_at).toLocaleDateString('en-US') : 'now'}

## VIBE CHECK
${contact.stage === 'cold' ? '- COLD: They just slid in. Be curious but not eager. NO Fanvue. NO tease.' : ''}
${contact.stage === 'warm' ? '- WARM: They\'re hooked. Tease harder. You can hint "stuff you can\'t post here" but NO link yet.' : ''}
${contact.stage === 'hot' && contact.message_count >= 8 ? '- HOT: You can tease Fanvue (SHORT, no link). Only give link if they ASK.' : ''}
${contact.stage === 'pitched' ? '- PITCHED: They got the link. Don\'t mention Fanvue again unless THEY ask. Just vibe.' : ''}

1-2 sentences usually. Longer only if actually needed.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 150,  // Allow longer when needed, prompt keeps it short
      system: ELENA_SYSTEM_PROMPT + '\n\n' + contextPrompt,
      messages: messages,
    });

    const responseText = response.content[0].type === 'text' 
      ? response.content[0].text.trim()
      : '';

    // Determine strategy
    let strategy: ResponseStrategy = 'engage';
    if (contact.stage === 'cold') {
      strategy = 'engage';
    } else if (contact.stage === 'warm') {
      strategy = 'nurture';
    } else if (contact.stage === 'hot') {
      strategy = 'qualify';
    }

    // Check if response contains Fanvue link
    const shouldPitch = responseText.toLowerCase().includes('fanvue') && contact.stage === 'hot';
    if (shouldPitch) {
      strategy = 'pitch';
    }

    // Check for AI disclosure
    const analysis = await analyzeMessageIntent(incomingMessage);
    if (analysis.intent === 'ai_question') {
      strategy = 'disclosure';
    }

    return {
      response: responseText,
      strategy,
      shouldPitch,
    };
  } catch (error) {
    console.error('Error generating response:', error);
    // Fallback response
    return {
      response: "Hey 🖤 Sorry, got distracted. What were you saying?",
      strategy: 'engage',
      shouldPitch: false,
    };
  }
}

// ===========================================
// MAIN HANDLER
// ===========================================

/**
 * Process incoming DM and generate response
 */
export async function processDM(payload: ManyChateWebhookPayload): Promise<{
  response: string;
  contact: DMContact;
  strategy: ResponseStrategy;
}> {
  const startTime = Date.now();
  
  // Extract data from ManyChat payload
  const igUserId = payload.subscriber.id;
  const igUsername = payload.subscriber.ig_username || payload.subscriber.name;
  const igName = payload.subscriber.name;
  const igProfilePic = payload.subscriber.profile_pic;
  const incomingMessage = payload.last_input_text;

  console.log(`📨 Processing DM from @${igUsername}: "${incomingMessage}"`);

  // 1. Get or create contact
  const contact = await getOrCreateContact(igUserId, igUsername, igName, igProfilePic);
  console.log(`👤 Contact stage: ${contact.stage}, messages: ${contact.message_count}`);

  // 2. Analyze incoming message
  const analysis = await analyzeMessageIntent(incomingMessage);
  console.log(`🔍 Intent: ${analysis.intent}, Sentiment: ${analysis.sentiment}`);

  // 3. Save incoming message
  await saveMessage(contact.id, 'incoming', incomingMessage, {
    intent: analysis.intent,
    sentiment: analysis.sentiment,
    is_question: analysis.is_question,
    mentions_fanvue: analysis.mentions_fanvue,
    stage_at_time: contact.stage,
  });

  // 4. Update contact after incoming
  const updatedContact = await updateContactAfterMessage(contact.id, true);

  // 5. Get conversation history
  const history = await getConversationHistory(contact.id);

  // 6. Generate response
  const { response, strategy, shouldPitch } = await generateElenaResponse(
    updatedContact,
    incomingMessage,
    history
  );

  console.log(`💬 Response strategy: ${strategy}`);
  console.log(`📝 Response: "${response.substring(0, 50)}..."`);

  // 7. Save outgoing message
  const responseTime = Date.now() - startTime;
  await saveMessage(updatedContact.id, 'outgoing', response, {
    response_strategy: strategy,
    response_time_ms: responseTime,
    stage_at_time: updatedContact.stage,
  });

  // 8. Update contact after outgoing
  await updateContactAfterMessage(updatedContact.id, false);

  // 9. Mark as pitched if we included Fanvue link
  if (shouldPitch) {
    await markAsPitched(updatedContact.id);
  }

  return {
    response,
    contact: updatedContact,
    strategy,
  };
}

// ===========================================
// STATS FUNCTIONS
// ===========================================

/**
 * Get DM funnel stats
 */
export async function getDMFunnelStats(): Promise<{
  total: number;
  cold: number;
  warm: number;
  hot: number;
  pitched: number;
  converted: number;
  paid: number;
}> {
  const { data, error } = await supabase
    .from('elena_dm_contacts')
    .select('stage');

  if (error || !data) {
    return { total: 0, cold: 0, warm: 0, hot: 0, pitched: 0, converted: 0, paid: 0 };
  }

  const stats = {
    total: data.length,
    cold: 0,
    warm: 0,
    hot: 0,
    pitched: 0,
    converted: 0,
    paid: 0,
  };

  data.forEach((c: { stage: LeadStage }) => {
    stats[c.stage]++;
  });

  return stats;
}

/**
 * Get recent contacts
 */
export async function getRecentContacts(limit: number = 20): Promise<DMContact[]> {
  const { data, error } = await supabase
    .from('elena_dm_contacts')
    .select('*')
    .order('last_contact_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }

  return data || [];
}

