import { NextRequest, NextResponse } from 'next/server';
import { supabase, CharacterName } from '@/lib/supabase';

interface Post {
  id: string;
  posted_at: string | null;
  impressions: number | null;
  reach: number | null;
  likes_count: number | null;
  comments_count: number | null;
  saves_count: number | null;
  character_name: string;
  location_name: string | null;
  engagement_rate: number | null;
  caption: string | null;
}

interface Snapshot {
  snapshot_date: string;
  character: string;
  followers_count: number | null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const character = searchParams.get('character') as CharacterName | 'all' | null;
  const days = parseInt(searchParams.get('days') || '30');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // End date = yesterday at 23:59:59 (exclude today's incomplete data)
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 1);
  endDate.setHours(23, 59, 59, 999);

  // Previous period for comparison
  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - days);
  const prevEndDate = new Date(startDate);
  prevEndDate.setDate(prevEndDate.getDate() - 1);

  try {
    // Get posts with impressions grouped by day (excluding today)
    let postsQuery = supabase
      .from('posts')
      .select('id, posted_at, impressions, reach, likes_count, comments_count, saves_count, character_name, location_name, engagement_rate, caption')
      .gte('posted_at', startDate.toISOString())
      .lte('posted_at', endDate.toISOString())
      .order('posted_at', { ascending: true });

    if (character && character !== 'all') {
      postsQuery = postsQuery.eq('character_name', character);
    }

    const { data: posts, error: postsError } = await postsQuery;
    if (postsError) throw postsError;

    // Get previous period posts for comparison
    let prevPostsQuery = supabase
      .from('posts')
      .select('impressions, reach, likes_count, comments_count, saves_count')
      .gte('posted_at', prevStartDate.toISOString())
      .lte('posted_at', prevEndDate.toISOString());

    if (character && character !== 'all') {
      prevPostsQuery = prevPostsQuery.eq('character_name', character);
    }

    const { data: prevPosts } = await prevPostsQuery;

    // Aggregate by day
    const dailyData: Record<string, {
      date: string;
      impressions: number;
      reach: number;
      likes: number;
      comments: number;
      saves: number;
      posts: number;
    }> = {};

    (posts as Post[] | null)?.forEach((post) => {
      if (!post.posted_at) return;
      const date = post.posted_at.split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { date, impressions: 0, reach: 0, likes: 0, comments: 0, saves: 0, posts: 0 };
      }
      dailyData[date].impressions += post.impressions || 0;
      dailyData[date].reach += post.reach || 0;
      dailyData[date].likes += post.likes_count || 0;
      dailyData[date].comments += post.comments_count || 0;
      dailyData[date].saves += post.saves_count || 0;
      dailyData[date].posts += 1;
    });

    // Get analytics snapshots for followers growth (excluding today)
    const yesterdayStr = endDate.toISOString().split('T')[0];
    let snapshotsQuery = supabase
      .from('analytics_snapshots')
      .select('*')
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .lte('snapshot_date', yesterdayStr)
      .order('snapshot_date', { ascending: true });

    if (character && character !== 'all') {
      snapshotsQuery = snapshotsQuery.eq('character', character);
    }

    const { data: snapshots } = await snapshotsQuery;

    // Calculate totals
    const typedPosts = posts as Post[] | null;
    const totals = {
      impressions: typedPosts?.reduce((sum: number, p: Post) => sum + (p.impressions || 0), 0) || 0,
      reach: typedPosts?.reduce((sum: number, p: Post) => sum + (p.reach || 0), 0) || 0,
      likes: typedPosts?.reduce((sum: number, p: Post) => sum + (p.likes_count || 0), 0) || 0,
      comments: typedPosts?.reduce((sum: number, p: Post) => sum + (p.comments_count || 0), 0) || 0,
      saves: typedPosts?.reduce((sum: number, p: Post) => sum + (p.saves_count || 0), 0) || 0,
      posts: typedPosts?.length || 0,
    };

    // Calculate previous period totals for comparison
    type PrevPost = { impressions: number | null; reach: number | null; likes_count: number | null; comments_count: number | null; saves_count: number | null };
    const typedPrevPosts = prevPosts as PrevPost[] | null;
    const prevTotals = {
      impressions: typedPrevPosts?.reduce((sum: number, p: PrevPost) => sum + (p.impressions || 0), 0) || 0,
      reach: typedPrevPosts?.reduce((sum: number, p: PrevPost) => sum + (p.reach || 0), 0) || 0,
      likes: typedPrevPosts?.reduce((sum: number, p: PrevPost) => sum + (p.likes_count || 0), 0) || 0,
      comments: typedPrevPosts?.reduce((sum: number, p: PrevPost) => sum + (p.comments_count || 0), 0) || 0,
      saves: typedPrevPosts?.reduce((sum: number, p: PrevPost) => sum + (p.saves_count || 0), 0) || 0,
      posts: typedPrevPosts?.length || 0,
    };

    // Calculate percentage changes
    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const changes = {
      impressions: calcChange(totals.impressions, prevTotals.impressions),
      reach: calcChange(totals.reach, prevTotals.reach),
      likes: calcChange(totals.likes, prevTotals.likes),
      comments: calcChange(totals.comments, prevTotals.comments),
      saves: calcChange(totals.saves, prevTotals.saves),
      posts: calcChange(totals.posts, prevTotals.posts),
    };

    // Calculate engagement rate (likes + comments + saves) / reach * 100
    const totalEngagement = totals.likes + totals.comments + totals.saves;
    const engagementRate = totals.reach > 0 
      ? Number(((totalEngagement / totals.reach) * 100).toFixed(2))
      : 0;
    
    const prevEngagement = prevTotals.likes + prevTotals.comments + prevTotals.saves;
    const prevEngagementRate = prevTotals.reach > 0
      ? Number(((prevEngagement / prevTotals.reach) * 100).toFixed(2))
      : 0;

    // Find best performers
    const sortedByImpressions = [...(typedPosts || [])].sort((a: Post, b: Post) => (b.impressions || 0) - (a.impressions || 0));
    const topPosts = sortedByImpressions.slice(0, 5).map((p: Post) => ({
      id: p.id,
      date: p.posted_at,
      impressions: p.impressions || 0,
      likes: p.likes_count || 0,
      caption: p.caption?.substring(0, 50) + (p.caption && p.caption.length > 50 ? '...' : ''),
      character: p.character_name,
    }));

    // Best performing location
    const locationStats: Record<string, { count: number; impressions: number; likes: number }> = {};
    typedPosts?.forEach((p: Post) => {
      const loc = p.location_name || 'Unknown';
      if (!locationStats[loc]) locationStats[loc] = { count: 0, impressions: 0, likes: 0 };
      locationStats[loc].count++;
      locationStats[loc].impressions += p.impressions || 0;
      locationStats[loc].likes += p.likes_count || 0;
    });
    
    const bestLocation = Object.entries(locationStats)
      .map(([name, stats]) => ({ name, avgImpressions: stats.count > 0 ? Math.round(stats.impressions / stats.count) : 0 }))
      .sort((a, b) => b.avgImpressions - a.avgImpressions)[0];

    // Best posting hour
    const hourStats: Record<number, { count: number; impressions: number }> = {};
    typedPosts?.forEach((p: Post) => {
      if (!p.posted_at) return;
      const hour = new Date(p.posted_at).getHours();
      if (!hourStats[hour]) hourStats[hour] = { count: 0, impressions: 0 };
      hourStats[hour].count++;
      hourStats[hour].impressions += p.impressions || 0;
    });
    
    const bestHour = Object.entries(hourStats)
      .map(([hour, stats]) => ({ hour: parseInt(hour), avgImpressions: stats.count > 0 ? Math.round(stats.impressions / stats.count) : 0 }))
      .sort((a, b) => b.avgImpressions - a.avgImpressions)[0];

    // Followers growth
    const typedSnapshots = snapshots as Snapshot[] | null;
    const firstSnapshot = typedSnapshots?.[0];
    const lastSnapshot = typedSnapshots?.[typedSnapshots.length - 1];
    const followersGrowth = lastSnapshot && firstSnapshot
      ? (lastSnapshot.followers_count || 0) - (firstSnapshot.followers_count || 0)
      : null;

    // Followers timeline for graph
    const followersTimeline = typedSnapshots?.map((s: Snapshot) => ({
      date: s.snapshot_date,
      followers: s.followers_count || 0,
      character: s.character,
    })) || [];

    return NextResponse.json({
      daily: Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date)),
      snapshots,
      totals,
      prevTotals,
      changes,
      engagementRate,
      prevEngagementRate,
      engagementChange: calcChange(engagementRate, prevEngagementRate),
      topPosts,
      bestLocation: bestLocation || null,
      bestHour: bestHour || null,
      followersGrowth,
      followersTimeline,
      currentFollowers: lastSnapshot?.followers_count || null,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

