import { NextResponse } from 'next/server';
import { getBasePortraits } from '@/config/base-portraits';

/**
 * GET /api/current-references
 * 
 * Returns the currently configured reference portraits
 */
export async function GET(): Promise<NextResponse> {
  const { primaryFaceUrl, referenceUrls } = getBasePortraits();
  
  return NextResponse.json({
    primary: primaryFaceUrl,
    references: referenceUrls,
    all: [primaryFaceUrl, ...referenceUrls],
    source: process.env.MILA_BASE_FACE_URL ? 'env' : 'defaults',
  });
}

