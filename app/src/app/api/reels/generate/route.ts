import { NextRequest, NextResponse } from 'next/server';
import { generateVideo, generateMultipleClips, estimateCost } from '@/lib/kling';
import { createMultiShotReel } from '@/lib/ffmpeg';
import path from 'path';

/**
 * POST /api/reels/generate
 * 
 * Generate a reel from one or multiple images using Kling v2.5 Turbo Pro
 * 
 * Single clip mode:
 * {
 *   mode: 'single',
 *   prompt: string,
 *   imageUrl: string,
 *   duration?: 5 | 10,
 *   aspectRatio?: '9:16' | '16:9' | '1:1'
 * }
 * 
 * Multi-shot mode (carousel → reel):
 * {
 *   mode: 'multi',
 *   clips: [{ prompt: string, imageUrl: string }],
 *   duration?: 5 | 10,
 *   aspectRatio?: '9:16' | '16:9' | '1:1',
 *   transition?: 'none' | 'fade'
 * }
 */

interface SingleModeRequest {
  mode: 'single';
  prompt: string;
  imageUrl: string;
  duration?: 5 | 10;
  aspectRatio?: '9:16' | '16:9' | '1:1';
}

interface MultiModeRequest {
  mode: 'multi';
  clips: Array<{ prompt: string; imageUrl: string }>;
  duration?: 5 | 10;
  aspectRatio?: '9:16' | '16:9' | '1:1';
  transition?: 'none' | 'fade';
}

type GenerateRequest = SingleModeRequest | MultiModeRequest;

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    
    // Single clip mode
    if (body.mode === 'single') {
      const { prompt, imageUrl, duration = 5, aspectRatio = '9:16' } = body;
      
      if (!prompt || !imageUrl) {
        return NextResponse.json(
          { error: 'Missing required fields: prompt, imageUrl' },
          { status: 400 }
        );
      }
      
      const result = await generateVideo({
        prompt,
        imageUrl,
        duration,
        aspectRatio,
      });
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        videoUrl: result.videoUrl,
        durationMs: result.durationMs,
        estimatedCost: estimateCost(1, duration),
      });
    }
    
    // Multi-shot mode
    if (body.mode === 'multi') {
      const { clips, duration = 5, aspectRatio = '9:16', transition = 'fade' } = body;
      
      if (!clips || clips.length < 2) {
        return NextResponse.json(
          { error: 'Multi mode requires at least 2 clips' },
          { status: 400 }
        );
      }
      
      // Generate all clips
      const results = await generateMultipleClips(clips, { duration, aspectRatio });
      
      const successful = results.filter(r => r.success);
      if (successful.length === 0) {
        return NextResponse.json(
          { error: 'All clip generations failed', details: results.map(r => r.error) },
          { status: 500 }
        );
      }
      
      // Get video URLs
      const videoUrls = successful
        .map(r => r.videoUrl)
        .filter((url): url is string => !!url);
      
      // Concatenate into single reel
      const outputDir = path.join(process.cwd(), 'generated', 'reels');
      const reelResult = await createMultiShotReel(videoUrls, outputDir, {
        transition,
        transitionDuration: 0.5,
      });
      
      if (!reelResult.success) {
        // Return individual clips even if concat failed
        return NextResponse.json({
          success: true,
          warning: 'FFmpeg concat failed, returning individual clips',
          clips: videoUrls,
          error: reelResult.error,
          estimatedCost: estimateCost(clips.length, duration),
        });
      }
      
      return NextResponse.json({
        success: true,
        reelPath: reelResult.outputPath,
        clips: videoUrls,
        clipCount: videoUrls.length,
        estimatedCost: estimateCost(clips.length, duration),
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid mode. Use "single" or "multi"' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('[API] /api/reels/generate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reels/generate
 * Returns cost estimation
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clipCount = parseInt(searchParams.get('clips') || '1', 10);
  const duration = (parseInt(searchParams.get('duration') || '5', 10) as 5 | 10);
  
  return NextResponse.json({
    clipCount,
    duration,
    estimatedCost: estimateCost(clipCount, duration),
    model: 'kwaivgi/kling-v2.5-turbo-pro',
    note: 'Cost is approximate, actual cost depends on Replicate pricing',
  });
}

