/**
 * Fanvue Re-engagement System
 * 
 * Sends personalized re-engagement messages to users who haven't messaged in 24h+
 * Only sends during evening hours (21h-1h) in user's local timezone
 */

import { supabase } from './supabase';
import { sendMessage } from './fanvue';
import { getLocalHour, FanvueUserProfile } from './fanvue-memory';
import { generateElenaFanvueResponse, VeniceMessage } from './venice';

// ===========================================
// TYPES
// ===========================================

export interface ReengagementCandidate {
  id: string;
  fanvue_user_id: string;
  fanvue_chat_id: string | null;
  username: string | null;
  stage: string;
  message_count: number;
  detected_language: string | null;
  last_user_message_at: string;
  last_reengagement_at: string | null;
  reengagement_count: number;
  profile: FanvueUserProfile | null;
}

export interface ReengagementResult {
  contactId: string;
  username: string | null;
  success: boolean;
  message?: string;
  error?: string;
}

interface ReengagementContactRow {
  id: string;
  fanvue_user_id: string;
  fanvue_chat_id: string | null;
  username: string | null;
  stage: string;
  message_count: number;
  detected_language: string | null;
  last_user_message_at: string;
  last_reengagement_at: string | null;
  reengagement_count: number;
}

// ===========================================
// CONFIGURATION
// ===========================================

// Evening window for re-engagement (user's local time)
const EVENING_START_HOUR = 21; // 9 PM
const EVENING_END_HOUR = 1;    // 1 AM (next day)

// Minimum hours since last user message
const MIN_HOURS_SINCE_MESSAGE = 24;

// Minimum hours since last re-engagement
const MIN_HOURS_SINCE_REENGAGEMENT = 24;

// Maximum re-engagements per contact
const MAX_REENGAGEMENTS = 3;

// Default timezone if not detected
const DEFAULT_TIMEZONE = 'Europe/Paris';

// ===========================================
// ELIGIBILITY CHECK
// ===========================================

/**
 * Check if current time is in evening window for user's timezone
 */
export function isInEveningWindow(timezone: string | null): boolean {
  const tz = timezone || DEFAULT_TIMEZONE;
  const hour = getLocalHour(tz);
  
  // 21h-23h or 0h-1h
  return hour >= EVENING_START_HOUR || hour < EVENING_END_HOUR;
}

/**
 * Calculate hours between two dates
 */
function hoursBetween(date1: Date, date2: Date): number {
  return Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60);
}

/**
 * Check if a contact is eligible for re-engagement
 */
export function isEligibleForReengagement(candidate: ReengagementCandidate): {
  eligible: boolean;
  reason?: string;
} {
  const now = new Date();
  
  // Must have chat ID
  if (!candidate.fanvue_chat_id) {
    return { eligible: false, reason: 'No chat ID' };
  }
  
  // Must be in warm, hot, or pitched stage
  if (!['warm', 'hot', 'pitched'].includes(candidate.stage)) {
    return { eligible: false, reason: `Stage ${candidate.stage} not eligible` };
  }
  
  // Must not exceed max re-engagements
  if (candidate.reengagement_count >= MAX_REENGAGEMENTS) {
    return { eligible: false, reason: 'Max re-engagements reached' };
  }
  
  // Check time since last user message (>= 24h)
  const lastUserMessage = new Date(candidate.last_user_message_at);
  const hoursSinceMessage = hoursBetween(now, lastUserMessage);
  
  if (hoursSinceMessage < MIN_HOURS_SINCE_MESSAGE) {
    return { eligible: false, reason: `Only ${Math.round(hoursSinceMessage)}h since last message` };
  }
  
  // Check time since last re-engagement (>= 24h)
  if (candidate.last_reengagement_at) {
    const lastReengagement = new Date(candidate.last_reengagement_at);
    const hoursSinceReengagement = hoursBetween(now, lastReengagement);
    
    if (hoursSinceReengagement < MIN_HOURS_SINCE_REENGAGEMENT) {
      return { eligible: false, reason: `Only ${Math.round(hoursSinceReengagement)}h since last re-engagement` };
    }
  }
  
  // Check if in evening window
  const timezone = candidate.profile?.timezone || null;
  if (!isInEveningWindow(timezone)) {
    const hour = getLocalHour(timezone || DEFAULT_TIMEZONE);
    return { eligible: false, reason: `Not evening (${hour}h in ${timezone || DEFAULT_TIMEZONE})` };
  }
  
  return { eligible: true };
}

// ===========================================
// MESSAGE GENERATION
// ===========================================

/**
 * Build personalized re-engagement message based on profile
 */
export async function buildReengagementMessage(
  candidate: ReengagementCandidate
): Promise<string> {
  const profile = candidate.profile;
  const language = candidate.detected_language;
  
  // Use Venice AI for personalized message
  const contextMessages: VeniceMessage[] = [
    {
      role: 'user',
      content: `Generate a short, flirty re-engagement message. The user hasn't messaged in a while. Make them want to reply. Max 15 words.`,
    },
  ];
  
  try {
    const response = await generateElenaFanvueResponse({
      messages: contextMessages,
      language,
      profile,
      stage: candidate.stage,
      messageCount: candidate.message_count,
      hasAvailablePPV: true,
    });
    
    return response;
  } catch (error) {
    // Fallback to template-based messages
    console.error('[Fanvue Re-engagement] Venice AI error, using fallback:', error);
    return buildFallbackMessage(profile, language);
  }
}

/**
 * Fallback template-based messages
 */
function buildFallbackMessage(
  profile: FanvueUserProfile | null,
  language: string | null
): string {
  // French messages
  if (language === 'fr') {
    if (profile?.tone_preference === 'dominant') {
      return "hey toi... tu m'as manqué 🖤 j'ai quelque chose à te montrer ce soir...";
    }
    if (profile?.total_spent && profile.total_spent > 0) {
      return "hey 🖤 j'ai pensé à toi... j'ai fait un nouveau shooting, encore plus intense...";
    }
    if (profile?.nickname) {
      return `coucou ${profile.nickname}... ça fait un moment 🖤 tu fais quoi ce soir?`;
    }
    return "coucou toi... ça fait un moment 🖤 tu fais quoi ce soir?";
  }
  
  // Italian messages
  if (language === 'it') {
    if (profile?.tone_preference === 'dominant') {
      return "ehi tu... mi sei mancato 🖤 ho qualcosa da mostrarti stasera...";
    }
    return "ciao tesoro... è passato un po' 🖤 cosa fai stasera?";
  }
  
  // Spanish messages
  if (language === 'es') {
    if (profile?.tone_preference === 'dominant') {
      return "hey tú... te extrañé 🖤 tengo algo que mostrarte esta noche...";
    }
    return "hola cariño... hace tiempo 🖤 qué haces esta noche?";
  }
  
  // English (default)
  if (profile?.tone_preference === 'dominant') {
    return "hey you... i missed you 🖤 i have something to show you tonight...";
  }
  if (profile?.total_spent && profile.total_spent > 0) {
    return "hey 🖤 been thinking about you... did a new shoot, even more intense...";
  }
  if (profile?.nickname) {
    return `hey ${profile.nickname}... it's been a while 🖤 what are you up to tonight?`;
  }
  return "hey you... it's been a while 🖤 what are you up to tonight?";
}

// ===========================================
// DATABASE OPERATIONS
// ===========================================

/**
 * Get candidates for re-engagement
 */
export async function getReengagementCandidates(
  limit: number = 50
): Promise<ReengagementCandidate[]> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  // Get contacts that might be eligible
  const { data: contacts, error } = await supabase
    .from('fanvue_dm_contacts')
    .select(`
      id,
      fanvue_user_id,
      fanvue_chat_id,
      username,
      stage,
      message_count,
      detected_language,
      last_user_message_at,
      last_reengagement_at,
      reengagement_count
    `)
    .eq('is_stopped', false)
    .in('stage', ['warm', 'hot', 'pitched'])
    .lt('last_user_message_at', twentyFourHoursAgo)
    .lt('reengagement_count', MAX_REENGAGEMENTS)
    .not('fanvue_chat_id', 'is', null)
    .order('last_user_message_at', { ascending: true })
    .limit(limit);
  
  if (error || !contacts) {
    console.error('[Fanvue Re-engagement] Error fetching candidates:', error);
    return [];
  }
  
  // Get profiles for these contacts
  const contactIds = (contacts as ReengagementContactRow[]).map(c => c.id);
  
  const { data: profiles } = await supabase
    .from('fanvue_user_profiles')
    .select('*')
    .in('contact_id', contactIds);
  
  const profileMap = new Map<string, FanvueUserProfile>(
    profiles?.map((p: FanvueUserProfile) => [p.contact_id, p] as [string, FanvueUserProfile]) || []
  );
  
  // Combine contacts with profiles
  return (contacts as ReengagementContactRow[]).map(contact => ({
    ...contact,
    profile: profileMap.get(contact.id) || null,
  }));
}

/**
 * Update contact after re-engagement
 */
export async function markReengagementSent(contactId: string): Promise<void> {
  const { error } = await supabase
    .from('fanvue_dm_contacts')
    .update({
      last_reengagement_at: new Date().toISOString(),
      reengagement_count: supabase.rpc('increment', { x: 1 }),
      last_contact_at: new Date().toISOString(),
    })
    .eq('id', contactId);
  
  if (error) {
    console.error('[Fanvue Re-engagement] Error updating contact:', error);
  }
}

/**
 * Save re-engagement message to history
 */
export async function saveReengagementMessage(
  contactId: string,
  message: string
): Promise<void> {
  const { error } = await supabase
    .from('fanvue_dm_messages')
    .insert({
      contact_id: contactId,
      direction: 'outgoing',
      content: message,
      response_strategy: 'reengagement',
    });
  
  if (error) {
    console.error('[Fanvue Re-engagement] Error saving message:', error);
  }
}

// ===========================================
// MAIN FUNCTION
// ===========================================

/**
 * Send re-engagement message to a single contact
 */
export async function sendReengagement(
  candidate: ReengagementCandidate
): Promise<ReengagementResult> {
  const result: ReengagementResult = {
    contactId: candidate.id,
    username: candidate.username,
    success: false,
  };
  
  try {
    // Check eligibility
    const eligibility = isEligibleForReengagement(candidate);
    if (!eligibility.eligible) {
      result.error = eligibility.reason;
      return result;
    }
    
    // Generate message
    const message = await buildReengagementMessage(candidate);
    result.message = message;
    
    // Send via Fanvue API
    await sendMessage({
      chatId: candidate.fanvue_chat_id!,
      text: message,
    });
    
    // Update database
    await markReengagementSent(candidate.id);
    await saveReengagementMessage(candidate.id, message);
    
    result.success = true;
    console.log(`[Fanvue Re-engagement] Sent to @${candidate.username}: "${message}"`);
    
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Fanvue Re-engagement] Error for @${candidate.username}:`, error);
  }
  
  return result;
}

/**
 * Process all eligible re-engagements
 */
export async function processReengagements(): Promise<ReengagementResult[]> {
  const results: ReengagementResult[] = [];
  
  // Get candidates
  const candidates = await getReengagementCandidates();
  console.log(`[Fanvue Re-engagement] Found ${candidates.length} potential candidates`);
  
  // Process each candidate
  for (const candidate of candidates) {
    const result = await sendReengagement(candidate);
    results.push(result);
    
    // Small delay between sends
    if (result.success) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return results;
}
