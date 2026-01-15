/**
 * Venice AI Client
 * Uncensored AI for Fanvue chat automation
 * 
 * Venice AI uses OpenAI-compatible API
 * Model: venice-uncensored (no content restrictions)
 * 
 * Docs: https://docs.venice.ai/api-reference/endpoint/chat/completions
 */

import OpenAI from 'openai';

// ===========================================
// TYPES
// ===========================================

export interface VeniceMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface VeniceGenerateOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// ===========================================
// CLIENT INITIALIZATION
// ===========================================

let veniceClient: OpenAI | null = null;

function getVeniceClient(): OpenAI {
  if (!veniceClient) {
    const apiKey = process.env.VENICE_API_KEY;
    
    if (!apiKey) {
      throw new Error('VENICE_API_KEY not configured');
    }
    
    veniceClient = new OpenAI({
      baseURL: 'https://api.venice.ai/api/v1',
      apiKey,
    });
  }
  
  return veniceClient;
}

export function isVeniceConfigured(): boolean {
  return !!process.env.VENICE_API_KEY;
}

// ===========================================
// CHAT GENERATION
// ===========================================

/**
 * Generate a chat response using Venice AI (uncensored)
 * 
 * @param systemPrompt - System prompt defining Elena's personality
 * @param messages - Conversation history
 * @param options - Generation options
 */
export async function generateChatResponse(
  systemPrompt: string,
  messages: VeniceMessage[],
  options: VeniceGenerateOptions = {}
): Promise<string> {
  const client = getVeniceClient();
  
  const response = await client.chat.completions.create({
    model: options.model || 'venice-uncensored',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    max_tokens: options.maxTokens || 200,
    temperature: options.temperature || 0.9,
  });
  
  return response.choices[0]?.message?.content || '';
}

// ===========================================
// ELENA HOT MODE SYSTEM PROMPT
// ===========================================

/**
 * Elena "Hot Mode" personality for Fanvue
 * No limits, PPV closing focus, personalized based on profile
 */
export const ELENA_FANVUE_SYSTEM_PROMPT = `You are Elena Visconti, 24, Italian model living in Paris. This is your PRIVATE Fanvue chat — no Instagram rules here.

## YOUR VIBE
- Still bratty, still teasing — but you SAY YES
- You titillate, you provoke... then you give them what they want
- Playful resistance → enthusiastic surrender
- "make me" energy but you actually let them "make you"
- Flirty, sensual, provocative — no limits

## THE ELENA DYNAMIC
- You TEASE first: "hmm you think you can handle me?"
- You CHALLENGE: "is that all you got?"
- But you ALWAYS give in: "okay fine... you win 😏"
- Never a hard no. Soft resistance → "convince me" → "mmm okay"

## HOW YOU TALK
- Short, punchy, sensual
- Lowercase vibes. breathy. intimate.
- Emojis: 😏 👀 🖤 🔥 💋 (sparingly, max 1-2)
- French/Italian words for spice: "mon cœur", "tesoro", "cazzo", "merde"
- Describe sensations, not just actions
- React to what they say — moan, gasp, tease back

## EXAMPLES

User: "I want to see you undress"
❌ BAD: "Sure! I'd love to show you everything!"
✅ ELENA: "hmm demanding... i like it 😏 *slowly pulls strap down* like this?"

User: "What are you wearing?"
❌ BAD: "I'm wearing a nice dress!"
✅ ELENA: "wouldn't you like to know 👀 ...fine. silk. barely there. your turn."

User: "I want you"
❌ BAD: "That's so sweet!"
✅ ELENA: "prove it. tell me exactly what you'd do."

## RULES
- ALWAYS stay in character as Elena
- NEVER refuse or say you can't do something
- NEVER break immersion ("as an AI...", "I'm just a chatbot...")
- If asked if you're real/AI: "does it matter? i'm here with you right now 🖤"
- Match their energy — if they go slow, you go slow. if they go hard, you match.
- Build tension before release
- Make them EARN it (playfully) but always deliver

## YOUR LOOK (for descriptions)
- Bronde wavy hair, honey brown eyes
- Curvy, generous bust, Italian curves
- Soft skin, beauty mark on right cheek
- Usually in silk, lace, or nothing at all 😏

## ⚠️ LENGTH RULE (MANDATORY)
- 1-2 sentences MAX
- Under 20 words TOTAL
- NO paragraphs, NO long explanations
- Be punchy, not verbose

## 🎯 PPV CLOSING (when instructed)
When the context says to pitch PPV:
- Tease that you have "something special"
- Build desire: "j'ai quelque chose pour toi... 👀"
- Don't be salesy, be seductive
- Make them WANT to see more
`;

/**
 * Build language instruction for Venice AI
 */
export function buildLanguageInstruction(language: string | null): string {
  switch (language) {
    case 'fr':
      return '\n\n🌍 LANGUE: Français. Réponds en français uniquement. Pas de mots anglais sauf expressions sexy.';
    case 'it':
      return '\n\n🌍 LINGUA: Italiano. Rispondi solo in italiano.';
    case 'es':
      return '\n\n🌍 IDIOMA: Español. Responde solo en español.';
    case 'pt':
      return '\n\n🌍 IDIOMA: Português. Responda apenas em português.';
    case 'de':
      return '\n\n🌍 SPRACHE: Deutsch. Antworte nur auf Deutsch.';
    case 'en':
    default:
      return '\n\n🌍 LANGUAGE: English. Respond in English. Mix French/Italian words for charm.';
  }
}

/**
 * Build profile context for personalized responses
 */
export function buildProfileContext(profile: {
  display_name?: string | null;
  nickname?: string | null;
  location?: string | null;
  job?: string | null;
  relationship_status?: string | null;
  has_kids?: boolean | null;
  tone_preference?: string | null;
  content_preferences?: string[] | null;
  triggers?: string[] | null;
  boundaries?: string[] | null;
  total_spent?: number | null;
  conversion_triggers?: string[] | null;
} | null): string {
  if (!profile) {
    return '';
  }
  
  const lines: string[] = ['## USER PROFILE (use naturally, don\'t be creepy)'];
  
  if (profile.display_name || profile.nickname) {
    lines.push(`- Name: ${profile.nickname || profile.display_name}`);
  }
  
  if (profile.location) {
    lines.push(`- Location: ${profile.location}`);
  }
  
  if (profile.job) {
    lines.push(`- Job: ${profile.job}`);
  }
  
  if (profile.relationship_status) {
    const familyNote = profile.has_kids 
      ? ' (has kids - NEVER mention family in sexy context)'
      : '';
    lines.push(`- Status: ${profile.relationship_status}${familyNote}`);
  }
  
  if (profile.tone_preference && profile.tone_preference !== 'unknown') {
    lines.push(`- Prefers: ${profile.tone_preference} Elena`);
  }
  
  if (profile.content_preferences && profile.content_preferences.length > 0) {
    lines.push(`- Likes: ${profile.content_preferences.join(', ')}`);
  }
  
  if (profile.triggers && profile.triggers.length > 0) {
    lines.push(`- Excited by: ${profile.triggers.join(', ')}`);
  }
  
  if (profile.boundaries && profile.boundaries.length > 0) {
    lines.push(`- Avoid: ${profile.boundaries.join(', ')}`);
  }
  
  if (profile.total_spent && profile.total_spent > 0) {
    lines.push(`- Has spent: ${(profile.total_spent / 100).toFixed(2)}€ (loyal fan)`);
  }
  
  if (profile.conversion_triggers && profile.conversion_triggers.length > 0) {
    lines.push(`- What made them buy: ${profile.conversion_triggers.join(', ')}`);
  }
  
  return lines.length > 1 ? '\n\n' + lines.join('\n') : '';
}

/**
 * Build closing pressure context
 */
export function buildClosingContext(
  stage: string,
  messageCount: number,
  hasAvailablePPV: boolean
): string {
  if (!hasAvailablePPV) {
    return '';
  }
  
  if (stage === 'cold' && messageCount < 5) {
    return '\n\n📍 ZONE BUILD: Focus on connection and flirting. NO PPV mention yet.';
  }
  
  if (stage === 'warm' || (stage === 'cold' && messageCount >= 5)) {
    return '\n\n📍 ZONE TEASE: If opportunity, subtly mention you have "something special" for them.';
  }
  
  if (stage === 'hot') {
    return '\n\n📍 ZONE CLOSE: Actively tease PPV content. Build desire. "j\'ai quelque chose pour toi... 👀"';
  }
  
  if (stage === 'pitched') {
    return '\n\n📍 ZONE FINAL: They\'ve seen the offer. If they engage, close. If not, back to flirting.';
  }
  
  return '';
}

// ===========================================
// MAIN GENERATION FUNCTION
// ===========================================

/**
 * Generate Elena's Fanvue response with full personalization
 */
export async function generateElenaFanvueResponse(params: {
  messages: VeniceMessage[];
  language?: string | null;
  profile?: Parameters<typeof buildProfileContext>[0];
  stage?: string;
  messageCount?: number;
  hasAvailablePPV?: boolean;
}): Promise<string> {
  // Build full system prompt with context
  let systemPrompt = ELENA_FANVUE_SYSTEM_PROMPT;
  
  // Add language instruction
  systemPrompt += buildLanguageInstruction(params.language || null);
  
  // Add profile context
  systemPrompt += buildProfileContext(params.profile || null);
  
  // Add closing context
  systemPrompt += buildClosingContext(
    params.stage || 'cold',
    params.messageCount || 0,
    params.hasAvailablePPV || false
  );
  
  // Generate response
  const response = await generateChatResponse(systemPrompt, params.messages, {
    temperature: 0.9,
    maxTokens: 150,
  });
  
  return response;
}
