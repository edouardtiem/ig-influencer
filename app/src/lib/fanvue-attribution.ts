/**
 * Fanvue Attribution — Match Fanvue followers/subscribers with IG contacts
 * 
 * Uses fuzzy matching on usernames and timing-based attribution
 * to track conversions from IG DM → Fanvue
 */

import { supabase } from './supabase';

interface IGContact {
  id: string;
  ig_username: string | null;
  ig_name: string | null;
  fanvue_pitched_at: string | null;
  stage: string;
}

interface AttributionResult {
  matched: boolean;
  contact?: IGContact;
  confidence: 'high' | 'medium' | 'low';
  matchType: 'exact' | 'fuzzy' | 'timing' | 'none';
  score?: number;
}

/**
 * Normalize username for comparison
 * Removes common variations: underscores, dots, numbers at end
 */
function normalizeUsername(username: string): string {
  return username
    .toLowerCase()
    .replace(/[._-]/g, '')      // Remove separators
    .replace(/\d+$/, '')         // Remove trailing numbers
    .trim();
}

/**
 * Calculate similarity score between two strings (Levenshtein-based)
 * Returns 0-1 (1 = identical)
 */
function similarityScore(str1: string, str2: string): number {
  const s1 = normalizeUsername(str1);
  const s2 = normalizeUsername(str2);
  
  // Exact match after normalization
  if (s1 === s2) return 1.0;
  
  // One contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    const longer = Math.max(s1.length, s2.length);
    const shorter = Math.min(s1.length, s2.length);
    return shorter / longer * 0.9; // 90% max for contains
  }
  
  // Levenshtein distance
  const len1 = s1.length;
  const len2 = s2.length;
  
  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;
  
  const matrix: number[][] = [];
  
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  
  return 1 - (distance / maxLen);
}

/**
 * Try to match a Fanvue user with an IG contact
 * 
 * Strategy:
 * 1. Exact username match (after normalization)
 * 2. Fuzzy username match (similarity > 0.7)
 * 3. Timing-based match (most recent pitch within 24h)
 */
export async function matchFanvueToIG(
  fanvueHandle: string,
  fanvueDisplayName?: string
): Promise<AttributionResult> {
  console.log(`[Attribution] Trying to match Fanvue user: ${fanvueHandle} (${fanvueDisplayName || 'no display name'})`);
  
  // Get contacts who received Fanvue link in last 24h
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: recentContacts, error } = await supabase
    .from('elena_dm_contacts')
    .select('id, ig_username, ig_name, fanvue_pitched_at, stage')
    .not('fanvue_pitched_at', 'is', null)
    .gte('fanvue_pitched_at', twentyFourHoursAgo)
    .order('fanvue_pitched_at', { ascending: false });
  
  if (error || !recentContacts || recentContacts.length === 0) {
    console.log('[Attribution] No recent pitched contacts found');
    return { matched: false, confidence: 'low', matchType: 'none' };
  }
  
  console.log(`[Attribution] Found ${recentContacts.length} contacts pitched in last 24h`);
  
  // 1. Try exact match
  const exactMatch = recentContacts.find((c: IGContact) => {
    if (!c.ig_username) return false;
    return normalizeUsername(c.ig_username) === normalizeUsername(fanvueHandle);
  });
  
  if (exactMatch) {
    console.log(`[Attribution] EXACT MATCH: @${exactMatch.ig_username}`);
    return {
      matched: true,
      contact: exactMatch,
      confidence: 'high',
      matchType: 'exact',
      score: 1.0
    };
  }
  
  // 2. Try fuzzy match on username
  let bestMatch: { contact: IGContact; score: number } | null = null;
  
  for (const contact of recentContacts) {
    if (!contact.ig_username) continue;
    
    // Check against handle
    const handleScore = similarityScore(contact.ig_username, fanvueHandle);
    
    // Check against display name if available
    let displayScore = 0;
    if (fanvueDisplayName && contact.ig_name) {
      displayScore = similarityScore(contact.ig_name, fanvueDisplayName);
    }
    
    const score = Math.max(handleScore, displayScore);
    
    if (score > 0.7 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { contact, score };
    }
  }
  
  if (bestMatch && bestMatch.score >= 0.8) {
    console.log(`[Attribution] FUZZY MATCH (${(bestMatch.score * 100).toFixed(0)}%): @${bestMatch.contact.ig_username}`);
    return {
      matched: true,
      contact: bestMatch.contact,
      confidence: 'high',
      matchType: 'fuzzy',
      score: bestMatch.score
    };
  }
  
  if (bestMatch && bestMatch.score >= 0.7) {
    console.log(`[Attribution] FUZZY MATCH MEDIUM (${(bestMatch.score * 100).toFixed(0)}%): @${bestMatch.contact.ig_username}`);
    return {
      matched: true,
      contact: bestMatch.contact,
      confidence: 'medium',
      matchType: 'fuzzy',
      score: bestMatch.score
    };
  }
  
  // 3. Fall back to timing-based (most recent)
  // Only use if we have few candidates (< 5 in last 15 min)
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const veryRecent = recentContacts.filter((c: IGContact) => 
    c.fanvue_pitched_at && c.fanvue_pitched_at >= fifteenMinAgo
  );
  
  if (veryRecent.length === 1) {
    console.log(`[Attribution] TIMING MATCH (only 1 in 15min): @${veryRecent[0].ig_username}`);
    return {
      matched: true,
      contact: veryRecent[0],
      confidence: 'medium',
      matchType: 'timing',
      score: 0.6
    };
  }
  
  if (veryRecent.length > 1 && veryRecent.length <= 3) {
    // Take most recent
    console.log(`[Attribution] TIMING MATCH LOW (${veryRecent.length} in 15min, taking most recent): @${veryRecent[0].ig_username}`);
    return {
      matched: true,
      contact: veryRecent[0],
      confidence: 'low',
      matchType: 'timing',
      score: 0.4
    };
  }
  
  console.log('[Attribution] NO MATCH FOUND');
  return { matched: false, confidence: 'low', matchType: 'none' };
}

/**
 * Mark an IG contact as converted on Fanvue
 */
export async function markContactAsConverted(
  contactId: string,
  fanvueHandle: string,
  isPaid: boolean = false
): Promise<boolean> {
  const newStage = isPaid ? 'paid' : 'converted';
  const timestamp = new Date().toISOString();
  
  // First get current notes
  const { data: current } = await supabase
    .from('elena_dm_contacts')
    .select('notes')
    .eq('id', contactId)
    .single();
  
  const currentNotes = current?.notes || '';
  const newNote = `\n[${timestamp}] Converted via Fanvue: @${fanvueHandle}`;
  
  const updateData: Record<string, unknown> = {
    stage: newStage,
    fanvue_link_clicked: true,
    notes: currentNotes + newNote,
  };
  
  // Set the appropriate timestamp field
  if (isPaid) {
    updateData.fanvue_paid_at = timestamp;
  } else {
    updateData.fanvue_converted_at = timestamp;
  }
  
  const { error } = await supabase
    .from('elena_dm_contacts')
    .update(updateData)
    .eq('id', contactId);
  
  if (error) {
    console.error('[Attribution] Error updating contact:', error);
    return false;
  }
  
  console.log(`[Attribution] Contact ${contactId} marked as ${newStage}`);
  return true;
}

/**
 * Process a new Fanvue follower/subscriber and try to attribute to IG
 */
export async function attributeFanvueConversion(
  fanvueHandle: string,
  fanvueDisplayName: string | undefined,
  isPaid: boolean
): Promise<{
  attributed: boolean;
  igUsername?: string;
  confidence?: 'high' | 'medium' | 'low';
  matchType?: string;
}> {
  // Try to match
  const match = await matchFanvueToIG(fanvueHandle, fanvueDisplayName);
  
  if (!match.matched || !match.contact) {
    console.log(`[Attribution] Could not attribute Fanvue user @${fanvueHandle}`);
    return { attributed: false };
  }
  
  // Mark as converted
  const success = await markContactAsConverted(
    match.contact.id,
    fanvueHandle,
    isPaid
  );
  
  if (!success) {
    return { attributed: false };
  }
  
  return {
    attributed: true,
    igUsername: match.contact.ig_username || undefined,
    confidence: match.confidence,
    matchType: match.matchType
  };
}
