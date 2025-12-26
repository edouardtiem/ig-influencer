import Replicate from 'replicate';
import { buildCharacterPrompt, buildStylePrompt, CHARACTER } from '@/config/character';
import { getBasePortraits } from '@/config/base-portraits';
import { getActiveLocationById, Location } from '@/config/locations';
import { ContentTemplate as CalendarTemplate, LightingCondition, getMoodFromLighting } from '@/config/calendar';
import { ContentTemplate as PromptsTemplate } from '@/types';

/**
 * Convert an image URL to base64 data URI
 */
async function urlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/png';
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error(`[urlToBase64] Error converting ${url}:`, error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface GenerateImageOptions {
  // Option A: Simple template (legacy)
  template?: PromptsTemplate;
  
  // Option B: Full contextual brief (new)
  locationId?: string;
  contentBrief?: {
    pose: string;
    expression: string;
    outfit: string;
    props?: string[];
    lighting: LightingCondition;
    mood: string;
  };
  
  // Common options
  width?: number;
  height?: number;
  useReferences?: boolean;
  useLocationReference?: boolean;
  
  // Scene consistency (for carousels)
  sceneReferenceUrl?: string; // URL of previous image for scene consistency
  forceSceneConsistency?: boolean; // Double the scene ref for stronger consistency
}

interface GenerateImageResult {
  success: boolean;
  imageUrl?: string;
  imageBase64?: string;
  error?: string;
  predictionId?: string;
  promptUsed?: string;
}

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDERS
// ═══════════════════════════════════════════════════════════════

/**
 * Build prompt from legacy template (prompts.ts format)
 */
function buildPromptFromTemplate(template: PromptsTemplate): string {
  const characterPrompt = buildCharacterPrompt();
  const stylePrompt = buildStylePrompt();
  
  return `[STYLE] 2026 instagram style picture, Photorealistic Instagram photo, natural lighting, professional photography quality, authentic candid feel,

${characterPrompt}

The woman in the reference images is the subject - maintain her EXACT face, features, beauty marks, freckles, hair color and style from the reference photos.

[CLOTHING] ${template.clothing}

[POSE & EXPRESSION] ${template.pose}

[SETTING] ${template.setting}

${stylePrompt}

[REQUIREMENTS]
- SINGLE IMAGE ONLY - absolutely NO collages, NO grids, NO patchwork, NO multiple photos combined in one frame
- Generate exactly ONE photograph, not a montage or split-screen composition
- Photorealistic quality like iPhone 15 Pro camera
- Natural skin texture with visible pores (not airbrushed)
- The thin gold star necklace MUST be visible
- Warm natural lighting, Instagram aesthetic
- Sharp focus on face
- Do NOT add tattoos, piercings, or glasses
- Keep the exact same copper auburn curly hair type 3A`;
}

/**
 * Build prompt from contextual brief (calendar.ts format) + location
 */
function buildContextualPrompt(
  location: Location,
  brief: {
    pose: string;
    expression: string;
    outfit: string;
    props?: string[];
    lighting: LightingCondition;
    mood: string;
  }
): string {
  const characterPrompt = buildCharacterPrompt();
  const stylePrompt = buildStylePrompt();
  const lightingDescription = getMoodFromLighting(brief.lighting);
  
  // Build detailed lighting instructions based on condition
  let lightingInstructions = '';
  if (brief.lighting === 'night') {
    lightingInstructions = `[LIGHTING - CRITICAL] 
- Interior: Artificial lighting only (lamps, spotlights, ambient lights)
- Exterior visible through windows: DARK NIGHT, no daylight, city lights or darkness outside
- No natural daylight coming through windows
- Indoor atmosphere: cozy warm artificial light`;
  } else if (brief.lighting === 'dawn') {
    lightingInstructions = `[LIGHTING - CRITICAL]
- Interior: Soft dim light, transitioning from night to day
- Exterior visible through windows: Pre-dawn twilight, very dim, not bright daylight yet
- Subtle natural light beginning to appear`;
  } else if (brief.lighting === 'golden_hour') {
    lightingInstructions = `[LIGHTING - CRITICAL]
- Interior: Warm golden natural light streaming through windows
- Exterior visible through windows: Golden hour sunset/sunrise, warm amber glow
- Beautiful warm lighting atmosphere`;
  } else if (brief.lighting === 'daylight') {
    lightingInstructions = `[LIGHTING - CRITICAL]
- Interior: Bright natural daylight through windows
- Exterior visible through windows: Bright clear daylight, sunny or bright overcast
- Natural bright lighting`;
  } else if (brief.lighting === 'sunset') {
    lightingInstructions = `[LIGHTING - CRITICAL]
- Interior: Warm golden sunset light through windows
- Exterior visible through windows: Sunset golden hour, warm orange-pink sky
- Romantic warm lighting`;
  } else if (brief.lighting === 'dusk') {
    lightingInstructions = `[LIGHTING - CRITICAL]
- Interior: Dimming natural light, artificial lights starting to turn on
- Exterior visible through windows: Dusk, fading daylight, transitioning to night
- Soft fading light`;
  } else {
    lightingInstructions = `[LIGHTING] ${lightingDescription}`;
  }
  
  // Build props string if provided
  const propsStr = brief.props && brief.props.length > 0 
    ? `\n[ENVIRONMENT DETAILS] ${brief.props.join(', ')}`
    : '';
  
  return `[STYLE] 2026 instagram style picture, Photorealistic Instagram photo, professional photography quality, authentic candid moment captured mid-action,

${characterPrompt}

The woman in the reference images is the subject - maintain her EXACT face, features, beauty marks, freckles, hair color and style from the reference photos.

[LOCATION]
${location.prompt}

[CLOTHING] ${brief.outfit}

[ACTION - IMPORTANT] She is actively: ${brief.pose}
This is a dynamic moment, NOT a static pose. Capture her mid-action, natural movement, authentic moment.

[EXPRESSION] ${brief.expression}
${propsStr}

${lightingInstructions}

[MOOD] ${brief.mood}

${stylePrompt}

[REQUIREMENTS]
- SINGLE IMAGE ONLY - absolutely NO collages, NO grids, NO patchwork, NO multiple photos combined in one frame
- Generate exactly ONE photograph, not a montage or split-screen composition
- Photorealistic quality like iPhone 15 Pro camera
- DYNAMIC ACTION shot - she is doing something, not just posing
- Natural movement, authentic candid moment
- Natural skin texture with visible pores (not airbrushed)
- The thin gold star necklace MUST be visible on her neck
- RESPECT THE LIGHTING INSTRUCTIONS ABOVE - if it says night, windows must show darkness outside
- Sharp focus on face
- Do NOT add tattoos, piercings, or glasses
- Keep the exact same copper auburn curly hair type 3A
- Maintain the location's aesthetic from the reference`;
}

/**
 * Build a simple prompt with just character + custom instruction
 */
export function buildSimplePrompt(instruction: string): string {
  const characterPrompt = buildCharacterPrompt();
  const stylePrompt = buildStylePrompt();
  
  return `[STYLE] 2026 instagram style picture, Photorealistic Instagram photo, natural lighting, professional photography quality,

${characterPrompt}

The woman in the reference images is the subject - maintain her EXACT face, features, beauty marks, freckles, hair color and style.

${instruction}

${stylePrompt}

[REQUIREMENTS]
- SINGLE IMAGE ONLY - absolutely NO collages, NO grids, NO patchwork, NO multiple photos combined
- Photorealistic quality, iPhone 15 Pro camera aesthetic
- Natural skin texture (not airbrushed)
- Gold star necklace MUST be visible
- No tattoos, no piercings, no glasses
- Copper auburn curly hair type 3A`;
}

// ═══════════════════════════════════════════════════════════════
// MAIN GENERATION FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate image using Nano Banana Pro with reference images
 */
export async function generateImage(options: GenerateImageOptions): Promise<GenerateImageResult> {
  const { 
    template, 
    locationId, 
    contentBrief,
    useReferences = true,
    useLocationReference = true,
    sceneReferenceUrl,
    forceSceneConsistency = false,
  } = options;
  
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    return { success: false, error: 'REPLICATE_API_TOKEN not configured' };
  }
  
  const replicate = new Replicate({ auth: apiToken });
  
  // ─────────────────────────────────────────────────────────────
  // BUILD PROMPT
  // ─────────────────────────────────────────────────────────────
  
  let prompt: string;
  let location: Location | undefined;
  
  if (locationId && contentBrief) {
    // New contextual mode: location + brief
    location = getActiveLocationById(locationId);
    if (!location) {
      return { success: false, error: `Location not found: ${locationId}` };
    }
    prompt = buildContextualPrompt(location, contentBrief);
    console.log('[Nano Banana Pro] Using contextual prompt with location:', location.name);
  } else if (template) {
    // Legacy mode: template from prompts.ts
    prompt = buildPromptFromTemplate(template);
    console.log('[Nano Banana Pro] Using template prompt:', template.type);
  } else {
    return { success: false, error: 'Either template or (locationId + contentBrief) is required' };
  }
  
  // ─────────────────────────────────────────────────────────────
  // COLLECT REFERENCE IMAGES
  // ─────────────────────────────────────────────────────────────
  
  try {
    const { primaryFaceUrl, referenceUrls } = getBasePortraits();
    const allReferenceUrls: string[] = [];
    
    // FIRST: Add scene reference for carousel consistency (strongest weight)
    if (sceneReferenceUrl) {
      allReferenceUrls.push(sceneReferenceUrl);
      console.log('[Nano Banana Pro] 🎬 Added scene reference for consistency');
      
      // Double the reference for stronger consistency
      if (forceSceneConsistency) {
        allReferenceUrls.push(sceneReferenceUrl);
        console.log('[Nano Banana Pro] 🎬 Doubled scene reference (strong consistency mode)');
      }
    }
    
    // Add character references (Mila's photos - limited to 2 for API payload size when scene ref present)
    if (useReferences) {
      // Use fewer face refs when scene ref is present to keep payload manageable
      const maxFaceRefs = sceneReferenceUrl ? 2 : 3;
      const limitedRefs = referenceUrls.slice(0, maxFaceRefs - 1);
      allReferenceUrls.push(primaryFaceUrl, ...limitedRefs);
      console.log('[Nano Banana Pro] Using', limitedRefs.length + 1, 'character references');
    }
    
    // Add location reference if available (only for first image, not when scene ref is used)
    if (useLocationReference && location?.referenceImageUrl && !sceneReferenceUrl) {
      allReferenceUrls.push(location.referenceImageUrl);
      console.log('[Nano Banana Pro] Added location reference:', location.name);
    }
    
    console.log('[Nano Banana Pro] Starting generation with', allReferenceUrls.length, 'references');
    console.log('[Nano Banana Pro] Prompt preview:', prompt.substring(0, 300) + '...');
    
    // ─────────────────────────────────────────────────────────────
    // PREPARE API INPUT
    // ─────────────────────────────────────────────────────────────
    
    const input: Record<string, unknown> = {
      prompt,
      aspect_ratio: "4:5",
      resolution: "2K",
      output_format: "jpg",
      safety_filter_level: "block_only_high",
    };
    
    // Convert reference URLs to base64 data URIs
    if (allReferenceUrls.length > 0) {
      console.log('[Nano Banana Pro] Converting', allReferenceUrls.length, 'images to base64...');
      try {
        const base64Images = await Promise.all(
          allReferenceUrls.map(url => urlToBase64(url))
        );
        input.image_input = base64Images;
        console.log('[Nano Banana Pro] ✅ Converted all images to base64');
      } catch (conversionError) {
        console.error('[Nano Banana Pro] ❌ Failed to convert images:', conversionError);
        // Fallback to URLs if conversion fails
        console.log('[Nano Banana Pro] Falling back to URL format...');
        input.image_input = allReferenceUrls;
      }
    }
    
    console.log('[Nano Banana Pro] Input params:', Object.keys(input));
    
    // ─────────────────────────────────────────────────────────────
    // CALL API
    // ─────────────────────────────────────────────────────────────
    
    const output = await replicate.run("google/nano-banana-pro", { input });
    
    console.log('[Nano Banana Pro] Output received, type:', typeof output);
    
    // Collect all binary chunks from the stream
    const chunks: Uint8Array[] = [];
    
    if (output && typeof output === 'object' && Symbol.asyncIterator in output) {
      // It's an async iterable - collect binary chunks
      for await (const chunk of output as AsyncIterable<Uint8Array>) {
        if (chunk instanceof Uint8Array) {
          chunks.push(chunk);
        } else if (typeof chunk === 'string') {
          // If it's a string URL, return it directly
          console.log('[Nano Banana Pro] ✅ Got URL directly:', chunk);
          return { success: true, imageUrl: chunk, promptUsed: prompt };
        }
      }
    } else if (typeof output === 'string') {
      // Direct URL
      console.log('[Nano Banana Pro] ✅ Got URL directly:', output);
      return { success: true, imageUrl: output, promptUsed: prompt };
    } else if (Array.isArray(output) && typeof output[0] === 'string') {
      console.log('[Nano Banana Pro] ✅ Got URL from array:', output[0]);
      return { success: true, imageUrl: output[0], promptUsed: prompt };
    }
    
    // If we collected binary chunks, combine them into a base64 image
    if (chunks.length > 0) {
      console.log('[Nano Banana Pro] Collected', chunks.length, 'binary chunks');
      
      // Combine all chunks into one buffer
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      
      // Convert to base64
      const base64 = Buffer.from(combined).toString('base64');
      const imageUrl = `data:image/jpeg;base64,${base64}`;
      
      console.log('[Nano Banana Pro] ✅ Created base64 image, size:', totalLength, 'bytes');
      return { success: true, imageUrl, imageBase64: base64, promptUsed: prompt };
    }
    
    console.error('[Nano Banana Pro] Could not process output');
    return { success: false, error: 'Could not process API response' };
    
  } catch (error) {
    console.error('[Nano Banana Pro] ❌ Error:', error);
    return {
      success: false,
      error: `Nano Banana Pro error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Generate image from calendar content brief
 * This is the main function for automated posting
 * 
 * @param sceneReferenceUrl - URL of previous image for scene consistency (carousel mode)
 * @param forceSceneConsistency - Double the scene ref for stronger consistency
 */
export async function generateFromCalendar(
  locationId: string,
  pose: string,
  expression: string,
  outfit: string,
  lighting: LightingCondition,
  mood: string,
  props?: string[],
  sceneReferenceUrl?: string,
  forceSceneConsistency?: boolean
): Promise<GenerateImageResult> {
  return generateImage({
    locationId,
    contentBrief: {
      pose,
      expression,
      outfit,
      lighting,
      mood,
      props,
    },
    sceneReferenceUrl,
    forceSceneConsistency,
  });
}

/**
 * Generate image with custom prompt instruction
 */
export async function generateCustom(instruction: string): Promise<GenerateImageResult> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    return { success: false, error: 'REPLICATE_API_TOKEN not configured' };
  }
  
  const prompt = buildSimplePrompt(instruction);
  
  // Use the main function with a fake template
  return generateImage({
    template: {
      type: 'custom' as any,
      clothing: '',
      pose: instruction,
      setting: '',
      captions: [],
      hashtags: [],
    },
    useReferences: true,
  });
}

// ═══════════════════════════════════════════════════════════════
// STATUS CHECK
// ═══════════════════════════════════════════════════════════════

/**
 * Check API status
 */
export async function checkApiStatus(): Promise<{ ok: boolean; error?: string }> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    return { ok: false, error: 'REPLICATE_API_TOKEN not configured' };
  }
  
  try {
    const replicate = new Replicate({ auth: apiToken });
    await replicate.models.get("google", "nano-banana-pro");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
