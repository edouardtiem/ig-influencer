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
 * 
 * @param prompt - Text description of the image
 * @param options - Generation options including reference images
 */
export async function generateImage(
  prompt: string,
  options: {
    model?: string;
    n?: number;
    referenceImageUrl?: string; // Cloudinary URL to use as style reference (for prompt enhancement)
    referenceImages?: string[]; // Multiple reference images (for prompt enhancement)
  } = {}
): Promise<string> {
  const apiKey = getApiKey();
  
  // Enhance prompt with reference image description if provided
  let enhancedPrompt = prompt;
  
  if (options.referenceImageUrl || options.referenceImages) {
    enhancedPrompt = `${prompt}\n\nStyle reference: Match the composition, lighting, mood, and aesthetic quality of the reference image(s). Maintain similar pose, setting atmosphere, and visual style.`;
  }
  
  const body: Record<string, unknown> = {
    model: options.model || 'grok-2-image',
    prompt: enhancedPrompt,
    n: options.n || 1,
    response_format: 'url',
  };
  
  const response = await fetch(`${XAI_API_URL}/images/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
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

/**
 * Get Elena images from Cloudinary for reference
 * Returns URLs of existing Elena photos that can be used as style references
 * 
 * These images are used to guide Grok's generation style (composition, lighting, mood)
 */
export function getElenaCloudinaryReferences(): {
  beach: string[];
  bedroom: string[];
  bathroom: string[];
  lifestyle: string[];
  all: string[];
} {
  // Elena images from Cloudinary - organized by category
  // These URLs are used as style references for Grok image generation
  const references = {
    // Beach/Pool images - sunset, infinity pool, resort style
    beach: [
      // Add beach/pool images here - example format:
      // 'https://res.cloudinary.com/dily60mr0/image/upload/v.../elena-beach-sunset.jpg',
    ],
    
    // Bedroom images - morning stretch, lingerie, intimate
    bedroom: [
      'https://res.cloudinary.com/dily60mr0/image/upload/v1767007066/elena-fanvue-daily/morning_bed_stretch-1767007065.jpg',
      // Add more bedroom images
    ],
    
    // Bathroom images - mirror selfie, shower, getting ready
    bathroom: [
      // Add bathroom images
    ],
    
    // Lifestyle images - yoga, sofa, casual, Parisian apartment
    lifestyle: [
      // Add lifestyle images
    ],
    
    all: [] as string[],
  };
  
  // Flatten all references
  references.all = [
    ...references.beach,
    ...references.bedroom,
    ...references.bathroom,
    ...references.lifestyle,
  ];
  
  return references;
}

/**
 * Add a new reference image to the appropriate category
 * Useful for dynamically adding images found in Cloudinary
 */
export function addElenaReference(
  imageUrl: string,
  category: 'beach' | 'bedroom' | 'bathroom' | 'lifestyle'
): void {
  // This would ideally update a persistent store (Supabase/DB)
  // For now, it's a helper for manual updates
  console.log(`[Grok] Add reference: ${imageUrl} to category: ${category}`);
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
 * Generate an Elena image based on request, using Cloudinary references for style consistency
 */
export async function generateElenaImage(
  request: string,
  useReference: boolean = true
): Promise<string> {
  // Build prompt for Elena-style image
  const basePrompt = `Beautiful 24 year old Italian woman, long bronde hair with golden highlights, honey brown eyes, natural beauty mark on right cheek, feminine curvy figure, gold jewelry`;
  
  // Analyze request to customize prompt and select reference
  let scenePrompt = '';
  let referenceImageUrl: string | undefined;
  const lowerRequest = request.toLowerCase();
  const references = getElenaCloudinaryReferences();
  
  if (lowerRequest.includes('selfie') || lowerRequest.includes('face')) {
    scenePrompt = 'close up selfie, bedroom, soft lighting, flirty expression';
    referenceImageUrl = references.bedroom[0];
  } else if (lowerRequest.includes('bikini') || lowerRequest.includes('plage') || lowerRequest.includes('beach') || lowerRequest.includes('pool') || lowerRequest.includes('piscine')) {
    scenePrompt = 'wearing bikini, beach or infinity pool setting, golden hour sunset lighting, luxury resort atmosphere';
    referenceImageUrl = references.beach[0] || references.all[0];
  } else if (lowerRequest.includes('lingerie') || lowerRequest.includes('bed') || lowerRequest.includes('lit')) {
    scenePrompt = 'wearing elegant lingerie or silk camisole, luxury bedroom, intimate atmosphere, soft morning light';
    referenceImageUrl = references.bedroom[0];
  } else if (lowerRequest.includes('shower') || lowerRequest.includes('douche') || lowerRequest.includes('bath') || lowerRequest.includes('bain')) {
    scenePrompt = 'wrapped in towel, bathroom, steam, fresh from shower, marble bathroom, soft lighting';
    referenceImageUrl = references.bathroom[0] || references.all[0];
  } else {
    scenePrompt = 'casual outfit, Parisian apartment, natural lighting, candid moment';
    referenceImageUrl = references.lifestyle[0] || references.all[0];
  }

  const fullPrompt = `${basePrompt}, ${scenePrompt}, photorealistic, high quality, professional photography, Instagram influencer style`;
  
  // Use reference image if available and requested
  if (useReference && referenceImageUrl) {
    console.log(`[Grok] Using reference image: ${referenceImageUrl}`);
    return generateImage(fullPrompt, { referenceImageUrl });
  }
  
  return generateImage(fullPrompt);
}

/**
 * Generate an Elena image matching a specific Cloudinary reference
 * Useful for creating variations of existing photos
 * 
 * @param referenceImageUrl - Cloudinary URL of the reference image
 * @param variationPrompt - Optional prompt to modify the reference (e.g., "different pose", "different outfit")
 */
export async function generateElenaImageFromReference(
  referenceImageUrl: string,
  variationPrompt?: string
): Promise<string> {
  const basePrompt = `Beautiful 24 year old Italian woman, long bronde hair with golden highlights, honey brown eyes, natural beauty mark on right cheek, feminine curvy figure, gold jewelry`;
  
  const prompt = variationPrompt 
    ? `${basePrompt}, ${variationPrompt}, photorealistic, high quality, professional photography, Instagram influencer style`
    : `${basePrompt}, similar pose and setting as reference, photorealistic, high quality, professional photography, Instagram influencer style`;
  
  console.log(`[Grok] Generating variation from reference: ${referenceImageUrl}`);
  
  return generateImage(prompt, { referenceImageUrl });
}

/**
 * Generate beach/pool images like the sunset infinity pool reference
 * Uses the style of the reference image (sunset, infinity pool, resort luxury)
 */
export async function generateBeachPoolImage(
  referenceImageUrl: string,
  options: {
    outfit?: 'bikini' | 'thong' | 'nude';
    pose?: 'kneeling' | 'standing' | 'lying' | 'backshot';
    timeOfDay?: 'sunset' | 'golden hour' | 'daylight';
  } = {}
): Promise<string> {
  const outfitDesc = options.outfit === 'bikini' 
    ? 'wearing white string bikini, thong style'
    : options.outfit === 'thong'
    ? 'wearing white string bikini, thong style, revealing'
    : 'wearing white string bikini, thong style';
  
  const poseDesc = options.pose === 'kneeling'
    ? 'kneeling on edge of infinity pool, back mostly to camera, looking to the side'
    : options.pose === 'standing'
    ? 'standing by infinity pool, elegant pose'
    : options.pose === 'backshot'
    ? 'back to camera, looking at sunset'
    : 'kneeling elegantly by infinity pool';
  
  const timeDesc = options.timeOfDay === 'sunset'
    ? 'golden hour sunset, warm orange and yellow hues, sun reflected in water'
    : options.timeOfDay === 'golden hour'
    ? 'golden hour lighting, warm tones'
    : 'daylight, bright and clear';
  
  const prompt = `Beautiful 24 year old Italian woman, long bronde hair with golden highlights, honey brown eyes, natural beauty mark on right cheek, feminine curvy figure, gold chain anklet on ankle, ${outfitDesc}, ${poseDesc}, infinity pool, luxury resort, ${timeDesc}, serene atmosphere, professional photography, Instagram influencer style, photorealistic, high quality`;
  
  console.log(`[Grok] Generating beach/pool image with reference style`);
  
  return generateImage(prompt, { referenceImageUrl });
}

