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
    
    // Return success page with tokens displayed for copying
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
      min-height: 100vh; 
      margin: 0;
      padding: 1rem;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white;
    }
    .container { 
      text-align: center; 
      padding: 2rem;
      background: rgba(255,255,255,0.1);
      border-radius: 16px;
      backdrop-filter: blur(10px);
      max-width: 800px;
      width: 100%;
    }
    .success { color: #4ade80; font-size: 4rem; margin-bottom: 1rem; }
    h1 { margin: 0 0 1rem 0; }
    p { color: #94a3b8; }
    .token-box {
      margin-top: 1.5rem;
      padding: 1rem;
      background: rgba(0,0,0,0.5);
      border-radius: 8px;
      text-align: left;
      font-family: monospace;
      font-size: 0.75rem;
      word-break: break-all;
      user-select: all;
    }
    .token-label {
      color: #4ade80;
      font-weight: bold;
      display: block;
      margin-bottom: 0.5rem;
    }
    .token-value {
      color: #fbbf24;
      display: block;
      margin-bottom: 1rem;
      padding: 0.5rem;
      background: rgba(0,0,0,0.3);
      border-radius: 4px;
    }
    .instructions {
      margin-top: 1rem;
      padding: 1rem;
      background: rgba(74, 222, 128, 0.1);
      border: 1px solid rgba(74, 222, 128, 0.3);
      border-radius: 8px;
      color: #94a3b8;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="success">✓</div>
    <h1>Fanvue Connecté!</h1>
    <p>Copie ces tokens et ajoute-les à ton .env.local et GitHub Secrets</p>
    
    <div class="token-box">
      <span class="token-label">FANVUE_ACCESS_TOKEN=</span>
      <span class="token-value">${tokens.accessToken}</span>
      
      <span class="token-label">FANVUE_REFRESH_TOKEN=</span>
      <span class="token-value">${tokens.refreshToken}</span>
    </div>
    
    <div class="instructions">
      <strong>📋 Actions:</strong><br>
      1. Copie ces lignes dans <code>.env.local</code><br>
      2. Ajoute-les aussi dans <strong>GitHub Secrets</strong><br>
      3. Token expire: ${new Date(tokens.expiresAt).toLocaleString()}
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
