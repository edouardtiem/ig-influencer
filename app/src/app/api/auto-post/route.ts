import { NextRequest, NextResponse } from 'next/server';
import { generateFromCalendar } from '@/lib/nanobanana';
import { postSingleImage, checkInstagramConnection } from '@/lib/instagram';
import { uploadImageFromUrl } from '@/lib/cloudinary';
import { generateCaption, fetchDailyTrends, DailyTrends } from '@/lib/perplexity';
import { 
  getPostingSlotsForDate, 
  generateContentBrief, 
  getCurrentSlot,
  PostingSlot,
} from '@/config/calendar';
import { getActiveLocationById } from '@/config/locations';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface AutoPostResult {
  success: boolean;
  error?: string;
  imageUrl?: string;
  caption?: string;
  hashtags?: string[];
  timestamp: string;
  metadata?: {
    location: string;
    action: string;
    outfit: string;
    lighting: string;
    slot: string;
    contentType: string;
  };
}

// ═══════════════════════════════════════════════════════════════
// SECURITY
// ═══════════════════════════════════════════════════════════════

function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.warn('[Auto-Post] CRON_SECRET not configured - allowing in development');
    return process.env.NODE_ENV === 'development';
  }
  
  const authHeader = request.headers.get('authorization');
  const providedSecret = authHeader?.replace('Bearer ', '');
  
  return providedSecret === cronSecret;
}

// ═══════════════════════════════════════════════════════════════
// TRENDS CACHE
// ═══════════════════════════════════════════════════════════════

let cachedTrends: DailyTrends | null = null;
let trendsDate: string | null = null;

async function getTodaysTrends(): Promise<DailyTrends | null> {
  const today = new Date().toISOString().split('T')[0];
  
  if (cachedTrends && trendsDate === today) {
    return cachedTrends;
  }
  
  const trends = await fetchDailyTrends();
  if (trends) {
    cachedTrends = trends;
    trendsDate = today;
  }
  
  return trends;
}

// ═══════════════════════════════════════════════════════════════
// MAIN AUTO-POST ENDPOINT
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/auto-post
 * 
 * Main endpoint called by cron-job.org to:
 * 1. Determine current slot from calendar
 * 2. Generate content brief (location, outfit, action, props)
 * 3. Generate image with Nano Banana Pro
 * 4. Generate caption with Perplexity (or fallback)
 * 5. Publish to Instagram via Make.com → Buffer
 * 
 * Optional query params:
 * - ?test=true : Don't publish, just generate
 * - ?slot=morning|midday|evening : Force specific slot
 */
export async function POST(request: NextRequest): Promise<NextResponse<AutoPostResult>> {
  const timestamp = new Date().toISOString();
  const searchParams = request.nextUrl.searchParams;
  const isTest = searchParams.get('test') === 'true';
  const forceSlot = searchParams.get('slot');
  
  // Security check (skip for test mode in development)
  if (!isTest && !verifyCronSecret(request)) {
    console.error(`[${timestamp}] ❌ Unauthorized request`);
    return NextResponse.json(
      { success: false, error: 'Unauthorized', timestamp },
      { status: 401 }
    );
  }
  
  console.log(`[${timestamp}] 🚀 Starting auto-post...`);
  if (isTest) console.log(`[${timestamp}] 🧪 TEST MODE - won't publish`);
  
  try {
    // ─────────────────────────────────────────────────────────────
    // STEP 1: Determine slot from calendar
    // ─────────────────────────────────────────────────────────────
    
    const now = new Date();
    const slots = getPostingSlotsForDate(now);
    let slot: PostingSlot | null;
    
    if (forceSlot) {
      slot = slots.find(s => s.id === forceSlot) || null;
      if (!slot) {
        return NextResponse.json({
          success: false,
          error: `Invalid slot: ${forceSlot}. Available: ${slots.map(s => s.id).join(', ')}`,
          timestamp,
        }, { status: 400 });
      }
      console.log(`[${timestamp}] 📅 Forced slot: ${slot.id}`);
    } else {
      slot = getCurrentSlot(now);
    }
    
    if (!slot) {
      return NextResponse.json({
        success: false,
        error: 'No slot available for current time',
        timestamp,
      }, { status: 400 });
    }
    
    console.log(`[${timestamp}] 📅 Slot: ${slot.id} (${slot.hour}:${slot.minute.toString().padStart(2, '0')})`);
    
    // ─────────────────────────────────────────────────────────────
    // STEP 2: Generate content brief
    // ─────────────────────────────────────────────────────────────
    
    const brief = generateContentBrief(slot);
    const location = getActiveLocationById(brief.location);
    
    if (!location) {
      return NextResponse.json({
        success: false,
        error: `Location not found: ${brief.location}`,
        timestamp,
      }, { status: 500 });
    }
    
    console.log(`[${timestamp}] 📍 Location: ${location.name}`);
    console.log(`[${timestamp}] 🎬 Content type: ${brief.contentType}`);
    console.log(`[${timestamp}] 👗 Outfit: ${brief.selectedOutfit.slice(0, 50)}...`);
    console.log(`[${timestamp}] 🎭 Action: ${brief.selectedPose.slice(0, 50)}...`);
    console.log(`[${timestamp}] 💡 Lighting: ${brief.lighting}`);
    
    // ─────────────────────────────────────────────────────────────
    // STEP 3: Generate image with Nano Banana Pro
    // ─────────────────────────────────────────────────────────────
    
    console.log(`[${timestamp}] 🎨 Generating image...`);
    const startTime = Date.now();
    
    const imageResult = await generateFromCalendar(
      brief.location,
      brief.selectedPose,
      brief.selectedExpression,
      brief.selectedOutfit,
      brief.lighting,
      brief.mood,
      brief.selectedProps
    );
    
    const genDuration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (!imageResult.success || !imageResult.imageUrl) {
      console.error(`[${timestamp}] ❌ Image generation failed:`, imageResult.error);
      return NextResponse.json({
        success: false,
        error: imageResult.error || 'Image generation failed',
        timestamp,
      }, { status: 500 });
    }
    
    console.log(`[${timestamp}] ✅ Image generated in ${genDuration}s`);
    
    // ─────────────────────────────────────────────────────────────
    // STEP 4: Generate caption with Perplexity
    // ─────────────────────────────────────────────────────────────
    
    console.log(`[${timestamp}] 📝 Generating caption...`);
    
    const trends = await getTodaysTrends();
    const captionResult = await generateCaption(
      brief.contentType,
      location.name,
      brief.selectedPose,
      trends || undefined
    );
    
    const caption = captionResult?.caption || 'Living my best life ✨';
    const hashtags = captionResult?.hashtags || ['#lifestyle', '#paris', '#frenchgirl'];
    const fullCaption = `${caption}\n\n${hashtags.join(' ')}`;
    
    console.log(`[${timestamp}] 📝 Caption: ${caption}`);
    console.log(`[${timestamp}] # Hashtags: ${hashtags.length}`);
    
    // ─────────────────────────────────────────────────────────────
    // STEP 5: Upload to Cloudinary (Instagram needs public URL)
    // ─────────────────────────────────────────────────────────────
    
    if (isTest) {
      console.log(`[${timestamp}] 🧪 TEST MODE - skipping upload & publish`);
      return NextResponse.json({
        success: true,
        imageUrl: imageResult.imageUrl,
        caption: fullCaption,
        hashtags,
        timestamp,
        metadata: {
          location: location.name,
          action: brief.selectedPose,
          outfit: brief.selectedOutfit,
          lighting: brief.lighting,
          slot: slot.id,
          contentType: brief.contentType,
        },
      });
    }
    
    console.log(`[${timestamp}] ☁️ Uploading to Cloudinary...`);
    
    const cloudinaryResult = await uploadImageFromUrl(imageResult.imageUrl);
    
    if (!cloudinaryResult.success || !cloudinaryResult.url) {
      console.error(`[${timestamp}] ❌ Cloudinary upload failed:`, cloudinaryResult.error);
      return NextResponse.json({
        success: false,
        error: cloudinaryResult.error || 'Cloudinary upload failed',
        imageUrl: imageResult.imageUrl,
        caption: fullCaption,
        timestamp,
      }, { status: 500 });
    }
    
    console.log(`[${timestamp}] ✅ Uploaded to Cloudinary: ${cloudinaryResult.url}`);
    
    // ─────────────────────────────────────────────────────────────
    // STEP 6: Publish to Instagram
    // ─────────────────────────────────────────────────────────────
    
    console.log(`[${timestamp}] 📤 Publishing to Instagram...`);
    if (location.instagramLocationId) {
      console.log(`[${timestamp}] 📍 With location: ${location.name} (${location.instagramLocationId})`);
    }
    
    const publishResult = await postSingleImage(
      cloudinaryResult.url, 
      fullCaption,
      location.instagramLocationId
    );
    
    if (!publishResult.success) {
      console.error(`[${timestamp}] ❌ Publish failed:`, publishResult.error);
      return NextResponse.json({
        success: false,
        error: publishResult.error || 'Publish failed',
        imageUrl: imageResult.imageUrl,
        caption: fullCaption,
        timestamp,
      }, { status: 500 });
    }
    
    console.log(`[${timestamp}] ✅ Published successfully! Post ID: ${publishResult.postId}`);
    
    // ─────────────────────────────────────────────────────────────
    // SUCCESS
    // ─────────────────────────────────────────────────────────────
    
    return NextResponse.json({
      success: true,
      imageUrl: cloudinaryResult.url,
      caption: fullCaption,
      hashtags,
      timestamp,
      postId: publishResult.postId,
      metadata: {
        location: location.name,
        action: brief.selectedPose,
        outfit: brief.selectedOutfit,
        lighting: brief.lighting,
        slot: slot.id,
        contentType: brief.contentType,
      },
    });
    
  } catch (error) {
    console.error(`[${timestamp}] ❌ Unexpected error:`, error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
      timestamp,
    }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════
// STATUS ENDPOINT
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/auto-post
 * Health check / status endpoint
 */
export async function GET(): Promise<NextResponse> {
  const now = new Date();
  const slots = getPostingSlotsForDate(now);
  const currentSlot = getCurrentSlot(now);
  
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/auto-post',
    method: 'POST',
    authentication: 'Bearer token (CRON_SECRET)',
    testMode: 'Add ?test=true to skip publishing',
    forceSlot: 'Add ?slot=morning|midday|evening',
    currentTime: now.toISOString(),
    currentSlot: currentSlot ? {
      id: currentSlot.id,
      time: `${currentSlot.hour}:${currentSlot.minute.toString().padStart(2, '0')}`,
      lighting: currentSlot.lighting,
      locations: currentSlot.locations,
    } : null,
    todaySlots: slots.map(s => ({
      id: s.id,
      time: `${s.hour}:${s.minute.toString().padStart(2, '0')}`,
      lighting: s.lighting,
    })),
  });
}
