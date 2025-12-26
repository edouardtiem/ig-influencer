/**
 * Fanvue OAuth - Initiate Authorization with PKCE
 * GET /api/oauth/auth
 * 
 * Redirects to Fanvue authorization page with PKCE challenge
 */

import { NextResponse } from 'next/server';
import { getAuthorizationUrl, isFanvueConfigured } from '@/lib/fanvue';
import { cookies } from 'next/headers';

export async function GET() {
  if (!isFanvueConfigured()) {
    return NextResponse.json(
      { error: 'Fanvue not configured. Set FANVUE_CLIENT_ID and FANVUE_CLIENT_SECRET.' },
      { status: 500 }
    );
  }

  // Generate random state for CSRF protection
  const state = crypto.randomUUID();
  
  // Get authorization URL with PKCE
  const { url, codeVerifier } = getAuthorizationUrl(state);
  
  console.log('[Fanvue] Starting OAuth with PKCE');
  console.log('[Fanvue] Auth URL:', url);
  
  // Store code verifier in secure HTTP-only cookie for callback
  const cookieStore = await cookies();
  cookieStore.set('fanvue_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });
  
  cookieStore.set('fanvue_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });
  
  // Redirect to Fanvue authorization
  return NextResponse.redirect(url);
}
