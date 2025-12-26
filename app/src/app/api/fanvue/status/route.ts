/**
 * Fanvue Status Check
 * GET /api/fanvue/status
 * 
 * Returns connection status and profile info if connected
 */

import { NextResponse } from 'next/server';
import { checkStatus, isFanvueConfigured, getTokens } from '@/lib/fanvue';

export async function GET() {
  // Check if configured
  if (!isFanvueConfigured()) {
    return NextResponse.json({
      configured: false,
      connected: false,
      error: 'Fanvue not configured. Set FANVUE_CLIENT_ID and FANVUE_CLIENT_SECRET in .env.local',
      authUrl: null,
    });
  }

  // Check if we have tokens
  const tokens = getTokens();
  if (!tokens) {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    return NextResponse.json({
      configured: true,
      connected: false,
      error: 'OAuth not completed',
      authUrl: `${baseUrl}/api/fanvue/auth`,
    });
  }

  // Check actual connection
  const status = await checkStatus();
  
  return NextResponse.json({
    configured: true,
    connected: status.ok,
    error: status.error || null,
    profile: status.profile || null,
    tokenExpiresAt: tokens.expiresAt,
  });
}

