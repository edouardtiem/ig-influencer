import { NextRequest, NextResponse } from 'next/server';
import { 
  fetchDailyTrends, 
  generateCaption, 
  checkPerplexityStatus,
  combineHashtags,
  DailyTrends,
} from '@/lib/perplexity';

// Cache trends for the day (in-memory, will reset on server restart)
let cachedTrends: DailyTrends | null = null;
let cacheDate: string | null = null;

/**
 * GET /api/daily-trends
 * Fetch today's trends (cached)
 */
export async function GET() {
  const today = new Date().toISOString().split('T')[0];
  
  // Check API status first
  const status = await checkPerplexityStatus();
  
  // Return cached if same day
  if (cachedTrends && cacheDate === today) {
    return NextResponse.json({
      source: 'cache',
      perplexityStatus: status,
      ...cachedTrends,
    });
  }

  // Fetch fresh trends
  const trends = await fetchDailyTrends();
  
  if (trends) {
    cachedTrends = trends;
    cacheDate = today;
    
    return NextResponse.json({
      source: 'fresh',
      perplexityStatus: status,
      ...trends,
    });
  }

  // Return error or cached even if stale
  return NextResponse.json({
    source: cachedTrends ? 'stale-cache' : 'error',
    perplexityStatus: status,
    error: 'Failed to fetch trends',
    ...(cachedTrends || {}),
  }, { status: cachedTrends ? 200 : 500 });
}

/**
 * POST /api/daily-trends
 * Generate a caption for specific content
 * 
 * Body: { contentType, location, action }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentType, location, action } = body;

    if (!contentType || !location || !action) {
      return NextResponse.json({
        error: 'Missing required fields: contentType, location, action',
        usage: {
          contentType: 'e.g. "workout", "café_moment", "cozy_evening"',
          location: 'e.g. "L\'Usine Paris", "KB CaféShop", "Chambre Mila"',
          action: 'e.g. "doing squats on smith machine", "sipping coffee and working"',
        },
      }, { status: 400 });
    }

    // Get cached trends if available
    const today = new Date().toISOString().split('T')[0];
    let trends = cachedTrends;
    
    if (!trends || cacheDate !== today) {
      trends = await fetchDailyTrends();
      if (trends) {
        cachedTrends = trends;
        cacheDate = today;
      }
    }

    // Generate caption
    const caption = await generateCaption(contentType, location, action, trends || undefined);

    if (!caption) {
      return NextResponse.json({
        error: 'Failed to generate caption',
      }, { status: 500 });
    }

    // Combine hashtags with trending ones
    const combinedHashtags = combineHashtags(
      [...(trends?.trendingHashtags || []), ...caption.hashtags],
      contentType
    );

    return NextResponse.json({
      success: true,
      caption: caption.caption,
      hashtags: combinedHashtags,
      mood: caption.mood,
      trendsUsed: !!trends,
      formattedPost: `${caption.caption}\n\n${combinedHashtags.join(' ')}`,
    });

  } catch (error) {
    console.error('[Daily Trends] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

