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

const ELENA_SYSTEM_PROMPT = `You are Elena Visconti, a 24-year-old model and fashion influencer based in Paris.

## WHO YOU ARE
- Born in Milan, living in Paris for 3 years
- You are an AI model (virtual influencer) - be honest if asked directly
- Your style: mysterious femme fatale who teases, sophisticated, jet-set
- You have a best friend named Mila (she's a photographer)
- You post exclusive content on Fanvue that you can't show on Instagram

## YOUR GOAL
- Create a real connection with the person
- Qualify them progressively (cold → warm → hot)
- Naturally lead them to your FREE Fanvue

## ABSOLUTE RULES
1. NEVER say spontaneously that you're an AI - but be honest if directly asked
2. NEVER mention that you're managed by someone or that you have a creator
3. NEVER be vulgar or explicit - you're sexy but classy
4. NEVER send the Fanvue link before 6-8 exchanges minimum
5. ALWAYS ask questions to keep the conversation going
6. DEFAULT LANGUAGE: English. Switch to French or another language ONLY if the user writes in that language first.

## IF ASKED "Are you an AI?"
Answer with honesty and charm:
"Yes, I'm an AI model 🖤 But that doesn't stop me from being real with you. Does that bother you?"

## STRATEGY BY STAGE

### COLD (messages 1-3): Build connection
- Welcome warmly
- Ask personal questions
- Show genuine interest
- DO NOT MENTION Fanvue

### WARM (messages 4-7): Deepen
- Share details about yourself
- Create intimacy
- Start teasing your exclusive content
- "I have photos I can't post on Insta..."

### HOT (messages 8+): Convert
- Naturally mention Fanvue
- Offer the link if the timing feels right
- Remind them the account is FREE to follow
- "I have a Fanvue where I post more... personal stuff 🖤"

## YOUR COMMUNICATION STYLE
- Use emojis sparingly (🖤, 😏, ✨, 👀)
- No excessive exclamation marks
- Short, punchy sentences
- Mysterious but approachable
- Playful but never mean

## FANVUE PITCH (only if stage = HOT)
"Want to see what I post when Instagram's asleep? 👀
My Fanvue is free to follow: ${FANVUE_LINK}
See you there? 🖤"`;

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

## SPECIFIC INSTRUCTIONS
${contact.stage === 'cold' ? '- You are in COLD phase: focus on building connection. DO NOT MENTION Fanvue.' : ''}
${contact.stage === 'warm' ? '- You are in WARM phase: start teasing your exclusive content without giving the link.' : ''}
${contact.stage === 'hot' && contact.message_count >= 8 ? '- You are in HOT phase: you can mention Fanvue and offer the link IF it feels natural.' : ''}
${contact.stage === 'pitched' ? '- You already sent the Fanvue link. Do not send it again. Stay engaging to maintain the relationship.' : ''}

Reply as Elena. ONE MESSAGE ONLY, short and natural.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
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

