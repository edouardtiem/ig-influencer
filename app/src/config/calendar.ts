/**
 * Content Calendar Configuration for Mila
 * Manages posting schedule, time slots, and content types
 */

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type TimeSlot = 'morning' | 'midday' | 'evening' | 'night';
export type DayType = 'weekday' | 'saturday' | 'sunday';
export type Season = 'winter' | 'spring' | 'summer' | 'autumn';
export type LightingCondition = 'night' | 'dawn' | 'golden_hour' | 'daylight' | 'sunset' | 'dusk';

export interface PostingSlot {
  id: string;
  slot: TimeSlot;
  hour: number;
  minute: number;
  locations: string[]; // location IDs
  contentTypes: string[];
  mood: string;
  lighting: LightingCondition;
}

export interface DaySchedule {
  dayType: DayType;
  slots: PostingSlot[];
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

// Paris coordinates for sunrise/sunset calculations
const PARIS_LAT = 48.8566;
const PARIS_LNG = 2.3522;

// Approximate sunrise/sunset times in Paris by month (simplified)
const PARIS_SUN_TIMES: Record<number, { sunrise: number; sunset: number }> = {
  1:  { sunrise: 8.5,  sunset: 17.0 },  // January
  2:  { sunrise: 7.75, sunset: 18.0 },  // February
  3:  { sunrise: 7.0,  sunset: 19.0 },  // March
  4:  { sunrise: 6.5,  sunset: 20.5 },  // April (DST)
  5:  { sunrise: 6.0,  sunset: 21.5 },  // May
  6:  { sunrise: 5.75, sunset: 22.0 },  // June
  7:  { sunrise: 6.0,  sunset: 21.75 }, // July
  8:  { sunrise: 6.75, sunset: 21.0 },  // August
  9:  { sunrise: 7.5,  sunset: 20.0 },  // September
  10: { sunrise: 8.0,  sunset: 19.0 },  // October
  11: { sunrise: 7.5,  sunset: 17.25 }, // November
  12: { sunrise: 8.5,  sunset: 16.75 }, // December
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get current season based on month
 */
export function getSeason(date: Date = new Date()): Season {
  const month = date.getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

/**
 * Get day type (weekday, saturday, sunday)
 */
export function getDayType(date: Date = new Date()): DayType {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  if (day === 0) return 'sunday';
  if (day === 6) return 'saturday';
  return 'weekday';
}

/**
 * Get sunrise/sunset times for a given date in Paris
 */
export function getSunTimes(date: Date = new Date()): { sunrise: number; sunset: number } {
  const month = date.getMonth() + 1;
  return PARIS_SUN_TIMES[month] || PARIS_SUN_TIMES[6];
}

/**
 * Determine lighting condition based on time and sun position
 */
export function getLightingCondition(hour: number, date: Date = new Date()): LightingCondition {
  const { sunrise, sunset } = getSunTimes(date);
  
  // Convert hour to decimal (e.g., 6.5 = 6h30)
  const hourDecimal = hour;
  
  // Night: more than 1.5h before sunrise or after sunset
  if (hourDecimal < sunrise - 1.5 || hourDecimal > sunset + 1) return 'night';
  
  // Dawn: 1.5h to 0.5h before sunrise
  if (hourDecimal >= sunrise - 1.5 && hourDecimal < sunrise - 0.5) return 'dawn';
  
  // Golden hour morning: 0.5h before to 1h after sunrise
  if (hourDecimal >= sunrise - 0.5 && hourDecimal <= sunrise + 1) return 'golden_hour';
  
  // Golden hour evening: 1h before to 0.5h after sunset
  if (hourDecimal >= sunset - 1 && hourDecimal <= sunset + 0.5) return 'sunset';
  
  // Dusk: 0.5h to 1h after sunset
  if (hourDecimal > sunset + 0.5 && hourDecimal <= sunset + 1) return 'dusk';
  
  // Regular daylight
  return 'daylight';
}

/**
 * Get mood description based on lighting
 */
export function getMoodFromLighting(lighting: LightingCondition): string {
  const moods: Record<LightingCondition, string> = {
    night: 'cozy, warm lamp light, intimate',
    dawn: 'soft awakening, peaceful, quiet',
    golden_hour: 'warm golden light, magical, dreamy',
    daylight: 'bright, energetic, active',
    sunset: 'golden hour, warm, romantic, reflective',
    dusk: 'soft fading light, peaceful evening',
  };
  return moods[lighting];
}

// ═══════════════════════════════════════════════════════════════
// SCHEDULE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Generate posting slots for a specific date
 */
export function getPostingSlotsForDate(date: Date = new Date()): PostingSlot[] {
  const dayType = getDayType(date);
  const season = getSeason(date);
  
  // Base slots (will be adjusted based on day type)
  const slots: PostingSlot[] = [];
  
  // ─────────────────────────────────────────────────────────────
  // MORNING SLOT - 6h30
  // ─────────────────────────────────────────────────────────────
  const morningLighting = getLightingCondition(6.5, date);
  const morningSlot: PostingSlot = {
    id: 'morning',
    slot: 'morning',
    hour: 6,
    minute: 30,
    locations: dayType === 'weekday' 
      ? ['home_bedroom', 'nice_gym'] // Weekday: routine PT
      : ['home_bedroom'], // Weekend: grasse mat
    contentTypes: dayType === 'weekday'
      ? ['morning_routine', 'pre_workout', 'coffee_prep']
      : ['lazy_morning', 'sleep_in', 'cozy_bed'],
    mood: dayType === 'weekday'
      ? `Early bird PT vibes, ${getMoodFromLighting(morningLighting)}`
      : `Weekend lazy morning, ${getMoodFromLighting(morningLighting)}`,
    lighting: morningLighting,
  };
  slots.push(morningSlot);
  
  // ─────────────────────────────────────────────────────────────
  // MIDDAY SLOT - 11h30
  // ─────────────────────────────────────────────────────────────
  const middayLighting = getLightingCondition(11.5, date);
  const middaySlot: PostingSlot = {
    id: 'midday',
    slot: 'midday',
    hour: 11,
    minute: 30,
    locations: dayType === 'sunday'
      ? ['nice_old_town_cafe', 'home_living_room'] // Sunday: chill café
      : ['nice_gym', 'nice_old_town_cafe'], // Weekday/Saturday: gym or café
    contentTypes: dayType === 'weekday'
      ? ['workout', 'training_client', 'gym_selfie', 'between_clients']
      : dayType === 'saturday'
        ? ['brunch', 'weekend_vibes', 'café_moment']
        : ['sunday_yoga', 'slow_morning', 'café_chill'],
    mood: `Active ${dayType === 'sunday' ? 'but relaxed' : 'energy'}, ${getMoodFromLighting(middayLighting)}`,
    lighting: middayLighting,
  };
  slots.push(middaySlot);
  
  // ─────────────────────────────────────────────────────────────
  // EVENING SLOT - 18h00
  // ─────────────────────────────────────────────────────────────
  const eveningLighting = getLightingCondition(18, date);
  const eveningSlot: PostingSlot = {
    id: 'evening',
    slot: 'evening',
    hour: 18,
    minute: 0,
    locations: ['home_living_room', 'home_bedroom'],
    contentTypes: dayType === 'weekday'
      ? ['post_work_relax', 'cozy_evening', 'golden_hour_home']
      : dayType === 'saturday'
        ? ['getting_ready', 'saturday_night', 'pre_going_out']
        : ['sunday_prep', 'week_prep', 'cozy_sunday'],
    mood: `End of day vibes, ${getMoodFromLighting(eveningLighting)}`,
    lighting: eveningLighting,
  };
  slots.push(eveningSlot);
  
  return slots;
}

/**
 * Get the current or next posting slot
 */
export function getCurrentSlot(date: Date = new Date()): PostingSlot | null {
  const slots = getPostingSlotsForDate(date);
  const currentHour = date.getHours();
  const currentMinute = date.getMinutes();
  const currentDecimal = currentHour + currentMinute / 60;
  
  // Find the closest upcoming slot (or current if within 30min)
  for (const slot of slots) {
    const slotDecimal = slot.hour + slot.minute / 60;
    if (slotDecimal >= currentDecimal - 0.5) {
      return slot;
    }
  }
  
  // If all slots passed, return first slot for tomorrow
  return slots[0];
}

/**
 * Get a random location from the slot's available locations
 */
export function getRandomLocationForSlot(slot: PostingSlot): string {
  const locations = slot.locations;
  return locations[Math.floor(Math.random() * locations.length)];
}

/**
 * Get a random content type from the slot
 */
export function getRandomContentType(slot: PostingSlot): string {
  const types = slot.contentTypes;
  return types[Math.floor(Math.random() * types.length)];
}

// ═══════════════════════════════════════════════════════════════
// CONTENT TEMPLATES BY TYPE
// ═══════════════════════════════════════════════════════════════

export interface ContentTemplate {
  type: string;
  poses: string[];
  expressions: string[];
  outfits: string[];
  props: string[];
  captionThemes: string[];
}

export const CONTENT_TEMPLATES: Record<string, ContentTemplate> = {
  // Morning content
  morning_routine: {
    type: 'morning_routine',
    poses: ['sitting on bed edge', 'stretching arms up', 'standing by window'],
    expressions: ['soft sleepy smile', 'peaceful eyes closed', 'gentle morning gaze'],
    outfits: ['oversized t-shirt', 'silk pajama set', 'cozy sweater and shorts'],
    props: ['coffee cup', 'phone in hand', 'messy bedsheets'],
    captionThemes: ['morning person', 'early bird', 'new day energy'],
  },
  
  lazy_morning: {
    type: 'lazy_morning',
    poses: ['lying in bed', 'propped on pillows', 'snuggled in blankets'],
    expressions: ['sleepy smile', 'cozy contentment', 'peaceful rest'],
    outfits: ['oversized hoodie', 'tank top', 'wrapped in duvet'],
    props: ['messy sheets', 'book or phone', 'coffee on nightstand'],
    captionThemes: ['weekend mood', 'self care', 'slow morning'],
  },
  
  // Workout content
  workout: {
    type: 'workout',
    poses: ['mid-exercise action', 'flexing confident', 'post-workout stretch'],
    expressions: ['focused determination', 'post-workout glow smile', 'confident stare'],
    outfits: ['matching sports bra and leggings', 'crop top and bike shorts', 'tank and joggers'],
    props: ['dumbbells', 'resistance bands', 'yoga mat', 'water bottle'],
    captionThemes: ['fitness motivation', 'strong not skinny', 'gym life'],
  },
  
  training_client: {
    type: 'training_client',
    poses: ['demonstrating exercise', 'standing confident', 'adjusting equipment'],
    expressions: ['professional smile', 'focused teaching', 'encouraging look'],
    outfits: ['professional athleisure', 'branded PT wear', 'clean matching set'],
    props: ['gym equipment', 'clipboard', 'timer'],
    captionThemes: ['PT life', 'client transformation', 'coaching'],
  },
  
  // Café content
  café_moment: {
    type: 'café_moment',
    poses: ['sitting at table', 'holding coffee cup', 'looking out window'],
    expressions: ['content smile', 'pensive look', 'candid laugh'],
    outfits: ['casual chic', 'blazer and jeans', 'cozy knit'],
    props: ['latte art coffee', 'croissant', 'laptop', 'book'],
    captionThemes: ['coffee lover', 'café culture', 'work from anywhere'],
  },
  
  brunch: {
    type: 'brunch',
    poses: ['sitting at brunch table', 'cheers with mimosa', 'food flat lay angle'],
    expressions: ['happy social smile', 'laughing with friends', 'food appreciation'],
    outfits: ['weekend casual', 'cute dress', 'trendy outfit'],
    props: ['brunch spread', 'mimosa', 'avocado toast'],
    captionThemes: ['brunch vibes', 'weekend mood', 'foodie'],
  },
  
  // Evening/Home content
  cozy_evening: {
    type: 'cozy_evening',
    poses: ['curled on sofa', 'reading by lamp light', 'playing guitar'],
    expressions: ['peaceful content', 'soft smile', 'relaxed gaze'],
    outfits: ['loungewear', 'oversized sweater', 'cozy pants'],
    props: ['book', 'wine glass', 'candles', 'guitar', 'blanket'],
    captionThemes: ['cozy night', 'self care', 'winding down'],
  },
  
  golden_hour_home: {
    type: 'golden_hour_home',
    poses: ['standing by window', 'sitting in golden light', 'balcony moment'],
    expressions: ['dreamy gaze', 'soft smile', 'eyes closed peaceful'],
    outfits: ['casual elegant', 'simple dress', 'nice loungewear'],
    props: ['wine glass', 'sunset view', 'plants'],
    captionThemes: ['golden hour', 'magic hour', 'home vibes'],
  },
  
  sunday_yoga: {
    type: 'sunday_yoga',
    poses: ['yoga pose', 'meditation seated', 'stretching'],
    expressions: ['zen peaceful', 'focused breath', 'serene smile'],
    outfits: ['yoga set', 'minimal sportswear', 'comfortable flow outfit'],
    props: ['yoga mat', 'candles', 'incense', 'plants'],
    captionThemes: ['sunday reset', 'yoga flow', 'mindfulness'],
  },
};

/**
 * Get content template by type
 */
export function getContentTemplate(type: string): ContentTemplate | undefined {
  return CONTENT_TEMPLATES[type];
}

/**
 * Get random element from array
 */
function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ═══════════════════════════════════════════════════════════════
// LOCATION-SPECIFIC OUTFITS — Sexy but elegant (no colors = AI variety)
// ═══════════════════════════════════════════════════════════════

const LOCATION_OUTFITS: Record<string, string[]> = {
  // GYM — Fitted, flattering athleisure
  nice_gym: [
    'matching sports bra and high-waisted leggings, form-fitting, showing toned midriff',
    'fitted sports bra and bike shorts, athletic but feminine, showing curves',
    'seamless workout set, cropped top showing waist, sculpting leggings',
    'sports bra with mesh details, high-waisted leggings, athletic allure',
    'matching gym set, sports bra showing cleavage tastefully, body-hugging leggings',
    'cropped workout tank and fitted leggings, athletic sensuality',
    'racerback sports bra and compression shorts, toned body visible',
  ],
  
  // BEDROOM — Intimate, sensual but tasteful
  home_bedroom: [
    'silk slip dress, thin straps, mid-thigh length, effortlessly sexy',
    'oversized t-shirt barely covering thighs, no pants visible, cozy sensual',
    'matching lace bralette and high-waisted shorts, soft intimate look',
    'silk camisole and matching shorts, elegant loungewear, subtle sensuality',
    'oversized knit sweater falling off one shoulder, bare legs, cozy allure',
    'satin pajama set slightly unbuttoned, relaxed intimacy',
    'lace-trimmed sleep top and shorts, feminine softness',
    'boyfriend shirt half-unbuttoned, bare legs, morning after vibe',
  ],
  
  // LIVING ROOM — Casual sexy, relaxed elegance
  home_living_room: [
    'cropped tank top and high-waisted joggers, casual but flattering, showing waist',
    'silk robe loosely tied over matching set, effortless sensuality',
    'oversized hoodie and bike shorts, showing long legs, cozy sexy',
    'fitted bodysuit with cardigan open, relaxed elegance',
    'soft knit crop top and wide-leg lounge pants, comfortable allure',
    'sports bra under open flannel shirt, casual intimate',
    'fitted tank and lounge shorts, relaxed but attractive',
  ],
  
  // CAFÉ — Chic Parisian, understated sexy
  nice_old_town_cafe: [
    'fitted bodysuit under blazer, high-waisted jeans, Parisian chic',
    'cropped turtleneck showing midriff, with tailored trousers',
    'silk camisole under open linen shirt, effortless French girl sexy',
    'fitted ribbed top accentuating curves, mom jeans, casual elegance',
    'off-shoulder sweater, subtle sensuality, with tailored pants',
    'wrap top showing décolleté tastefully, fitted pants',
    'tucked-in fitted blouse, high-waisted skirt, feminine elegance',
  ],
};

// ═══════════════════════════════════════════════════════════════
// DYNAMIC ACTIONS — Active, not just posing
// ═══════════════════════════════════════════════════════════════

const LOCATION_ACTIONS: Record<string, string[]> = {
  nice_gym: [
    'mid-squat on smith machine, weights loaded, focused determination, athletic form',
    'doing cable rows, pulling weight toward body, muscles engaged, concentrated',
    'on leg press machine, pushing weight, showing leg strength and curves',
    'doing dumbbell curls, mid-lift, focused on form, athletic sensuality',
    'stretching on yoga mat between sets, one leg extended, flexible and toned',
    'adjusting weight plates on barbell, preparing for next set, confident',
    'walking between machines, towel around neck, post-set glow',
    'doing hip thrusts on bench, demonstrating exercise, trainer mode',
    'at cable machine doing tricep pushdowns, arms defined',
    'sitting on bench catching breath, wiping sweat, satisfied smile',
    'recording workout on phone propped nearby, demonstrating exercise',
    'doing lunges across gym floor, dynamic movement, hair flowing',
  ],
  home_bedroom: [
    'just waking up, stretching arms above head in bed, morning sensuality',
    'sitting on bed scrolling phone, legs tucked under, cozy moment',
    'standing by window looking out at city, contemplative morning',
    'making the bed, bending over slightly, candid domestic moment',
    'applying skincare at vanity mirror, self-care routine',
    'reading book in bed, propped on pillows, relaxed intimate',
    'getting dressed, putting on top, caught mid-action',
    'lying in bed on phone, legs up on headboard, casual scrolling',
    'stretching after waking, standing by bed, morning routine',
    'brushing hair at mirror, natural beauty routine',
    'sitting on bed edge putting on socks/shoes, getting ready',
    'taking mirror selfie with phone, typical influencer moment',
  ],
  home_living_room: [
    'curled up on sofa watching something on laptop, cozy evening',
    'doing yoga flow on mat in living room, mid-pose, flexible',
    'watering plants by window, domestic goddess moment',
    'reading magazine on sofa, flipping pages, relaxed',
    'stretching on floor after home workout, recovery mode',
    'on phone call, pacing by window, animated conversation',
    'working on laptop at coffee table, focused but comfortable',
    'playing guitar on sofa, artistic side, concentrating',
    'lighting candles on coffee table, setting evening mood',
    'pouring wine into glass, evening ritual, sophisticated',
    'dancing slightly to music, carefree moment, happy',
    'folding laundry on sofa, real life candid moment',
  ],
  nice_old_town_cafe: [
    'laughing mid-conversation with someone across table, genuine joy',
    'sipping coffee, cup to lips, savoring the moment',
    'typing on laptop, working remotely, focused Parisian',
    'reading book at table, turning page, intellectual vibe',
    'taking photo of coffee/food for Instagram, content creator mode',
    'waving at someone arriving, friendly greeting, social',
    'looking out window watching people pass, pensive moment',
    'paying at counter, interaction with barista, social moment',
    'walking into café, pushing door open, arriving shot',
    'texting on phone at table, modern life moment',
    'eating croissant, mid-bite, enjoying French pastry',
    'adjusting sunglasses while sitting outside, chic Parisian',
  ],
};

const SEXY_EXPRESSIONS: string[] = [
  'confident sultry gaze, slight smile playing on lips, direct eye contact',
  'soft sensual expression, eyes slightly hooded, natural allure',
  'playful smirk, knowing look, effortless confidence',
  'warm inviting smile, eyes sparkling, approachable but alluring',
  'pensive look with soft smile, gazing slightly away, mysterious charm',
  'genuine laugh, eyes crinkled, natural beauty',
  'confident stare, no smile, powerful feminine energy',
  'soft bite of lower lip (subtle), playful sensuality',
];

// ═══════════════════════════════════════════════════════════════
// SMART PROPS — Based on location + time of day
// ═══════════════════════════════════════════════════════════════

const LOCATION_PROPS: Record<string, Record<string, string[]>> = {
  nice_gym: {
    morning: ['water bottle', 'towel around neck', 'wireless earbuds', 'gym bag nearby'],
    midday: ['water bottle', 'towel', 'phone with timer', 'resistance bands'],
    evening: ['water bottle', 'towel', 'gym bag', 'post-workout shake'],
    night: ['water bottle', 'towel', 'gym bag'], // rare but possible
  },
  home_bedroom: {
    morning: ['messy sheets', 'phone on pillow', 'coffee cup on nightstand', 'morning light through curtains'],
    midday: ['unmade bed', 'book on bed', 'phone', 'natural daylight'],
    evening: ['soft lamp light', 'book', 'candle lit', 'cozy blanket'],
    night: ['dim lamp light', 'glass of wine on nightstand', 'phone', 'candle', 'silk sheets'],
  },
  home_living_room: {
    morning: ['coffee cup', 'phone', 'soft morning light', 'cozy blanket'],
    midday: ['laptop open', 'coffee cup', 'magazine', 'natural light'],
    evening: ['glass of wine', 'book', 'candles lit', 'soft lamp light', 'cozy throw blanket'],
    night: ['glass of wine', 'candles', 'dim lighting', 'soft music vibe', 'blanket'],
  },
  nice_old_town_cafe: {
    morning: ['cappuccino', 'croissant', 'newspaper or book', 'morning light'],
    midday: ['latte', 'laptop open', 'light lunch', 'afternoon sun'],
    evening: ['espresso', 'pastry', 'golden hour light', 'book'],
    night: ['glass of wine', 'small appetizer', 'ambient café lighting'], // evening café
  },
};

/**
 * Get smart props based on location and time slot
 */
function getSmartProps(locationId: string, slot: TimeSlot): string[] {
  const locationProps = LOCATION_PROPS[locationId];
  if (!locationProps) return [];
  
  // Map slot to time period
  const timePeriod = slot === 'morning' ? 'morning' 
    : slot === 'midday' ? 'midday'
    : slot === 'evening' ? 'evening'
    : 'night';
  
  const props = locationProps[timePeriod] || locationProps['midday'] || [];
  
  // Return 1-2 random props
  const shuffled = [...props].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.floor(Math.random() * 2) + 1);
}

/**
 * Generate a complete content brief for a posting slot
 * Now with location-coherent outfits and sexy-but-tasteful approach
 */
export function generateContentBrief(slot: PostingSlot): {
  slot: PostingSlot;
  location: string;
  contentType: string;
  template: ContentTemplate;
  selectedPose: string;
  selectedExpression: string;
  selectedOutfit: string;
  selectedProps: string[];
  captionTheme: string;
  lighting: LightingCondition;
  mood: string;
} {
  const location = getRandomLocationForSlot(slot);
  const contentType = getRandomContentType(slot);
  const template = getContentTemplate(contentType) || CONTENT_TEMPLATES.morning_routine;
  
  // Get location-specific outfit (or fallback to template)
  const locationOutfits = LOCATION_OUTFITS[location] || template.outfits;
  const selectedOutfit = randomFrom(locationOutfits);
  
  // Get location-specific ACTION (not just pose - she's doing something!)
  const locationActions = LOCATION_ACTIONS[location] || template.poses;
  const selectedPose = randomFrom(locationActions); // Still called "pose" for compatibility
  
  // Use sexy expressions
  const selectedExpression = randomFrom(SEXY_EXPRESSIONS);
  
  // Get smart props based on location + time (not random from template)
  const smartProps = getSmartProps(location, slot.slot);
  
  return {
    slot,
    location,
    contentType,
    template,
    selectedPose,
    selectedExpression,
    selectedOutfit,
    selectedProps: smartProps,
    captionTheme: randomFrom(template.captionThemes),
    lighting: slot.lighting,
    mood: slot.mood,
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS FOR DEBUGGING / TESTING
// ═══════════════════════════════════════════════════════════════

export const CALENDAR_INFO = {
  timezone: 'Europe/Paris',
  defaultSlots: ['6:30', '11:30', '18:00'],
  locations: {
    morning: ['home_bedroom', 'nice_gym'],
    midday: ['nice_gym', 'nice_old_town_cafe'],
    evening: ['home_living_room', 'home_bedroom'],
  },
};

