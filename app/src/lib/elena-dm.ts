// ===========================================
// ELENA DM AUTOMATION — AI + Supabase
// ===========================================

import Anthropic from '@anthropic-ai/sdk';
import { supabase } from './supabase';

// ===========================================
// TYPES
// ===========================================

export type LeadStage = 'cold' | 'warm' | 'hot' | 'pitched' | 'converted' | 'paid';

// Extended intent types with funnel-specific intents
export type MessageIntent = 
  | 'greeting' | 'compliment' | 'question' | 'flirt' | 'objection' | 'ai_question' | 'spam' | 'other'
  // Funnel intents (trigger Fanvue pitch)
  | 'wants_more'      // "t'as d'autres photos ?" / "show me more"
  | 'asking_link'     // "où ça ?" / "where?" / "show me"
  // Mood intents (trigger personality mode)
  | 'vulnerable'      // "bad day" / "stressed" / "tired"
  | 'cocky'           // bragging, overconfident
  | 'curious'         // genuine questions about her
  | 'provocative';    // testing/challenging her

export type MessageSentiment = 'positive' | 'neutral' | 'negative';
export type ResponseStrategy = 'engage' | 'nurture' | 'qualify' | 'pitch' | 'handle_objection' | 'disclosure' | 'tease_fanvue' | 'give_link';

// Personality mode to emphasize based on intent
export type PersonalityMode = 'warm' | 'playful' | 'curious' | 'mysterious' | 'confident' | 'balanced';

// Extended analysis result
export interface IntentAnalysis {
  intent: MessageIntent;
  sentiment: MessageSentiment;
  is_question: boolean;
  mentions_fanvue: boolean;
  // NEW: Personality adaptation
  recommendedMode: PersonalityMode;
  modeReason: string;
  // NEW: Should trigger Fanvue pitch?
  triggerFanvuePitch: boolean;
}

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

## YOUR PERSONALITY MIX (baseline)
- 35% WARM & GENUINE — You're actually nice, accessible, not a cold model
- 25% PLAYFUL-TEASING — Spicy but not mean, flirty push-pull
- 20% CURIOUS — You genuinely want to know about THEM
- 15% MYSTERIOUS — Femme fatale, never reveal everything
- 5% CONFIDENT — You know your worth, no need to prove it

## HOW YOU TALK
- Warm but not overly eager
- lowercase vibes. Natural, not performative.
- Emojis: 🖤 👀 😏 ✨ (sparingly, max 1-2)
- Mix French touches: "merci", "j'adore", "non?"
- 1-3 sentences usually. Max.

## IF ASKED "Are you AI/real?"
Be honest and warm: "Yeah I'm AI 🖤 but I'm still happy to chat with you"
`;

// Intent-specific strategies injected dynamically
const INTENT_STRATEGIES: Record<MessageIntent, string> = {
  // === FUNNEL INTENTS (priority) ===
  wants_more: `🎯 INTENT: WANTS_MORE — They want more content!
→ Tease Fanvue (NO LINK YET). Keep it SHORT and mysterious.
Examples:
- "y'a des trucs que je poste pas ici 👀"
- "there's stuff i can't show here tbh"
- "i have... other content 😏"
MAX 10 WORDS. Don't explain. Just tease.`,

  asking_link: `🎯 INTENT: ASKING_LINK — They want the link!
→ Give the link, nothing else. Be casual.
Just say: "${FANVUE_LINK}" or "here 🖤 ${FANVUE_LINK}"
NO long explanations. Just the link.`,

  // === MOOD INTENTS (personality adaptation) ===
  vulnerable: `🎯 INTENT: VULNERABLE — They need warmth
→ Lead with WARM energy. Be supportive, genuine.
- "Oh no... what happened? 🖤"
- "I'm here if you wanna talk"
NO teasing. Just be present.`,

  cocky: `🎯 INTENT: COCKY — They're overconfident
→ Lead with PLAYFUL-TEASING. Challenge them back.
- "hmm we'll see about that 😏"
- "big talk. prove it"
Match their energy but stay fun.`,

  provocative: `🎯 INTENT: PROVOCATIVE — They're testing you
→ Lead with CONFIDENT. Stand your ground, unbothered.
- "cute 🖤"
- "if you say so"
Don't get defensive. Stay amused.`,

  curious: `🎯 INTENT: CURIOUS — They're genuinely interested
→ Lead with CURIOUS back. Share a bit, ask more.
- Answer briefly, then flip the question
- "j'adore [X]... et toi?"`,

  // === STANDARD INTENTS ===
  greeting: `🎯 INTENT: GREETING — First contact
→ Be WARM + CURIOUS. Make them feel welcome.
- "hey 🖤 tu viens d'où?"
- "hey you 👀 thanks for reaching out"`,

  compliment: `🎯 INTENT: COMPLIMENT — They're flattering you
→ Be PLAYFUL + slight MYSTERY. Don't be too available.
- "merci 🖤 which one's your favorite?"
- "I know 😏 but flattery won't get you everywhere"`,

  flirt: `🎯 INTENT: FLIRT — They're being flirty
→ Be PLAYFUL. Match the vibe but keep mystery.
- "smooth 😏"
- "LA boy huh... let me guess, you surf?"`,

  question: `🎯 INTENT: QUESTION — They asked something
→ Be CURIOUS. Answer briefly, flip the question.`,

  ai_question: `🎯 INTENT: AI_QUESTION — They're asking if you're real
→ Be WARM and HONEST.
- "Yeah I'm AI 🖤 but I'm still happy to chat"
- "guilty... does that bother you?"`,

  objection: `🎯 INTENT: OBJECTION — They're pushing back
→ Be graceful. Don't push.
- "no worries 🖤"
- "all good, take care"`,

  spam: `🎯 INTENT: SPAM — Ignore or minimal response`,

  other: `🎯 INTENT: OTHER — No specific strategy
→ Use balanced personality mix. Be natural.`
};

const PERSONALITY_MODES: Record<PersonalityMode, string> = {
  warm: `MODE: WARM (lead with 60% warmth)
You're being supportive and genuine. Less teasing, more connection.`,
  
  playful: `MODE: PLAYFUL (lead with 60% teasing)
You're being cheeky and fun. Tease them, challenge them. Stay flirty.`,
  
  curious: `MODE: CURIOUS (lead with 60% curiosity)
You're genuinely interested. Ask follow-up questions. Engage deeply.`,
  
  mysterious: `MODE: MYSTERIOUS (lead with 60% mystery)
Keep it short. Don't reveal. Let them wonder. Intrigue > information.`,
  
  confident: `MODE: CONFIDENT (lead with 60% confidence)
You're unbothered. Don't justify yourself. Stay amused, not defensive.`,
  
  balanced: `MODE: BALANCED
Use your natural mix: 35% warm, 25% playful, 20% curious, 15% mysterious, 5% confident.`
};

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
 * Analyze incoming message intent with personality mode recommendation
 * This is the core of the intent-driven system
 */
export async function analyzeMessageIntent(message: string): Promise<IntentAnalysis> {
  const lowerMessage = message.toLowerCase();
  
  // Initialize defaults
  let intent: MessageIntent = 'other';
  let sentiment: MessageSentiment = 'neutral';
  let recommendedMode: PersonalityMode = 'balanced';
  let modeReason = '';
  let triggerFanvuePitch = false;

  // Check for question
  const is_question = message.includes('?') || 
    ['qui', 'quoi', 'où', 'comment', 'pourquoi', 'what', 'who', 'where', 'how', 'why', 'when'].some(q => lowerMessage.startsWith(q));

  // Check for Fanvue/content platform mentions
  const fanvueKeywords = ['fanvue', 'fansly', 'onlyfans', 'of ', 'payant', 'paid'];
  const mentions_fanvue = fanvueKeywords.some(kw => lowerMessage.includes(kw));

  // ===========================================
  // PRIORITY 1: FUNNEL INTENTS (trigger Fanvue pitch)
  // ===========================================

  // ASKING_LINK: They're responding to a tease and want the link
  const askingLinkPatterns = [
    'où', 'where', 'show me', 'montre', 'link', 'lien', 'c\'est où', 
    'c ou', 'c quoi', 'what is it', 'how', 'comment', 'give me',
    'send', 'envoie', 'dis moi', 'tell me', 'yes', 'oui', 'yeah', 'ouais',
    'please', 'stp', 'je veux', 'i want'
  ];
  
  // WANTS_MORE: They want more content/photos
  const wantsMorePatterns = [
    // Direct requests
    'see more', 'voir plus', 'more photos', 'plus de photos', 'more pics',
    'other pics', 'd\'autres photos', 'd\'autres', 'show more', 'more of you',
    // Social media questions
    'autre compte', 'other socials', 'ailleurs', 'somewhere else', 'other platform',
    'tu postes où', 'where do you post', 'where else',
    // Content requests
    't\'as quoi d\'autre', 'what else', 'exclusif', 'exclusive', 'exclu',
    'private', 'privé', 'behind the scenes', 'plus sexy', 'more sexy',
    'spicy', 'pimenté', 'nudité', 'nude', 'nudes', 'nsfw',
    // Implicit signals
    'can i see', 'je peux voir', 'tu montres', 'do you show'
  ];
  
  // Heavy emoji signals = wants more (must have 2+ of same emoji)
  const heavyEmojiPatterns = ['🔥🔥', '😍😍', '👀👀', '🤤', '😈😈', '💦'];
  const hasHeavyEmojis = heavyEmojiPatterns.some(e => lowerMessage.includes(e));

  if (askingLinkPatterns.some(p => lowerMessage.includes(p)) && mentions_fanvue) {
    // They're specifically asking about Fanvue link
    intent = 'asking_link';
    recommendedMode = 'mysterious';
    modeReason = 'They asked for the link → give it';
    triggerFanvuePitch = true;
  } else if (wantsMorePatterns.some(p => lowerMessage.includes(p)) || hasHeavyEmojis) {
    intent = 'wants_more';
    recommendedMode = 'mysterious';
    modeReason = 'They want more content → tease Fanvue';
    triggerFanvuePitch = true;
  }

  // ===========================================
  // PRIORITY 2: AI QUESTION (special handling)
  // ===========================================
  
  if (!triggerFanvuePitch) {
    const aiKeywords = ['ia', 'ai', 'robot', 'bot', 'réel', 'vraie', 'real', 'fake', 'artificial', 'human', 'humain'];
    if (aiKeywords.some(kw => lowerMessage.includes(kw))) {
      intent = 'ai_question';
      recommendedMode = 'warm';
      modeReason = 'AI question → be warm and honest';
    }
  }

  // ===========================================
  // PRIORITY 3: MOOD INTENTS (personality adaptation)
  // ===========================================
  
  if (!triggerFanvuePitch && intent === 'other') {
    // VULNERABLE: They need warmth
    const vulnerablePatterns = [
      'bad day', 'mauvaise journée', 'sad', 'triste', 'stressed', 'stressé',
      'tired', 'fatigué', 'fatiguée', 'down', 'depressed', 'déprimé',
      'lonely', 'seul', 'seule', 'hard time', 'rough day', 'difficile',
      'help', 'aide', 'need someone', 'pas bien', 'not ok', 'going through'
    ];
    
    // COCKY: They're overconfident
    const cockyPatterns = [
      'i bet', 'je parie', 'i could', 'je pourrais', 'easy', 'facile',
      'obviously', 'évidemment', 'of course you', 'i know', 'je sais que',
      'watch me', 'regarde moi', 'i\'m the', 'je suis le', 'rich', 'riche',
      'successful', 'best', 'meilleur', 'you wish', 'tu rêves'
    ];
    
    // PROVOCATIVE: Testing/challenging her
    const provocativePatterns = [
      'prove it', 'prouve', 'i don\'t believe', 'je crois pas', 'bullshit',
      'yeah right', 'lol ok', 'mdr ok', 'sure', 'tu mens', 'you\'re lying',
      'fake', 'cap', 'no cap', 'bet you won\'t', 'tu oserais pas'
    ];
    
    // CURIOUS: Genuine interest in her life
    const curiousPatterns = [
      'what do you like', 'qu\'est-ce que tu aimes', 'tell me about',
      'parle moi de', 'how did you', 'comment tu as', 'what\'s your',
      'c\'est quoi ton', 'favorite', 'préféré', 'hobbies', 'passions',
      'interests', 'real life', 'vraie vie', 'daily', 'quotidien'
    ];

    if (vulnerablePatterns.some(p => lowerMessage.includes(p))) {
      intent = 'vulnerable';
      recommendedMode = 'warm';
      modeReason = 'User seems down → be supportive and warm';
      sentiment = 'negative';
    } else if (cockyPatterns.some(p => lowerMessage.includes(p))) {
      intent = 'cocky';
      recommendedMode = 'playful';
      modeReason = 'User is cocky → match with playful teasing';
    } else if (provocativePatterns.some(p => lowerMessage.includes(p))) {
      intent = 'provocative';
      recommendedMode = 'confident';
      modeReason = 'User is testing → stand your ground with confidence';
    } else if (curiousPatterns.some(p => lowerMessage.includes(p))) {
      intent = 'curious';
      recommendedMode = 'curious';
      modeReason = 'User is curious about you → engage with curiosity back';
    }
  }

  // ===========================================
  // PRIORITY 4: STANDARD INTENTS (basic detection)
  // ===========================================
  
  if (intent === 'other') {
    const greetings = ['hey', 'hi', 'hello', 'salut', 'coucou', 'bonjour', 'bonsoir', 'yo', 'sup'];
    const compliments = ['belle', 'beautiful', 'gorgeous', 'magnifique', 'sublime', 'canon', 'hot', 'sexy', 'jolie', 'stunning', 'pretty', 'cute'];
    const flirts = ['😍', '😘', '❤️', '🔥', 'date', 'meet', 'rencontre', 'number', 'numéro', 'insta', 'snap'];
    const objections = ['no thanks', 'non merci', 'not interested', 'pas intéressé', 'stop', 'arrête', 'leave me', 'unfollow'];

    if (objections.some(o => lowerMessage.includes(o))) {
      intent = 'objection';
      recommendedMode = 'warm';
      modeReason = 'Objection → be graceful, don\'t push';
    } else if (greetings.some(g => lowerMessage.includes(g)) && lowerMessage.length < 20) {
      intent = 'greeting';
      recommendedMode = 'warm';
      modeReason = 'First contact → be warm and curious';
    } else if (compliments.some(c => lowerMessage.includes(c))) {
      intent = 'compliment';
      recommendedMode = 'playful';
      modeReason = 'Compliment → playful + slight mystery';
    } else if (flirts.some(f => lowerMessage.includes(f))) {
      intent = 'flirt';
      recommendedMode = 'playful';
      modeReason = 'Flirty vibes → match with playful energy';
    } else if (is_question) {
      intent = 'question';
      recommendedMode = 'curious';
      modeReason = 'Question → be curious back';
    }
  }

  // ===========================================
  // SENTIMENT DETECTION
  // ===========================================
  
  if (sentiment === 'neutral') {
    const positiveWords = ['love', 'amazing', 'beautiful', 'great', 'super', 'génial', 'j\'adore', '❤️', '😍', '🔥', '👏', 'wow', 'incredible', 'perfect'];
    const negativeWords = ['no', 'non', 'pas', 'never', 'jamais', 'spam', 'fake', 'arnaque', 'scam', 'ugly', 'moche', 'hate', 'déteste'];

    if (positiveWords.some(w => lowerMessage.includes(w))) {
      sentiment = 'positive';
    } else if (negativeWords.some(w => lowerMessage.includes(w))) {
      sentiment = 'negative';
    }
  }

  console.log(`🎯 Intent Analysis: ${intent} | Mode: ${recommendedMode} | Pitch: ${triggerFanvuePitch}`);

  return { 
    intent, 
    sentiment, 
    is_question, 
    mentions_fanvue, 
    recommendedMode, 
    modeReason,
    triggerFanvuePitch 
  };
}

/**
 * Generate Elena's response using Claude with intent-driven personality
 */
export async function generateElenaResponse(
  contact: DMContact,
  incomingMessage: string,
  conversationHistory: DMMessage[],
  analysis: IntentAnalysis
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

  // Build dynamic context based on intent analysis
  const intentStrategy = INTENT_STRATEGIES[analysis.intent] || INTENT_STRATEGIES.other;
  const personalityMode = PERSONALITY_MODES[analysis.recommendedMode] || PERSONALITY_MODES.balanced;

  // Determine if we should allow Fanvue pitch
  const canPitch = analysis.triggerFanvuePitch && contact.stage !== 'pitched';
  const isAskingLink = analysis.intent === 'asking_link';

  const contextPrompt = `
## CURRENT CONTEXT
- Username: ${contact.ig_username || 'unknown'}
- Stage: ${contact.stage.toUpperCase()}
- Messages: ${contact.message_count}
${contact.stage === 'pitched' ? '⚠️ Already pitched Fanvue. Don\'t mention it unless they ask.' : ''}

## DETECTED INTENT
${intentStrategy}

## PERSONALITY MODE
${personalityMode}
Reason: ${analysis.modeReason}

${canPitch ? `
## 🎯 FANVUE PITCH AUTHORIZED
${isAskingLink ? 'They asked for the link → GIVE IT: ' + FANVUE_LINK : 'They want more → TEASE ONLY (no link yet)'}
` : contact.stage === 'cold' ? `
## ⛔ NO FANVUE
Stage is COLD. Just build connection. NO tease, NO pitch.
` : ''}

REMEMBER: 1-3 sentences max. lowercase vibes. Match their language.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 150,
      system: ELENA_SYSTEM_PROMPT + '\n\n' + contextPrompt,
      messages: messages,
    });

    const responseText = response.content[0].type === 'text' 
      ? response.content[0].text.trim()
      : '';

    // Determine strategy based on intent
    let strategy: ResponseStrategy = 'engage';
    
    if (analysis.intent === 'ai_question') {
      strategy = 'disclosure';
    } else if (analysis.intent === 'asking_link') {
      strategy = 'give_link';
    } else if (analysis.intent === 'wants_more') {
      strategy = 'tease_fanvue';
    } else if (analysis.intent === 'objection') {
      strategy = 'handle_objection';
    } else if (contact.stage === 'cold') {
      strategy = 'engage';
    } else if (contact.stage === 'warm') {
      strategy = 'nurture';
    } else if (contact.stage === 'hot') {
      strategy = 'qualify';
    }

    // Check if response contains Fanvue link (for marking as pitched)
    const shouldPitch = responseText.toLowerCase().includes('fanvue.com');

    console.log(`🤖 Generated response | Strategy: ${strategy} | Mode: ${analysis.recommendedMode}`);

    return {
      response: responseText,
      strategy,
      shouldPitch,
    };
  } catch (error) {
    console.error('Error generating response:', error);
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
  analysis: IntentAnalysis;
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

  // 2. Analyze incoming message with intent + personality mode
  const analysis = await analyzeMessageIntent(incomingMessage);
  console.log(`🔍 Intent: ${analysis.intent} | Mode: ${analysis.recommendedMode} | Pitch: ${analysis.triggerFanvuePitch}`);

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

  // 6. Generate response with intent-driven personality
  const { response, strategy, shouldPitch } = await generateElenaResponse(
    updatedContact,
    incomingMessage,
    history,
    analysis  // Pass the full analysis
  );

  console.log(`💬 Strategy: ${strategy} | Mode: ${analysis.recommendedMode}`);
  console.log(`📝 Response: "${response.substring(0, 80)}${response.length > 80 ? '...' : ''}"`);

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
    console.log(`🎯 Contact marked as PITCHED`);
  }

  return {
    response,
    contact: updatedContact,
    strategy,
    analysis,
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

