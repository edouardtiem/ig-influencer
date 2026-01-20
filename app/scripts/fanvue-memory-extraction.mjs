#!/usr/bin/env node

/**
 * Fanvue Memory Extraction CRON Job
 * 
 * Runs every 6 hours to analyze conversations and extract user profiles.
 * Uses Claude AI to identify personal facts, buyer behavior, and psychological traits.
 * 
 * Usage:
 *   node scripts/fanvue-memory-extraction.mjs
 * 
 * Environment:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - Claude_key or ANTHROPIC_API_KEY
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

// ===========================================
// CONFIGURATION
// ===========================================

const BATCH_SIZE = 20; // Process 20 contacts per run
const MIN_MESSAGES_FOR_ANALYSIS = 5; // Need at least 5 messages
const MAX_MESSAGES_TO_ANALYZE = 50; // Limit messages per contact

// ===========================================
// CLIENTS
// ===========================================

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.Claude_key || process.env.ANTHROPIC_API_KEY,
});

// ===========================================
// EXTRACTION PROMPT
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

// ===========================================
// TIMEZONE INFERENCE
// ===========================================

const LOCATION_TIMEZONES = {
  // France
  'paris': 'Europe/Paris',
  'france': 'Europe/Paris',
  'lyon': 'Europe/Paris',
  'marseille': 'Europe/Paris',
  
  // USA
  'new york': 'America/New_York',
  'nyc': 'America/New_York',
  'los angeles': 'America/Los_Angeles',
  'la': 'America/Los_Angeles',
  'chicago': 'America/Chicago',
  'miami': 'America/New_York',
  'usa': 'America/New_York',
  
  // UK
  'london': 'Europe/London',
  'uk': 'Europe/London',
  'england': 'Europe/London',
  
  // Italy
  'rome': 'Europe/Rome',
  'milan': 'Europe/Rome',
  'italy': 'Europe/Rome',
  'italia': 'Europe/Rome',
  
  // Spain
  'madrid': 'Europe/Madrid',
  'barcelona': 'Europe/Madrid',
  'spain': 'Europe/Madrid',
  
  // Germany
  'berlin': 'Europe/Berlin',
  'germany': 'Europe/Berlin',
  
  // Other
  'amsterdam': 'Europe/Amsterdam',
  'brussels': 'Europe/Brussels',
  'zurich': 'Europe/Zurich',
  'toronto': 'America/Toronto',
  'sydney': 'Australia/Sydney',
  'tokyo': 'Asia/Tokyo',
  'dubai': 'Asia/Dubai',
};

function inferTimezone(location) {
  if (!location) return null;
  
  const lowerLocation = location.toLowerCase();
  
  for (const [key, tz] of Object.entries(LOCATION_TIMEZONES)) {
    if (lowerLocation.includes(key)) {
      return tz;
    }
  }
  
  return null;
}

// ===========================================
// MAIN FUNCTIONS
// ===========================================

/**
 * Get contacts that need memory analysis
 */
async function getContactsNeedingAnalysis() {
  // Get contacts with enough messages and no recent analysis
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  
  const { data: contacts, error } = await supabase
    .from('fanvue_dm_contacts')
    .select('id, username, message_count, last_contact_at')
    .eq('is_stopped', false)
    .gte('message_count', MIN_MESSAGES_FOR_ANALYSIS)
    .order('last_contact_at', { ascending: false })
    .limit(BATCH_SIZE * 2); // Get more to filter
  
  if (error) {
    console.error('❌ Error fetching contacts:', error);
    return [];
  }
  
  // Get profiles to check last_analyzed_at
  const contactIds = contacts.map(c => c.id);
  
  const { data: profiles } = await supabase
    .from('fanvue_user_profiles')
    .select('contact_id, last_analyzed_at')
    .in('contact_id', contactIds);
  
  const profileMap = new Map(profiles?.map(p => [p.contact_id, p.last_analyzed_at]) || []);
  
  // Filter contacts that need analysis
  const needsAnalysis = contacts.filter(contact => {
    const lastAnalyzed = profileMap.get(contact.id);
    
    // Never analyzed
    if (!lastAnalyzed) return true;
    
    // Analyzed more than 6 hours ago AND has new messages
    const lastAnalyzedDate = new Date(lastAnalyzed);
    const lastContactDate = new Date(contact.last_contact_at);
    
    return lastAnalyzedDate < new Date(sixHoursAgo) && lastContactDate > lastAnalyzedDate;
  });
  
  return needsAnalysis.slice(0, BATCH_SIZE);
}

/**
 * Get messages for a contact
 */
async function getMessages(contactId, sinceDate) {
  let query = supabase
    .from('fanvue_dm_messages')
    .select('direction, content, created_at')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: true })
    .limit(MAX_MESSAGES_TO_ANALYZE);
  
  if (sinceDate) {
    query = query.gte('created_at', sinceDate);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error(`❌ Error fetching messages for ${contactId}:`, error);
    return [];
  }
  
  return data || [];
}

/**
 * Extract profile from conversation using Claude
 */
async function extractProfile(messages) {
  if (messages.length < MIN_MESSAGES_FOR_ANALYSIS) {
    return null;
  }
  
  // Format conversation
  const conversationText = messages
    .map(m => `[${m.direction === 'incoming' ? 'User' : 'Elena'}]: ${m.content}`)
    .join('\n');
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001', // Haiku 4.5
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `${EXTRACTION_PROMPT}\n\nCONVERSATION:\n${conversationText}`,
        },
      ],
    });
    
    const responseText = response.content[0]?.text || '';
    
    // Parse JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('  ⚠️ No JSON in response');
      return null;
    }
    
    return JSON.parse(jsonMatch[0]);
    
  } catch (error) {
    console.error('  ❌ Claude error:', error.message);
    return null;
  }
}

/**
 * Update or create profile in database
 */
async function updateProfile(contactId, extraction) {
  // Check if profile exists
  const { data: existing } = await supabase
    .from('fanvue_user_profiles')
    .select('id')
    .eq('contact_id', contactId)
    .single();
  
  const updates = {
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
    if (b.objection_history?.length) updates.objection_history = b.objection_history;
    if (b.conversion_triggers?.length) updates.conversion_triggers = b.conversion_triggers;
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
  
  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('fanvue_user_profiles')
      .update(updates)
      .eq('contact_id', contactId);
    
    if (error) {
      console.error(`  ❌ Update error:`, error.message);
      return false;
    }
  } else {
    // Create new
    const { error } = await supabase
      .from('fanvue_user_profiles')
      .insert({
        contact_id: contactId,
        ...updates,
      });
    
    if (error) {
      console.error(`  ❌ Insert error:`, error.message);
      return false;
    }
  }
  
  return true;
}

/**
 * Process a single contact
 */
async function processContact(contact) {
  console.log(`\n📝 Processing @${contact.username || contact.id}...`);
  
  // Get existing profile for last_analyzed_at
  const { data: profile } = await supabase
    .from('fanvue_user_profiles')
    .select('last_analyzed_at')
    .eq('contact_id', contact.id)
    .single();
  
  // Get messages
  const messages = await getMessages(contact.id, profile?.last_analyzed_at);
  
  if (messages.length < MIN_MESSAGES_FOR_ANALYSIS) {
    console.log(`  ⏭️ Not enough messages (${messages.length})`);
    return false;
  }
  
  console.log(`  📨 Analyzing ${messages.length} messages...`);
  
  // Extract profile
  const extraction = await extractProfile(messages);
  
  if (!extraction) {
    console.log(`  ⚠️ No extraction result`);
    return false;
  }
  
  // Infer timezone if location found
  if (extraction.personal?.location && !extraction.personal.timezone) {
    const tz = inferTimezone(extraction.personal.location);
    if (tz) {
      extraction.personal.timezone = tz;
      console.log(`  🌍 Inferred timezone: ${tz}`);
    }
  }
  
  // Log what we found
  const facts = [];
  if (extraction.personal?.display_name) facts.push(`name: ${extraction.personal.display_name}`);
  if (extraction.personal?.location) facts.push(`location: ${extraction.personal.location}`);
  if (extraction.personal?.job) facts.push(`job: ${extraction.personal.job}`);
  if (extraction.psychological?.tone_preference) facts.push(`tone: ${extraction.psychological.tone_preference}`);
  
  if (facts.length > 0) {
    console.log(`  ✨ Found: ${facts.join(', ')}`);
  }
  
  // Update profile
  const success = await updateProfile(contact.id, extraction);
  
  if (success) {
    console.log(`  ✅ Profile updated`);
  }
  
  return success;
}

// ===========================================
// MAIN
// ===========================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🧠 FANVUE MEMORY EXTRACTION');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Get contacts needing analysis
  const contacts = await getContactsNeedingAnalysis();
  
  console.log(`\n📊 Found ${contacts.length} contacts to analyze`);
  
  if (contacts.length === 0) {
    console.log('\n✅ No contacts need analysis right now');
    return;
  }
  
  // Process each contact
  let processed = 0;
  let updated = 0;
  
  for (const contact of contacts) {
    const success = await processContact(contact);
    processed++;
    if (success) updated++;
    
    // Small delay between API calls
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Processed: ${processed}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${processed - updated}`);
  console.log('\n✅ Memory extraction complete!');
}

main().catch(console.error);
