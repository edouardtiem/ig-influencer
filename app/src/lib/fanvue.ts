/**
 * Fanvue API Client
 * OAuth 2.0 authentication and API integration for premium content monetization
 * 
 * Documentation: https://api.fanvue.com/docs
 */

const AUTH_BASE_URL = 'https://auth.fanvue.com';
const API_BASE_URL = 'https://api.fanvue.com';

interface FanvueConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface FanvueTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// In-memory token storage (should be persisted in production)
let cachedTokens: FanvueTokens | null = null;

/**
 * Get Fanvue configuration from environment variables
 */
function getConfig(): FanvueConfig {
  const clientId = process.env.FANVUE_CLIENT_ID;
  const clientSecret = process.env.FANVUE_CLIENT_SECRET;
  
  // Default to production URL, can be overridden for local dev
  const redirectUri = process.env.FANVUE_REDIRECT_URI || 'https://ig-influencer.vercel.app/api/oauth/callback';
  const scopes = process.env.FANVUE_SCOPES || 'read:chat read:creator read:fan read:insights read:media read:post read:self write:chat write:creator write:media write:post';

  if (!clientId || !clientSecret) {
    throw new Error('Fanvue credentials not configured. Set FANVUE_CLIENT_ID and FANVUE_CLIENT_SECRET');
  }

  return { clientId, clientSecret, redirectUri, scopes };
}

/**
 * Check if Fanvue is configured
 */
export function isFanvueConfigured(): boolean {
  return !!(process.env.FANVUE_CLIENT_ID && process.env.FANVUE_CLIENT_SECRET);
}

/**
 * Generate OAuth authorization URL
 * Redirect user here to start OAuth flow
 */
export function getAuthorizationUrl(state?: string): string {
  const config = getConfig();
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes,
    ...(state && { state }),
  });

  return `${AUTH_BASE_URL}/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<FanvueTokens> {
  const config = getConfig();
  
  console.log('[Fanvue] Exchanging authorization code for tokens...');

  const response = await fetch(`${AUTH_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Fanvue] Token exchange failed:', error);
    throw new Error(`Failed to exchange code: ${error}`);
  }

  const data: TokenResponse = await response.json();
  
  const tokens: FanvueTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };

  cachedTokens = tokens;
  console.log('[Fanvue] Tokens obtained successfully');
  
  return tokens;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<FanvueTokens> {
  const config = getConfig();
  
  console.log('[Fanvue] Refreshing access token...');

  const response = await fetch(`${AUTH_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Fanvue] Token refresh failed:', error);
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data: TokenResponse = await response.json();
  
  const tokens: FanvueTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };

  cachedTokens = tokens;
  console.log('[Fanvue] Token refreshed successfully');
  
  return tokens;
}

/**
 * Get valid access token (refreshes if needed)
 */
export async function getValidAccessToken(): Promise<string> {
  if (!cachedTokens) {
    throw new Error('No Fanvue tokens available. Complete OAuth flow first.');
  }

  // Refresh if token expires in less than 5 minutes
  if (cachedTokens.expiresAt - Date.now() < 5 * 60 * 1000) {
    await refreshAccessToken(cachedTokens.refreshToken);
  }

  return cachedTokens.accessToken;
}

/**
 * Set tokens manually (e.g., from database)
 */
export function setTokens(tokens: FanvueTokens): void {
  cachedTokens = tokens;
}

/**
 * Get current tokens
 */
export function getTokens(): FanvueTokens | null {
  return cachedTokens;
}

// ===========================================
// API CALLS
// ===========================================

interface FanvueApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
}

/**
 * Make authenticated API call to Fanvue
 */
async function fanvueApi<T>(endpoint: string, options: FanvueApiOptions = {}): Promise<T> {
  const accessToken = await getValidAccessToken();
  
  const fetchOptions: RequestInit = {
    method: options.method || 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };
  
  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Fanvue API error (${response.status}): ${error}`);
  }

  return response.json();
}

/**
 * Get creator profile information
 */
export async function getProfile(): Promise<unknown> {
  return fanvueApi('/v1/me');
}

/**
 * Get creator analytics
 */
export async function getAnalytics(): Promise<unknown> {
  return fanvueApi('/v1/analytics');
}

interface CreatePostParams {
  content: string;
  media_urls?: string[];
  is_premium?: boolean;
  price?: number;
  scheduled_at?: string;
}

/**
 * Create a new post on Fanvue
 */
export async function createPost(params: CreatePostParams): Promise<unknown> {
  console.log('[Fanvue] Creating post...');
  return fanvueApi('/v1/posts', {
    method: 'POST',
    body: params,
  });
}

/**
 * Get list of posts
 */
export async function getPosts(): Promise<unknown> {
  return fanvueApi('/v1/posts');
}

/**
 * Check Fanvue connection status
 */
export async function checkStatus(): Promise<{ ok: boolean; error?: string; profile?: unknown }> {
  if (!isFanvueConfigured()) {
    return { ok: false, error: 'Fanvue credentials not configured' };
  }

  if (!cachedTokens) {
    return { ok: false, error: 'OAuth not completed. Visit /api/fanvue/auth to authorize.' };
  }

  try {
    const profile = await getProfile();
    return { ok: true, profile };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

