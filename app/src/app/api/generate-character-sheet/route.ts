import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { CHARACTER } from '@/config/character';

/**
 * POST /api/generate-character-sheet
 * Generate 30 varied images from a base reference for LoRA training
 * 
 * Body: { baseImageUrl: string, count?: number }
 */

function getClient(): Replicate {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    throw new Error('REPLICATE_API_TOKEN not configured');
  }
  return new Replicate({ auth: apiToken });
}

function extractImageUrl(output: unknown): string | null {
  if (typeof output === 'string') {
    return output;
  } else if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    return typeof first === 'string' ? first : String(first);
  }
  
  // Try regex extraction
  if (output) {
    const outputStr = String(output);
    const urlMatch = outputStr.match(/https?:\/\/[^\s"'\]]+/);
    if (urlMatch) return urlMatch[0];
  }
  
  return null;
}

interface Shot {
  category: string;
  angle: string;
  pose: string;
  clothing?: string;
  aspectRatio: '4:5' | '9:16';
}

const CHARACTER_SHEET_SHOTS: Shot[] = [
  // ===== FACE ANGLES (8) =====
  { category: 'face', angle: 'front face, directly looking at camera', pose: 'neutral calm expression, slight smile', aspectRatio: '4:5' },
  { category: 'face', angle: '3/4 view from right side', pose: 'slight smile, confident', aspectRatio: '4:5' },
  { category: 'face', angle: '3/4 view from left side', pose: 'slight smile, confident', aspectRatio: '4:5' },
  { category: 'face', angle: 'side profile right', pose: 'neutral expression, looking to the side', aspectRatio: '4:5' },
  { category: 'face', angle: 'side profile left', pose: 'neutral expression, looking to the side', aspectRatio: '4:5' },
  { category: 'face', angle: 'looking down', pose: 'peaceful gentle expression', aspectRatio: '4:5' },
  { category: 'face', angle: 'looking up slightly', pose: 'confident hopeful expression', aspectRatio: '4:5' },
  { category: 'face', angle: 'over shoulder looking back', pose: 'playful smile, flirty', aspectRatio: '4:5' },
  
  // ===== EXPRESSIONS (6) =====
  { category: 'expression', angle: 'front face closeup', pose: 'big genuine smile, very happy, teeth showing', aspectRatio: '4:5' },
  { category: 'expression', angle: 'front face closeup', pose: 'laughing, joyful, eyes closed slightly', aspectRatio: '4:5' },
  { category: 'expression', angle: 'front face closeup', pose: 'serious sultry look, confident gaze, sensual', aspectRatio: '4:5' },
  { category: 'expression', angle: 'front face closeup', pose: 'surprised expression, eyes wide, mouth slightly open', aspectRatio: '4:5' },
  { category: 'expression', angle: 'front face closeup', pose: 'thinking contemplative, hand on chin', aspectRatio: '4:5' },
  { category: 'expression', angle: 'front face closeup', pose: 'playful wink with smile', aspectRatio: '4:5' },
  
  // ===== BODY POSES (8) =====
  { category: 'body', angle: 'full body front view', pose: 'standing straight confident posture, arms at sides', clothing: 'simple white fitted t-shirt and blue jeans', aspectRatio: '9:16' },
  { category: 'body', angle: 'full body 3/4 view', pose: 'hand on hip, confident stance', clothing: 'simple white fitted t-shirt and blue jeans', aspectRatio: '9:16' },
  { category: 'body', angle: 'sitting on chair', pose: 'relaxed casual sitting pose, legs crossed', clothing: 'simple white fitted t-shirt and blue jeans', aspectRatio: '4:5' },
  { category: 'body', angle: 'walking pose', pose: 'mid-step casual walk, natural movement', clothing: 'simple white fitted t-shirt and blue jeans', aspectRatio: '9:16' },
  { category: 'body', angle: 'leaning against wall', pose: 'casual cool lean, arms crossed', clothing: 'simple white fitted t-shirt and blue jeans', aspectRatio: '9:16' },
  { category: 'body', angle: 'from behind, looking over shoulder', pose: 'back view, head turned to camera, soft smile', clothing: 'simple white fitted t-shirt and blue jeans', aspectRatio: '9:16' },
  { category: 'body', angle: 'upper body closeup', pose: 'arms crossed confidently, direct gaze', clothing: 'simple white fitted t-shirt', aspectRatio: '4:5' },
  { category: 'body', angle: 'side profile full body', pose: 'standing profile view, elegant posture', clothing: 'simple white fitted t-shirt and blue jeans', aspectRatio: '9:16' },
  
  // ===== CONTEXTS (8) =====
  { category: 'context', angle: 'upper body portrait', pose: 'confident athletic pose', clothing: 'black sports bra and matching leggings', aspectRatio: '4:5' },
  { category: 'context', angle: 'upper body portrait', pose: 'relaxed sitting at café, holding coffee', clothing: 'casual beige blazer over white top', aspectRatio: '4:5' },
  { category: 'context', angle: 'upper body portrait', pose: 'standing on beach, hand in hair, relaxed', clothing: 'terracotta bikini top', aspectRatio: '4:5' },
  { category: 'context', angle: 'sitting on bed', pose: 'cozy relaxed morning pose', clothing: 'oversized cream knit sweater', aspectRatio: '4:5' },
  { category: 'context', angle: 'standing elegant', pose: 'confident stylish pose, hand on hip', clothing: 'elegant black dress', aspectRatio: '4:5' },
  { category: 'context', angle: 'full body gym', pose: 'mid-workout pose, confident', clothing: 'matching olive green sports bra and leggings', aspectRatio: '9:16' },
  { category: 'context', angle: 'full body outdoor', pose: 'walking in park, natural candid', clothing: 'flowing terracotta midi dress', aspectRatio: '9:16' },
  { category: 'context', angle: 'bedroom intimate', pose: 'sitting on bed edge, soft natural light', clothing: 'cream silk slip dress', aspectRatio: '4:5' },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { baseImageUrl, count = 30 } = body;

    if (!baseImageUrl) {
      return NextResponse.json(
        { success: false, error: 'baseImageUrl is required' },
        { status: 400 }
      );
    }

    const client = getClient();
    const { physical, signature } = CHARACTER;
    
    console.log('[Character Sheet] Starting generation...');
    console.log('[Character Sheet] Base image:', baseImageUrl);
    console.log('[Character Sheet] Count:', count);

    const results: Array<{
      index: number;
      category: string;
      angle: string;
      pose: string;
      url: string;
      success: boolean;
    }> = [];

    const shotsToGenerate = CHARACTER_SHEET_SHOTS.slice(0, count);

    for (const [index, shot] of shotsToGenerate.entries()) {
      console.log(`[Character Sheet] Generating ${index + 1}/${shotsToGenerate.length}: ${shot.category} - ${shot.angle}`);

      try {
        // Build prompt
        const clothingPart = shot.clothing ? `wearing ${shot.clothing}` : '';
        const prompt = `Professional high-quality photograph of ${physical.base}, ${physical.face}, ${physical.hair}, ${physical.eyes}, ${physical.skin}, ${physical.body}, ${physical.features}. ${signature.necklace} clearly visible. ${clothingPart}. ${shot.angle}, ${shot.pose}. Clean background, professional studio lighting, photorealistic, sharp focus, high resolution, 8K quality, natural skin texture. Same person, consistent identity throughout.`;

        const output = await client.run(
          "black-forest-labs/flux-kontext-pro",
          {
            input: {
              prompt,
              image_url: baseImageUrl, // Same reference for ALL shots
              aspect_ratio: shot.aspectRatio,
              output_format: "jpg",
              safety_tolerance: 2,
            }
          }
        );

        const imageUrl = extractImageUrl(output);

        if (imageUrl) {
          results.push({
            index,
            category: shot.category,
            angle: shot.angle,
            pose: shot.pose,
            url: imageUrl,
            success: true,
          });
          console.log(`[Character Sheet] ✅ Success ${index + 1}: ${imageUrl.slice(0, 80)}...`);
        } else {
          console.error(`[Character Sheet] ❌ Failed ${index + 1}: No URL extracted`);
          results.push({
            index,
            category: shot.category,
            angle: shot.angle,
            pose: shot.pose,
            url: '',
            success: false,
          });
        }

        // Rate limit protection: wait 3 seconds between generations
        if (index < shotsToGenerate.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

      } catch (error) {
        console.error(`[Character Sheet] Error generating shot ${index + 1}:`, error);
        results.push({
          index,
          category: shot.category,
          angle: shot.angle,
          pose: shot.pose,
          url: '',
          success: false,
        });
      }
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`[Character Sheet] Complete: ${successful.length} success, ${failed.length} failed`);

    return NextResponse.json({
      success: successful.length > 0,
      generated: successful.length,
      failed: failed.length,
      images: successful,
      failedIndices: failed.map(f => f.index),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Character Sheet] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

