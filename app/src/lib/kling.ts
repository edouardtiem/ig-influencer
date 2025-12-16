import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';

/**
 * Kling v2.5 Video Generation Service
 * Uses Kling v2.5 Turbo Pro for image-to-video generation
 * Cost: ~$0.40-0.50 per 5s clip
 */

let replicateClient: Replicate | null = null;

function getClient(): Replicate {
  if (!replicateClient) {
    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      throw new Error('REPLICATE_API_TOKEN not configured');
    }
    replicateClient = new Replicate({ auth: apiToken });
  }
  return replicateClient;
}

export interface KlingGenerateOptions {
  prompt: string;
  imageUrl?: string;        // URL of the image
  imagePath?: string;       // Local file path (will be converted to base64)
  imageBase64?: string;     // Direct base64 input
  duration?: 5 | 10;        // 5s or 10s
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

export interface KlingGenerateResult {
  success: boolean;
  videoUrl?: string;
  durationMs?: number;
  error?: string;
}

/**
 * Convert local file to base64 data URI
 */
function fileToBase64(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const base64 = fileBuffer.toString('base64');
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Extract video URL from Replicate output
 */
function extractVideoUrl(output: unknown): string | null {
  if (typeof output === 'string') {
    return output;
  }
  
  if (output && typeof output === 'object') {
    const obj = output as Record<string, unknown>;
    
    if (obj.url) {
      return typeof obj.url === 'function' 
        ? (obj.url as () => { href: string })().href 
        : String(obj.url);
    }
    
    if (obj.video) {
      return typeof obj.video === 'string' 
        ? obj.video 
        : (obj.video as { url?: string })?.url || null;
    }
  }
  
  if (Array.isArray(output) && output[0]) {
    const first = output[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object') {
      return (first as { url?: string; video?: string }).url || 
             (first as { url?: string; video?: string }).video || null;
    }
  }
  
  return null;
}

/**
 * Generate video from image using Kling v2.5 Turbo Pro
 */
export async function generateVideo(options: KlingGenerateOptions): Promise<KlingGenerateResult> {
  const { prompt, imageUrl, imagePath, imageBase64, duration = 5, aspectRatio = '9:16' } = options;
  
  // Resolve image input
  let imageInput: string;
  if (imageBase64) {
    imageInput = imageBase64;
  } else if (imagePath) {
    if (!fs.existsSync(imagePath)) {
      return { success: false, error: `Image not found: ${imagePath}` };
    }
    imageInput = fileToBase64(imagePath);
  } else if (imageUrl) {
    imageInput = imageUrl;
  } else {
    return { success: false, error: 'No image provided (imageUrl, imagePath, or imageBase64 required)' };
  }
  
  console.log('[Kling] Generating video with Kling v2.5 Turbo Pro...');
  console.log('[Kling] Duration:', duration, 's');
  console.log('[Kling] Aspect ratio:', aspectRatio);
  console.log('[Kling] Prompt:', prompt.slice(0, 100) + '...');
  
  const startTime = Date.now();
  
  try {
    const client = getClient();
    
    const output = await client.run("kwaivgi/kling-v2.5-turbo-pro", {
      input: {
        prompt,
        image: imageInput,
        duration,
        aspect_ratio: aspectRatio,
      }
    });
    
    const durationMs = Date.now() - startTime;
    const videoUrl = extractVideoUrl(output);
    
    if (!videoUrl) {
      return { 
        success: false, 
        error: `No video URL in output: ${JSON.stringify(output).slice(0, 200)}`,
        durationMs 
      };
    }
    
    console.log('[Kling] Video generated in', (durationMs / 1000).toFixed(1), 's');
    console.log('[Kling] URL:', videoUrl);
    
    return { success: true, videoUrl, durationMs };
    
  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error('[Kling] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      durationMs,
    };
  }
}

/**
 * Generate multiple clips in parallel (for multi-shot reels)
 */
export async function generateMultipleClips(
  clips: Array<{ prompt: string; imageUrl?: string; imagePath?: string }>,
  options: { duration?: 5 | 10; aspectRatio?: '16:9' | '9:16' | '1:1' } = {}
): Promise<KlingGenerateResult[]> {
  console.log(`[Kling] Generating ${clips.length} clips in parallel...`);
  
  const results = await Promise.all(
    clips.map(clip => generateVideo({
      prompt: clip.prompt,
      imageUrl: clip.imageUrl,
      imagePath: clip.imagePath,
      duration: options.duration || 5,
      aspectRatio: options.aspectRatio || '9:16',
    }))
  );
  
  const successful = results.filter(r => r.success).length;
  console.log(`[Kling] Generated ${successful}/${clips.length} clips`);
  
  return results;
}

/**
 * Estimate cost for video generation
 */
export function estimateCost(clipCount: number, duration: 5 | 10 = 5): number {
  const costPer5s = 0.40;
  const costPer10s = 0.80;
  return clipCount * (duration === 5 ? costPer5s : costPer10s);
}

