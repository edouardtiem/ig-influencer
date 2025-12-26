/**
 * Fanvue OAuth - Callback Handler with PKCE
 * GET /api/oauth/callback
 * 
 * Handles OAuth callback and exchanges code for tokens using PKCE
 */

import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, isFanvueConfigured } from '@/lib/fanvue';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  if (!isFanvueConfigured()) {
    return NextResponse.json(
      { error: 'Fanvue not configured' },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle authorization errors
  if (error) {
    console.error('[Fanvue] OAuth error:', error, errorDescription);
    return NextResponse.json(
      { 
        error: 'Authorization failed',
        details: errorDescription || error,
      },
      { status: 400 }
    );
  }

  // Validate code
  if (!code) {
    return NextResponse.json(
      { error: 'Missing authorization code' },
      { status: 400 }
    );
  }

  // Get code verifier from cookie
  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get('fanvue_code_verifier')?.value;
  const savedState = cookieStore.get('fanvue_oauth_state')?.value;

  // Validate state (CSRF protection)
  if (state && savedState && state !== savedState) {
    console.error('[Fanvue] State mismatch - possible CSRF attack');
    return NextResponse.json(
      { error: 'Invalid state parameter' },
      { status: 400 }
    );
  }

  if (!codeVerifier) {
    console.error('[Fanvue] Missing code verifier - OAuth session expired?');
    return NextResponse.json(
      { error: 'OAuth session expired. Please try again.' },
      { status: 400 }
    );
  }

  try {
    // Exchange code for tokens with PKCE verifier
    const tokens = await exchangeCodeForTokens(code, codeVerifier);
    
    console.log('[Fanvue] OAuth completed successfully');
    
    // Clear OAuth cookies
    cookieStore.delete('fanvue_code_verifier');
    cookieStore.delete('fanvue_oauth_state');
    
    // Return success page
    return new NextResponse(
      `<!DOCTYPE html>
<html>
<head>
  <title>Fanvue Connected</title>
  <style>
    body { 
      font-family: system-ui, -apple-system, sans-serif; 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      height: 100vh; 
      margin: 0;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white;
    }
    .container { 
      text-align: center; 
      padding: 2rem;
      background: rgba(255,255,255,0.1);
      border-radius: 16px;
      backdrop-filter: blur(10px);
    }
    .success { color: #4ade80; font-size: 4rem; margin-bottom: 1rem; }
    h1 { margin: 0 0 1rem 0; }
    p { color: #94a3b8; }
    .info { 
      margin-top: 1.5rem; 
      padding: 1rem; 
      background: rgba(0,0,0,0.3); 
      border-radius: 8px;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="success">✓</div>
    <h1>Fanvue Connecté!</h1>
    <p>Ton compte Fanvue est maintenant lié.</p>
    <div class="info">
      <strong>Token expires:</strong> ${new Date(tokens.expiresAt).toLocaleString()}
    </div>
  </div>
</body>
</html>`,
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  } catch (err) {
    console.error('[Fanvue] Token exchange error:', err);
    return NextResponse.json(
      { 
        error: 'Failed to exchange authorization code',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
