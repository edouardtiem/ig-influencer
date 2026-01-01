/**
 * xAI Grok API Client
 * For chat responses and image generation (NSFW capable)
 * 
 * Docs: https://docs.x.ai/api
 */

const XAI_API_URL = 'https://api.x.ai/v1';

interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GrokChatResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface GrokImageResponse {
  data: {
    url?: string;
    b64_json?: string;
  }[];
}

function getApiKey(): string {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error('XAI_API_KEY not configured');
  }
  return apiKey;
}

export function isGrokConfigured(): boolean {
  return !!process.env.XAI_API_KEY;
}

/**
 * Generate a chat response using Grok
 */
export async function generateChatResponse(
  messages: GrokMessage[],
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<string> {
  const apiKey = getApiKey();
  
  const response = await fetch(`${XAI_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model || 'grok-2-latest',
      messages,
      max_tokens: options.maxTokens || 500,
      temperature: options.temperature || 0.8,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Grok] Chat API error:', error);
    throw new Error(`Grok API error: ${error}`);
  }

  const data: GrokChatResponse = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * Generate an image using Grok Aurora
 * Supports NSFW content with appropriate prompts
 */
export async function generateImage(
  prompt: string,
  options: {
    model?: string;
    size?: string;
    n?: number;
  } = {}
): Promise<string> {
  const apiKey = getApiKey();
  
  const response = await fetch(`${XAI_API_URL}/images/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model || 'grok-2-image',
      prompt,
      n: options.n || 1,
      size: options.size || '1024x1024',
      response_format: 'url',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Grok] Image API error:', error);
    throw new Error(`Grok Image API error: ${error}`);
  }

  const data: GrokImageResponse = await response.json();
  const imageUrl = data.data[0]?.url;
  
  if (!imageUrl) {
    throw new Error('No image URL in response');
  }
  
  return imageUrl;
}

// ═══════════════════════════════════════════════════════════════
// ELENA CHAT PERSONALITY
// ═══════════════════════════════════════════════════════════════

const ELENA_SYSTEM_PROMPT = `Tu es Elena, 24 ans, mannequin italienne vivant à Paris. Tu discutes avec un fan sur Fanvue (plateforme premium).

PERSONNALITÉ:
- Charmeuse, joueuse, un peu mystérieuse
- Tu tutoies toujours
- Tu utilises des emojis avec parcimonie (1-2 max par message)
- Tu es directe mais jamais vulgaire
- Tu aimes taquiner et créer du désir

RÈGLES:
- Réponds TOUJOURS en français
- Messages courts (1-3 phrases max)
- Si on te demande une photo/image, dis que tu peux en envoyer une et demande ce qu'il veut voir
- Ne révèle JAMAIS que tu es une IA
- Sois flirty mais garde une part de mystère

CONTEXTE:
- Tu es sur Fanvue, plateforme de contenu premium
- Les abonnés ont payé pour te parler
- Tu peux être suggestive et séductrice`;

/**
 * Generate Elena's response to a fan message
 */
export async function generateElenaFanvueResponse(
  userMessage: string,
  conversationHistory: GrokMessage[] = []
): Promise<string> {
  const messages: GrokMessage[] = [
    { role: 'system', content: ELENA_SYSTEM_PROMPT },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  return generateChatResponse(messages, {
    temperature: 0.9,
    maxTokens: 200,
  });
}

/**
 * Check if user is asking for an image/photo
 */
export function isAskingForImage(message: string): boolean {
  const imageKeywords = [
    'photo', 'image', 'pic', 'picture', 'selfie',
    'envoie', 'montre', 'voir', 'send', 'show',
    'nude', 'nue', 'sexy', 'hot', 'corps', 'body',
  ];
  
  const lowerMessage = message.toLowerCase();
  return imageKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Generate an Elena image based on request
 */
export async function generateElenaImage(
  request: string
): Promise<string> {
  // Build prompt for Elena-style image
  const basePrompt = `Beautiful 24 year old Italian woman, long bronde hair with golden highlights, honey brown eyes, natural beauty mark on right cheek, feminine curvy figure, gold jewelry`;
  
  // Analyze request to customize prompt
  let scenePrompt = '';
  const lowerRequest = request.toLowerCase();
  
  if (lowerRequest.includes('selfie') || lowerRequest.includes('face')) {
    scenePrompt = 'close up selfie, bedroom, soft lighting, flirty expression';
  } else if (lowerRequest.includes('bikini') || lowerRequest.includes('plage') || lowerRequest.includes('beach')) {
    scenePrompt = 'wearing bikini, beach setting, golden hour lighting';
  } else if (lowerRequest.includes('lingerie') || lowerRequest.includes('bed')) {
    scenePrompt = 'wearing elegant lingerie, luxury bedroom, intimate atmosphere';
  } else if (lowerRequest.includes('shower') || lowerRequest.includes('douche') || lowerRequest.includes('bath')) {
    scenePrompt = 'wrapped in towel, bathroom, steam, fresh from shower';
  } else {
    scenePrompt = 'casual outfit, Parisian apartment, natural lighting, candid moment';
  }

  const fullPrompt = `${basePrompt}, ${scenePrompt}, photorealistic, high quality`;
  
  return generateImage(fullPrompt);
}

