// Content Types
export type ContentType = 'lifestyle' | 'fitness' | 'summer' | 'sexy_light' | 'sexy_medium' | 'casual' | 'glam';

export interface ContentTemplate {
  type: ContentType;
  clothing: string;
  pose: string;
  setting: string;
  captions: string[];
  hashtags: string[];
}

// Nanobanana API Types
export interface NanobananGenerateRequest {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
}

export interface NanobananGenerateResponse {
  success: boolean;
  image_url?: string;
  error?: string;
}

// Buffer API Types
export interface BufferCreatePostRequest {
  profile_ids: string[];
  text: string;
  media: {
    photo: string;
  };
  scheduled_at?: string;
}

export interface BufferCreatePostResponse {
  success: boolean;
  updates?: Array<{
    id: string;
    status: string;
  }>;
  error?: string;
}

// Auto Post Response
export interface AutoPostResult {
  success: boolean;
  imageUrl?: string;
  caption?: string;
  bufferId?: string;
  error?: string;
  timestamp: string;
}

