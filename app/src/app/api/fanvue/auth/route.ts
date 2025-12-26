/**
 * Fanvue OAuth - Initiate Authorization
 * GET /api/fanvue/auth
 * 
 * Redirects to Fanvue authorization page to start OAuth flow
 */

import { NextResponse } from 'next/server';
import { getAuthorizationUrl, isFanvueConfigured } from '@/lib/fanvue';

export async function GET() {
  if (!isFanvueConfigured()) {
    return NextResponse.json(
      { error: 'Fanvue not configured. Set FANVUE_CLIENT_ID and FANVUE_CLIENT_SECRET.' },
      { status: 500 }
    );
  }

  // Generate random state for CSRF protection
  const state = crypto.randomUUID();
  
  // Get authorization URL
  const authUrl = getAuthorizationUrl(state);
  
  // Redirect to Fanvue authorization
  return NextResponse.redirect(authUrl);
}

