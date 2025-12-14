import { NextResponse } from 'next/server';
import { uploadImageFromUrl, isCloudinaryConfigured } from '@/lib/cloudinary';
import { postSingleImage, checkInstagramConnection } from '@/lib/instagram';

/**
 * GET /api/test-publish
 * 
 * Test the full publishing pipeline:
 * 1. Upload a test image to Cloudinary
 * 2. Publish to Instagram via Graph API
 * 
 * Query params:
 * - image: URL of image to test (optional, uses default test image)
 * - caption: Caption text (optional, uses default)
 * - dryrun: If true, only tests config without publishing
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  
  const imageUrl = searchParams.get('image') || 
    'https://replicate.delivery/xezq/38bEKtrTzCaLFZtvfHB6f0ilzKoAg3XzWbNMDgRl8bhj2HvVA/tmpyahxs5sk.jpg';
  const caption = searchParams.get('caption') || 
    'Test post from Mila ☀️\n\n#paris #test #milaverne';
  const isDryRun = searchParams.get('dryrun') === 'true';
  
  // Check Instagram connection
  const instagramCheck = await checkInstagramConnection();
  
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    config: {
      cloudinaryConfigured: isCloudinaryConfigured(),
      instagramConfigured: instagramCheck.ok,
      instagramAccount: instagramCheck.accountName,
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
  
  // Step 2: Publish to Instagram
  if (isDryRun) {
    results.instagram = { skipped: true, reason: 'Dry run mode' };
  } else if (instagramCheck.ok) {
    console.log('[Test] Publishing to Instagram...');
    const publishResult = await postSingleImage(imageUrl, caption);
    results.instagram = publishResult;
    
    if (!publishResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Instagram publish failed',
        ...results,
      }, { status: 500 });
    }
  } else {
    results.instagram = { skipped: true, reason: instagramCheck.error || 'Not configured' };
  }
  
  return NextResponse.json({
    success: true,
    message: 'Pipeline test completed!',
    ...results,
  });
}

