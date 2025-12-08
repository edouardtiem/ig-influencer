/**
 * Make.com integration for Instagram publishing
 * Uploads image to Cloudinary, then sends to Make.com webhook → Buffer → Instagram
 */

import { uploadImageFromUrl, isCloudinaryConfigured } from './cloudinary';

interface PublishToInstagramOptions {
  imageUrl: string;
  caption: string;
}

interface PublishResult {
  success: boolean;
  cloudinaryUrl?: string;
  error?: string;
}

/**
 * Get the Make.com webhook URL from environment
 */
function getWebhookUrl(): string {
  const url = process.env.MAKE_WEBHOOK_URL;
  if (!url) {
    throw new Error('MAKE_WEBHOOK_URL not configured');
  }
  return url;
}

/**
 * Publish a post to Instagram via Make.com webhook
 * First uploads image to Cloudinary for a permanent URL
 */
export async function publishToInstagram(options: PublishToInstagramOptions): Promise<PublishResult> {
  const { imageUrl, caption } = options;
  
  try {
    // Step 1: Upload to Cloudinary for permanent URL
    let finalImageUrl = imageUrl;
    
    if (isCloudinaryConfigured()) {
      console.log('[Make.com] Uploading to Cloudinary first...');
      const uploadResult = await uploadImageFromUrl(imageUrl);
      
      if (!uploadResult.success || !uploadResult.url) {
        console.error('[Make.com] Cloudinary upload failed:', uploadResult.error);
        return {
          success: false,
          error: `Cloudinary upload failed: ${uploadResult.error}`,
        };
      }
      
      finalImageUrl = uploadResult.url;
      console.log('[Make.com] Using Cloudinary URL:', finalImageUrl);
    } else {
      console.warn('[Make.com] Cloudinary not configured, using original URL');
    }
    
    // Step 2: Send to Make.com webhook
    const webhookUrl = getWebhookUrl();
    
    console.log('[Make.com] Sending post to webhook...');
    console.log('[Make.com] Image:', finalImageUrl);
    console.log('[Make.com] Caption:', caption.slice(0, 50) + '...');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: finalImageUrl,
        caption: caption,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Make.com] Webhook error:', response.status, errorText);
      return {
        success: false,
        cloudinaryUrl: finalImageUrl,
        error: `Webhook returned ${response.status}: ${errorText}`,
      };
    }
    
    console.log('[Make.com] Post sent successfully!');
    return { 
      success: true,
      cloudinaryUrl: finalImageUrl,
    };
    
  } catch (error) {
    console.error('[Make.com] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check if Make.com is configured
 */
export function isMakeConfigured(): boolean {
  return !!process.env.MAKE_WEBHOOK_URL;
}

/**
 * Check Make.com webhook status (basic connectivity test)
 */
export async function checkMakeStatus(): Promise<{ ok: boolean; error?: string }> {
  if (!isMakeConfigured()) {
    return { ok: false, error: 'MAKE_WEBHOOK_URL not configured' };
  }
  
  // Make.com webhooks are always "ready" if configured
  // We can't really test them without triggering the scenario
  return { ok: true };
}

