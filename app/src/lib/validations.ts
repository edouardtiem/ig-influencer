/**
 * Zod validation schemas for API endpoints
 * Provides type-safe input validation
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// GENERATE CONTEXTUAL ENDPOINT
// ═══════════════════════════════════════════════════════════════

export const generateContextualSchema = z.object({
  auto: z.boolean().optional(),
  locationId: z.string().optional(),
  slotId: z.enum(['morning', 'midday', 'evening']).optional(),
}).refine(
  data => data.auto || data.slotId || data.locationId,
  { message: 'Either auto=true, slotId, or locationId is required' }
);

export type GenerateContextualInput = z.infer<typeof generateContextualSchema>;

// ═══════════════════════════════════════════════════════════════
// SMART COMMENT ENDPOINT
// ═══════════════════════════════════════════════════════════════

export const smartCommentSchema = z.object({
  image: z.string().optional(),
  imageBase64: z.string().optional(),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']).optional().default('image/jpeg'),
  language: z.enum(['en', 'fr', 'auto']).optional(),
}).refine(
  data => data.image || data.imageBase64,
  { message: 'Either image or imageBase64 is required' }
);

export type SmartCommentInput = z.infer<typeof smartCommentSchema>;

// ═══════════════════════════════════════════════════════════════
// DAILY TRENDS ENDPOINT
// ═══════════════════════════════════════════════════════════════

export const dailyTrendsSchema = z.object({
  date: z.string().optional().refine(
    val => !val || !isNaN(Date.parse(val)),
    { message: 'Invalid date format' }
  ),
});

export type DailyTrendsInput = z.infer<typeof dailyTrendsSchema>;

// ═══════════════════════════════════════════════════════════════
// VALIDATION HELPER
// ═══════════════════════════════════════════════════════════════

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Validate input against a Zod schema
 * Returns a type-safe result object
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): ValidationResult<T> {
  const result = schema.safeParse(input);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  // Format error message from Zod errors
  const errorMessage = result.error.issues
    .map(issue => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ');
  
  return { success: false, error: errorMessage };
}

