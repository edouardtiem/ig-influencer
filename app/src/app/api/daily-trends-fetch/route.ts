import { NextRequest, NextResponse } from 'next/server';
import { fetchDailyTrends } from '@/lib/perplexity';
import { dailyTrendsSchema, validateInput } from '@/lib/validations';

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

    // Parse and validate optional date
    const body = await request.json().catch(() => ({}));
    const validation = validateInput(dailyTrendsSchema, body);
    if (!validation.success || !validation.data) {
      return NextResponse.json({
        success: false,
        error: validation.error || 'Validation failed',
      }, { status: 400 });
    }
    
    const validatedData = validation.data;
    const date = validatedData.date ? new Date(validatedData.date) : new Date();

    console.log('[Daily Trends] Fetching trends for', date.toISOString().split('T')[0]);

    const trends = await fetchDailyTrends();

    if (!trends) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch trends from Perplexity',
        configured: !!process.env.PERPLEXITY_API_KEY,
      });
    }

    console.log('[Daily Trends] ✅ Fetched', trends.topics.length, 'topics and', trends.trendingHashtags.length, 'hashtags');

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
 * Protected by CRON_SECRET to prevent unauthorized API usage
 */
export async function GET(request: NextRequest) {
  try {
    // Check authorization (cron secret)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const dateStr = searchParams.get('date');
    const date = dateStr ? new Date(dateStr) : new Date();

    const trends = await fetchDailyTrends();

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
        selectTopic: 'Use trends.topics to get relevant topics',
        generateCaption: 'Use generateCaption from @/lib/perplexity',
        selectHashtags: 'Use trends.trendingHashtags for hashtags',
      },
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

