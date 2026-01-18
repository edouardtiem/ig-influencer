import { createClient } from '@supabase/supabase-js';

// ===========================================
// SUPABASE CLIENT - Content Brain
// ===========================================

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Supabase credentials missing - database features disabled');
}

// Using any to avoid complex generic type issues with Supabase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder'
);

// ===========================================
// TYPES
// ===========================================

export type CharacterName = 'mila' | 'elena';
export type PostType = 'photo' | 'carousel' | 'reel';
export type Mood = 'cozy' | 'adventure' | 'work' | 'party' | 'relax' | 'fitness' | 'travel' | 'fashion';
export type ArcStatus = 'planned' | 'active' | 'completed';
export type ScheduleStatus = 'pending' | 'in_progress' | 'completed' | 'partial';

export interface Database {
  public: {
    Tables: {
      characters: {
        Row: Character;
        Insert: Omit<Character, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Character, 'id'>>;
      };
      posts: {
        Row: Post;
        Insert: Omit<Post, 'id' | 'created_at'>;
        Update: Partial<Omit<Post, 'id'>>;
      };
      timeline_events: {
        Row: TimelineEvent;
        Insert: Omit<TimelineEvent, 'id' | 'created_at'>;
        Update: Partial<Omit<TimelineEvent, 'id'>>;
      };
      narrative_arcs: {
        Row: NarrativeArc;
        Insert: Omit<NarrativeArc, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<NarrativeArc, 'id'>>;
      };
      relationships: {
        Row: Relationship;
        Insert: Omit<Relationship, 'id' | 'created_at'>;
        Update: Partial<Omit<Relationship, 'id'>>;
      };
      caption_templates: {
        Row: CaptionTemplate;
        Insert: Omit<CaptionTemplate, 'id' | 'created_at'>;
        Update: Partial<Omit<CaptionTemplate, 'id'>>;
      };
      daily_schedules: {
        Row: DailySchedule;
        Insert: Omit<DailySchedule, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DailySchedule, 'id'>>;
      };
      conversations: {
        Row: Conversation;
        Insert: Omit<Conversation, 'id'>;
        Update: Partial<Omit<Conversation, 'id'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at'>;
        Update: Partial<Omit<Message, 'id'>>;
      };
      analytics_snapshots: {
        Row: AnalyticsSnapshot;
        Insert: Omit<AnalyticsSnapshot, 'id' | 'created_at'>;
        Update: Partial<Omit<AnalyticsSnapshot, 'id'>>;
      };
    };
  };
}

export interface Character {
  id: string;
  name: CharacterName;
  full_name: string;
  instagram_handle: string;
  instagram_account_id: string | null;
  age: number | null;
  job: string | null;
  city: string | null;
  personality: string | null;
  interests: string[] | null;
  style_keywords: string[] | null;
  face_reference_url: string | null;
  body_reference_url: string | null;
  additional_references: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  character_id: string | null;
  character_name: CharacterName;
  instagram_post_id: string | null;
  instagram_permalink: string | null;
  post_type: PostType;
  caption: string | null;
  hashtags: string[] | null;
  image_urls: string[];
  video_url: string | null;
  location_key: string | null;
  location_name: string | null;
  location_country: string | null;
  outfit_description: string | null;
  action_description: string | null;
  mood: Mood | null;
  with_character: CharacterName | null;
  narrative_arc_id: string | null;
  prompt: string | null;
  negative_prompt: string | null;
  model_used: string | null;
  generation_params: Record<string, unknown> | null;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  shares_count: number;
  reach: number;
  impressions: number;
  engagement_rate: number | null;
  posted_at: string | null;
  scheduled_for: string | null;
  analytics_updated_at: string | null;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  event_date: string;
  event_type: 'meeting' | 'trip' | 'milestone' | 'memory';
  title: string;
  description: string;
  characters: CharacterName[];
  location: string | null;
  shareable: boolean;
  emotional_tone: string | null;
  reference_image_url: string | null;
  created_at: string;
}

export interface NarrativeArc {
  id: string;
  name: string;
  title: string;
  description: string | null;
  characters: CharacterName[];
  status: ArcStatus;
  start_date: string | null;
  end_date: string | null;
  planned_posts: number | null;
  completed_posts: number;
  post_sequence: unknown[] | null;
  main_location: string | null;
  location_country: string | null;
  created_at: string;
  updated_at: string;
}

export interface Relationship {
  id: string;
  character_1: CharacterName;
  character_2: CharacterName;
  relationship_type: string;
  how_they_met: string;
  met_date: string | null;
  met_location: string | null;
  inside_jokes: string[] | null;
  shared_memories: string[] | null;
  nicknames: Record<string, string> | null;
  see_each_other: string | null;
  activities_together: string[] | null;
  created_at: string;
}

export interface CaptionTemplate {
  id: string;
  character: CharacterName | null;
  category: string;
  mood: string | null;
  template: string;
  questions: string[] | null;
  ctas: string[] | null;
  hashtag_pool: string[] | null;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
}

export interface DailySchedule {
  id: string;
  schedule_date: string;
  character: CharacterName;
  daily_theme: string | null;
  mood: Mood | null;
  scheduled_posts: ScheduledPost[];
  status: ScheduleStatus;
  posts_completed: number;
  posts_total: number;
  generated_by: string;
  generation_reasoning: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduledPost {
  time: string;
  type: PostType;
  location_key: string;
  mood: Mood;
  outfit: string;
  action: string;
  caption_hint: string;
  with_character?: CharacterName;
  executed?: boolean;
}

export interface Conversation {
  id: string;
  character: CharacterName;
  instagram_user_id: string;
  username: string;
  first_contact_at: string;
  last_message_at: string;
  user_type: string | null;
  engagement_level: 'high' | 'medium' | 'low' | null;
  notes: string | null;
  total_interactions: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  message_type: 'text' | 'comment' | 'dm' | 'story_reply';
  content: string;
  post_id: string | null;
  created_at: string;
}

export interface AnalyticsSnapshot {
  id: string;
  character: CharacterName;
  snapshot_date: string;
  followers_count: number | null;
  following_count: number | null;
  posts_count: number | null;
  total_likes_week: number | null;
  total_comments_week: number | null;
  total_saves_week: number | null;
  avg_engagement_rate: number | null;
  best_post_type: PostType | null;
  best_location: string | null;
  best_mood: Mood | null;
  best_posting_hour: number | null;
  created_at: string;
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Save a post to the database after publishing
 */
export async function savePost(post: Omit<Post, 'id' | 'created_at'>): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .insert(post)
    .select()
    .single();

  if (error) {
    console.error('❌ Error saving post:', error);
    return null;
  }

  console.log('✅ Post saved to Supabase:', data.id);
  return data;
}

/**
 * Get recent posts for a character
 */
export async function getRecentPosts(
  character: CharacterName,
  limit: number = 10
): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('character_name', character)
    .order('posted_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('❌ Error fetching posts:', error);
    return [];
  }

  return data || [];
}

/**
 * Get posts with another character (crossovers)
 */
export async function getCrossoverPosts(
  character: CharacterName,
  limit: number = 5
): Promise<Post[]> {
  const otherCharacter = character === 'mila' ? 'elena' : 'mila';
  
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('character_name', character)
    .eq('with_character', otherCharacter)
    .order('posted_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('❌ Error fetching crossover posts:', error);
    return [];
  }

  return data || [];
}

/**
 * Get timeline events for throwbacks
 */
export async function getTimelineEvents(
  characters?: CharacterName[],
  shareable: boolean = true
): Promise<TimelineEvent[]> {
  let query = supabase
    .from('timeline_events')
    .select('*')
    .eq('shareable', shareable)
    .order('event_date', { ascending: false });

  if (characters && characters.length > 0) {
    query = query.contains('characters', characters);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Error fetching timeline:', error);
    return [];
  }

  return data || [];
}

/**
 * Get active narrative arcs
 */
export async function getActiveArcs(character?: CharacterName): Promise<NarrativeArc[]> {
  let query = supabase
    .from('narrative_arcs')
    .select('*')
    .eq('status', 'active');

  if (character) {
    query = query.contains('characters', [character]);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Error fetching arcs:', error);
    return [];
  }

  return data || [];
}

/**
 * Get relationship details
 */
export async function getRelationship(
  char1: CharacterName,
  char2: CharacterName
): Promise<Relationship | null> {
  const { data, error } = await supabase
    .from('relationships')
    .select('*')
    .or(`and(character_1.eq.${char1},character_2.eq.${char2}),and(character_1.eq.${char2},character_2.eq.${char1})`)
    .single();

  if (error) {
    console.error('❌ Error fetching relationship:', error);
    return null;
  }

  return data;
}

/**
 * Get caption templates by category
 */
export async function getCaptionTemplates(
  category: string,
  character?: CharacterName
): Promise<CaptionTemplate[]> {
  let query = supabase
    .from('caption_templates')
    .select('*')
    .eq('category', category);

  if (character) {
    query = query.or(`character.eq.${character},character.is.null`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Error fetching templates:', error);
    return [];
  }

  return data || [];
}

/**
 * Get or create today's schedule
 */
export async function getTodaySchedule(character: CharacterName): Promise<DailySchedule | null> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_schedules')
    .select('*')
    .eq('schedule_date', today)
    .eq('character', character)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    console.error('❌ Error fetching schedule:', error);
    return null;
  }

  return data;
}

/**
 * Save daily schedule
 */
export async function saveDailySchedule(
  schedule: Omit<DailySchedule, 'id' | 'created_at' | 'updated_at'>
): Promise<DailySchedule | null> {
  const { data, error } = await supabase
    .from('daily_schedules')
    .upsert(schedule, { onConflict: 'schedule_date,character' })
    .select()
    .single();

  if (error) {
    console.error('❌ Error saving schedule:', error);
    return null;
  }

  return data;
}

/**
 * Update post analytics
 */
export async function updatePostAnalytics(
  postId: string,
  analytics: {
    likes_count?: number;
    comments_count?: number;
    saves_count?: number;
    shares_count?: number;
    reach?: number;
    impressions?: number;
  }
): Promise<boolean> {
  const engagement_rate = analytics.likes_count && analytics.reach
    ? (analytics.likes_count / analytics.reach) * 100
    : null;

  const { error } = await supabase
    .from('posts')
    .update({
      ...analytics,
      engagement_rate,
      analytics_updated_at: new Date().toISOString()
    })
    .eq('id', postId);

  if (error) {
    console.error('❌ Error updating analytics:', error);
    return false;
  }

  return true;
}

/**
 * Get analytics insights for content decisions
 */
export async function getAnalyticsInsights(character: CharacterName): Promise<{
  bestLocation: string | null;
  bestMood: Mood | null;
  bestPostType: PostType | null;
  avgEngagement: number;
  recentLocations: string[];
}> {
  // Get recent posts with good engagement
  const { data: posts } = await supabase
    .from('posts')
    .select('location_key, mood, post_type, engagement_rate')
    .eq('character_name', character)
    .not('engagement_rate', 'is', null)
    .order('engagement_rate', { ascending: false })
    .limit(20);

  if (!posts || posts.length === 0) {
    return {
      bestLocation: null,
      bestMood: null,
      bestPostType: null,
      avgEngagement: 0,
      recentLocations: []
    };
  }

  // Calculate insights
  const locationCounts: Record<string, number[]> = {};
  const moodCounts: Record<string, number[]> = {};
  const typeCounts: Record<string, number[]> = {};

  posts.forEach((post: { location_key?: string; mood?: string; post_type?: string; engagement_rate?: number }) => {
    if (post.location_key && post.engagement_rate) {
      locationCounts[post.location_key] = locationCounts[post.location_key] || [];
      locationCounts[post.location_key].push(post.engagement_rate);
    }
    if (post.mood && post.engagement_rate) {
      moodCounts[post.mood] = moodCounts[post.mood] || [];
      moodCounts[post.mood].push(post.engagement_rate);
    }
    if (post.post_type && post.engagement_rate) {
      typeCounts[post.post_type] = typeCounts[post.post_type] || [];
      typeCounts[post.post_type].push(post.engagement_rate);
    }
  });

  const avgOf = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const bestLocation = Object.entries(locationCounts)
    .sort(([, a], [, b]) => avgOf(b) - avgOf(a))[0]?.[0] || null;

  const bestMood = Object.entries(moodCounts)
    .sort(([, a], [, b]) => avgOf(b) - avgOf(a))[0]?.[0] as Mood || null;

  const bestPostType = Object.entries(typeCounts)
    .sort(([, a], [, b]) => avgOf(b) - avgOf(a))[0]?.[0] as PostType || null;

  // Get recent locations to avoid
  const { data: recent } = await supabase
    .from('posts')
    .select('location_key')
    .eq('character_name', character)
    .not('location_key', 'is', null)
    .order('posted_at', { ascending: false })
    .limit(5);

  const recentLocations = recent 
    ? [...new Set(recent.map((p: { location_key?: string }) => p.location_key).filter(Boolean) as string[])] 
    : [];

  const avgEngagement = posts.reduce((sum: number, p: { engagement_rate?: number }) => sum + (p.engagement_rate || 0), 0) / posts.length;

  return {
    bestLocation,
    bestMood,
    bestPostType,
    avgEngagement,
    recentLocations
  };
}

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseServiceKey && !supabaseUrl.includes('placeholder'));
}

// ===========================================
// FANVUE OAUTH TOKENS STORAGE
// ===========================================

export interface FanvueTokensData {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp ms
  updated_at: string;
}

/**
 * Save Fanvue OAuth tokens to Supabase
 * Uses oauth_tokens table with service_name as key
 */
export async function saveFanvueTokens(tokens: {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('[Supabase] Not configured - cannot save Fanvue tokens');
    return false;
  }

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
    console.error('❌ Error saving Fanvue tokens:', error);
    return false;
  }

  console.log('✅ Fanvue tokens saved to Supabase');
  return true;
}

/**
 * Get Fanvue OAuth tokens from Supabase
 */
export async function getFanvueTokens(): Promise<FanvueTokensData | null> {
  if (!isSupabaseConfigured()) {
    console.warn('[Supabase] Not configured - cannot fetch Fanvue tokens');
    return null;
  }

  const { data, error } = await supabase
    .from('oauth_tokens')
    .select('*')
    .eq('service_name', 'fanvue')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('❌ Error fetching Fanvue tokens:', error);
    return null;
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    updated_at: data.updated_at,
  };
}

// ===========================================
// DAILY TRENDS CACHE
// ===========================================

export interface TrendTopic {
  topic: string;
  relevance: 'high' | 'medium' | 'low';
  context: string;
  captionAngle?: string;
}

export interface DailyTrendsData {
  date: string;
  topics: TrendTopic[];
  trendingHashtags: string[];
  suggestedHashtags: string[];
  fetchedAt: string;
}

/**
 * Save daily trends to Supabase cache
 */
export async function saveDailyTrends(trends: DailyTrendsData): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('[Supabase] Not configured - cannot save trends');
    return false;
  }

  const { error } = await supabase
    .from('daily_trends')
    .upsert({
      trend_date: trends.date,
      topics: trends.topics,
      trending_hashtags: trends.trendingHashtags,
      suggested_hashtags: trends.suggestedHashtags,
      fetched_at: trends.fetchedAt,
    }, { onConflict: 'trend_date' });

  if (error) {
    console.error('❌ Error saving daily trends:', error);
    return false;
  }

  console.log('✅ Daily trends saved to Supabase for', trends.date);
  return true;
}

/**
 * Get daily trends from Supabase cache
 */
export async function getDailyTrends(date: string): Promise<DailyTrendsData | null> {
  if (!isSupabaseConfigured()) {
    console.warn('[Supabase] Not configured - cannot fetch trends');
    return null;
  }

  const { data, error } = await supabase
    .from('daily_trends')
    .select('*')
    .eq('trend_date', date)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found - this is expected for new dates
      return null;
    }
    console.error('❌ Error fetching daily trends:', error);
    return null;
  }

  return {
    date: data.trend_date,
    topics: data.topics,
    trendingHashtags: data.trending_hashtags,
    suggestedHashtags: data.suggested_hashtags,
    fetchedAt: data.fetched_at,
  };
}

