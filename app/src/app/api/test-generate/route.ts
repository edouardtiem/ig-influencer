import { NextRequest, NextResponse } from 'next/server';
import { generateWithNanaBanana } from '@/lib/replicate';
import { getWeightedRandomTemplate, getRandomCaption, CONTENT_TEMPLATES } from '@/config/prompts';
import { ContentType } from '@/types';
import { getBasePortraits } from '@/config/base-portraits';


/**
 * GET /api/test-generate
 * 
 * Test endpoint to generate an image of Mila
 * 
 * Query params:
 * - type: content type (lifestyle, fitness, summer, sexy_light, sexy_medium, casual, glam)
 * - index: specific template index (0-11)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const timestamp = new Date().toISOString();
  const searchParams = request.nextUrl.searchParams;
  
  // Get optional params
  const typeParam = searchParams.get('type') as ContentType | null;
  const indexParam = searchParams.get('index');
  
  console.log(`[${timestamp}] Test generate request - type: ${typeParam}, index: ${indexParam}`);
  
  try {
    // Select template
    let template;
    
    if (indexParam !== null) {
      const index = parseInt(indexParam, 10);
      if (index >= 0 && index < CONTENT_TEMPLATES.length) {
        template = CONTENT_TEMPLATES[index];
      } else {
        return NextResponse.json({
          success: false,
          error: `Invalid index. Must be 0-${CONTENT_TEMPLATES.length - 1}`,
          availableTemplates: CONTENT_TEMPLATES.map((t, i) => ({ index: i, type: t.type })),
        }, { status: 400 });
      }
    } else if (typeParam) {
      const filtered = CONTENT_TEMPLATES.filter(t => t.type === typeParam);
      if (filtered.length === 0) {
        return NextResponse.json({
          success: false,
          error: `Invalid type: ${typeParam}`,
          availableTypes: [...new Set(CONTENT_TEMPLATES.map(t => t.type))],
        }, { status: 400 });
      }
      template = filtered[Math.floor(Math.random() * filtered.length)];
    } else {
      template = getWeightedRandomTemplate();
    }
    
    console.log(`[${timestamp}] Selected template: ${template.type}`);
    
    // Generate image with Nano Banana Pro
    const startTime = Date.now();
    const { primaryFaceUrl, referenceUrls } = getBasePortraits();
    const allReferences = [primaryFaceUrl, ...referenceUrls];
    
    console.log(`[${timestamp}] Generating with Nano Banana Pro...`);
    console.log(`[${timestamp}] Using ${allReferences.length} reference images`);
    
    const imageResult = await generateWithNanaBanana(template, allReferences);
    const pipelineSteps = ['Nano Banana Pro'];
    const duration = Date.now() - startTime;
    console.log(`[${timestamp}] Generation completed in ${duration}ms`);
    
    if (!imageResult.success) {
      return NextResponse.json({
        success: false,
        error: imageResult.error,
        template: {
          type: template.type,
          clothing: template.clothing,
          setting: template.setting,
        },
        pipeline: pipelineSteps,
        timestamp,
      }, { status: 500 });
    }
    
    // Generate caption
    const caption = getRandomCaption(template);
    
    return NextResponse.json({
      success: true,
      template: {
        type: template.type,
        clothing: template.clothing,
        pose: template.pose,
        setting: template.setting,
      },
      caption,
      image: imageResult.imageUrl,
      pipeline: pipelineSteps,
      referenceCount: allReferences.length,
      generationTime: `${duration}ms`,
      timestamp,
    });
    
  } catch (error) {
    console.error(`[${timestamp}] Unexpected error:`, error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
      timestamp,
    }, { status: 500 });
  }
}

