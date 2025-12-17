import { NextRequest, NextResponse } from 'next/server';
import { generateSmartComment } from '@/lib/smart-comments';

/**
 * POST /api/smart-comment
 * 
 * Accepts an image (screenshot of IG post) and returns a smart comment.
 * 
 * Body (JSON):
 * - image: base64 encoded image data
 * - mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
 * 
 * Or multipart/form-data:
 * - image: file
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let imageBase64: string;
    let mimeType: 'image/jpeg' | 'image/png' | 'image/webp';

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload (from iOS Shortcut)
      const formData = await request.formData();
      const imageFile = formData.get('image') as File | null;

      if (!imageFile) {
        return NextResponse.json(
          { success: false, error: 'No image provided' },
          { status: 400 }
        );
      }

      // Convert file to base64
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      imageBase64 = buffer.toString('base64');

      // Get mime type
      const type = imageFile.type;
      if (type === 'image/jpeg' || type === 'image/jpg') {
        mimeType = 'image/jpeg';
      } else if (type === 'image/png') {
        mimeType = 'image/png';
      } else if (type === 'image/webp') {
        mimeType = 'image/webp';
      } else {
        // Default to jpeg for unknown types (iOS often sends as generic)
        mimeType = 'image/jpeg';
      }
    } else {
      // Handle JSON body (accept both 'image' and 'imageBase64' keys)
      const body = await request.json();
      const imageData = body.image || body.imageBase64;

      if (!imageData) {
        return NextResponse.json(
          { success: false, error: 'No image provided (use "image" or "imageBase64" key)' },
          { status: 400 }
        );
      }

      imageBase64 = imageData;
      mimeType = body.mimeType || 'image/jpeg';
    }

    // Generate smart comment
    const result = await generateSmartComment({
      imageBase64,
      mimeType,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] smart-comment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Simple GET for testing
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/smart-comment',
    usage: 'POST with image (multipart/form-data or JSON with base64)',
  });
}
