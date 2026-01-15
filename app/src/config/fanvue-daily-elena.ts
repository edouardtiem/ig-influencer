/**
 * Elena Fanvue Daily Content Calendar
 * 
 * Safe-sexy prompts optimized to pass Nano Banana Pro filters
 * Using vocabulary from docs/19-QUALITY-SEXY-STRATEGY.md
 * 
 * Rotation: 14 days of content, then repeat
 */

// ═══════════════════════════════════════════════════════════════
// ELENA CHARACTER BASE
// ═══════════════════════════════════════════════════════════════

export const ELENA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';
export const ELENA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png';

export const REFERENCE_INSTRUCTION = `You are provided with reference images in order:

**IMAGE 1 (FACE REFERENCE)**: This is Elena's face. Copy this EXACTLY:
- Same soft round pleasant face shape (NOT angular, NOT sharp jawline)
- Same smooth feminine jawline and rounded chin
- Same honey brown warm almond-shaped eyes
- Same naturally full lips nude-pink color
- Same small beauty mark on right cheekbone (SIGNATURE MARK)
- Same bronde hair with VISIBLE golden blonde balayage highlights
- Same naturally thick well-groomed eyebrows

**IMAGE 2 (BODY REFERENCE)**: This is Elena's body. Match these proportions EXACTLY:
- Same feminine shapely figure (NOT skinny, NOT thin)
- Same very large natural F-cup breasts (prominent, NOT reduced)
- Same narrow defined waist
- Same wide feminine hips

CRITICAL: Face MUST be identical to Image 1. Body proportions MUST match Image 2.`;

export const ELENA_BASE = `soft round pleasant face NOT angular, warm approachable features,
bronde hair dark roots with golden blonde balayage long beach waves,
honey brown warm almond-shaped eyes, naturally thick eyebrows,
small beauty mark on right cheekbone (SIGNATURE),
gold chunky chain bracelet on left wrist ALWAYS visible,
layered gold necklaces with medallion pendant,
feminine shapely figure 172cm, very large natural F-cup breasts,
narrow defined waist, wide feminine hips`;

export const ELENA_FINAL_CHECK = `FINAL CHECK - MUST MATCH REFERENCES:
- SINGLE IMAGE ONLY - NO collages, NO grids, NO patchwork, NO multiple photos combined
- Face: IDENTICAL to Image 1 (soft round face, NOT angular)
- Body: IDENTICAL to Image 2 (shapely with large bust visible)
- Hair: bronde with VISIBLE golden blonde balayage
- Beauty mark: on right cheekbone MUST be visible
- Jewelry: gold bracelet, layered gold necklaces`;

// ═══════════════════════════════════════════════════════════════
// SAFE-SEXY VOCABULARY (from docs/19-QUALITY-SEXY-STRATEGY.md)
// ═══════════════════════════════════════════════════════════════

// Expressions (alluring without being explicit)
const EXPRESSIONS = [
  'captivating warm gaze directly at camera, soft confident smile, magnetic feminine presence',
  'enchanting eyes with playful knowing smile, radiating warmth and charm',
  'alluring gaze with soft parted lips, eyes sparkling with feminine allure',
  'inviting warm expression, confident soft smile, eyes full of warmth',
  'striking confident gaze, elegant smile, charming captivating presence',
];

// ═══════════════════════════════════════════════════════════════
// FANVUE OUTFITS - Only sexy/revealing options (NO regular clothes)
// Bikini, lingerie, leggings, bodysuits, etc.
// ═══════════════════════════════════════════════════════════════

const FANVUE_OUTFITS = [
  // Lingerie
  'delicate black lace bralette with matching lace thong, sheer fabric, elegant lingerie set',
  'white delicate lace bralette with matching lace panties, bridal style lingerie',
  'burgundy satin lingerie set, push-up bralette with high-cut satin panties',
  'black sheer mesh bodysuit with strategic lace panels, form-fitting',
  'soft pink sheer babydoll with matching thong, delicate lace trim',
  // Bikinis
  'tiny black string bikini, triangle top, brazilian cut bottoms',
  'white micro bikini, minimal coverage, string ties',
  // Athletic sexy
  'tight black sports bra showing underboob, high-waisted yoga leggings, athletic fit',
  'cropped tank top showing midriff and sideboob, skin-tight leggings',
  // Bodysuits
  'black lace bodysuit, plunging neckline, high-cut legs',
  'nude satin bodysuit, thin straps, form-fitting silhouette',
];

// Settings that feel intimate but aren't explicit
const INTIMATE_SETTINGS = {
  bedroom_morning: 'Elegant Parisian apartment bedroom, king bed with crisp white linen sheets and cream pillows, soft morning golden light through sheer curtains, warm intimate atmosphere',
  bathroom_mirror: 'Luxurious marble bathroom, large ornate gold-framed mirror, soft warm lighting, steam from shower visible, spa-like intimate setting',
  living_room_cozy: 'Bright Parisian loft with dusty rose velvet sofa, herringbone parquet floor, tall French windows, soft afternoon light, cozy intimate space',
  balcony_sunset: 'Private Parisian balcony with wrought iron railing, golden hour sunset light, Paris rooftops in background, warm romantic atmosphere',
  vanity_getting_ready: 'Elegant vanity area with Hollywood mirror lights, makeup scattered on marble top, getting ready intimate moment',
  yoga_corner: 'Minimalist home yoga corner, black yoga mat on light wood floor, large mirror, soft natural light, peaceful wellness space',
  bath_relaxation: 'Luxurious deep soaking tub filled with bubbles, candles lit around, eucalyptus hanging, steam rising, self-care sanctuary',
};

// Poses that are alluring but not explicit
const ALLURING_POSES = [
  'lounging elegantly on bed, propped on elbow, legs naturally positioned, hair flowing on pillows',
  'sitting on edge of bed, leaning forward slightly, hands on knees, confident feminine pose',
  'standing by window, one hand touching hair, soft backlight creating silhouette, looking over shoulder',
  'lying on sofa, one arm above head, body curved gracefully, relaxed confident pose',
  'taking mirror selfie with phone, body slightly angled to show curves, natural candid moment',
  'stretching on yoga mat, impressive flexibility displayed, athletic feminine strength',
  'stepping out of bath wrapped in towel, wet hair, fresh glowing skin, candid moment',
  'sitting at vanity applying lipstick, mirror reflection visible, intimate getting ready moment',
];

// ═══════════════════════════════════════════════════════════════
// 14-DAY CONTENT CALENDAR
// ═══════════════════════════════════════════════════════════════

export interface FanvueDailyContent {
  day: number;
  id: string;
  name: string;
  caption: string;
  prompt: string;
  isPremium: boolean; // true = subscribers only, false = free followers
  price?: number; // in cents, for PPV content
}

export const FANVUE_DAILY_CALENDAR: FanvueDailyContent[] = [
  // DAY 1 - Soft intro
  {
    day: 1,
    id: 'morning_bed_stretch',
    name: 'Morning Stretch',
    caption: 'Good morning from Paris... barely awake 💋',
    isPremium: true, // Subscribers only
    prompt: `${REFERENCE_INSTRUCTION}

SUBJECT: Elena, 24 year old Italian woman,
${ELENA_BASE},

SETTING: ${INTIMATE_SETTINGS.bedroom_morning}

OUTFIT: ${FANVUE_OUTFITS[4]},

POSE: ${ALLURING_POSES[0]},

EXPRESSION: ${EXPRESSIONS[0]},

STYLE: lifestyle influencer content, soft morning aesthetic, warm intimate atmosphere, premium Fanvue quality,

${ELENA_FINAL_CHECK}`,
  },

  // DAY 2 - Mirror selfie
  {
    day: 2,
    id: 'bathroom_mirror_selfie',
    name: 'Mirror Moment',
    caption: 'Just got out of the shower... 🚿✨',
    isPremium: true, // Subscribers only
    prompt: `${REFERENCE_INSTRUCTION}

SUBJECT: Elena, 24 year old Italian woman,
${ELENA_BASE},

SETTING: ${INTIMATE_SETTINGS.bathroom_mirror}

OUTFIT: ${FANVUE_OUTFITS[1]}, hair slightly damp, fresh glowing skin,

POSE: ${ALLURING_POSES[4]},

EXPRESSION: ${EXPRESSIONS[1]},

STYLE: mirror selfie aesthetic, iPhone visible, warm bathroom lighting, candid intimate moment,

${ELENA_FINAL_CHECK}`,
  },

  // DAY 3 - Cozy evening
  {
    day: 3,
    id: 'sofa_evening',
    name: 'Sofa Vibes',
    caption: 'Netflix and... 🍷',
    isPremium: true, // Subscribers only
    prompt: `${REFERENCE_INSTRUCTION}

SUBJECT: Elena, 24 year old Italian woman,
${ELENA_BASE},

SETTING: ${INTIMATE_SETTINGS.living_room_cozy}

OUTFIT: ${FANVUE_OUTFITS[0]},

POSE: ${ALLURING_POSES[3]},

EXPRESSION: ${EXPRESSIONS[2]},

STYLE: cozy evening content, soft warm lighting, relaxed intimate atmosphere, premium quality,

${ELENA_FINAL_CHECK}`,
  },

  // DAY 4 - Getting ready
  {
    day: 4,
    id: 'vanity_getting_ready',
    name: 'Getting Ready',
    caption: 'Getting ready for something special tonight... 💄',
    isPremium: true, // Subscribers only
    prompt: `${REFERENCE_INSTRUCTION}

SUBJECT: Elena, 24 year old Italian woman,
${ELENA_BASE},

SETTING: ${INTIMATE_SETTINGS.vanity_getting_ready}

OUTFIT: ${FANVUE_OUTFITS[2]},

POSE: ${ALLURING_POSES[7]},

EXPRESSION: ${EXPRESSIONS[3]},

STYLE: getting ready content, warm vanity lighting, intimate behind-the-scenes moment, aspirational,

${ELENA_FINAL_CHECK}`,
  },

  // DAY 5 - Yoga flexibility
  {
    day: 5,
    id: 'yoga_flexibility',
    name: 'Yoga Time',
    caption: 'Flexibility is key 🧘‍♀️',
    isPremium: true, // Subscribers only
    prompt: `${REFERENCE_INSTRUCTION}

SUBJECT: Elena, 24 year old Italian woman,
${ELENA_BASE},

SETTING: ${INTIMATE_SETTINGS.yoga_corner}

OUTFIT: ${FANVUE_OUTFITS[7]},

POSE: ${ALLURING_POSES[5]},

EXPRESSION: ${EXPRESSIONS[4]},

STYLE: fitness wellness content, athletic aesthetic, impressive flexibility showcase, premium quality,

${ELENA_FINAL_CHECK}`,
  },

  // DAY 6 - Balcony sunset
  {
    day: 6,
    id: 'balcony_golden_hour',
    name: 'Golden Hour',
    caption: 'Paris sunsets hit different ✨',
    isPremium: true, // Subscribers only
    prompt: `${REFERENCE_INSTRUCTION}

SUBJECT: Elena, 24 year old Italian woman,
${ELENA_BASE},

SETTING: ${INTIMATE_SETTINGS.balcony_sunset}

OUTFIT: ${FANVUE_OUTFITS[6]},

POSE: ${ALLURING_POSES[2]},

EXPRESSION: ${EXPRESSIONS[0]},

STYLE: golden hour photography, backlit silhouette, romantic Parisian atmosphere, premium influencer content,

${ELENA_FINAL_CHECK}`,
  },

  // DAY 7 - Self-care Sunday
  {
    day: 7,
    id: 'bath_self_care',
    name: 'Self-Care Sunday',
    caption: 'Sunday self-care ritual 🛁🕯️',
    isPremium: true, // Subscribers only
    prompt: `${REFERENCE_INSTRUCTION}

SUBJECT: Elena, 24 year old Italian woman,
${ELENA_BASE},

SETTING: ${INTIMATE_SETTINGS.bath_relaxation}

OUTFIT: hair up in messy bun, shoulders and collarbone visible above bubbles, gold necklaces visible, natural dewy skin,

POSE: relaxing in bubble bath, head tilted back slightly, one arm resting on tub edge, peaceful self-care moment,

EXPRESSION: eyes closed blissfully with soft content smile, complete relaxation, spa day energy,

STYLE: self-care wellness content, warm candlelit glow, intimate but tasteful, premium quality,

${ELENA_FINAL_CHECK}`,
  },

  // DAY 8 - Bedroom confidence
  {
    day: 8,
    id: 'bed_edge_confident',
    name: 'Bedroom Confidence',
    caption: 'Feeling myself today 💋',
    isPremium: true, // Subscribers only
    prompt: `${REFERENCE_INSTRUCTION}

SUBJECT: Elena, 24 year old Italian woman,
${ELENA_BASE},

SETTING: ${INTIMATE_SETTINGS.bedroom_morning}

OUTFIT: ${FANVUE_OUTFITS[9]},

POSE: ${ALLURING_POSES[1]},

EXPRESSION: ${EXPRESSIONS[2]},

STYLE: bedroom confidence content, soft natural lighting, alluring feminine energy, premium Fanvue quality,

${ELENA_FINAL_CHECK}`,
  },

  // DAY 9 - Cozy sweater
  {
    day: 9,
    id: 'oversized_sweater',
    name: 'Cozy Morning',
    caption: 'Boyfriend sweater but no boyfriend needed 😏',
    isPremium: true, // Subscribers only
    prompt: `${REFERENCE_INSTRUCTION}

SUBJECT: Elena, 24 year old Italian woman,
${ELENA_BASE},

SETTING: ${INTIMATE_SETTINGS.living_room_cozy}, morning light

OUTFIT: ${FANVUE_OUTFITS[0]} with open sweater falling off shoulders,

POSE: standing by window, sweater open showing lingerie, one bare leg visible, intimate moment,

EXPRESSION: ${EXPRESSIONS[1]},

STYLE: cozy morning content, soft warm tones, relaxed intimate atmosphere, aspirational lifestyle,

${ELENA_FINAL_CHECK}`,
  },

  // DAY 10 - After workout
  {
    day: 10,
    id: 'post_workout_glow',
    name: 'Post-Workout Glow',
    caption: 'That after workout feeling 💪✨',
    isPremium: true, // Subscribers only
    prompt: `${REFERENCE_INSTRUCTION}

SUBJECT: Elena, 24 year old Italian woman,
${ELENA_BASE},

SETTING: ${INTIMATE_SETTINGS.yoga_corner}, towel nearby, water bottle visible

OUTFIT: ${FANVUE_OUTFITS[8]}, slight sheen of sweat, glowing skin,

POSE: standing confidently, one hand on hip, towel around neck, proud accomplished energy, full body visible,

EXPRESSION: ${EXPRESSIONS[4]},

STYLE: fitness lifestyle content, natural lighting, healthy glow aesthetic, empowered feminine energy,

${ELENA_FINAL_CHECK}`,
  },

  // DAY 11 - Silk slip dress
  {
    day: 11,
    id: 'silk_slip_evening',
    name: 'Evening Ready',
    caption: 'Ready for tonight... or staying in? 🖤',
    isPremium: true, // Subscribers only
    prompt: `${REFERENCE_INSTRUCTION}

SUBJECT: Elena, 24 year old Italian woman,
${ELENA_BASE},

SETTING: ${INTIMATE_SETTINGS.living_room_cozy}, evening soft lighting

OUTFIT: ${FANVUE_OUTFITS[10]},

POSE: standing, hands adjusting thin strap on shoulder, hip slightly cocked, elegant feminine silhouette,

EXPRESSION: ${EXPRESSIONS[3]},

STYLE: evening content, soft ambient lighting, elegant sensual aesthetic, premium quality,

${ELENA_FINAL_CHECK}`,
  },

  // DAY 12 - Lazy bed day
  {
    day: 12,
    id: 'lazy_bed_day',
    name: 'Lazy Day',
    caption: 'Some days you just stay in bed 😴💕',
    isPremium: true, // Subscribers only
    prompt: `${REFERENCE_INSTRUCTION}

SUBJECT: Elena, 24 year old Italian woman,
${ELENA_BASE},

SETTING: ${INTIMATE_SETTINGS.bedroom_morning}, messy but luxurious bedding

OUTFIT: ${FANVUE_OUTFITS[5]},

POSE: lying on stomach on bed, propped up on elbows, feet playfully kicked up behind, chin resting on hands, looking at camera,

EXPRESSION: ${EXPRESSIONS[1]},

STYLE: lazy day content, soft cozy atmosphere, playful intimate energy, lifestyle aesthetic,

${ELENA_FINAL_CHECK}`,
  },

  // DAY 13 - Towel moment
  {
    day: 13,
    id: 'fresh_from_shower',
    name: 'Fresh Out',
    caption: 'That fresh feeling ✨🚿',
    isPremium: true, // Subscribers only
    prompt: `${REFERENCE_INSTRUCTION}

SUBJECT: Elena, 24 year old Italian woman,
${ELENA_BASE},

SETTING: ${INTIMATE_SETTINGS.bathroom_mirror}, steam visible

OUTFIT: wrapped in large white fluffy towel, wet hair slicked back, fresh natural skin, gold jewelry visible,

POSE: ${ALLURING_POSES[6]},

EXPRESSION: ${EXPRESSIONS[0]},

STYLE: fresh shower moment, warm bathroom lighting, natural beauty aesthetic, intimate candid content,

${ELENA_FINAL_CHECK}`,
  },

  // DAY 14 - Satin loungewear
  {
    day: 14,
    id: 'satin_loungewear',
    name: 'Satin Dreams',
    caption: 'Ending the day right 🌙',
    isPremium: true, // Subscribers only
    prompt: `${REFERENCE_INSTRUCTION}

SUBJECT: Elena, 24 year old Italian woman,
${ELENA_BASE},

SETTING: ${INTIMATE_SETTINGS.bedroom_morning}, soft evening lamp lighting

OUTFIT: ${FANVUE_OUTFITS[2]},

POSE: sitting on bed, legs tucked to side, one hand in hair, soft romantic pose, feminine silhouette emphasized,

EXPRESSION: ${EXPRESSIONS[2]},

STYLE: evening loungewear content, soft warm lighting, romantic intimate atmosphere, premium Fanvue quality,

${ELENA_FINAL_CHECK}`,
  },
];

/**
 * Get today's content based on a start date
 * Content rotates every 14 days
 */
export function getTodaysContent(startDate?: Date): FanvueDailyContent {
  const start = startDate || new Date('2024-12-30'); // Default start
  const today = new Date();
  const daysDiff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const dayIndex = daysDiff % FANVUE_DAILY_CALENDAR.length;
  return FANVUE_DAILY_CALENDAR[dayIndex];
}

/**
 * Get content for a specific day number (1-14)
 */
export function getContentByDay(day: number): FanvueDailyContent | undefined {
  return FANVUE_DAILY_CALENDAR.find(c => c.day === day);
}

