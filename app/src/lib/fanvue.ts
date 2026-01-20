/**
 * Fanvue API Client
 * OAuth 2.0 + PKCE authentication for premium content monetization
 * 
 * Documentation: https://api.fanvue.com/docs/authentication/implementation-guide
 * 
 * Token storage: Supabase (persists across refreshes) with env vars fallback
 */

import { randomBytes, createHash, createHmac, timingSafeEqual } from 'crypto';
import { fetchWithTimeout } from './fetch-utils';
import { createClient } from '@supabase/supabase-js';

const AUTH_BASE_URL = 'https://auth.fanvue.com';
const API_BASE_URL = 'https://api.fanvue.com';
const FANVUE_TIMEOUT = 30000; // 30s timeout for Fanvue API calls

// Required scopes per Fanvue docs
const REQUIRED_SCOPES = 'openid offline_access offline';

// Supabase client for token storage
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

interface FanvueConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface FanvueTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// In-memory storage (should be persisted in production)
let cachedTokens: FanvueTokens | null = null;
let cachedCodeVerifier: string | null = null;

/**
 * Load tokens from Supabase (preferred) or environment variables (fallback)
 */
async function loadTokensFromSupabase(): Promise<FanvueTokens | null> {
  if (!supabase) {
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('service_name', 'fanvue')
      .single();
    
    if (error || !data) {
      return null;
    }
    
    // Handle expires_at as either number (Unix ms) or string (ISO date)
    const expiresAtRaw = data.expires_at;
    const expiresAt = typeof expiresAtRaw === 'number' 
      ? expiresAtRaw 
      : new Date(expiresAtRaw).getTime();
    
    console.log('[Fanvue] Tokens loaded from Supabase (expires:', new Date(expiresAt).toISOString(), ')');
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt,
    };
  } catch {
    return null;
  }
}

/**
 * Save tokens to Supabase for persistence across refreshes
 */
async function saveTokensToSupabase(tokens: FanvueTokens): Promise<boolean> {
  if (!supabase) {
    console.warn('[Fanvue] Supabase not configured - tokens will not persist');
    return false;
  }
  
  try {
    const { error } = await supabase
      .from('oauth_tokens')
      .upsert({
        service_name: 'fanvue',
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: tokens.expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'service_name' });
    
    if (error) {
      console.error('[Fanvue] Failed to save tokens to Supabase:', error.message);
      return false;
    }
    
    console.log('[Fanvue] Tokens saved to Supabase');
    return true;
  } catch (err) {
    console.error('[Fanvue] Error saving tokens:', err);
    return false;
  }
}

/**
 * Initialize tokens from Supabase (preferred) or environment variables (fallback)
 * For Vercel/GitHub Actions - tries Supabase first, then env vars
 */
export async function initTokensFromEnv(): Promise<boolean> {
  // First, try Supabase
  const supabaseTokens = await loadTokensFromSupabase();
  if (supabaseTokens) {
    cachedTokens = supabaseTokens;
    return true;
  }
  
  // Fallback to environment variables
  const accessToken = process.env.FANVUE_ACCESS_TOKEN;
  const refreshToken = process.env.FANVUE_REFRESH_TOKEN;
  
  if (accessToken && refreshToken) {
    cachedTokens = {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + (3600 * 1000), // Assume 1h validity, will refresh if needed
    };
    console.log('[Fanvue] Tokens initialized from environment variables');
    return true;
  }
  return false;
}

// ===========================================
// PKCE HELPERS
// ===========================================

function base64URLEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Generate PKCE code verifier (43-128 characters)
 */
export function generateCodeVerifier(): string {
  return base64URLEncode(randomBytes(32));
}

/**
 * Generate PKCE code challenge from verifier
 */
export function generateCodeChallenge(verifier: string): string {
  return base64URLEncode(
    createHash('sha256').update(verifier).digest()
  );
}

/**
 * Store code verifier for later use in token exchange
 */
export function setCodeVerifier(verifier: string): void {
  cachedCodeVerifier = verifier;
}

/**
 * Get stored code verifier
 */
export function getCodeVerifier(): string | null {
  return cachedCodeVerifier;
}

// ===========================================
// CONFIG
// ===========================================

function getConfig(): FanvueConfig {
  const clientId = process.env.FANVUE_CLIENT_ID;
  const clientSecret = process.env.FANVUE_CLIENT_SECRET;
  const redirectUri = process.env.FANVUE_REDIRECT_URI || 'https://ig-influencer.vercel.app/api/oauth/callback';
  
  // User scopes + required system scopes
  const userScopes = process.env.FANVUE_SCOPES || 'read:chat read:creator read:fan read:insights read:media read:post read:self write:chat write:creator write:media write:post';
  const scopes = `${REQUIRED_SCOPES} ${userScopes}`;

  if (!clientId || !clientSecret) {
    throw new Error('Fanvue credentials not configured. Set FANVUE_CLIENT_ID and FANVUE_CLIENT_SECRET');
  }

  return { clientId, clientSecret, redirectUri, scopes };
}

export function isFanvueConfigured(): boolean {
  return !!(process.env.FANVUE_CLIENT_ID && process.env.FANVUE_CLIENT_SECRET);
}

// ===========================================
// OAUTH 2.0 + PKCE FLOW
// ===========================================

/**
 * Generate OAuth authorization URL with PKCE
 * Returns { url, codeVerifier } - store codeVerifier for token exchange
 */
export function getAuthorizationUrl(state?: string): { url: string; codeVerifier: string } {
  const config = getConfig();
  
  // Generate PKCE values
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    ...(state && { state }),
  });

  // Correct endpoint: /oauth2/auth (not /oauth/authorize)
  const url = `${AUTH_BASE_URL}/oauth2/auth?${params.toString()}`;
  
  return { url, codeVerifier };
}

/**
 * Exchange authorization code for access tokens (with PKCE)
 */
export async function exchangeCodeForTokens(code: string, codeVerifier: string): Promise<FanvueTokens> {
  const config = getConfig();
  
  console.log('[Fanvue] Exchanging authorization code for tokens...');

  // Use client_secret_basic auth (credentials in Authorization header)
  const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  // Correct endpoint: /oauth2/token (not /oauth/token)
  const response = await fetchWithTimeout(`${AUTH_BASE_URL}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
      code_verifier: codeVerifier, // PKCE required
    }).toString(),
    timeout: FANVUE_TIMEOUT,
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
 * IMPORTANT: Saves new tokens to Supabase for persistence (token rotation)
 */
export async function refreshAccessToken(refreshToken: string): Promise<FanvueTokens> {
  const config = getConfig();
  
  console.log('[Fanvue] Refreshing access token...');

  // Use client_secret_basic auth (credentials in Authorization header)
  const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  const response = await fetchWithTimeout(`${AUTH_BASE_URL}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
    timeout: FANVUE_TIMEOUT,
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
  
  // CRITICAL: Save new tokens to Supabase for next request (token rotation)
  await saveTokensToSupabase(tokens);
  
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

export function setTokens(tokens: FanvueTokens): void {
  cachedTokens = tokens;
}

export function getTokens(): FanvueTokens | null {
  return cachedTokens;
}

// ===========================================
// API CALLS
// ===========================================

interface FanvueApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
}

async function fanvueApi<T>(endpoint: string, options: FanvueApiOptions = {}): Promise<T> {
  const accessToken = await getValidAccessToken();
  
  const fetchOptions: RequestInit = {
    method: options.method || 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Fanvue-API-Version': '2025-06-26', // Required by Fanvue API
    },
  };
  
  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }
  
  const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    timeout: FANVUE_TIMEOUT,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Fanvue API error (${response.status}): ${error}`);
  }

  return response.json();
}

export async function getProfile(): Promise<unknown> {
  return fanvueApi('/creator');
}

interface UpdateProfileParams {
  bio?: string;
  display_name?: string;
  username?: string;
}

export async function updateProfile(params: UpdateProfileParams): Promise<unknown> {
  console.log('[Fanvue] Updating profile...');
  return fanvueApi('/creator', {
    method: 'PATCH',
    body: params,
  });
}

export async function getAnalytics(): Promise<unknown> {
  return fanvueApi('/analytics');
}

interface CreatePostParams {
  content: string;
  media_urls?: string[];
  is_premium?: boolean;
  price?: number;
  scheduled_at?: string;
}

export async function createPost(params: CreatePostParams): Promise<unknown> {
  console.log('[Fanvue] Creating post...');
  return fanvueApi('/posts', {
    method: 'POST',
    body: params,
  });
}

export async function getPosts(): Promise<unknown> {
  return fanvueApi('/posts');
}

export async function checkStatus(): Promise<{ ok: boolean; error?: string; profile?: unknown }> {
  if (!isFanvueConfigured()) {
    return { ok: false, error: 'Fanvue credentials not configured' };
  }

  if (!cachedTokens) {
    return { ok: false, error: 'OAuth not completed. Visit /api/oauth/auth to authorize.' };
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

// ===========================================
// MESSAGING
// ===========================================

interface SendMessageParams {
  chatId: string;
  text: string;
  mediaUrls?: string[];
  // PPV support
  price?: number;      // Price in cents (299 = 2.99€) - makes message a PPV
  isLocked?: boolean;  // true = requires payment to view media
}

/**
 * Send a message to a user via Fanvue chat
 * Supports both free messages and PPV (pay-per-view) messages
 * 
 * @param params.chatId - Chat ID to send message to
 * @param params.text - Message text
 * @param params.mediaUrls - Optional media URLs (images)
 * @param params.price - Optional price in cents for PPV (e.g., 299 = 2.99€)
 * @param params.isLocked - If true with price, media is locked until payment
 */
export async function sendMessage(params: SendMessageParams): Promise<unknown> {
  const price = params.price;
  const isPPV = price && price > 0;
  
  console.log(`[Fanvue] Sending ${isPPV ? 'PPV' : 'free'} message to user ${params.chatId}${isPPV ? ` (${price / 100}€)` : ''}...`);
  
  const body: Record<string, unknown> = {
    text: params.text,
  };
  
  // Note: API uses mediaUuids (not media_urls) per 2026 documentation
  if (params.mediaUrls && params.mediaUrls.length > 0) {
    body.mediaUuids = params.mediaUrls; // Changed from media_urls to mediaUuids
  }
  
  // PPV message configuration
  if (isPPV) {
    body.price = price;
    // Note: is_locked is not in the 2026 API docs, price alone makes it PPV
  }
  
  // Correct endpoint: /chats/:userUuid/message (singular, not plural)
  return fanvueApi(`/chats/${params.chatId}/message`, {
    method: 'POST',
    body,
  });
}

/**
 * Send a PPV (pay-per-view) message with locked media
 * Convenience function for PPV messages
 */
export async function sendPPVMessage(params: {
  chatId: string;
  text: string;
  mediaUrls: string[];
  price: number;  // Price in cents
}): Promise<unknown> {
  if (!params.mediaUrls || params.mediaUrls.length === 0) {
    throw new Error('PPV messages must include at least one media URL');
  }
  if (!params.price || params.price < 100) {
    throw new Error('PPV price must be at least 100 cents (1€)');
  }
  
  return sendMessage({
    chatId: params.chatId,
    text: params.text,
    mediaUrls: params.mediaUrls,
    price: params.price,
    isLocked: true,
  });
}

/**
 * Start a new chat with a user (for welcome DMs)
 * Returns the chat ID to use for sending messages
 */
export async function startChat(userId: string): Promise<{ chatId: string }> {
  console.log(`[Fanvue] Starting chat with user ${userId}...`);
  
  const result = await fanvueApi<{ uuid: string }>('/chats', {
    method: 'POST',
    body: { user_id: userId },
  });
  
  return { chatId: result.uuid };
}

/**
 * Send a welcome DM to a new follower
 * Combines startChat + sendMessage
 */
export async function sendWelcomeDM(
  userId: string, 
  message: string, 
  photoUrl?: string
): Promise<{ success: boolean; chatId?: string; error?: string }> {
  try {
    // Start or get chat with user
    const { chatId } = await startChat(userId);
    
    // Send welcome message with optional photo
    await sendMessage({
      chatId,
      text: message,
      mediaUrls: photoUrl ? [photoUrl] : undefined,
    });
    
    console.log(`[Fanvue] Welcome DM sent to user ${userId}`);
    return { success: true, chatId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Fanvue] Failed to send welcome DM: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

// ===========================================
// WEBHOOK VERIFICATION
// ===========================================

/**
 * Verify Fanvue webhook signature
 * 
 * Fanvue signature format: "t=<timestamp>,v0=<signature>"
 * - t: Unix timestamp (seconds) when request was signed
 * - v0: HMAC-SHA256 signature of "{timestamp}.{body}"
 * 
 * @param payload - Raw request body
 * @param signatureHeader - X-Fanvue-Signature header value
 * @param secret - Webhook signing secret from Fanvue Developer Portal
 * @param toleranceSeconds - Max age of signature (default 5 minutes)
 */
export function verifyWebhookSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
  toleranceSeconds: number = 300
): boolean {
  try {
    // Parse the signature header: "t=1234567890,v0=abc123..."
    const parts = signatureHeader.split(',');
    const timestampPart = parts.find(p => p.startsWith('t='));
    const signaturePart = parts.find(p => p.startsWith('v0='));
    
    if (!timestampPart || !signaturePart) {
      console.error('[Fanvue] Invalid signature format - missing t= or v0=');
      return false;
    }
    
    const timestamp = parseInt(timestampPart.slice(2), 10);
    const providedSignature = signaturePart.slice(3);
    
    // Check timestamp is recent (prevent replay attacks)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > toleranceSeconds) {
      console.error('[Fanvue] Signature timestamp too old:', now - timestamp, 'seconds');
      return false;
    }
    
    // Compute expected signature: HMAC-SHA256("{timestamp}.{body}")
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');
    
    // Timing-safe comparison to prevent timing attacks
    const providedBuffer = Buffer.from(providedSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    
    if (providedBuffer.length !== expectedBuffer.length) {
      return false;
    }
    
    return timingSafeEqual(providedBuffer, expectedBuffer);
  } catch (error) {
    console.error('[Fanvue] Signature verification error:', error);
    return false;
  }
}
