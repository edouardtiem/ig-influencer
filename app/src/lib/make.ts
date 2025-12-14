/**
 * Make.com Integration Stub
 * 
 * This file provides compatibility for legacy code that referenced Make.com
 * The actual publishing now goes through Instagram Graph API directly
 */

import { postCarousel, postSingleImage } from './instagram';

interface PublishOptions {
  imageUrl: string;
  caption: string;
  imageUrls?: string[];
}

interface PublishResult {
  success: boolean;
  error?: string;
  cloudinaryUrl?: string;
  postId?: string;
}

/**
 * Publish to Instagram (via Graph API, not Make.com)
 */
export async function publishToInstagram(options: PublishOptions): Promise<PublishResult> {
  try {
    // If multiple images, use carousel
    if (options.imageUrls && options.imageUrls.length > 1) {
      const result = await postCarousel(options.imageUrls, options.caption);
      return {
        success: result.success,
        error: result.error,
        postId: result.postId,
      };
    }
    
    // Single image
    const result = await postSingleImage(options.imageUrl, options.caption);
    return {
      success: result.success,
      error: result.error,
      postId: result.postId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if Make.com is configured (legacy - always returns false)
 */
export function isMakeConfigured(): boolean {
  // Instagram Graph API is used instead
  return !!(process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_ACCOUNT_ID);
}

/**
 * Check Make.com status (legacy stub)
 */
export async function checkMakeStatus(): Promise<{ ok: boolean; error?: string }> {
  const configured = isMakeConfigured();
  return {
    ok: configured,
    error: configured ? undefined : 'Instagram API not configured',
  };
}
