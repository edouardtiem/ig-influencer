/**
 * Base portraits configuration for Mila
 * These are used for face consistency via face swap
 */

export interface BasePortraitConfig {
  primaryFaceUrl: string;
  referenceUrls: string[];
}

/**
 * Get base portrait URLs from environment or defaults
 */
export function getBasePortraits(): BasePortraitConfig {
  const primaryFaceUrl = process.env.MILA_BASE_FACE_URL || 
    'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png';
  
  const referenceUrlsString = process.env.MILA_REFERENCE_URLS || '';
  const referenceUrls = referenceUrlsString 
    ? referenceUrlsString.split(',').map(url => url.trim()).filter(Boolean)
    : [
        'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_2_q8kxit.png',
        'https://res.cloudinary.com/dily60mr0/image/upload/v1764767098/Photo_3_nopedx.png',
        'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_4_pna4fo.png',
        'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_5_kyx12v.png',
        'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_6_i5rdpa.png',
      ];
  
  return { primaryFaceUrl, referenceUrls };
}


