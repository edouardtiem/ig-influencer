import { NextRequest, NextResponse } from 'next/server';
import { generateFromCalendar } from '@/lib/nanobanana';
import { generateContextualSchema, validateInput } from '@/lib/validations';
import {
  getPostingSlotsForDate,
  generateContentBrief,
  getCurrentSlot,
  LightingCondition,
} from '@/config/calendar';
import { getActiveLocationById, ACTIVE_LOCATIONS } from '@/config/locations';

/**
 * POST /api/generate-contextual
 * Generate an image using the intelligent calendar system
 * 
 * Body options:
 * - auto: true → Use current time slot
 * - locationId: string → Override location
 * - slotId: string → Use specific slot (morning, midday, evening)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    // Validate input with Zod
    const validation = validateInput(generateContextualSchema, body);
    if (!validation.success || !validation.data) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error || 'Unknown validation error',
        usage: {
          auto: 'POST with { "auto": true } to use current time slot',
          slotId: 'POST with { "slotId": "morning|midday|evening" } for specific slot',
          locationId: 'POST with { "locationId": "home_bedroom" } for specific location',
        },
      }, { status: 400 });
    }
    
    const validatedData = validation.data;
    const { auto = false, locationId, slotId } = validatedData;
    
    const now = new Date();
    let brief;
    let usedLocationId: string;
    
    if (auto || slotId) {
      // ─────────────────────────────────────────────────────────────
      // AUTO MODE: Use calendar to determine content
      // ─────────────────────────────────────────────────────────────
      
      const slots = getPostingSlotsForDate(now);
      const targetSlot = slotId 
        ? slots.find(s => s.id === slotId) || getCurrentSlot(now)
        : getCurrentSlot(now);
      
      if (!targetSlot) {
        return NextResponse.json({ error: 'No slot found for current time' }, { status: 400 });
      }
      
      brief = generateContentBrief(targetSlot);
      usedLocationId = locationId || brief.location;
      
      console.log('[Generate Contextual] Auto mode:', {
        slot: targetSlot.id,
        location: usedLocationId,
        contentType: brief.contentType,
        lighting: brief.lighting,
      });
      
    } else if (locationId) {
      // ─────────────────────────────────────────────────────────────
      // MANUAL MODE: Use provided location with default brief
      // ─────────────────────────────────────────────────────────────
      
      const location = getActiveLocationById(locationId);
      if (!location) {
        return NextResponse.json({ 
          error: `Location not found: ${locationId}`,
          availableLocations: ACTIVE_LOCATIONS.map(l => ({ id: l.id, name: l.name })),
        }, { status: 400 });
      }
      
      usedLocationId = locationId;
      
      // Generate a simple brief for manual mode
      brief = {
        location: locationId,
        contentType: 'lifestyle',
        selectedPose: 'natural relaxed pose, casual comfortable stance',
        selectedExpression: 'confident warm smile, direct eye contact',
        selectedOutfit: 'casual chic outfit appropriate for the setting',
        selectedProps: [],
        lighting: 'daylight' as LightingCondition,
        mood: location.mood,
      };
      
      console.log('[Generate Contextual] Manual mode:', {
        location: usedLocationId,
        mood: location.mood,
      });
      
    } else {
      return NextResponse.json({ 
        error: 'Either auto=true, slotId, or locationId is required',
        usage: {
          auto: 'POST with { "auto": true } to use current time slot',
          slotId: 'POST with { "slotId": "morning|midday|evening" } for specific slot',
          locationId: 'POST with { "locationId": "home_bedroom" } for specific location',
        },
        availableLocations: ACTIVE_LOCATIONS.map(l => ({ id: l.id, name: l.name })),
      }, { status: 400 });
    }
    
    // ─────────────────────────────────────────────────────────────
    // GENERATE IMAGE
    // ─────────────────────────────────────────────────────────────
    
    const location = getActiveLocationById(usedLocationId);
    if (!location) {
      return NextResponse.json({ error: `Location not found: ${usedLocationId}` }, { status: 400 });
    }
    
    console.log('[Generate Contextual] Starting generation...');
    console.log('[Generate Contextual] Location:', location.name);
    console.log('[Generate Contextual] Has reference image:', !!location.referenceImageUrl);
    
    const startTime = Date.now();
    
    const result = await generateFromCalendar(
      usedLocationId,
      brief.selectedPose,
      brief.selectedExpression,
      brief.selectedOutfit,
      brief.lighting,
      brief.mood,
      brief.selectedProps
    );
    
    const duration = (Date.now() - startTime) / 1000;
    
    if (!result.success) {
      console.error('[Generate Contextual] Generation failed:', result.error);
      return NextResponse.json({ 
        error: result.error,
        brief,
        location: location.name,
      }, { status: 500 });
    }
    
    console.log('[Generate Contextual] ✅ Success in', duration.toFixed(1), 'seconds');
    
    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      duration: `${duration.toFixed(1)}s`,
      metadata: {
        location: location.name,
        locationId: usedLocationId,
        hasLocationReference: !!location.referenceImageUrl,
        contentType: brief.contentType,
        pose: brief.selectedPose,
        expression: brief.selectedExpression,
        outfit: brief.selectedOutfit,
        lighting: brief.lighting,
        mood: brief.mood,
        props: brief.selectedProps,
      },
    });
    
  } catch (error) {
    console.error('[Generate Contextual] Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * GET /api/generate-contextual
 * Returns info about available locations and current schedule
 */
export async function GET() {
  const now = new Date();
  const slots = getPostingSlotsForDate(now);
  const currentSlot = getCurrentSlot(now);
  
  return NextResponse.json({
    currentTime: now.toISOString(),
    currentSlot: currentSlot ? {
      id: currentSlot.id,
      time: `${currentSlot.hour}:${currentSlot.minute.toString().padStart(2, '0')}`,
      locations: currentSlot.locations,
      lighting: currentSlot.lighting,
    } : null,
    todaySlots: slots.map(s => ({
      id: s.id,
      time: `${s.hour}:${s.minute.toString().padStart(2, '0')}`,
      locations: s.locations,
      lighting: s.lighting,
    })),
    availableLocations: ACTIVE_LOCATIONS.map(l => ({
      id: l.id,
      name: l.name,
      category: l.category,
      hasReferenceImage: !!l.referenceImageUrl,
      compatibleSlots: l.compatibleSlots,
    })),
    usage: {
      auto: 'POST with { "auto": true }',
      bySlot: 'POST with { "slotId": "morning" }',
      byLocation: 'POST with { "locationId": "home_bedroom" }',
    },
  });
}

