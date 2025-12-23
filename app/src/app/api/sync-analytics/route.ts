import { NextRequest, NextResponse } from 'next/server';
import { supabase, CharacterName } from '@/lib/supabase';

const INSTAGRAM_GRAPH_API = 'https://graph.facebook.com/v21.0';

interface AccountConfig {
  name: string;
  accountId: string | undefined;
  accessToken: string | undefined;
}

const ACCOUNTS: Record<CharacterName, AccountConfig> = {
  mila: {
    name: 'Mila Verne',
    accountId: process.env.INSTAGRAM_ACCOUNT_ID,
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
  },
  elena: {
    name: 'Elena Visconti',
    accountId: process.env.INSTAGRAM_ACCOUNT_ID_ELENA,
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN_ELENA,
  },
};

// ===========================================
// FETCH ACCOUNT INFO (followers, etc.)
// ===========================================
async function fetchAccountInfo(accessToken: string, accountId: string) {
  const params = new URLSearchParams({
    fields: 'username,followers_count,follows_count,media_count',
    access_token: accessToken,
  });
  
  const response = await fetch(`${INSTAGRAM_GRAPH_API}/${accountId}?${params}`);
  return response.json();
}

// ===========================================
// FETCH RECENT MEDIA
// ===========================================
async function fetchRecentMedia(accessToken: string, accountId: string) {
  const params = new URLSearchParams({
    fields: 'id,caption,media_type,permalink,timestamp,like_count,comments_count',
    limit: '25',
    access_token: accessToken,
  });
  
  const response = await fetch(`${INSTAGRAM_GRAPH_API}/${accountId}/media?${params}`);
  const data = await response.json();
  return data.data || [];
}

// ===========================================
// FETCH POST INSIGHTS + ENGAGEMENT METRICS
// Uses new API v22 metrics: views (replaces impressions), reach, saved, shares
// Also fetches current like_count and comments_count
// ===========================================
async function fetchPostInsights(
  mediaId: string, 
  accessToken: string, 
  mediaType: string
): Promise<{ impressions: number; reach: number; saved?: number; shares?: number; likes?: number; comments?: number }> {
  // API v22: 'impressions' and 'plays' are deprecated, use 'views' instead
  // Works for all media types: IMAGE, CAROUSEL_ALBUM, VIDEO, REELS
  const metrics = 'views,reach,saved,shares,total_interactions';
  
  const params = new URLSearchParams({
    metric: metrics,
    access_token: accessToken,
  });

  try {
    // Fetch insights
    const response = await fetch(`${INSTAGRAM_GRAPH_API}/${mediaId}/insights?${params}`);
    const data = await response.json();
    
    const insights: Record<string, number> = {};
    if (data.data) {
      data.data.forEach((item: { name: string; values: { value: number }[] }) => {
        insights[item.name] = item.values?.[0]?.value || 0;
      });
    }
    
    // Also fetch current like_count and comments_count
    const mediaParams = new URLSearchParams({
      fields: 'like_count,comments_count',
      access_token: accessToken,
    });
    const mediaResponse = await fetch(`${INSTAGRAM_GRAPH_API}/${mediaId}?${mediaParams}`);
    const mediaData = await mediaResponse.json();
    
    // Map 'views' to 'impressions' for backward compatibility in our DB
    return {
      impressions: insights.views || 0,  // views = new impressions
      reach: insights.reach || 0,
      saved: insights.saved || 0,
      shares: insights.shares || 0,
      likes: mediaData.like_count || 0,
      comments: mediaData.comments_count || 0,
    };
  } catch (error) {
    console.error(`   ❌ Fetch insights error:`, error);
    return { impressions: 0, reach: 0 };
  }
}

// ===========================================
// UPDATE POST IN SUPABASE
// ===========================================
interface IGPost {
  id: string;
  caption?: string;
  media_type: string;
  permalink: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
}

async function updatePostInSupabase(
  character: CharacterName, 
  igPost: IGPost, 
  insights: { impressions: number; reach: number; saved?: number; shares?: number }
): Promise<{ action: 'updated' | 'inserted'; id?: string }> {
  const { data: existingPost } = await supabase
    .from('posts')
    .select('id')
    .eq('instagram_post_id', igPost.id)
    .single();

  const postData: Record<string, unknown> = {
    likes_count: igPost.like_count || 0,
    comments_count: igPost.comments_count || 0,
    reach: insights.reach || 0,
    impressions: insights.impressions || 0,
    saves_count: insights.saved || 0,
    shares_count: insights.shares || 0,
    analytics_updated_at: new Date().toISOString(),
  };

  // Calculate engagement rate
  if (insights.reach > 0) {
    postData.engagement_rate = Number(((igPost.like_count || 0) / insights.reach * 100).toFixed(2));
  }

  if (existingPost) {
    await supabase
      .from('posts')
      .update(postData)
      .eq('id', existingPost.id);
    
    return { action: 'updated', id: existingPost.id };
  } else {
    const mediaType = igPost.media_type === 'CAROUSEL_ALBUM' ? 'carousel' 
      : igPost.media_type === 'VIDEO' || igPost.media_type === 'REELS' ? 'reel' : 'photo';

    const newPost = {
      character_name: character,
      instagram_post_id: igPost.id,
      instagram_permalink: igPost.permalink,
      post_type: mediaType,
      caption: igPost.caption?.substring(0, 500),
      image_urls: [igPost.permalink],
      posted_at: igPost.timestamp,
      ...postData,
    };

    const { data } = await supabase
      .from('posts')
      .insert(newPost)
      .select('id')
      .single();

    return { action: 'inserted', id: data?.id };
  }
}

// ===========================================
// SAVE ANALYTICS SNAPSHOT
// ===========================================
async function saveAnalyticsSnapshot(
  character: CharacterName, 
  posts: IGPost[],
  accountInfo: { followers_count?: number; follows_count?: number; media_count?: number }
) {
  const today = new Date().toISOString().split('T')[0];
  
  const totalLikes = posts.reduce((sum, p) => sum + (p.like_count || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.comments_count || 0), 0);
  const avgEngagement = posts.length > 0 
    ? Number((totalLikes / posts.length / 100).toFixed(2))
    : 0;

  const snapshot = {
    character,
    snapshot_date: today,
    followers_count: accountInfo.followers_count || null,
    following_count: accountInfo.follows_count || null,
    posts_count: accountInfo.media_count || posts.length,
    total_likes_week: totalLikes,
    total_comments_week: totalComments,
    avg_engagement_rate: avgEngagement,
  };

  await supabase
    .from('analytics_snapshots')
    .upsert(snapshot, { onConflict: 'character,snapshot_date' });

  return snapshot;
}

// ===========================================
// SYNC SINGLE ACCOUNT - Updates ALL posts in DB
// ===========================================
async function syncAccount(character: CharacterName): Promise<{
  character: string;
  success: boolean;
  message: string;
  updated?: number;
  inserted?: number;
  followers?: number;
}> {
  const account = ACCOUNTS[character];
  
  if (!account.accountId || !account.accessToken) {
    return { 
      character, 
      success: false, 
      message: 'Missing Instagram credentials' 
    };
  }

  try {
    // Fetch account info
    const accountInfo = await fetchAccountInfo(account.accessToken, account.accountId);
    
    if (accountInfo.error) {
      return { 
        character, 
        success: false, 
        message: accountInfo.error.message || 'Failed to fetch account info'
      };
    }

    // Get ALL posts from Supabase for this character (not just 25)
    const { data: dbPosts } = await supabase
      .from('posts')
      .select('id, instagram_post_id, likes_count, comments_count')
      .eq('character_name', character)
      .not('instagram_post_id', 'is', null);

    let updated = 0;
    const igPosts: IGPost[] = [];

    // Update insights for all existing posts in DB
    if (dbPosts && dbPosts.length > 0) {
      for (const dbPost of dbPosts) {
        if (!dbPost.instagram_post_id) continue;
        
        const insights = await fetchPostInsights(
          dbPost.instagram_post_id, 
          account.accessToken!, 
          'IMAGE' // Media type doesn't matter for new API
        );
        
        // Update the post in Supabase (including likes/comments!)
        await supabase
          .from('posts')
          .update({
            impressions: insights.impressions,
            reach: insights.reach,
            saves_count: insights.saved || 0,
            shares_count: insights.shares || 0,
            likes_count: insights.likes || dbPost.likes_count || 0,
            comments_count: insights.comments || dbPost.comments_count || 0,
            analytics_updated_at: new Date().toISOString(),
          })
          .eq('id', dbPost.id);
        
        updated++;
        
        // Build igPosts for snapshot calculation with fresh data
        igPosts.push({
          id: dbPost.instagram_post_id,
          media_type: 'IMAGE',
          permalink: '',
          timestamp: new Date().toISOString(),
          like_count: insights.likes || dbPost.likes_count || 0,
          comments_count: insights.comments || dbPost.comments_count || 0,
        });
        
        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 80));
      }
    }

    // Also fetch recent media to catch any new posts
    const recentMedia = await fetchRecentMedia(account.accessToken, account.accountId);
    let inserted = 0;
    
    for (const post of recentMedia) {
      // Check if post already exists
      const exists = dbPosts?.some((p: { instagram_post_id: string | null }) => p.instagram_post_id === post.id);
      if (exists) continue;
      
      // New post - insert it
      const insights = await fetchPostInsights(post.id, account.accessToken!, post.media_type);
      const result = await updatePostInSupabase(character, post, insights);
      
      if (result.action === 'inserted') inserted++;
      
      await new Promise(r => setTimeout(r, 80));
    }

    // Save snapshot
    await saveAnalyticsSnapshot(character, igPosts.length > 0 ? igPosts : recentMedia, accountInfo);

    return {
      character,
      success: true,
      message: `Synced ${updated} existing + ${inserted} new posts`,
      updated,
      inserted,
      followers: accountInfo.followers_count,
    };
  } catch (error) {
    return {
      character,
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ===========================================
// API ROUTE HANDLER
// ===========================================
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const character = searchParams.get('character') as CharacterName | 'all' | null;

  const results: Array<{
    character: string;
    success: boolean;
    message: string;
    updated?: number;
    inserted?: number;
    followers?: number;
  }> = [];

  if (character === 'mila') {
    results.push(await syncAccount('mila'));
  } else if (character === 'elena') {
    results.push(await syncAccount('elena'));
  } else {
    // Sync both
    results.push(await syncAccount('mila'));
    results.push(await syncAccount('elena'));
  }

  const allSuccess = results.every(r => r.success);
  
  return NextResponse.json({
    success: allSuccess,
    results,
    syncedAt: new Date().toISOString(),
  }, { status: allSuccess ? 200 : 207 });
}

// GET endpoint to check last sync status
export async function GET() {
  const { data: lastSnapshots } = await supabase
    .from('analytics_snapshots')
    .select('character, snapshot_date, followers_count, created_at')
    .order('created_at', { ascending: false })
    .limit(2);

  return NextResponse.json({
    lastSync: lastSnapshots?.[0]?.created_at || null,
    snapshots: lastSnapshots,
  });
}

