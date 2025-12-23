import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface ScheduledPost {
  id: string;
  schedule_id: string;
  character: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  post_type: string;
  reel_type: string | null;
  location_name: string | null;
  mood: string | null;
  caption: string | null;
  image_urls: string[] | null;
  instagram_post_id: string | null;
  error_message: string | null;
  error_step: string | null;
  retry_count: number;
  max_retries: number;
  posted_at: string | null;
  created_at: string;
}

interface DayPosts {
  date: string;
  dayName: string;
  isToday: boolean;
  posts: ScheduledPost[];
  stats: {
    total: number;
    posted: number;
    pending: number;
    failed: number;
  };
}

/**
 * GET /api/calendar-posts
 * Fetch scheduled posts for a date range
 * 
 * Query params:
 * - start: Start date (YYYY-MM-DD), defaults to start of current week
 * - end: End date (YYYY-MM-DD), defaults to end of current week
 * - character: 'all' | 'mila' | 'elena'
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const character = searchParams.get('character') || 'all';
  
  // Calculate default week range (Monday to Sunday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const defaultStart = new Date(now);
  defaultStart.setDate(now.getDate() + mondayOffset);
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setDate(defaultStart.getDate() + 6);
  
  const startDate = searchParams.get('start') || defaultStart.toISOString().split('T')[0];
  const endDate = searchParams.get('end') || defaultEnd.toISOString().split('T')[0];
  const today = now.toISOString().split('T')[0];

  try {
    // Build query
    let query = supabase
      .from('scheduled_posts')
      .select('*')
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true });

    if (character !== 'all') {
      query = query.eq('character', character);
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group posts by date
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const postsByDate: Record<string, ScheduledPost[]> = {};
    
    // Initialize all dates in range
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);
    while (currentDate <= endDateObj) {
      const dateStr = currentDate.toISOString().split('T')[0];
      postsByDate[dateStr] = [];
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Group posts
    for (const post of posts || []) {
      if (postsByDate[post.scheduled_date]) {
        postsByDate[post.scheduled_date].push(post);
      }
    }

    // Build response
    const days: DayPosts[] = Object.entries(postsByDate).map(([date, dayPosts]) => {
      const dateObj = new Date(date + 'T12:00:00');
      const posted = dayPosts.filter(p => p.status === 'posted').length;
      const failed = dayPosts.filter(p => p.status === 'failed').length;
      const pending = dayPosts.length - posted - failed;

      return {
        date,
        dayName: dayNames[dateObj.getDay()],
        isToday: date === today,
        posts: dayPosts,
        stats: {
          total: dayPosts.length,
          posted,
          pending,
          failed,
        },
      };
    });

    // Calculate totals
    const allPosts = posts || [];
    const totals = {
      total: allPosts.length,
      posted: allPosts.filter(p => p.status === 'posted').length,
      scheduled: allPosts.filter(p => p.status === 'scheduled').length,
      generating: allPosts.filter(p => p.status === 'generating').length,
      images_ready: allPosts.filter(p => p.status === 'images_ready').length,
      posting: allPosts.filter(p => p.status === 'posting').length,
      failed: allPosts.filter(p => p.status === 'failed').length,
    };

    return NextResponse.json({
      startDate,
      endDate,
      today,
      character,
      days,
      totals,
    });

  } catch (err) {
    console.error('Calendar API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

