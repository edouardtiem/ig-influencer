/**
 * Fanvue Memory System
 * Long-term memory for personalized Fanvue conversations
 * 
 * Features:
 * - Profile extraction from conversations (Claude batch analysis)
 * - Profile context injection for Venice AI
 * - Timezone inference for re-engagement
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabase } from './supabase';

// ===========================================
// TYPES
// ===========================================

export interface FanvueUserProfile {
  id: string;
  contact_id: string;
  
  // Personal facts
  display_name: string | null;
  nickname: string | null;
  location: string | null;
  timezone: string | null;
  job: string | null;
  industry: string | null;
  relationship_status: string | null;
  has_kids: boolean | null;
  kids_count: number | null;
  age_range: string | null;
  hobbies: string[] | null;
  interests: string[] | null;
  languages_spoken: string[] | null;
  
  // Buyer behavior
  spending_pattern: string | null;
  avg_purchase_value: number | null;
  total_spent: number | null;
  purchase_count: number | null;
  preferred_price_range: string | null;
  objection_history: string[] | null;
  conversion_triggers: string[] | null;
  last_purchase_at: string | null;
  
  // Psychological profile
  communication_style: string | null;
  emotional_needs: string[] | null;
  tone_preference: string | null;
  content_preferences: string[] | null;
  fantasies: string[] | null;
  triggers: string[] | null;
  boundaries: string[] | null;
  
  // Conversation insights
  topics_discussed: string[] | null;
  personal_stories: string[] | null;
  compliments_given: string[] | null;
  
  // Meta
  last_analyzed_at: string | null;
  analysis_version: number;
  notes: string | null;
  raw_insights: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileExtraction {
  personal?: {
    display_name?: string;
    nickname?: string;
    location?: string;
    timezone?: string;
    job?: string;
    industry?: string;
    relationship_status?: string;
    has_kids?: boolean;
    kids_count?: number;
    age_range?: string;
    hobbies?: string[];
    interests?: string[];
  };
  buyer?: {
    spending_pattern?: string;
    objection_history?: string[];
    conversion_triggers?: string[];
    preferred_price_range?: string;
  };
  psychological?: {
    communication_style?: string;
    emotional_needs?: string[];
    tone_preference?: string;
    content_preferences?: string[];
    fantasies?: string[];
    triggers?: string[];
    boundaries?: string[];
  };
  conversation?: {
    topics_discussed?: string[];
    personal_stories?: string[];
    compliments_given?: string[];
  };
}

// ===========================================
// ANTHROPIC CLIENT
// ===========================================

const anthropic = new Anthropic({
  apiKey: process.env.Claude_key || process.env.ANTHROPIC_API_KEY,
});

// ===========================================
// PROFILE MANAGEMENT
// ===========================================

/**
 * Get or create a user profile for a Fanvue contact
 */
export async function getOrCreateProfile(contactId: string): Promise<FanvueUserProfile | null> {
  // Try to find existing profile
  const { data: existing, error: findError } = await supabase
    .from('fanvue_user_profiles')
    .select('*')
    .eq('contact_id', contactId)
    .single();
  
  if (existing && !findError) {
    return existing;
  }
  
  // Create new empty profile
  const { data: created, error: createError } = await supabase
    .from('fanvue_user_profiles')
    .insert({
      contact_id: contactId,
      analysis_version: 1,
    })
    .select()
    .single();
  
  if (createError) {
    console.error('[Fanvue Memory] Error creating profile:', createError);
    return null;
  }
  
  return created;
}

/**
 * Update profile with new extracted data
 * Merges new data with existing (doesn't overwrite with null)
 */
export async function updateProfile(
  contactId: string,
  extraction: ProfileExtraction
): Promise<void> {
  const updates: Record<string, unknown> = {
    last_analyzed_at: new Date().toISOString(),
    raw_insights: extraction,
  };
  
  // Personal facts
  if (extraction.personal) {
    const p = extraction.personal;
    if (p.display_name) updates.display_name = p.display_name;
    if (p.nickname) updates.nickname = p.nickname;
    if (p.location) updates.location = p.location;
    if (p.timezone) updates.timezone = p.timezone;
    if (p.job) updates.job = p.job;
    if (p.industry) updates.industry = p.industry;
    if (p.relationship_status) updates.relationship_status = p.relationship_status;
    if (p.has_kids !== undefined) updates.has_kids = p.has_kids;
    if (p.kids_count) updates.kids_count = p.kids_count;
    if (p.age_range) updates.age_range = p.age_range;
    if (p.hobbies?.length) updates.hobbies = p.hobbies;
    if (p.interests?.length) updates.interests = p.interests;
  }
  
  // Buyer behavior
  if (extraction.buyer) {
    const b = extraction.buyer;
    if (b.spending_pattern) updates.spending_pattern = b.spending_pattern;
    if (b.preferred_price_range) updates.preferred_price_range = b.preferred_price_range;
    // Arrays: merge with existing
    if (b.objection_history?.length) {
      updates.objection_history = supabase.rpc('array_append_unique', {
        arr: 'objection_history',
        vals: b.objection_history,
      });
    }
    if (b.conversion_triggers?.length) {
      updates.conversion_triggers = supabase.rpc('array_append_unique', {
        arr: 'conversion_triggers',
        vals: b.conversion_triggers,
      });
    }
  }
  
  // Psychological profile
  if (extraction.psychological) {
    const ps = extraction.psychological;
    if (ps.communication_style) updates.communication_style = ps.communication_style;
    if (ps.tone_preference) updates.tone_preference = ps.tone_preference;
    if (ps.emotional_needs?.length) updates.emotional_needs = ps.emotional_needs;
    if (ps.content_preferences?.length) updates.content_preferences = ps.content_preferences;
    if (ps.fantasies?.length) updates.fantasies = ps.fantasies;
    if (ps.triggers?.length) updates.triggers = ps.triggers;
    if (ps.boundaries?.length) updates.boundaries = ps.boundaries;
  }
  
  // Conversation insights
  if (extraction.conversation) {
    const c = extraction.conversation;
    if (c.topics_discussed?.length) updates.topics_discussed = c.topics_discussed;
    if (c.personal_stories?.length) updates.personal_stories = c.personal_stories;
    if (c.compliments_given?.length) updates.compliments_given = c.compliments_given;
  }
  
  const { error } = await supabase
    .from('fanvue_user_profiles')
    .update(updates)
    .eq('contact_id', contactId);
  
  if (error) {
    console.error('[Fanvue Memory] Error updating profile:', error);
  }
}

// ===========================================
// MEMORY EXTRACTION (Claude)
// ===========================================

const EXTRACTION_PROMPT = `You are analyzing a conversation between Elena (a model/creator) and a fan on Fanvue (premium content platform).

Extract structured information about the USER (not Elena) from this conversation.
ONLY include facts that are EXPLICITLY stated or clearly implied. Do NOT guess or invent.

Return a JSON object with these sections (include only fields where you found evidence):

{
  "personal": {
    "display_name": "their name if mentioned",
    "nickname": "any nickname they use or Elena gives them",
    "location": "city/country if mentioned",
    "timezone": "IANA timezone if location is clear (e.g., Europe/Paris, America/New_York)",
    "job": "their job/profession",
    "industry": "their industry (finance, tech, etc.)",
    "relationship_status": "single/married/complicated/divorced",
    "has_kids": true/false,
    "kids_count": number,
    "age_range": "20s/30s/40s/50s+",
    "hobbies": ["list of hobbies mentioned"],
    "interests": ["list of interests"]
  },
  "buyer": {
    "spending_pattern": "impulsive/thoughtful/price_sensitive/big_spender",
    "objection_history": ["objections they raised: too expensive, need to think, etc."],
    "conversion_triggers": ["what made them buy or engage more"],
    "preferred_price_range": "low/medium/high"
  },
  "psychological": {
    "communication_style": "direct/playful/romantic/dominant/submissive",
    "emotional_needs": ["validation", "attention", "fantasy", "connection", "escape"],
    "tone_preference": "bratty/sweet/dominant/mysterious/playful",
    "content_preferences": ["lingerie", "bikini", "explicit", "roleplay", "soft", "artistic"],
    "fantasies": ["any fantasies or desires mentioned"],
    "triggers": ["what excites them"],
    "boundaries": ["what they don't like or avoid"]
  },
  "conversation": {
    "topics_discussed": ["main topics they talked about"],
    "personal_stories": ["key personal stories they shared"],
    "compliments_given": ["what they compliment about Elena"]
  }
}

IMPORTANT:
- Only include fields where you have clear evidence
- For timezone, infer from location (Paris → Europe/Paris, NYC → America/New_York, London → Europe/London)
- For tone_preference, look at what type of Elena responses they engage with most
- For triggers, note what makes them respond enthusiastically
- Return ONLY valid JSON, no explanations`;

/**
 * Extract profile information from conversation using Claude
 */
export async function extractMemoryFromConversation(
  messages: { direction: string; content: string }[]
): Promise<ProfileExtraction | null> {
  if (messages.length < 3) {
    // Not enough messages to extract meaningful info
    return null;
  }
  
  // Format conversation for analysis
  const conversationText = messages
    .map(m => `[${m.direction === 'incoming' ? 'User' : 'Elena'}]: ${m.content}`)
    .join('\n');
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001', // Haiku 4.5 - fast and cheap for extraction
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `${EXTRACTION_PROMPT}\n\nCONVERSATION:\n${conversationText}`,
        },
      ],
    });
    
    const responseText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';
    
    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Fanvue Memory] No JSON found in extraction response');
      return null;
    }
    
    const extraction: ProfileExtraction = JSON.parse(jsonMatch[0]);
    return extraction;
    
  } catch (error) {
    console.error('[Fanvue Memory] Extraction error:', error);
    return null;
  }
}

// ===========================================
// TIMEZONE UTILITIES
// ===========================================

// Location to timezone mapping
const LOCATION_TIMEZONES: Record<string, string> = {
  // France
  'paris': 'Europe/Paris',
  'france': 'Europe/Paris',
  'lyon': 'Europe/Paris',
  'marseille': 'Europe/Paris',
  'nice': 'Europe/Paris',
  
  // USA
  'new york': 'America/New_York',
  'nyc': 'America/New_York',
  'los angeles': 'America/Los_Angeles',
  'la': 'America/Los_Angeles',
  'chicago': 'America/Chicago',
  'miami': 'America/New_York',
  'san francisco': 'America/Los_Angeles',
  'usa': 'America/New_York', // Default to EST
  'america': 'America/New_York',
  
  // UK
  'london': 'Europe/London',
  'uk': 'Europe/London',
  'england': 'Europe/London',
  'manchester': 'Europe/London',
  
  // Italy
  'rome': 'Europe/Rome',
  'roma': 'Europe/Rome',
  'milan': 'Europe/Rome',
  'milano': 'Europe/Rome',
  'italy': 'Europe/Rome',
  'italia': 'Europe/Rome',
  
  // Spain
  'madrid': 'Europe/Madrid',
  'barcelona': 'Europe/Madrid',
  'spain': 'Europe/Madrid',
  'españa': 'Europe/Madrid',
  
  // Germany
  'berlin': 'Europe/Berlin',
  'munich': 'Europe/Berlin',
  'germany': 'Europe/Berlin',
  'deutschland': 'Europe/Berlin',
  
  // Other Europe
  'amsterdam': 'Europe/Amsterdam',
  'brussels': 'Europe/Brussels',
  'zurich': 'Europe/Zurich',
  'geneva': 'Europe/Zurich',
  'switzerland': 'Europe/Zurich',
  'vienna': 'Europe/Vienna',
  'prague': 'Europe/Prague',
  'warsaw': 'Europe/Warsaw',
  'stockholm': 'Europe/Stockholm',
  'oslo': 'Europe/Oslo',
  'copenhagen': 'Europe/Copenhagen',
  'lisbon': 'Europe/Lisbon',
  'portugal': 'Europe/Lisbon',
  
  // Canada
  'toronto': 'America/Toronto',
  'montreal': 'America/Montreal',
  'vancouver': 'America/Vancouver',
  'canada': 'America/Toronto',
  
  // Australia
  'sydney': 'Australia/Sydney',
  'melbourne': 'Australia/Melbourne',
  'australia': 'Australia/Sydney',
  
  // Brazil
  'sao paulo': 'America/Sao_Paulo',
  'rio': 'America/Sao_Paulo',
  'brazil': 'America/Sao_Paulo',
  'brasil': 'America/Sao_Paulo',
  
  // Asia
  'tokyo': 'Asia/Tokyo',
  'japan': 'Asia/Tokyo',
  'singapore': 'Asia/Singapore',
  'hong kong': 'Asia/Hong_Kong',
  'dubai': 'Asia/Dubai',
  'uae': 'Asia/Dubai',
};

/**
 * Infer timezone from location string
 */
export function inferTimezone(location: string | null): string | null {
  if (!location) return null;
  
  const lowerLocation = location.toLowerCase();
  
  // Check direct matches
  for (const [key, tz] of Object.entries(LOCATION_TIMEZONES)) {
    if (lowerLocation.includes(key)) {
      return tz;
    }
  }
  
  return null;
}

/**
 * Get local time in a timezone
 */
export function getLocalTime(date: Date, timezone: string): Date {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    
    const parts = formatter.formatToParts(date);
    const values: Record<string, string> = {};
    for (const part of parts) {
      values[part.type] = part.value;
    }
    
    return new Date(
      parseInt(values.year),
      parseInt(values.month) - 1,
      parseInt(values.day),
      parseInt(values.hour),
      parseInt(values.minute),
      parseInt(values.second)
    );
  } catch {
    // Invalid timezone, return original date
    return date;
  }
}

/**
 * Get hour in user's timezone
 */
export function getLocalHour(timezone: string | null): number {
  const tz = timezone || 'Europe/Paris'; // Default to Paris
  const localTime = getLocalTime(new Date(), tz);
  return localTime.getHours();
}

// ===========================================
// BATCH PROCESSING
// ===========================================

/**
 * Get contacts that need memory analysis
 * (have new messages since last analysis)
 */
export async function getContactsNeedingAnalysis(limit: number = 50): Promise<string[]> {
  const { data, error } = await supabase
    .from('fanvue_dm_contacts')
    .select(`
      id,
      fanvue_user_profiles!inner (
        last_analyzed_at
      )
    `)
    .eq('is_stopped', false)
    .gte('message_count', 3) // At least 3 messages
    .order('last_contact_at', { ascending: false })
    .limit(limit);
  
  if (error || !data) {
    console.error('[Fanvue Memory] Error getting contacts:', error);
    return [];
  }
  
  // Filter contacts where last_contact_at > last_analyzed_at
  // or last_analyzed_at is null
  const contactIds: string[] = [];
  
  for (const contact of data) {
    const profile = contact.fanvue_user_profiles as unknown as { last_analyzed_at: string | null };
    if (!profile?.last_analyzed_at) {
      contactIds.push(contact.id);
    }
  }
  
  return contactIds;
}

/**
 * Get messages for a contact since last analysis
 */
export async function getMessagesForAnalysis(
  contactId: string,
  sinceDate?: string
): Promise<{ direction: string; content: string }[]> {
  let query = supabase
    .from('fanvue_dm_messages')
    .select('direction, content, created_at')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: true });
  
  if (sinceDate) {
    query = query.gte('created_at', sinceDate);
  }
  
  const { data, error } = await query.limit(100);
  
  if (error || !data) {
    return [];
  }
  
  return data;
}

/**
 * Process a single contact's memory extraction
 */
export async function processContactMemory(contactId: string): Promise<boolean> {
  try {
    // Get profile to check last analysis date
    const profile = await getOrCreateProfile(contactId);
    
    // Get messages since last analysis
    const messages = await getMessagesForAnalysis(
      contactId,
      profile?.last_analyzed_at || undefined
    );
    
    if (messages.length < 3) {
      console.log(`[Fanvue Memory] Not enough new messages for ${contactId}`);
      return false;
    }
    
    // Extract memory
    const extraction = await extractMemoryFromConversation(messages);
    
    if (!extraction) {
      console.log(`[Fanvue Memory] No extraction for ${contactId}`);
      return false;
    }
    
    // Infer timezone if location was found
    if (extraction.personal?.location && !extraction.personal.timezone) {
      const inferredTz = inferTimezone(extraction.personal.location);
      if (inferredTz) {
        extraction.personal.timezone = inferredTz;
      }
    }
    
    // Update profile
    await updateProfile(contactId, extraction);
    
    console.log(`[Fanvue Memory] Updated profile for ${contactId}`);
    return true;
    
  } catch (error) {
    console.error(`[Fanvue Memory] Error processing ${contactId}:`, error);
    return false;
  }
}
