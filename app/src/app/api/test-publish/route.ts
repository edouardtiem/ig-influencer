import { NextResponse } from 'next/server';
import { uploadImageFromUrl, isCloudinaryConfigured } from '@/lib/cloudinary';
import { publishToInstagram, isMakeConfigured } from '@/lib/make';

/**
 * GET /api/test-publish
 * 
 * Test the full publishing pipeline:
 * 1. Upload a test image to Cloudinary
 * 2. Send to Make.com webhook
 * 
 * Query params:
 * - image: URL of image to test (optional, uses default test image)
 * - caption: Caption text (optional, uses default)
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  
  const imageUrl = searchParams.get('image') || 
    'https://replicate.delivery/xezq/38bEKtrTzCaLFZtvfHB6f0ilzKoAg3XzWbNMDgRl8bhj2HvVA/tmpyahxs5sk.jpg';
  const caption = searchParams.get('caption') || 
    'Test post from Mila ☀️\n\n#paris #test #milaverne';
  
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    config: {
      cloudinaryConfigured: isCloudinaryConfigured(),
      makeConfigured: isMakeConfigured(),
    },
  };
  
  // Step 1: Test Cloudinary upload
  if (isCloudinaryConfigured()) {
    console.log('[Test] Uploading to Cloudinary...');
    const uploadResult = await uploadImageFromUrl(imageUrl);
    results.cloudinary = uploadResult;
    
    if (!uploadResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Cloudinary upload failed',
        ...results,
      }, { status: 500 });
    }
  } else {
    results.cloudinary = { skipped: true, reason: 'Not configured' };
  }
  
  // Step 2: Test Make.com webhook
  if (isMakeConfigured()) {
    console.log('[Test] Publishing to Instagram via Make.com...');
    const publishResult = await publishToInstagram({
      imageUrl,
      caption,
    });
    results.make = publishResult;
    
    if (!publishResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Make.com publish failed',
        ...results,
      }, { status: 500 });
    }
  } else {
    results.make = { skipped: true, reason: 'Not configured' };
  }
  
  return NextResponse.json({
    success: true,
    message: 'Pipeline test completed!',
    ...results,
  });
}

