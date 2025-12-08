import axios from 'axios';

const BUFFER_API_URL = 'https://api.bufferapp.com/1';

interface PublishPostOptions {
  imageUrl?: string;
  imageBase64?: string;
  caption: string;
  scheduleAt?: Date;
}

interface PublishPostResult {
  success: boolean;
  updateId?: string;
  error?: string;
}

/**
 * Publish a post to Instagram via Buffer
 */
export async function publishPost(options: PublishPostOptions): Promise<PublishPostResult> {
  const { imageUrl, imageBase64, caption, scheduleAt } = options;
  
  const accessToken = process.env.BUFFER_ACCESS_TOKEN;
  const profileId = process.env.BUFFER_PROFILE_ID;
  
  if (!accessToken) {
    return { success: false, error: 'BUFFER_ACCESS_TOKEN not configured' };
  }
  
  if (!profileId) {
    return { success: false, error: 'BUFFER_PROFILE_ID not configured' };
  }
  
  // Determine image source (prefer base64 data URL, fallback to URL)
  const imageSource = imageBase64 
    ? `data:image/png;base64,${imageBase64}`
    : imageUrl;
  
  if (!imageSource) {
    return { success: false, error: 'No image provided (imageUrl or imageBase64 required)' };
  }
  
  try {
    const payload: Record<string, unknown> = {
      profile_ids: [profileId],
      text: caption,
      media: {
        photo: imageSource,
      },
    };
    
    // If schedule time provided, add it
    if (scheduleAt) {
      payload.scheduled_at = scheduleAt.toISOString();
    } else {
      // Publish now
      payload.now = true;
    }
    
    const response = await axios.post(
      `${BUFFER_API_URL}/updates/create.json`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (response.data?.success) {
      return {
        success: true,
        updateId: response.data.updates?.[0]?.id,
      };
    }
    
    return {
      success: false,
      error: response.data?.message || 'Unknown Buffer error',
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: `Buffer API error: ${error.response?.data?.message || error.message}`,
      };
    }
    return {
      success: false,
      error: `Unexpected error: ${error}`,
    };
  }
}

/**
 * Get profile info from Buffer
 */
export async function getProfileInfo(): Promise<{ ok: boolean; profile?: unknown; error?: string }> {
  const accessToken = process.env.BUFFER_ACCESS_TOKEN;
  const profileId = process.env.BUFFER_PROFILE_ID;
  
  if (!accessToken || !profileId) {
    return { ok: false, error: 'Buffer credentials not configured' };
  }
  
  try {
    const response = await axios.get(
      `${BUFFER_API_URL}/profiles/${profileId}.json`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    
    return {
      ok: true,
      profile: response.data,
    };
  } catch (error) {
    return {
      ok: false,
      error: axios.isAxiosError(error) ? error.message : 'Unknown error',
    };
  }
}

