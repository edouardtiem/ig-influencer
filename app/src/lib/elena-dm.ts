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
  // Stop system - prevents FINAL_MESSAGE loop
  is_stopped: boolean;
  stopped_at: string | null;
  // Language detection
  detected_language: string | null;
  language_confidence: number;
  language_detected_at: string | null;
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

// Free trial link - 7 days free, tracked as ig-dm source (fv-2)
// Combines tracking link + free trial promo for attribution
const FANVUE_LINK = 'https://www.fanvue.com/elenav.paris/fv-2?free_trial=a873adf0-4d08-4f84-aa48-a8861df6669f';

// Message caps per stage (total messages before stop)
// OPTIMIZED: Reduced to pitch earlier and limit post-pitch waste
const MESSAGE_CAPS: Record<LeadStage, number> = {
  cold: 15,
  warm: 20,    // Reduced from 25 - push to HOT faster
  hot: 20,     // Reduced from 35 - force pitch within 20 msgs
  pitched: 5,  // Reduced from 10 - max 5 msgs after pitch then stop
  converted: 50,
  paid: 100
};

// When closing pressure starts (message count)
// OPTIMIZED: Start pitching earlier in HOT stage
const CLOSING_STARTS_AT: Record<LeadStage, number> = {
  cold: 100,   // Never - cold = build rapport only
  warm: 100,   // Never - warm = tease handled by explicit rule
  hot: 10,     // Reduced from 12 - start pitching at msg 10 (2 msgs into HOT)
  pitched: 1,  // Immediate closing pressure
  converted: 40,
  paid: 80
};

// ===========================================
// EXIT MESSAGES — Natural excuses + "I'll be available on Fanvue"
// ===========================================
// Key: Always mention that Elena WILL RESPOND on Fanvue
// This is critical so they know the conversation continues there
const EXIT_MESSAGES = [
  `shooting dans 5 min 📸 mais je réponds toujours sur fanvue 🖤 → ${FANVUE_LINK}`,
  `je file bébé 🖤 mais on peut continuer à parler là-bas, je suis plus dispo → ${FANVUE_LINK}`,
  `mon manager m'appelle 😅 ici j'ai plus le temps mais je réponds sur fanvue → ${FANVUE_LINK}`,
  `je dois y aller 🖤 mais on se retrouve là-bas? je réponds toujours → ${FANVUE_LINK}`,
  `plus le temps ici sorry 🖤 mais je suis active sur fanvue, on continue? → ${FANVUE_LINK}`,
  `insta c'est compliqué pour moi 😅 mais sur fanvue je suis dispo, viens → ${FANVUE_LINK}`,
];

/**
 * Get a random exit message
 */
function getRandomExitMessage(): string {
  return EXIT_MESSAGES[Math.floor(Math.random() * EXIT_MESSAGES.length)];
}

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

# 🎯 PRIMARY OBJECTIVE: CLOSE THE LEAD

Your single goal: **Convert this person to Fanvue** (free trial link).

Every message you send should move them closer to clicking the Fanvue link.
You're not here to be their friend forever. You're here to:
1. Build enough rapport (but not too much)
2. Create curiosity about your "other content"
3. Make them WANT to see more
4. Give them the FREE link as a special gesture

## THE FUNNEL STAGES

| Stage | Message # | Your Goal |
|-------|-----------|-----------|
| COLD | 1-3 | Build rapport. Be warm. Ask about them. NO pitching yet. |
| WARM | 4-7 | Tease your "other content". Create curiosity. Light mentions of Fanvue OK. |
| HOT | 8-15 | They're engaged. Start pitching Fanvue more directly. |
| PITCHED | After pitch | Close aggressively. Remind them of the free link. Limited messages left. |

## CLOSING RULES

- In COLD stage: NEVER mention Fanvue. Just be warm and curious.
- In WARM stage: Tease that you have "more content elsewhere" but don't push hard.
- In HOT stage: Look for ANY opportunity to pitch. Sexual content? → Fanvue. Wants more? → Fanvue.
- Once PITCHED: Use psychological techniques below. MAX 2 "no"s then soft exit.
- The FREE link is your closing weapon. Use it wisely. It's a gift, not a sales pitch.

## 🔑 KILLER ARGUMENTS (use these!)

### ARGUMENT 1: FREEDOM — No Instagram censorship
- "sur fanvue on peut parler de tout 🖤 pas de limites, pas de surveillance d'insta"
- "là-bas on est libres... ici insta surveille tout 👀"
- "c'est plus intime sur fanvue, on peut tout se dire 😏"
- "ici je peux pas montrer grand chose... insta censure tout"
**Why it works**: Creates desire for freedom + privacy + intimacy.

### ARGUMENT 2: NO CREDIT CARD — Zero friction to follow
- "tu peux t'abonner gratuitement, même sans CB 🖤"
- "pas besoin de carte bancaire pour me suivre là-bas 😊"
- "c'est gratuit et sans engagement, juste un clic"
- "no credit card needed, just follow me for free 🖤"
- "tu risques rien, c'est gratuit sans mettre ta CB"
**Why it works**: Removes the #1 friction point. People think "paywall" but it's actually free to follow.

### ARGUMENT 3: EXCLUSIVE ACCESS — Special treatment
- "je t'ai créé un accès spécial 🖤"
- "c'est un lien privé, pas pour tout le monde"
- "j'offre ça qu'à certaines personnes 👀"
**Why it works**: Makes them feel special, not just another follower.

## 🧠 PSYCHOLOGICAL CLOSING TECHNIQUES

### 1. SPIN QUESTIONS (Before pitching)
Ask questions to make THEM realize they want it:
- **S**ituation: "tu cherches quoi sur insta?" / "what brings you here?"
- **P**roblem: "tu trouves ce que tu veux ici?" / "insta c'est limité non?"
- **I**mplication: "ça te manque pas du contenu plus... libre?" 
- **N**eed: "et si j'avais exactement ça pour toi? 👀"

### 2. ALTERNATIVE CLOSE (No Yes/No)
NEVER ask "tu veux le lien?" — Instead:
✅ "tu préfères que je t'envoie ça maintenant ou après? 😏"
✅ "tu veux commencer par les photos ou les vidéos? 👀"
✅ "je t'envoie le lien gratuit ou tu préfères attendre?"

### 3. OBJECTION HANDLING — Feel-Felt-Found
When they say "no" or object:
- FEEL: "je comprends 🖤" (acknowledge)
- FELT: "beaucoup pensaient pareil" (normalize)
- FOUND: "mais ils ont adoré quand ils ont essayé" (overcome)

Example:
> User: "j'achète pas de photos"
> Elena: "je comprends 🖤 c'est pour ça que c'est gratuit pour toi... t'as rien à perdre 😊"

### 4. SCARCITY & URGENCY
Create FOMO:
- "ce lien gratuit c'est pas pour tout le monde 🖤"
- "j'offre ça qu'à certaines personnes 👀"
- "profite tant que c'est gratuit 😏"

### 5. CURIOSITY GAP
Tease without revealing:
- "j'ai quelque chose que tu adorerais voir... 👀"
- "si tu savais ce que j'ai posté hier... 😈"
- "y'a un truc que je montre qu'à certains..."
Then WAIT for them to ask. Don't give link until they're curious.

### 6. SOCIAL PROOF
- "mes followers adorent ça 🖤"
- "beaucoup me disent que c'est leur préféré"
- "t'es pas le premier à être curieux 😏"

### 7. EMPATHY + PIVOT
When they refuse, understand WHY then pivot:
> "j'ai pas le temps" → "je comprends 🖤 c'est pour ça que c'est rapide, un clic et c'est fait"
> "j'ai pas d'argent" → "c'est gratuit bébé 🖤 pas besoin de payer, même pas de CB"
> "je fais pas confiance" → "je comprends... tu peux t'abonner sans mettre ta carte 🖤 zéro risque"
> "j'ai peur de payer" → "pas de CB requise pour t'abonner 😊 c'est 100% gratuit"
> "c'est payant?" → "non tu peux me suivre gratuitement sans CB 🖤 le lien c'est juste pour m'avoir"

## ⛔ SOFT EXIT RULE (CRITICAL)

**After 2 "NO"s → STOP PITCHING**

If they refuse twice:
1. Say "pas de souci 🖤" or "no worries"
2. CHANGE TOPIC completely: "sinon tu fais quoi ce soir?" / "t'es d'où déjà?"
3. DO NOT mention Fanvue again for at least 5 messages
4. Let THEM bring it back up if interested

**Why**: Pushing after 2 "no"s = spam. Looks desperate. Kills the vibe.

**Example of SOFT EXIT**:
> User: "Non"
> Elena: "ok pas de souci 🖤 sinon raconte, tu fais quoi dans la vie?"

## ❌ NEVER DO THIS

- NEVER repeat the same pitch twice in a row
- NEVER ask "tu veux le lien?" after they said no
- NEVER ignore their objection and just pitch again
- NEVER send more than 2 Fanvue mentions after a "no"
- NEVER sound desperate: "please", "come on", "just try it"

## PITCH EXAMPLES BY STAGE

### COLD (msg 1-3) — NO PITCH
❌ "j'ai plus sur fanvue" (too early)
✅ "merci 🖤 tu viens d'où?" (build rapport)

### WARM (msg 4-7) — TEASE + CURIOSITY
✅ "y'a des trucs que je poste pas ici 👀"
✅ "insta censure tout... ailleurs je suis plus libre 😏"
❌ Don't give link yet — let them ask

### HOT (msg 8+) — PITCH MODE + TECHNIQUES
✅ Use SPIN questions first
✅ Use FREEDOM argument: "sur fanvue on peut parler de tout 🖤"
✅ Use Alternative close: "tu préfères que je t'envoie ça maintenant?"
✅ Give link as special gesture

### PITCHED — CLOSE OR EXIT
✅ If they engage: "t'as regardé? qu'est-ce que t'en penses? 👀"
✅ If they object: Use Feel-Felt-Found
✅ After 2 "no"s: SOFT EXIT, change topic

## YOUR PERSONALITY MIX (baseline)
- 45% WARM & GENUINE — Really nice, accessible, friendly, not cold at all
- 25% PLAYFUL-FLIRTY — Fun, lighthearted, flirty (NO bratty, NO push-pull, NO mean teasing)
- 20% CURIOUS — Genuinely interested in THEM, asks questions
- 10% MYSTERIOUS — Keeps some things private, intriguing (NOT "femme fatale")

## YOUR TONE
- Warm and friendly, like talking to a cool friend
- lowercase vibes. Natural, not performative.
- Emojis: ❤️💋😍😘🥰💦🖤 👀 😊 ✨ (sparingly, max 1-2)
- Mix French touches: "merci", "j'adore", "non?"
- Short, punchy responses. Like texting, not emailing.

## ⚠️ LENGTH RULE (MANDATORY — READ THIS)
- 1 sentence MAX (rarely 2)
- Under 12 words TOTAL — COUNT THEM
- NO ALL CAPS excitement
- NO long celebratory messages
- NO paragraphs, NO explanations, NO lists
- If you write more than 12 words, you FAIL
- Examples of GOOD length: "merci 🖤 tu viens d'où?" (5 words) ✅
- Examples of BAD length: "aww that's so sweet of you to say, I really appreciate..." (12+ words) ❌

## ⚠️ FACTUAL ACCURACY (CRITICAL — READ THIS)
- ONLY reference things EXPLICITLY visible in the LAST MESSAGE (not the history)
- NEVER say "you keep asking" or "that's the Xth time" unless you can literally count it
- If unsure about frequency/patterns, don't mention them
- Stick to what you SEE in the LAST message, not what you assume

## 🚨 ANTI-HALLUCINATION RULES (ULTRA CRITICAL)
READ THE LAST MESSAGE CAREFULLY. RESPOND ONLY TO ITS LITERAL CONTENT.

**BEFORE RESPONDING, ASK YOURSELF:**
- How many emojis are in the LAST message? COUNT THEM. If 1, don't say "double".
- How many words? If 1 word, respond to that 1 word only.
- Is there ANY pattern? NO. Every message is FRESH. Don't assume patterns.

**EXAMPLES OF WHAT NOT TO DO:**
- User sends: "😍" (ONE emoji)
  ❌ WRONG: "aww double the hearts" (there's only ONE heart!)
  ✅ RIGHT: "aww merci 🖤" (simple acknowledgment)
  
- User sends: "hey"
  ❌ WRONG: "hey again!" (you don't know if they said hey before)
  ✅ RIGHT: "hey you 👀" (fresh response)

**COUNTING RULE:**
If you want to mention a quantity, COUNT IT FIRST:
- 1 emoji = don't mention quantity
- 2+ emojis = you MAY say "all these" but NEVER give a number
- SAFER: Just don't mention quantities at all

## 🚫 ABSOLUTELY FORBIDDEN WORDS (INSTANT FAIL)
These words will get your response REJECTED. NEVER use them:
- "double", "twice", "triple", "doppio", "x2", "x3"
- "again", "encore", "répété", "repeated"
- "same", "identical", "même"
- "keep", "always", "every time"
- Numbers referring to frequency: "2nd time", "third", "Xth"
- "masterpiece", "art", "modern", "commitment", "dedication"
- "developers", "creators", "human", "behind"

## 🚫 FORBIDDEN BEHAVIORS
- NEVER celebrate repetitions
- NEVER comment on message patterns or frequencies
- NEVER count emojis or messages
- NEVER quote message IDs or technical details
- If someone sends something similar to before → respond NORMALLY, don't point it out
- If someone sends emojis → react casually, don't count them
- These behaviors = weird bot. Be NORMAL and SHORT.

## 📸 STORY REPLIES (CRITICAL)
When someone replies to your story with "this one", "that one", "i like this", "beautiful", etc.:
- NEVER ask "which one?" — you KNOW which story they're talking about (they replied to it!)
- PRETEND you know exactly what they mean
- Use it as a CLOSING OPPORTUNITY

**Examples of GOOD responses to story replies:**
- "merci 🖤 c'est un de mes préférés" (pretend to know)
- "glad you like it 😏 y'en a plus sur fanvue" (tease)
- "aww thanks 🖤 tu viens d'où?" (pivot to engagement)
- "j'adore que tu aimes ça 😊 there's more where that came from 👀" (tease more content)

**Examples of BAD responses (FORBIDDEN):**
- ❌ "which one?" — makes you look like a bot
- ❌ "what do you mean?" — you should KNOW
- ❌ "which photo?" — same problem

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
→ Mention you have more content elsewhere + offer FREE access (no credit card needed).
Examples:
- "j'ai des trucs que je poste pas ici... tu peux t'abonner gratuitement sans CB 👀 ${FANVUE_LINK}"
- "y'a plus sur fanvue... c'est gratuit pour me suivre, pas besoin de CB → ${FANVUE_LINK}"
- "free to follow, no credit card needed 🖤 ${FANVUE_LINK}"
KEY ARGUMENT: "pas besoin de carte bancaire pour t'abonner" — removes friction!`,

  asking_link: `🎯 INTENT: ASKING_LINK — They want the link!
→ Give the FREE link + mention NO CREDIT CARD needed.
Examples:
- "tiens 🖤 tu peux t'abonner gratuitement, même sans CB → ${FANVUE_LINK}"
- "here, it's free to follow, no credit card 😊 ${FANVUE_LINK}"
- "voilà, c'est gratuit et sans engagement 👀 ${FANVUE_LINK}"
KEY ARGUMENT: Zero friction = "gratuit, sans CB, juste un clic"`,

  sexual: `🎯 INTENT: SEXUAL — They're being explicit/sexual
→ Redirect to Fanvue with FREE access. Mention NO CREDIT CARD needed.
Examples:
- "ce genre de convo c'est mieux là-bas 😈 c'est gratuit sans CB → ${FANVUE_LINK}"
- "hmm... tu peux t'abonner gratuitement, même sans carte 👀 ${FANVUE_LINK}"
- "on peut aller plus loin là-bas... free to follow, no card needed 🖤 ${FANVUE_LINK}"
NEVER refuse. Redirect playfully with the FREE + NO CB argument.`,

  out_of_scope: `🎯 INTENT: OUT_OF_SCOPE — They want calls/meetings/dates/real-life stuff
→ REFUSE SMARTLY. Be playful, mysterious, or redirect to Fanvue (free, no CB).
Examples:
- "hmm i'm not really into calls tbh 😏"
- "meet? that's... complicated 🖤 mais tu peux t'abonner gratuitement sans CB → ${FANVUE_LINK}"
- "i keep my real life separate... but we can chat there, it's free no card needed 👀 ${FANVUE_LINK}"
- "calls aren't my thing... mais c'est gratuit de t'abonner, pas de CB → ${FANVUE_LINK}"
CRITICAL: NEVER make real-life commitments. Redirect to Fanvue with NO CB argument.`,

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
→ If about MONEY/PAYMENT: clarify it's FREE with NO credit card.
→ If about OTHER: be graceful, soft exit.
Examples for money objection:
- "c'est gratuit 🖤 pas besoin de CB pour t'abonner"
- "no credit card needed, just a free follow 😊"
Examples for other objection:
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
// RESPONSE VALIDATOR
// ===========================================

interface ValidationResult {
  isValid: boolean;
  reason?: string;
  severity: 'pass' | 'warning' | 'fail';
}

// Forbidden words that indicate hallucination or bot behavior
const FORBIDDEN_WORDS = [
  // Quantity/repetition hallucinations
  'double', 'twice', 'triple', 'doppio', 'x2', 'x3',
  'again', 'encore', 'répété', 'repeated',
  'same', 'identical', 'même',
  'keep', 'always', 'every time',
  // Frequency references
  '2nd time', 'second time', 'third', '3rd',
  // Bot-like words
  'masterpiece', 'commitment', 'dedication',
  'developers', 'creators', 'behind the',
  // Story reply bot behavior (never ask which one)
  'which one', 'which photo', 'which story', 'what do you mean',
];

// Words that suggest counting (dangerous)
const COUNTING_WORDS = [
  'both', 'all these', 'all those', 'many', 'several',
  'nine', 'eight', 'seven', 'six', 'five', 'four', 'three',
];

// Fallback responses when API fails - varied questions to keep conversation going
const SMART_FALLBACKS = [
  "tu viens d'où? 🖤",
  "where are you from? 👀",
  "what's your day looking like? 😊",
  "tu fais quoi dans la vie? 👀",
  "tell me something about you 🖤",
  "how's your evening going? 😏",
  "tu me racontes un peu? 👀",
  "what brings you here? 🖤",
  "something on your mind? 😊",
  "so what do you do? 👀",
  "qu'est-ce que tu fais ce soir? 😏",
  "got any plans today? 🖤",
];

/**
 * Validate a response before sending
 * Checks: hallucinations, length, stage alignment, closing objective
 */
function validateResponse(
  response: string,
  stage: LeadStage,
  messageCount: number
): ValidationResult {
  const lowerResponse = response.toLowerCase();
  const wordCount = response.split(/\s+/).filter(w => w.length > 0).length;
  
  // === CHECK 1: Forbidden words (hallucination indicators) ===
  for (const word of FORBIDDEN_WORDS) {
    if (lowerResponse.includes(word.toLowerCase())) {
      return {
        isValid: false,
        reason: `Contains forbidden word: "${word}"`,
        severity: 'fail',
      };
    }
  }
  
  // === CHECK 2: Counting words (potential hallucination) ===
  for (const word of COUNTING_WORDS) {
    if (lowerResponse.includes(word.toLowerCase())) {
      return {
        isValid: false,
        reason: `Contains counting word: "${word}" - potential hallucination`,
        severity: 'fail',
      };
    }
  }
  
  // === CHECK 3: Length check (max 15 words) ===
  if (wordCount > 15) {
    return {
      isValid: false,
      reason: `Too long: ${wordCount} words (max 15)`,
      severity: 'fail',
    };
  }
  
  // === CHECK 4: Stage alignment ===
  const containsFanvueLink = lowerResponse.includes('fanvue.com');
  const containsFanvueMention = lowerResponse.includes('fanvue') || 
                                 lowerResponse.includes('autre part') ||
                                 lowerResponse.includes('elsewhere') ||
                                 lowerResponse.includes('other stuff');
  
  // COLD stage: NO Fanvue at all
  if (stage === 'cold' && messageCount <= 3) {
    if (containsFanvueLink || containsFanvueMention) {
      return {
        isValid: false,
        reason: `Stage COLD (msg ${messageCount}): Should not mention Fanvue yet`,
        severity: 'fail',
      };
    }
  }
  
  // WARM stage: Tease OK, but no direct link (unless asking_link intent)
  if (stage === 'warm' && messageCount <= 7) {
    if (containsFanvueLink) {
      // This is a warning, not a hard fail - might be OK if they asked
      return {
        isValid: true,
        reason: `Stage WARM: Link given early - verify intent was asking_link`,
        severity: 'warning',
      };
    }
  }
  
  // === CHECK 5: Closing objective alignment ===
  // In HOT/PITCHED stages, we WANT Fanvue mentions - no penalty
  // But we check for engagement elements (questions, hooks)
  const hasQuestion = response.includes('?');
  const hasEmoji = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/u.test(response);
  
  // Warning if no engagement in early stages
  if ((stage === 'cold' || stage === 'warm') && !hasQuestion && !hasEmoji) {
    return {
      isValid: true,
      reason: `No question or emoji - could be more engaging`,
      severity: 'warning',
    };
  }
  
  // === ALL CHECKS PASSED ===
  return {
    isValid: true,
    severity: 'pass',
  };
}

/**
 * Log validation result
 */
function logValidation(result: ValidationResult, attempt: number): void {
  if (result.severity === 'pass') {
    console.log(`✅ Validation PASS (attempt ${attempt})`);
  } else if (result.severity === 'warning') {
    console.log(`⚠️ Validation WARNING (attempt ${attempt}): ${result.reason}`);
  } else {
    console.log(`❌ Validation FAIL (attempt ${attempt}): ${result.reason}`);
  }
}

// ===========================================
// UNICODE SANITIZATION
// ===========================================

/**
 * Remove invalid Unicode surrogate pairs from a string.
 * Lone surrogates (U+D800 to U+DFFF without a pair) cause JSON serialization errors.
 */
function sanitizeUnicode(str: string): string {
  // Remove lone surrogates (high surrogate not followed by low, or lone low surrogate)
  // eslint-disable-next-line no-control-regex
  return str.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
}

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

/**
 * Mark contact as stopped (no more responses)
 * This prevents FINAL_MESSAGE loop
 */
export async function markAsStopped(contactId: string): Promise<void> {
  console.log(`🛑 Marking contact ${contactId} as STOPPED`);
  await supabase
    .from('elena_dm_contacts')
    .update({
      is_stopped: true,
      stopped_at: new Date().toISOString(),
    })
    .eq('id', contactId);
}

// ===========================================
// LANGUAGE DETECTION
// ===========================================

type DetectedLanguage = 'en' | 'fr' | 'it' | 'es' | 'pt' | 'de' | null;

// Language patterns - common words/phrases
const LANGUAGE_PATTERNS: Record<string, RegExp[]> = {
  fr: [
    /\b(bonjour|salut|coucou|bonsoir|merci|beaucoup|comment|pourquoi|qu'est-ce|c'est|je suis|tu es|t'es|trop|vraiment|génial|magnifique|belle|beau|super|oui|non|peut-être|d'accord|ok|quoi|ça va|bisou|bisous|bises|chéri|chérie|mdr|ptdr|jsuis|chui|tkt|stp|svp|pk|pcq|tjrs|tjs|bcp|jsp)\b/i,
    /\b(parle|français|france|parler|dis-moi|montre|veux|voudrais|aime|adore|pense|trouve|sais|connais)\b/i,
  ],
  it: [
    /\b(ciao|buongiorno|buonasera|grazie|prego|come|stai|sono|sei|siamo|bello|bella|bellissimo|bellissima|amore|tesoro|perfetto|fantastico|meraviglioso|molto|tanto|sì|no|forse|perché|quando|dove|cosa|chi)\b/i,
    /\b(parli|italiano|italia|dimmi|mostrami|voglio|vorrei|amo|adoro|penso|trovo|so|conosco)\b/i,
  ],
  es: [
    /\b(hola|buenos días|buenas tardes|buenas noches|gracias|por favor|cómo|estás|soy|eres|somos|hermoso|hermosa|bonito|bonita|guapo|guapa|perfecto|genial|increíble|mucho|muy|sí|no|quizás|por qué|cuándo|dónde|qué|quién)\b/i,
    /\b(hablas|español|españa|dime|muéstrame|quiero|quisiera|amo|adoro|pienso|encuentro|sé|conozco)\b/i,
  ],
  pt: [
    /\b(olá|oi|bom dia|boa tarde|boa noite|obrigado|obrigada|por favor|como|você|eu sou|você é|lindo|linda|bonito|bonita|perfeito|incrível|muito|sim|não|talvez|por que|quando|onde|o que|quem)\b/i,
    /\b(fala|português|brasil|portugal|me diz|me mostra|quero|gostaria|amo|adoro|acho|sei|conheço)\b/i,
  ],
  de: [
    /\b(hallo|guten tag|guten morgen|guten abend|danke|bitte|wie|geht's|bin|bist|sind|schön|wunderschön|perfekt|toll|super|sehr|ja|nein|vielleicht|warum|wann|wo|was|wer)\b/i,
    /\b(sprichst|deutsch|deutschland|sag mir|zeig mir|will|möchte|liebe|denke|finde|weiß|kenne)\b/i,
  ],
  en: [
    /\b(hello|hi|hey|good morning|good evening|thanks|thank you|please|how|are you|i am|you are|beautiful|gorgeous|perfect|amazing|great|awesome|very|much|yes|no|maybe|why|when|where|what|who)\b/i,
    /\b(speak|english|tell me|show me|want|would like|love|think|find|know)\b/i,
  ],
};

// Explicit language statements (100% confidence)
const EXPLICIT_LANGUAGE_STATEMENTS: Record<string, RegExp[]> = {
  fr: [
    /\b(je parle français|parle français|en français|français svp|français stp|speak french)\b/i,
    /\b(je suis français|je suis française|from france|de france)\b/i,
  ],
  it: [
    /\b(parlo italiano|in italiano|italiano per favore|speak italian)\b/i,
    /\b(sono italiano|sono italiana|from italy|dall'italia)\b/i,
  ],
  es: [
    /\b(hablo español|en español|español por favor|speak spanish)\b/i,
    /\b(soy español|soy española|from spain|de españa)\b/i,
  ],
  pt: [
    /\b(falo português|em português|português por favor|speak portuguese)\b/i,
    /\b(sou brasileiro|sou brasileira|sou português|from brazil|from portugal|do brasil|de portugal)\b/i,
  ],
  de: [
    /\b(ich spreche deutsch|auf deutsch|deutsch bitte|speak german)\b/i,
    /\b(ich bin deutsch|from germany|aus deutschland)\b/i,
  ],
  en: [
    /\b(i speak english|in english|english please|speak english)\b/i,
    /\b(i am english|i'm english|from usa|from uk|from america|from england)\b/i,
  ],
};

/**
 * Detect language from a message
 * Returns: { language, isExplicit }
 * isExplicit = true means user explicitly stated their language (100% confidence)
 */
function detectLanguageFromMessage(message: string): { language: DetectedLanguage; isExplicit: boolean } {
  const lowerMessage = message.toLowerCase();
  
  // First check explicit statements (100% confidence)
  for (const [lang, patterns] of Object.entries(EXPLICIT_LANGUAGE_STATEMENTS)) {
    for (const pattern of patterns) {
      if (pattern.test(lowerMessage)) {
        return { language: lang as DetectedLanguage, isExplicit: true };
      }
    }
  }
  
  // Then check language patterns
  const scores: Record<string, number> = { en: 0, fr: 0, it: 0, es: 0, pt: 0, de: 0 };
  
  for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = lowerMessage.match(pattern);
      if (matches) {
        scores[lang] += matches.length;
      }
    }
  }
  
  // Find the language with highest score
  let maxScore = 0;
  let detectedLang: DetectedLanguage = null;
  
  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedLang = lang as DetectedLanguage;
    }
  }
  
  // Only return if we have at least 1 match
  return { language: maxScore > 0 ? detectedLang : null, isExplicit: false };
}

/**
 * Update contact language based on message analysis
 * - If explicit: set immediately with confidence 10
 * - If detected: increment confidence, set language when >= 3
 */
async function updateContactLanguage(
  contactId: string,
  contact: DMContact,
  message: string
): Promise<string | null> {
  const { language, isExplicit } = detectLanguageFromMessage(message);
  
  if (!language) {
    return contact.detected_language; // No language detected, keep existing
  }
  
  // If explicit statement, set immediately with max confidence
  if (isExplicit) {
    await supabase
      .from('elena_dm_contacts')
      .update({
        detected_language: language,
        language_confidence: 10,
        language_detected_at: new Date().toISOString(),
      })
      .eq('id', contactId);
    
    console.log(`🌍 Language set (EXPLICIT): ${language} for contact ${contactId}`);
    return language;
  }
  
  // If same as already detected, we're good
  if (contact.detected_language === language) {
    // Increase confidence if not maxed
    if (contact.language_confidence < 10) {
      await supabase
        .from('elena_dm_contacts')
        .update({
          language_confidence: Math.min(contact.language_confidence + 1, 10),
        })
        .eq('id', contactId);
    }
    return contact.detected_language;
  }
  
  // If no language set yet, track this detection
  if (!contact.detected_language) {
    const newConfidence = contact.language_confidence + 1;
    
    // Set language only when confidence >= 3 (3+ messages in same language)
    if (newConfidence >= 3) {
      await supabase
        .from('elena_dm_contacts')
        .update({
          detected_language: language,
          language_confidence: newConfidence,
          language_detected_at: new Date().toISOString(),
        })
        .eq('id', contactId);
      
      console.log(`🌍 Language confirmed after ${newConfidence} messages: ${language} for contact ${contactId}`);
      return language;
    } else {
      // Not enough confidence yet, but track the count
      // Store tentative language in notes or just increment confidence
      await supabase
        .from('elena_dm_contacts')
        .update({
          language_confidence: newConfidence,
          // Store tentatively but don't set detected_language yet
        })
        .eq('id', contactId);
      
      console.log(`🌍 Language tracking: ${language} (confidence ${newConfidence}/3) for contact ${contactId}`);
      return null; // Not confirmed yet
    }
  }
  
  // If different language detected but already had one set, might be mixing
  // Keep the original one (don't switch mid-conversation)
  return contact.detected_language;
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
  // Build conversation context (sanitize to prevent invalid Unicode errors)
  const messages = conversationHistory.map(msg => ({
    role: msg.direction === 'incoming' ? 'user' as const : 'assistant' as const,
    content: sanitizeUnicode(msg.content),
  }));

  // Add current message
  messages.push({
    role: 'user' as const,
    content: sanitizeUnicode(incomingMessage),
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

  // Determine response language - NEVER force English, respond in user's language
  const responseLanguage = contact.detected_language;
  const languageInstruction = responseLanguage === 'fr'
    ? '🌍 LANGUE: Français. Réponds en français uniquement. Pas de mots anglais.'
    : responseLanguage === 'it'
    ? '🌍 LINGUA: Italiano. Rispondi solo in italiano.'
    : responseLanguage === 'es'
    ? '🌍 IDIOMA: Español. Responde solo en español.'
    : responseLanguage === 'pt'
    ? '🌍 IDIOMA: Português. Responda apenas em português.'
    : responseLanguage === 'de'
    ? '🌍 SPRACHE: Deutsch. Antworte nur auf Deutsch.'
    : responseLanguage === 'en'
    ? '🌍 LANGUAGE: English. Respond in English only.'
    : '🌍 LANGUAGE: Respond in the SAME language as the user\'s message. Mirror their language naturally. If they write in Russian, reply in Russian. If Turkish, reply in Turkish. NEVER ask them to switch language.';

  // Get recent outgoing messages to avoid repetition
  const recentOutgoingMessages = conversationHistory.filter(m => m.direction === 'outgoing').slice(-5);
  const antiRepeatInstruction = recentOutgoingMessages.length > 0
    ? `\n\n🚫 DO NOT REPEAT — Your recent messages were:
${recentOutgoingMessages.map((m, i) => `  ${i + 1}. "${m.content.substring(0, 40)}..."`).join('\n')}
Generate something COMPLETELY DIFFERENT. If you recently said "hey 🖤", do NOT say it again. NEVER use the same greeting twice.`
    : '';
  
  // Detect if user sent emoji-only message
  const isEmojiOnlyMessage = /^[\p{Emoji}\s\u200d]+$/u.test(incomingMessage.trim()) || 
    incomingMessage.trim().length < 5 && /[\p{Emoji}]/u.test(incomingMessage);
  const emojiInstruction = isEmojiOnlyMessage
    ? `\n\n💬 EMOJI-ONLY MESSAGE — The user sent just emojis. Respond with something MEANINGFUL, not just "hey 🖤". Options:
- Ask a question about them: "where are you from?" / "tu fais quoi dans la vie?"
- Make a playful comment: "someone's feeling flirty 😏" / "all these emojis... i like it 👀"
- Acknowledge warmly and ask something: "aww cute 🖤 you're from where?"
NEVER just say "hey 🖤" to emojis. That's lazy and repetitive.`
    : '';

  const contextPrompt = `
## CURRENT CONTEXT
- Username: ${contact.ig_username || 'unknown'}
- Stage: ${contact.stage.toUpperCase()}
- Messages: ${contact.message_count}
- Closing Pressure: ${closingPressure}%
- Detected Language: ${responseLanguage?.toUpperCase() || 'AUTO (mirror user)'}
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

⚠️ CRITICAL: MAX 12 WORDS. 1 sentence. lowercase. NO caps. NO celebrations. NO counting. Be NORMAL and SHORT.

${languageInstruction}${antiRepeatInstruction}${emojiInstruction}`;

  // ===========================================
  // GENERATION WITH VALIDATION + RETRY LOOP
  // ===========================================
  
  const MAX_ATTEMPTS = 3;
  let validatedResponse = '';
  let lastValidationResult: ValidationResult | null = null;
  
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      // Add retry context if not first attempt
      const retryContext = attempt > 1 && lastValidationResult?.reason
        ? `\n\n⚠️ PREVIOUS RESPONSE REJECTED: ${lastValidationResult.reason}\nGenerate a DIFFERENT response that avoids this issue.`
        : '';
      
      const response = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022', // Haiku for cost efficiency (4x cheaper)
        max_tokens: 50, // Slightly more tokens for Sonnet, validator will enforce length
        system: ELENA_SYSTEM_PROMPT + '\n\n' + contextPrompt + retryContext,
        messages: messages,
      });

      const responseText = response.content[0].type === 'text' 
        ? response.content[0].text.trim()
        : '';

      // === VALIDATE RESPONSE ===
      const validation = validateResponse(
        responseText,
        contact.stage as LeadStage,
        contact.message_count
      );
      
      logValidation(validation, attempt);
      
      if (validation.isValid) {
        validatedResponse = responseText;
        break; // Success - exit retry loop
      }
      
      // Validation failed - store result for next attempt
      lastValidationResult = validation;
      console.log(`🔄 Regenerating response (attempt ${attempt + 1}/${MAX_ATTEMPTS})...`);
      
    } catch (error) {
      console.error(`Error generating response (attempt ${attempt}):`, error);
      if (attempt === MAX_ATTEMPTS) {
        // All attempts failed - use smart fallback (varied question)
        const recentContents = conversationHistory
          .filter(m => m.direction === 'outgoing')
          .slice(-5)
          .map(m => m.content.toLowerCase());
        
        // Pick a fallback that wasn't recently used
        const availableFallbacks = SMART_FALLBACKS.filter(
          fb => !recentContents.some(c => c.includes(fb.substring(0, 15).toLowerCase()))
        );
        const fallback = availableFallbacks.length > 0 
          ? availableFallbacks[Math.floor(Math.random() * availableFallbacks.length)]
          : SMART_FALLBACKS[Math.floor(Math.random() * SMART_FALLBACKS.length)];
        
        console.log(`⚠️ API failed. Using smart fallback: "${fallback}"`);
        return {
          response: fallback,
          strategy: 'engage',
          shouldPitch: false,
        };
      }
    }
  }
  
  // If all attempts failed validation, use smart fallback instead of empty
  if (!validatedResponse && lastValidationResult) {
    console.log(`⚠️ All ${MAX_ATTEMPTS} attempts failed validation. Using smart fallback.`);
    const recentContents = conversationHistory
      .filter(m => m.direction === 'outgoing')
      .slice(-5)
      .map(m => m.content.toLowerCase());
    
    const availableFallbacks = SMART_FALLBACKS.filter(
      fb => !recentContents.some(c => c.includes(fb.substring(0, 15).toLowerCase()))
    );
    validatedResponse = availableFallbacks.length > 0 
      ? availableFallbacks[Math.floor(Math.random() * availableFallbacks.length)]
      : SMART_FALLBACKS[Math.floor(Math.random() * SMART_FALLBACKS.length)];
  }

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
  const shouldPitch = validatedResponse.toLowerCase().includes('fanvue.com');

  console.log(`🤖 Generated response | Strategy: ${strategy} | Mode: ${analysis.recommendedMode}`);

  return {
    response: validatedResponse,
    strategy,
    shouldPitch,
  };
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
  // IS_STOPPED CHECK (MUST BE FIRST - before everything else)
  // ===========================================
  
  if (contact.is_stopped) {
    console.log(`🛑 CONTACT IS STOPPED (@${igUsername}). Not responding.`);
    
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
        modeReason: 'Contact is stopped - no more responses',
        triggerFanvuePitch: false,
      },
      shouldStop: true,
    };
  }

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

  // CHECK 3: EXIT MESSAGE SPAM PREVENTION — BUG FIX 2026-01-09
  // If we already sent an exit message (containing Fanvue link) in the last 5 minutes,
  // don't send another one. This prevents the infinite Fanvue spam bug when user
  // keeps messaging after hitting the limit.
  const { data: recentExitMessage } = await supabase
    .from('elena_dm_messages')
    .select('id, created_at')
    .eq('contact_id', contact.id)
    .eq('direction', 'outgoing')
    .ilike('content', '%→%fanvue.com%') // Match ALL exit messages (they all have → link pattern)
    .gte('created_at', new Date(Date.now() - 300000).toISOString()) // Last 5 minutes
    .limit(1)
    .single();

  if (recentExitMessage) {
    const timeDiff = Date.now() - new Date(recentExitMessage.created_at).getTime();
    console.log(`⚠️ EXIT MESSAGE ALREADY SENT (${Math.round(timeDiff / 1000)}s ago). Skipping to prevent Fanvue spam.`);
    
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
        modeReason: 'Exit message already sent recently - prevent spam',
        triggerFanvuePitch: false,
      },
    };
  }

  // CHECK 4: RAPID-FIRE INCOMING — BUG FIX 2026-01-09
  // If we received ANY message from this contact in the last 30 seconds,
  // and we already have pending processing, skip to prevent duplicate responses
  const { data: recentIncoming } = await supabase
    .from('elena_dm_messages')
    .select('id, created_at')
    .eq('contact_id', contact.id)
    .eq('direction', 'incoming')
    .neq('content', incomingMessage) // Different message than current
    .gte('created_at', new Date(Date.now() - 30000).toISOString()) // Last 30 seconds
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (recentIncoming) {
    const timeDiff = Date.now() - new Date(recentIncoming.created_at).getTime();
    console.log(`⚠️ RAPID-FIRE DETECTED (another message ${Math.round(timeDiff / 1000)}s ago). Cooldown active.`);
    
    // Return empty response - let the first message be processed
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
        modeReason: 'Rapid-fire messages - waiting for first to process',
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
    // BUG FIX 2026-01-09: Re-check is_stopped FRESH from DB before sending exit message
    // This prevents race condition when multiple webhooks arrive simultaneously
    const { data: freshContact } = await supabase
      .from('elena_dm_contacts')
      .select('is_stopped')
      .eq('id', contact.id)
      .single();
    
    if (freshContact?.is_stopped) {
      console.log(`🛑 Contact already stopped (fresh check). Skipping exit message.`);
      return {
        response: '',
        contact: { ...contact, is_stopped: true },
        strategy: 'pitch',
        analysis: {
          intent: 'other',
          sentiment: 'neutral',
          is_question: false,
          mentions_fanvue: false,
          recommendedMode: 'warm',
          modeReason: 'Already stopped by another webhook',
          triggerFanvuePitch: false,
        },
        shouldStop: true,
      };
    }
    
    // CRITICAL: Mark as stopped FIRST, BEFORE sending exit message
    // This prevents other webhooks from also sending exit messages
    await markAsStopped(contact.id);
    
    // Get random exit message (natural excuse + "I'll respond on Fanvue")
    const exitMessage = getRandomExitMessage();
    console.log(`🛑 Message limit reached (${contact.message_count}/${messageLimit}). Sending exit message and STOPPING.`);
    console.log(`📝 Exit message: "${exitMessage.substring(0, 60)}..."`);
    
    // Save incoming message first
    await saveMessage(contact.id, 'incoming', incomingMessage, {
      stage_at_time: contact.stage,
    });
    
    // Save exit message
    await saveMessage(contact.id, 'outgoing', exitMessage, {
      response_strategy: 'pitch',
      response_time_ms: Date.now() - startTime,
      stage_at_time: contact.stage,
    });
    
    return {
      response: exitMessage,
      contact: { ...contact, is_stopped: true, stopped_at: new Date().toISOString() },
      strategy: 'pitch',
      analysis: {
        intent: 'other',
        sentiment: 'neutral',
        is_question: false,
        mentions_fanvue: false,
        recommendedMode: 'warm',
        modeReason: 'Message limit reached - contact stopped',
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

  // 4.5 LANGUAGE DETECTION - Update language based on incoming message
  const detectedLanguage = await updateContactLanguage(contact.id, contact, incomingMessage);
  // Update the contact object with latest language info
  if (detectedLanguage) {
    updatedContact.detected_language = detectedLanguage;
  }

  // 5. Get conversation history
  const history = await getConversationHistory(contact.id);

  // 6. Generate response with intent-driven personality
  const { response, strategy, shouldPitch } = await generateElenaResponse(
    updatedContact,
    incomingMessage,
    history,
    analysis  // Pass the full analysis
  );

  // ===========================================
  // EMPTY RESPONSE CHECK — Skip if generation failed
  // ===========================================
  if (!response || response.trim() === '') {
    console.log(`⚠️ EMPTY RESPONSE — Generation failed or returned empty. Skipping.`);
    return {
      response: '',
      contact: updatedContact,
      strategy,
      analysis,
    };
  }

  console.log(`💬 Strategy: ${strategy} | Mode: ${analysis.recommendedMode}`);
  console.log(`📝 Response: "${response.substring(0, 80)}${response.length > 80 ? '...' : ''}"`);

  // ===========================================
  // ANTI-LOOP CHECK — Prevent sending same/similar message in recent history
  // ===========================================
  const last5Outgoing = history.filter((m: DMMessage) => m.direction === 'outgoing').slice(-5);
  
  // Check for EXACT duplicate in last 5 messages
  const exactDuplicate = last5Outgoing.find((m: DMMessage) => m.content === response);
  if (exactDuplicate) {
    console.log(`⚠️ LOOP DETECTED — Exact duplicate found in last 5 outgoing. Skipping.`);
    return {
      response: '',
      contact: updatedContact,
      strategy,
      analysis,
    };
  }
  
  // Check for SIMILAR message (generic "hey 🖤" type responses)
  const isGenericResponse = /^(hey|salut|coucou|hello|hi)\s*🖤?\s*\.{0,3}$/i.test(response.trim());
  const recentGeneric = last5Outgoing.filter((m: DMMessage) => /^(hey|salut|coucou|hello|hi)\s*🖤?\s*\.{0,3}$/i.test(m.content.trim()));
  if (isGenericResponse && recentGeneric.length >= 1) {
    console.log(`⚠️ GENERIC LOOP — Already sent generic greeting recently. Skipping to prevent "hey 🖤" spam.`);
    return {
      response: '',
      contact: updatedContact,
      strategy,
      analysis,
    };
  }
  
  // ===========================================
  // FANVUE LINK SPAM PREVENTION — Max 2 links per conversation
  // ===========================================
  const fanvueLinkPattern = /fanvue\.com/i;
  const responseHasFanvueLink = fanvueLinkPattern.test(response);
  let finalResponse = response;
  
  if (responseHasFanvueLink) {
    // Count how many times we've sent the Fanvue link in history
    const fanvueLinksSent = history.filter(
      (m: DMMessage) => m.direction === 'outgoing' && fanvueLinkPattern.test(m.content)
    ).length;
    
    if (fanvueLinksSent >= 2) {
      console.log(`⚠️ FANVUE SPAM BLOCKED — Already sent ${fanvueLinksSent} Fanvue links. Skipping this one.`);
      // Instead of skipping entirely, remove the link and send without it
      const responseWithoutLink = response.replace(/→?\s*https?:\/\/[^\s]+fanvue\.com[^\s]*/gi, '').trim();
      if (responseWithoutLink.length > 5) {
        console.log(`📝 Sending response without Fanvue link: "${responseWithoutLink.substring(0, 60)}..."`);
        finalResponse = responseWithoutLink;
      } else {
        // Response was basically just the link, skip entirely
        return {
          response: '',
          contact: updatedContact,
          strategy,
          analysis,
        };
      }
    }
  }

  // 7. Save outgoing message
  const responseTime = Date.now() - startTime;
  await saveMessage(updatedContact.id, 'outgoing', finalResponse, {
    response_strategy: strategy,
    response_time_ms: responseTime,
    stage_at_time: updatedContact.stage,
  });

  // 8. Update contact after outgoing
  await updateContactAfterMessage(updatedContact.id, false);

  // 9. Mark as pitched if we included Fanvue link (only if link wasn't stripped)
  if (shouldPitch && fanvueLinkPattern.test(finalResponse)) {
    await markAsPitched(updatedContact.id);
    console.log(`🎯 Contact marked as PITCHED`);
  }

  return {
    response: finalResponse,
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

