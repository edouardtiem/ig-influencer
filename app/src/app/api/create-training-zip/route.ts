import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

/**
 * POST /api/create-training-zip
 * Download selected images and create a ZIP for LoRA training
 * 
 * Body: { imageUrls: string[] }
 */

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageUrls } = body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'imageUrls array is required' },
        { status: 400 }
      );
    }

    console.log('[Create ZIP] Processing', imageUrls.length, 'images...');

    // Download all images and upload to Cloudinary
    const uploadedImages: string[] = [];

    for (const [index, url] of imageUrls.entries()) {
      try {
        console.log(`[Create ZIP] Downloading ${index + 1}/${imageUrls.length}...`);
        
        // Fetch image
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`[Create ZIP] Failed to fetch ${url}`);
          continue;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        const dataUri = `data:image/jpeg;base64,${base64}`;

        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(dataUri, {
          folder: 'lora-training',
          public_id: `mila_training_${Date.now()}_${index}`,
          resource_type: 'image',
        });

        uploadedImages.push(uploadResult.secure_url);
        console.log(`[Create ZIP] ✅ Uploaded ${index + 1}/${imageUrls.length}`);

      } catch (error) {
        console.error(`[Create ZIP] Error processing image ${index}:`, error);
      }
    }

    if (uploadedImages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No images could be processed' },
        { status: 500 }
      );
    }

    // Create a ZIP archive URL
    // Note: Replicate training accepts either:
    // 1. A ZIP URL
    // 2. Multiple image URLs
    // We'll return the array of URLs for now, as Replicate can handle that
    
    // For Replicate, we need to create a text file with all URLs
    // Or we can pass the URLs array directly to the training endpoint
    
    console.log('[Create ZIP] Successfully processed', uploadedImages.length, 'images');

    // Return a JSON file URL with all image URLs
    // This can be used by Replicate training
    const manifestData = {
      images: uploadedImages,
      count: uploadedImages.length,
      created_at: new Date().toISOString(),
    };

    // Upload manifest to Cloudinary as a raw file
    const manifestBuffer = Buffer.from(JSON.stringify(manifestData, null, 2));
    const manifestBase64 = manifestBuffer.toString('base64');
    const manifestDataUri = `data:application/json;base64,${manifestBase64}`;

    const manifestUpload = await cloudinary.uploader.upload(manifestDataUri, {
      folder: 'lora-training',
      public_id: `manifest_${Date.now}`,
      resource_type: 'raw',
    });

    return NextResponse.json({
      success: true,
      imageCount: uploadedImages.length,
      images: uploadedImages,
      manifestUrl: manifestUpload.secure_url,
      // For Replicate, we'll use the images array directly
      zipUrl: manifestUpload.secure_url, // This is actually a manifest, but we'll handle it in train-lora
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Create ZIP] Error:', error);
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

