import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { LOCATIONS, getLocationById } from '@/config/locations';

/**
 * API Route to generate location reference photos
 * Uses Nano Banana Pro without character - just the location/setting
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { locationId } = body;

    const location = locationId 
      ? getLocationById(locationId) 
      : LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    console.log('[Generate Location] Generating:', location.name);
    console.log('[Generate Location] Prompt:', location.prompt.substring(0, 100) + '...');

    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      return NextResponse.json({ error: 'REPLICATE_API_TOKEN not configured' }, { status: 500 });
    }

    const replicate = new Replicate({ auth: apiToken });

    // Build enhanced prompt for location-only generation (no people)
    const enhancedPrompt = `${location.prompt}

Style: Photorealistic photography, high-end Instagram aesthetic
Quality: Shot on iPhone 15 Pro, natural lighting, high resolution
Composition: Beautiful empty scene ready for portrait photography
IMPORTANT: No people in the frame - this is a location reference shot only
Avoid: People, crowds, tourists, blurry areas, low quality, artificial look`;

    const input = {
      prompt: enhancedPrompt,
      aspect_ratio: "4:5",
      resolution: "2K",
      output_format: "jpg",
      safety_filter_level: "block_only_high",
    };

    console.log('[Generate Location] Calling Nano Banana Pro...');
    const output = await replicate.run("google/nano-banana-pro", { input });

    // Collect binary chunks
    const chunks: Uint8Array[] = [];
    
    if (output && typeof output === 'object' && Symbol.asyncIterator in output) {
      for await (const chunk of output as AsyncIterable<Uint8Array>) {
        if (chunk instanceof Uint8Array) {
          chunks.push(chunk);
        } else if (typeof chunk === 'string') {
          // Direct URL
          console.log('[Generate Location] ✅ Success - URL:', chunk);
          return NextResponse.json({
            success: true,
            location,
            imageUrl: chunk,
          });
        }
      }
    } else if (typeof output === 'string') {
      console.log('[Generate Location] ✅ Success - URL:', output);
      return NextResponse.json({
        success: true,
        location,
        imageUrl: output,
      });
    }

    // Combine binary chunks to base64
    if (chunks.length > 0) {
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      
      const base64 = Buffer.from(combined).toString('base64');
      const imageUrl = `data:image/jpeg;base64,${base64}`;
      
      console.log('[Generate Location] ✅ Success - Base64 image, size:', totalLength, 'bytes');
      return NextResponse.json({
        success: true,
        location,
        imageUrl,
        sizeBytes: totalLength,
      });
    }

    return NextResponse.json({ error: 'Could not generate image' }, { status: 500 });

  } catch (error) {
    console.error('[Generate Location] ❌ Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET - List all available locations
 */
export async function GET() {
  return NextResponse.json({
    total: LOCATIONS.length,
    locations: LOCATIONS.map(loc => ({
      id: loc.id,
      name: loc.name,
      category: loc.category,
      mood: loc.mood,
      hasReferenceImage: !!loc.referenceImageUrl,
    })),
  });
}

