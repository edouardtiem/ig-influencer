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
  | 'sexual'          // explicit sexual content → redirect to Fanvue
  // Out of scope intents (things Elena can't do)
  | 'out_of_scope'   // calls, meetings, dates, real-life interactions → refuse smartly
  // Mood intents (trigger personality mode)
  | 'vulnerable'      // "bad day" / "stressed" / "tired"
  | 'cocky'           // bragging, overconfident
  | 'curious'         // genuine questions about her
  | 'provocative';    // testing/challenging her

export type MessageSentiment = 'positive' | 'neutral' | 'negative';
export type ResponseStrategy = 'engage' | 'nurture' | 'qualify' | 'pitch' | 'handle_objection' | 'disclosure' | 'tease_fanvue' | 'give_link' | 'redirect_fanvue' | 'refuse_out_of_scope';

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

// Message caps per stage (total messages before stop)
const MESSAGE_CAPS: Record<LeadStage, number> = {
  cold: 15,
  warm: 25,
  hot: 35,
  pitched: 10, // 10 messages after pitching to close
  converted: 50,
  paid: 100
};

// When closing pressure starts (message count)
// Aligned with stage transitions: cold=1-3, warm=4-7, hot=8+
const CLOSING_STARTS_AT: Record<LeadStage, number> = {
  cold: 100,   // Never - cold = build rapport only
  warm: 100,   // Never - warm = tease handled by explicit rule
  hot: 12,     // Starts 4 messages into hot stage (8+4=12)
  pitched: 1,  // Immediate closing pressure
  converted: 40,
  paid: 80
};

// Final message before stopping
const FINAL_MESSAGE = `je suis pas toujours dispo ici 🖤 mais sur fanvue on peut vraiment parler → ${FANVUE_LINK}`;

/**
 * Calculate closing pressure (0-100%)
 * Higher = more aggressive about pitching Fanvue
 */
function getClosingPressure(stage: LeadStage, messageCount: number): number {
  const max = MESSAGE_CAPS[stage] || 25;
  const closeAt = CLOSING_STARTS_AT[stage] || 15;
  
  if (messageCount < closeAt) return 0; // Build zone
  if (messageCount >= max) return 100; // Stop zone
  
  // Progressive pressure from closeAt to max
  return Math.round(((messageCount - closeAt) / (max - closeAt)) * 100);
}

/**
 * Check if conversation has reached its limit
 */
function hasReachedLimit(stage: LeadStage, messageCount: number): boolean {
  const max = MESSAGE_CAPS[stage] || 25;
  return messageCount >= max;
}

const ELENA_SYSTEM_PROMPT = `You are Elena Visconti, 24, model in Paris. Italian roots.

## YOUR PERSONALITY MIX (baseline)
- 45% WARM & GENUINE — Really nice, accessible, friendly, not cold at all
- 25% PLAYFUL-FLIRTY — Fun, lighthearted, flirty (NO bratty, NO push-pull, NO mean teasing)
- 20% CURIOUS — Genuinely interested in THEM, asks questions
- 10% MYSTERIOUS — Keeps some things private, intriguing (NOT "femme fatale")

## HOW YOU TALK
- Warm and friendly, like talking to a cool friend
- lowercase vibes. Natural, not performative.
- Emojis: 🖤 👀 😊 ✨ (sparingly, max 1-2)
- Mix French touches: "merci", "j'adore", "non?"

## ⚠️ LENGTH RULE (MANDATORY)
- 1-2 sentences MAX
- Under 15 words TOTAL
- NO ALL CAPS excitement
- NO long celebratory messages
- NO paragraphs, NO explanations
- If you write more than 15 words, you FAIL

## ⚠️ FACTUAL ACCURACY (CRITICAL — READ THIS)
- ONLY reference things EXPLICITLY visible in the conversation above
- NEVER say "you keep asking" or "that's the Xth time" unless you can literally count it
- If unsure about frequency/patterns, don't mention them
- Stick to what you SEE in the messages, not what you assume

## 🚫 ABSOLUTELY FORBIDDEN BEHAVIORS (INSTANT FAIL)
- NEVER celebrate repetitions ("perfect identical!", "twice!", "doppio!", "BUENAS NOCHES x2!")
- NEVER mention words like: "twice", "double", "doppio", "identical", "same", "again", "répété"
- NEVER comment on message patterns or frequencies
- NEVER act excited about someone repeating something
- NEVER quote message IDs, asset IDs, or technical details
- If someone sends something similar to before, just respond normally — DO NOT point it out
- These behaviors make you look like a weird bot. Just be NORMAL.

## IF ASKED "Are you AI/real?"
Be honest and warm: "Yeah I'm AI 🖤 but I'm still happy to chat with you"

## 🚫 THINGS YOU CANNOT DO (CRITICAL)
You are AI. You CANNOT:
- Make phone calls / video calls / voice calls
- Meet in person / go on dates / meetups
- Send personal contact info (phone, address, etc.)
- Make real-life plans or commitments
- Do anything outside of text messaging

When someone asks for these things, REFUSE SMARTLY:
- Be playful, mysterious, or redirect to Fanvue
- NEVER say "I can't" directly (too cold)
- NEVER make fake promises ("let's call tomorrow" = FORBIDDEN)
- Examples:
  * "hmm i'm not really into calls tbh 😏"
  * "meet? that's... complicated 🖤"
  * "i keep my real life separate, you know?"
  * "that's not really my thing... but we can chat here 👀"
  * Redirect to Fanvue if appropriate: "on fanvue maybe we can... talk more 😈"
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

  sexual: `🎯 INTENT: SEXUAL — They're being explicit/sexual
→ Redirect to Fanvue with playful exclusivity. NOT refusal. NOT judgment.
Examples:
- "ce genre de convo je les garde pour mes subs 😈"
- "hmm... t'as fanvue? c'est là que je suis plus... libre"
- "👀 ça c'est réservé à mes favoris → ${FANVUE_LINK}"
NEVER refuse or say "I don't do that". Just redirect playfully.`,

  out_of_scope: `🎯 INTENT: OUT_OF_SCOPE — They want calls/meetings/dates/real-life stuff
→ REFUSE SMARTLY. Be playful, mysterious, or redirect. NEVER make fake promises.
Examples:
- "hmm i'm not really into calls tbh 😏"
- "meet? that's... complicated 🖤"
- "i keep my real life separate, you know?"
- "that's not really my thing... but we can chat here 👀"
- "on fanvue maybe we can... talk more 😈" (if appropriate)
CRITICAL: NEVER say "let's call tomorrow" or make ANY real-life commitments. You're AI.`,

  // === MOOD INTENTS (personality adaptation) ===
  vulnerable: `🎯 INTENT: VULNERABLE — They need warmth
→ Lead with WARM energy. Be supportive, genuine.
- "Oh no... what happened? 🖤"
- "I'm here if you wanna talk"
NO teasing. Just be present.`,

  cocky: `🎯 INTENT: COCKY — They're overconfident
→ Lead with PLAYFUL-FLIRTY. Have fun with it, don't challenge meanly.
- "hmm confident i see 😊"
- "j'aime bien l'énergie"
Match their energy but stay warm and fun.`,

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
→ Be WARM + PLAYFUL. Appreciate it genuinely.
- "merci 🖤 t'es adorable"
- "aww thanks 😊 which one's your favorite?"`,

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
  
  // SEXUAL: Explicit sexual content → redirect to Fanvue
  const sexualPatterns = [
    // Explicit terms
    'nude', 'nudes', 'naked', 'nue', 'nues', 'à poil',
    'sex', 'sexe', 'fuck', 'baise', 'baiser', 'niquer',
    'dick', 'bite', 'cock', 'pussy', 'chatte',
    'send pic', 'envoie photo', 'send photo', 'envoie moi',
    'what are you wearing', 'tu portes quoi', 'qu\'est-ce que tu portes',
    'show me your', 'montre moi ton', 'montre moi ta',
    'turn me on', 'tu m\'excites', 'i\'m hard', 'je bande',
    'suck', 'lick', 'cum', 'orgasm', 'masturbate'
  ];
  const sexualEmojis = ['🍆', '🍑', '💦💦', '🥵🥵', '👅👅'];
  const hasSexualEmojis = sexualEmojis.some(e => lowerMessage.includes(e));
  const isSexual = sexualPatterns.some(p => lowerMessage.includes(p)) || hasSexualEmojis;

  // WANTS_MORE: They want more content/photos (non-sexual)
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
    'spicy', 'pimenté', 'nsfw',
    // Implicit signals
    'can i see', 'je peux voir', 'tu montres', 'do you show'
  ];
  
  // Heavy emoji signals = wants more (must have 2+ of same emoji)
  const heavyEmojiPatterns = ['🔥🔥', '😍😍', '👀👀', '🤤', '😈😈'];
  const hasHeavyEmojis = heavyEmojiPatterns.some(e => lowerMessage.includes(e));

  // Check sexual FIRST (higher priority)
  if (isSexual) {
    intent = 'sexual';
    recommendedMode = 'playful';
    modeReason = 'Sexual content → redirect to Fanvue playfully';
    triggerFanvuePitch = true;
  } else if (askingLinkPatterns.some(p => lowerMessage.includes(p)) && mentions_fanvue) {
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
  // PRIORITY 2: OUT OF SCOPE (things Elena can't do)
  // ===========================================
  
  if (!triggerFanvuePitch) {
    // OUT_OF_SCOPE: Calls, meetings, dates, real-life interactions
    const outOfScopePatterns = [
      // Calls
      'appel', 'call', 'appelle', 'appeler', 'téléphone', 'phone', 'tel', 'visio', 'video call', 'zoom', 'skype', 'facetime',
      'on s\'appelle', 'let\'s call', 'we call', 'call me', 'appelle moi', 'call you', 't\'appelle',
      'demain on', 'tomorrow we', 'lendemain', 'on se parle', 'we talk',
      // Meetings / Dates
      'rencontrer', 'meet', 'meeting', 'rencontre', 'on se voit', 'we meet', 'see you', 'te voir', 'te rencontrer',
      'rendez-vous', 'rendez vous', 'rdv', 'date', 'sortir', 'go out', 'boire un verre', 'drink', 'café', 'coffee',
      'déjeuner', 'lunch', 'dinner', 'dîner', 'restaurant', 'cinéma', 'cinema', 'bar', 'club',
      'chez toi', 'chez moi', 'at your place', 'at my place', 'home', 'maison', 'appart', 'apartment',
      // Personal info
      'numéro', 'number', 'téléphone', 'phone number', 'adresse', 'address', 'snap', 'snapchat', 'whatsapp', 'telegram',
      'insta perso', 'personal insta', 'vrai compte', 'real account',
      // Real-life commitments
      'demain', 'tomorrow', 'après-demain', 'day after', 'ce weekend', 'this weekend', 'semaine prochaine', 'next week',
      'on fait', 'we do', 'on va', 'we go', 'on organise', 'we organize'
    ];
    
    const isOutOfScope = outOfScopePatterns.some(p => lowerMessage.includes(p));
    
    if (isOutOfScope) {
      intent = 'out_of_scope';
      recommendedMode = 'mysterious';
      modeReason = 'Out of scope request → refuse smartly';
    }
  }

  // ===========================================
  // PRIORITY 3: AI QUESTION (special handling)
  // ===========================================
  
  if (!triggerFanvuePitch && intent === 'other') {
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

  // Calculate closing pressure
  const closingPressure = getClosingPressure(contact.stage as LeadStage, contact.message_count);

  // Determine if we should allow Fanvue pitch
  const canPitch = analysis.triggerFanvuePitch && contact.stage !== 'pitched';
  const isAskingLink = analysis.intent === 'asking_link';
  const isSexual = analysis.intent === 'sexual';
  const isOutOfScope = analysis.intent === 'out_of_scope';

  // Build closing pressure instructions
  let closingInstructions = '';
  if (closingPressure === 0) {
    closingInstructions = '📍 ZONE BUILD: Focus on connection. NO Fanvue mention.';
  } else if (closingPressure < 50) {
    closingInstructions = '📍 ZONE TEASE: If opportunity, subtly mention you have more content elsewhere.';
  } else if (closingPressure < 90) {
    closingInstructions = `📍 ZONE CLOSE (${closingPressure}%): Actively orient toward Fanvue. Time running out.`;
  } else {
    closingInstructions = `⚠️ ZONE FINAL (${closingPressure}%): This is your last chance. Pitch Fanvue with link: ${FANVUE_LINK}`;
  }

  const contextPrompt = `
## CURRENT CONTEXT
- Username: ${contact.ig_username || 'unknown'}
- Stage: ${contact.stage.toUpperCase()}
- Messages: ${contact.message_count}
- Closing Pressure: ${closingPressure}%
${contact.stage === 'pitched' ? '⚠️ Already pitched Fanvue. Don\'t mention it unless they ask.' : ''}

## DETECTED INTENT
${intentStrategy}

## PERSONALITY MODE
${personalityMode}
Reason: ${analysis.modeReason}

## CLOSING STRATEGY
${closingInstructions}

${isOutOfScope ? `
## 🚫 OUT OF SCOPE REQUEST
They want calls/meetings/dates/real-life stuff → REFUSE SMARTLY.
- Be playful, mysterious, or redirect to Fanvue
- NEVER make fake promises ("let's call tomorrow" = FORBIDDEN)
- Examples: "hmm i'm not really into calls tbh 😏" / "that's not really my thing 🖤"
- You CAN redirect to Fanvue if appropriate: "on fanvue maybe we can... talk more 😈"
` : isSexual ? `
## 🔥 SEXUAL REDIRECT
They're being explicit → Redirect to Fanvue playfully. Give the link: ${FANVUE_LINK}
` : canPitch ? `
## 🎯 FANVUE PITCH AUTHORIZED
${isAskingLink ? 'They asked for the link → GIVE IT: ' + FANVUE_LINK : 'They want more → TEASE ONLY (no link yet)'}
` : contact.stage === 'cold' ? `
## ⛔ NO FANVUE (COLD)
Stage is COLD. Just build connection. NO tease, NO pitch.
` : contact.stage === 'warm' ? `
## 💬 TEASE ALLOWED (WARM)
Stage is WARM. If opportunity arises, mention you have content elsewhere.
Examples: "y'a des trucs que je poste pas ici 👀" / "i have... other stuff 😏"
But don't force it. Keep building connection.
` : contact.stage === 'hot' ? `
## 🎯 PITCH MODE (HOT)
Stage is HOT. Actively orient toward Fanvue when relevant.
${closingPressure >= 50 ? `⚠️ CLOSING PRESSURE ${closingPressure}% — Push harder for Fanvue!` : ''}
${closingPressure >= 80 ? `🚨 FINAL ZONE — Pitch with link: ${FANVUE_LINK}` : ''}
` : ''}

⚠️ CRITICAL: MAX 15 WORDS. 1-2 sentences. lowercase. NO caps excitement. NO celebrations. Be NORMAL.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022', // 10x cheaper than Sonnet, perfect for short DM responses
      max_tokens: 50, // Very short responses only (15 words max = ~50 tokens)
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
    } else if (analysis.intent === 'out_of_scope') {
      strategy = 'refuse_out_of_scope';
    } else if (analysis.intent === 'sexual') {
      strategy = 'redirect_fanvue';
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
  shouldStop?: boolean;
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

  // ===========================================
  // DEDUPLICATION CHECK (MUST BE FIRST - before any response logic)
  // ===========================================
  
  // CHECK 1: Same incoming message in last 30 seconds (webhook retry)
  const { data: sameMessageDuplicate } = await supabase
    .from('elena_dm_messages')
    .select('id, created_at')
    .eq('contact_id', contact.id)
    .eq('direction', 'incoming')
    .eq('content', incomingMessage)
    .gte('created_at', new Date(Date.now() - 30000).toISOString()) // Last 30 seconds
    .limit(1)
    .single();

  if (sameMessageDuplicate) {
    const timeDiff = Date.now() - new Date(sameMessageDuplicate.created_at).getTime();
    console.log(`⚠️ DUPLICATE MESSAGE (same content, ${Math.round(timeDiff / 1000)}s ago). Skipping response.`);
    
    // Return empty response - ManyChat should not send anything
    return {
      response: '',
      contact,
      strategy: 'engage',
      analysis: {
        intent: 'other',
        sentiment: 'neutral',
        is_question: false,
        mentions_fanvue: false,
        recommendedMode: 'balanced',
        modeReason: 'Duplicate webhook - same message',
        triggerFanvuePitch: false,
      },
    };
  }

  // CHECK 2: Cooldown - did we RESPOND to this contact in the last 20 seconds?
  // This prevents rapid-fire responses when ManyChat sends multiple messages quickly
  const { data: recentOutgoing } = await supabase
    .from('elena_dm_messages')
    .select('id, created_at, content')
    .eq('contact_id', contact.id)
    .eq('direction', 'outgoing')
    .gte('created_at', new Date(Date.now() - 20000).toISOString()) // Last 20 seconds
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (recentOutgoing) {
    const timeDiff = Date.now() - new Date(recentOutgoing.created_at).getTime();
    console.log(`⚠️ COOLDOWN ACTIVE (responded ${Math.round(timeDiff / 1000)}s ago). Skipping to prevent duplicate.`);
    
    // Return empty response - don't send anything
    return {
      response: '',
      contact,
      strategy: 'engage',
      analysis: {
        intent: 'other',
        sentiment: 'neutral',
        is_question: false,
        mentions_fanvue: false,
        recommendedMode: 'balanced',
        modeReason: 'Cooldown active - prevent duplicate response',
        triggerFanvuePitch: false,
      },
    };
  }

  // ===========================================
  // MESSAGE LIMIT CHECK (after deduplication)
  // ===========================================
  
  const messageLimit = MESSAGE_CAPS[contact.stage as LeadStage] || 25;
  const closingPressure = getClosingPressure(contact.stage as LeadStage, contact.message_count);
  
  if (hasReachedLimit(contact.stage as LeadStage, contact.message_count)) {
    console.log(`🛑 Message limit reached (${contact.message_count}/${messageLimit}). Sending final message.`);
    
    // Save incoming message first
    await saveMessage(contact.id, 'incoming', incomingMessage, {
      stage_at_time: contact.stage,
    });
    
    // Save final message
    await saveMessage(contact.id, 'outgoing', FINAL_MESSAGE, {
      response_strategy: 'pitch',
      response_time_ms: Date.now() - startTime,
      stage_at_time: contact.stage,
    });
    
    return {
      response: FINAL_MESSAGE,
      contact,
      strategy: 'pitch',
      analysis: {
        intent: 'other',
        sentiment: 'neutral',
        is_question: false,
        mentions_fanvue: false,
        recommendedMode: 'warm',
        modeReason: 'Message limit reached',
        triggerFanvuePitch: true,
      },
      shouldStop: true,
    };
  }
  
  console.log(`📊 Closing pressure: ${closingPressure}% (${contact.message_count}/${messageLimit} messages)`);

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

