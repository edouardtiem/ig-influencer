import { NextResponse } from 'next/server';
import { generateImage } from '@/lib/nanobanana';
import { ContentTemplate } from '@/types';

/**
 * POST /api/test-nanobanana
 * Test Nano Banana Pro generation with optional reference images
 * 
 * Body: { template: ContentTemplate, useReferences?: boolean }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { template, useReferences = true } = body;

    if (!template || !template.clothing || !template.pose || !template.setting) {
      return NextResponse.json(
        { success: false, error: 'Valid template object is required' },
        { status: 400 }
      );
    }

    console.log('[Test Nano Banana Pro] Generating...');
    console.log('[Test Nano Banana Pro] Template:', template);
    console.log('[Test Nano Banana Pro] Use references:', useReferences);

    const startTime = Date.now();
    
    // Generate with Nano Banana Pro (references handled internally)
    const result = await generateImage({ 
      template,
      useReferences
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (result.success && result.imageUrl) {
      return NextResponse.json({
        success: true,
        imageUrl: result.imageUrl,
        duration: `${duration}s`,
        model: 'google/nano-banana-pro',
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Generation failed',
          duration: `${duration}s`,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Test Nano Banana] Error:', error);
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

