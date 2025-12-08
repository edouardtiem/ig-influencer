import { NextRequest, NextResponse } from 'next/server';
import { getDailyTrends, selectRelevantTopic, DailyTrends } from '@/lib/perplexity';

/**
 * POST /api/daily-trends-fetch
 * Fetch daily trends from Perplexity AI
 * 
 * Called by cron job at 6:00 AM daily
 * 
 * Body (optional):
 * - date: ISO date string (defaults to today)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authorization (cron secret)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse optional date
    const body = await request.json().catch(() => ({}));
    const date = body.date ? new Date(body.date) : new Date();

    console.log('[Daily Trends] Fetching trends for', date.toISOString().split('T')[0]);

    const trends = await getDailyTrends(date);

    if (!trends) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch trends from Perplexity',
        configured: !!process.env.PERPLEXITY_API_KEY,
      });
    }

    console.log('[Daily Trends] ✅ Fetched', trends.topics.length, 'topics and', trends.hashtags.length, 'hashtags');

    // TODO: Save to Supabase when implemented
    // await saveDailyTrends(trends);

    return NextResponse.json({
      success: true,
      trends,
    });

  } catch (error) {
    console.error('[Daily Trends] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * GET /api/daily-trends-fetch
 * Get today's trends (for testing/debugging)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateStr = searchParams.get('date');
    const date = dateStr ? new Date(dateStr) : new Date();

    const trends = await getDailyTrends(date);

    if (!trends) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch trends',
        configured: !!process.env.PERPLEXITY_API_KEY,
        message: process.env.PERPLEXITY_API_KEY 
          ? 'API key configured but request failed'
          : 'PERPLEXITY_API_KEY not configured in environment',
      });
    }

    return NextResponse.json({
      success: true,
      trends,
      usage: {
        selectTopic: 'Use selectRelevantTopic(trends.topics, context)',
        generateCaption: 'Use generateCaptionWithTrend(topic, baseCaption)',
        selectHashtags: 'Use selectHashtags(trends.hashtags, postType)',
      },
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

