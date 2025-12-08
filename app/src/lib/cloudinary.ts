/**
 * Cloudinary service for permanent image hosting
 * Uploads images from Replicate URLs to Cloudinary for use with Buffer
 */

import { v2 as cloudinary } from 'cloudinary';

let isConfigured = false;

/**
 * Configure Cloudinary with environment variables
 */
function ensureConfigured(): void {
  if (isConfigured) return;
  
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  }
  
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  
  isConfigured = true;
}

interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

/**
 * Upload an image from URL to Cloudinary
 * Returns a permanent public URL
 */
export async function uploadImageFromUrl(imageUrl: string): Promise<UploadResult> {
  try {
    ensureConfigured();
    
    console.log('[Cloudinary] Uploading image from URL...');
    console.log('[Cloudinary] Source:', imageUrl.slice(0, 80) + '...');
    
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'mila-verne',
      resource_type: 'image',
      unique_filename: true,
    });
    
    console.log('[Cloudinary] Upload successful!');
    console.log('[Cloudinary] Public URL:', result.secure_url);
    
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
    
  } catch (error) {
    console.error('[Cloudinary] Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check if Cloudinary is configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Check Cloudinary status
 */
export async function checkCloudinaryStatus(): Promise<{ ok: boolean; error?: string }> {
  if (!isCloudinaryConfigured()) {
    return { ok: false, error: 'Cloudinary credentials not configured' };
  }
  
  try {
    ensureConfigured();
    // Simple ping - get account info
    await cloudinary.api.ping();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

