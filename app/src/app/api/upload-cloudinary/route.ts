import { NextResponse } from 'next/server';
import { uploadImageFromUrl, isCloudinaryConfigured } from '@/lib/cloudinary';

/**
 * GET /api/upload-cloudinary
 * 
 * Upload an image to Cloudinary and return the permanent URL
 * Query params:
 * - url: The image URL to upload
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');
  
  if (!imageUrl) {
    return NextResponse.json({
      success: false,
      error: 'Missing url parameter',
    }, { status: 400 });
  }
  
  if (!isCloudinaryConfigured()) {
    return NextResponse.json({
      success: false,
      error: 'Cloudinary not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to .env.local',
    }, { status: 500 });
  }
  
  try {
    console.log('[API] Uploading to Cloudinary:', imageUrl.slice(0, 60) + '...');
    
    const result = await uploadImageFromUrl(imageUrl);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
    });
    
  } catch (error) {
    console.error('[API] Cloudinary upload error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }, { status: 500 });
  }
}

