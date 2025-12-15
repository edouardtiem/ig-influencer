import { NextRequest, NextResponse } from 'next/server';
import { generateFromCalendar } from '@/lib/nanobanana';
import { postCarousel } from '@/lib/instagram';
import { uploadImageFromUrl } from '@/lib/cloudinary';
import { generateCaption, fetchDailyTrends, DailyTrends } from '@/lib/perplexity';
import { 
  getPostingSlotsForDate, 
  generateContentBrief, 
  getCurrentSlot,
  PostingSlot,
  LOCATION_ACTIONS,
} from '@/config/calendar';
import { getActiveLocationById } from '@/config/locations';

// ═══════════════════════════════════════════════════════════════
// CAROUSEL CONFIG
// ═══════════════════════════════════════════════════════════════

const CAROUSEL_SIZE = 3; // Number of images per carousel

// Hero expressions (Photo 1 - most engaging)
const HERO_EXPRESSIONS = [
  'confident sultry gaze, slight smile playing on lips, direct eye contact',
  'warm inviting smile, eyes sparkling, approachable but alluring',
  'confident stare, slight smile, powerful feminine energy',
];

// Secondary expressions (Photo 2, 3 - varied)
const SECONDARY_EXPRESSIONS = [
  'soft sensual expression, eyes slightly hooded, natural allure',
  'playful smirk, knowing look, effortless confidence',
  'pensive look with soft smile, gazing slightly away, mysterious charm',
  'genuine laugh, eyes crinkled, natural beauty',
  'candid moment, caught mid-action, authentic',
];

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface AutoPostResult {
  success: boolean;
  error?: string;
  imageUrls?: string[]; // Carousel images
  caption?: string;
  hashtags?: string[];
  timestamp: string;
  postId?: string;
  metadata?: {
    location: string;
    actions: string[]; // Multiple actions for carousel
    outfit: string;
    lighting: string;
    slot: string;
    contentType: string;
    carouselSize: number;
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
 * Main endpoint for automated carousel posting:
 * 1. Determine current slot from calendar
 * 2. Generate content brief (location, outfit, actions, props)
 * 3. Generate 3 images with scene consistency chain
 * 4. Upload each to Cloudinary
 * 5. Generate caption with Perplexity
 * 6. Publish carousel to Instagram
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
  
  console.log(`[${timestamp}] 🚀 Starting auto-post (CAROUSEL MODE - ${CAROUSEL_SIZE} images)...`);
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
    // STEP 2: Generate content briefs for carousel (3 different poses)
    // ─────────────────────────────────────────────────────────────
    
    // Generate base brief
    const baseBrief = generateContentBrief(slot);
    const location = getActiveLocationById(baseBrief.location);
    
    if (!location) {
      return NextResponse.json({
        success: false,
        error: `Location not found: ${baseBrief.location}`,
        timestamp,
      }, { status: 500 });
    }
    
    // Generate 3 different poses/actions for the carousel from LOCATION_ACTIONS
    const locationActions = LOCATION_ACTIONS[baseBrief.location] || [];
    const poses: string[] = [baseBrief.selectedPose];
    
    // Get more poses from location actions (avoid duplicates)
    const availablePoses = locationActions.filter(p => p !== baseBrief.selectedPose);
    const shuffled = availablePoses.sort(() => Math.random() - 0.5);
    poses.push(...shuffled.slice(0, CAROUSEL_SIZE - 1));
    
    // Fallback: generate slight variations if not enough poses
    while (poses.length < CAROUSEL_SIZE) {
      poses.push(baseBrief.selectedPose + ', slightly different angle and expression');
    }
    
    console.log(`[${timestamp}] 📍 Location: ${location.name}`);
    console.log(`[${timestamp}] 🎬 Content type: ${baseBrief.contentType}`);
    console.log(`[${timestamp}] 👗 Outfit: ${baseBrief.selectedOutfit.slice(0, 50)}...`);
    console.log(`[${timestamp}] 🎭 Actions (${CAROUSEL_SIZE}):`, poses.map(p => p.slice(0, 30) + '...'));
    console.log(`[${timestamp}] 💡 Lighting: ${baseBrief.lighting}`);
    
    // ─────────────────────────────────────────────────────────────
    // STEP 3: Generate carousel images with scene consistency
    // ─────────────────────────────────────────────────────────────
    
    const cloudinaryUrls: string[] = [];
    const actions: string[] = [];
    let previousImageUrl: string | undefined;
    
    for (let i = 0; i < CAROUSEL_SIZE; i++) {
      const photoNum = i + 1;
      const pose = poses[i];
      const isHeroShot = i === 0;
      
      // Hero shot gets confident expression, others get varied expressions
      const expression = isHeroShot
        ? HERO_EXPRESSIONS[Math.floor(Math.random() * HERO_EXPRESSIONS.length)]
        : SECONDARY_EXPRESSIONS[Math.floor(Math.random() * SECONDARY_EXPRESSIONS.length)];
      
      console.log(`[${timestamp}] 🎨 Generating Photo ${photoNum}/${CAROUSEL_SIZE}...`);
      if (previousImageUrl) {
        console.log(`[${timestamp}]    ↳ Using Photo ${photoNum - 1} as scene reference`);
      }
      
      const startTime = Date.now();
      
      const imageResult = await generateFromCalendar(
        baseBrief.location,
        pose,
        expression,
        baseBrief.selectedOutfit,
        baseBrief.lighting,
        baseBrief.mood,
        baseBrief.selectedProps,
        previousImageUrl, // Scene reference from previous photo
        true // Force strong consistency
      );
      
      const genDuration = ((Date.now() - startTime) / 1000).toFixed(1);
      
      if (!imageResult.success || !imageResult.imageUrl) {
        console.error(`[${timestamp}] ❌ Photo ${photoNum} generation failed:`, imageResult.error);
        // Continue with partial carousel if we have at least 2 images
        if (cloudinaryUrls.length >= 2) {
          console.log(`[${timestamp}] ⚠️ Continuing with ${cloudinaryUrls.length} images`);
          break;
        }
        return NextResponse.json({
          success: false,
          error: `Photo ${photoNum} generation failed: ${imageResult.error}`,
          timestamp,
        }, { status: 500 });
      }
      
      console.log(`[${timestamp}] ✅ Photo ${photoNum} generated in ${genDuration}s`);
      
      // Upload to Cloudinary immediately
      console.log(`[${timestamp}] ☁️ Uploading Photo ${photoNum} to Cloudinary...`);
      
      const cloudinaryResult = await uploadImageFromUrl(imageResult.imageUrl);
      
      if (!cloudinaryResult.success || !cloudinaryResult.url) {
        console.error(`[${timestamp}] ❌ Cloudinary upload failed for Photo ${photoNum}:`, cloudinaryResult.error);
        if (cloudinaryUrls.length >= 2) {
          console.log(`[${timestamp}] ⚠️ Continuing with ${cloudinaryUrls.length} images`);
          break;
        }
        return NextResponse.json({
          success: false,
          error: `Cloudinary upload failed for Photo ${photoNum}: ${cloudinaryResult.error}`,
          timestamp,
        }, { status: 500 });
      }
      
      console.log(`[${timestamp}] ✅ Photo ${photoNum} uploaded: ${cloudinaryResult.url}`);
      
      cloudinaryUrls.push(cloudinaryResult.url);
      actions.push(pose);
      
      // Use THIS photo's Cloudinary URL as reference for the NEXT photo
      previousImageUrl = cloudinaryResult.url;
    }
    
    console.log(`[${timestamp}] 📸 Carousel ready: ${cloudinaryUrls.length} images`);
    
    // ─────────────────────────────────────────────────────────────
    // STEP 4: Generate caption with Perplexity
    // ─────────────────────────────────────────────────────────────
    
    console.log(`[${timestamp}] 📝 Generating caption...`);
    
    const trends = await getTodaysTrends();
    const captionResult = await generateCaption(
      baseBrief.contentType,
      location.name,
      actions[0], // Use main action for caption
      trends || undefined
    );
    
    const caption = captionResult?.caption || 'Living my best life ✨';
    const hashtags = captionResult?.hashtags || ['#lifestyle', '#paris', '#frenchgirl'];
    const fullCaption = `${caption}\n\n${hashtags.join(' ')}`;
    
    console.log(`[${timestamp}] 📝 Caption: ${caption}`);
    console.log(`[${timestamp}] # Hashtags: ${hashtags.length}`);
    
    // ─────────────────────────────────────────────────────────────
    // STEP 5: Skip publish in test mode
    // ─────────────────────────────────────────────────────────────
    
    if (isTest) {
      console.log(`[${timestamp}] 🧪 TEST MODE - skipping publish`);
      return NextResponse.json({
        success: true,
        imageUrls: cloudinaryUrls,
        caption: fullCaption,
        hashtags,
        timestamp,
        metadata: {
          location: location.name,
          actions,
          outfit: baseBrief.selectedOutfit,
          lighting: baseBrief.lighting,
          slot: slot.id,
          contentType: baseBrief.contentType,
          carouselSize: cloudinaryUrls.length,
        },
      });
    }
    
    // ─────────────────────────────────────────────────────────────
    // STEP 6: Publish carousel to Instagram
    // ─────────────────────────────────────────────────────────────
    
    console.log(`[${timestamp}] 📤 Publishing carousel to Instagram (${cloudinaryUrls.length} images)...`);
    if (location.instagramLocationId) {
      console.log(`[${timestamp}] 📍 With location: ${location.name} (${location.instagramLocationId})`);
    }
    
    const publishResult = await postCarousel(cloudinaryUrls, fullCaption);
    
    if (!publishResult.success) {
      console.error(`[${timestamp}] ❌ Publish failed:`, publishResult.error);
      return NextResponse.json({
        success: false,
        error: publishResult.error || 'Publish failed',
        imageUrls: cloudinaryUrls,
        caption: fullCaption,
        timestamp,
      }, { status: 500 });
    }
    
    console.log(`[${timestamp}] ✅ Carousel published successfully! Post ID: ${publishResult.postId}`);
    
    // ─────────────────────────────────────────────────────────────
    // SUCCESS
    // ─────────────────────────────────────────────────────────────
    
    return NextResponse.json({
      success: true,
      imageUrls: cloudinaryUrls,
      caption: fullCaption,
      hashtags,
      timestamp,
      postId: publishResult.postId,
      metadata: {
        location: location.name,
        actions,
        outfit: baseBrief.selectedOutfit,
        lighting: baseBrief.lighting,
        slot: slot.id,
        contentType: baseBrief.contentType,
        carouselSize: cloudinaryUrls.length,
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
