/**
 * Locations Configuration — Elena Visconti
 * Paris 8e Luxurious Loft + Recurring Locations
 */

export interface ElenaLocation {
  id: string;
  name: string;
  category: 'home' | 'cafe' | 'spa' | 'travel';
  description: string;
  prompt: string;
  referenceImageUrl?: string; // Cloudinary URL for location reference
  instagramLocationId?: string;
  compatibleSlots: ('morning' | 'midday' | 'evening' | 'night' | 'late_night')[];
}

// ═══════════════════════════════════════════════════════════════
// ELENA'S APARTMENT — Reference photos for consistency
// ═══════════════════════════════════════════════════════════════

export const ELENA_LOCATIONS: Record<string, ElenaLocation> = {
  // ─────────────────────────────────────────────────────────────
  // LOFT LIVING ROOM — Main location
  // ─────────────────────────────────────────────────────────────
  loft_living: {
    id: 'loft_living',
    name: 'Loft Elena',
    category: 'home',
    description: 'Luxurious Parisian loft in 8th arrondissement',
    referenceImageUrl: 'https://res.cloudinary.com/dily60mr0/image/upload/v1766009920/replicate-prediction-aphj5sddfxrmc0cv5sf8eqe2pw_c0otnl.png',
    instagramLocationId: undefined, // Paris 8e - to add
    compatibleSlots: ['morning', 'midday', 'evening', 'night'],
    prompt: `Based on the provided location reference image, recreate this exact living room faithfully.

Luxurious bright Parisian loft apartment 8th arrondissement with high Haussmannian ceilings 3.5 meters, ornate white crown moldings.

ARCHITECTURE: Two large French windows floor-to-ceiling with white wooden frames, herringbone chevron parquet floor in light oak honey color. Zinc Paris rooftops visible through windows with typical grey Haussmann buildings, chimneys and blue sky.

FURNITURE: Statement vintage dusty rose mauve velvet sofa with curved armrests 1970s Italian design, minimalist black metal and glass side table geometric frame, round marble coffee table with brass base.

DECOR: Large indoor palm tree in terracotta pot, fiddle leaf fig plant, smaller potted plants on windowsill, fashion magazines on coffee table, gold candle holders, soft cream throw blanket on sofa.

COLOR PALETTE: White walls, honey oak floors, dusty rose mauve velvet, cream, beige, terracotta, gold accents, touches of green from plants.

Bright and airy atmosphere, abundant natural daylight. Instagram-ready interior, expensive but lived-in, Italian-Parisian luxury aesthetic.`,
  },

  // ─────────────────────────────────────────────────────────────
  // BEDROOM — Vanity + bed
  // ─────────────────────────────────────────────────────────────
  loft_bedroom: {
    id: 'loft_bedroom',
    name: 'Chambre Elena',
    category: 'home',
    description: 'Elegant Parisian bedroom with vanity',
    referenceImageUrl: 'https://res.cloudinary.com/dily60mr0/image/upload/v1766009918/replicate-prediction-nnns47vwgdrme0cv5shbd0b224_d0ghoj.png',
    instagramLocationId: undefined,
    compatibleSlots: ['morning', 'evening', 'night', 'late_night'],
    prompt: `Based on the provided location reference image, recreate this exact bedroom faithfully.

Elegant Parisian apartment bedroom in the 8th arrondissement with high Haussmannian ceiling 3.2 meters, ornate white crown moldings, herringbone chevron parquet floor light oak.

ARCHITECTURE: Two tall French windows with sheer white linen curtains gently flowing, view of Paris rooftops.

BED: King size bed with cream linen upholstered headboard button-tufted, luxurious white and beige layered bedding with linen duvet, multiple pillows in cream white and dusty rose, cashmere throw blanket in camel color draped at foot of bed.

VANITY AREA: Vintage-style vanity table in white lacquer with gold legs, Hollywood mirror with warm globe lights surrounding the frame, velvet stool in dusty rose mauve matching living room sofa.

FURNITURE: Pair of gold and marble bedside tables, modern gold arc floor lamp with cream shade, cream linen armchair in corner with gold legs.

DECOR: Fresh white roses in glass vase, fashion books on vanity, perfume bottles with gold caps, small indoor plant, abstract feminine art print above bed in gold frame beige and blush tones, gold jewelry tray on vanity.

Warm golden natural light, romantic and inviting atmosphere. Instagram influencer aesthetic, feminine luxury.`,
  },

  // ─────────────────────────────────────────────────────────────
  // BATHROOM — Marble + gold
  // ─────────────────────────────────────────────────────────────
  bathroom_luxe: {
    id: 'bathroom_luxe',
    name: 'Salle de bain Elena',
    category: 'home',
    description: 'Luxurious marble bathroom with gold fixtures',
    referenceImageUrl: 'https://res.cloudinary.com/dily60mr0/image/upload/v1766009922/replicate-prediction-cq10n9h3jsrma0cv5sgrn0x5mr_swbswr.png',
    instagramLocationId: undefined,
    compatibleSlots: ['morning', 'evening', 'night', 'late_night'],
    prompt: `Based on the provided location reference image, recreate this exact bathroom faithfully.

Luxurious Parisian apartment bathroom with high ceiling, spacious and elegant.

ARCHITECTURE: Large single French window with white wooden frame overlooking Paris zinc rooftops and Haussmann building facades, abundant natural daylight streaming in.

WALLS AND SURFACES: Floor to ceiling white Calacatta marble with elegant grey veining, polished finish, continuous marble on walls floor and shower area, seamless luxury spa feeling.

FIXTURES: All brushed gold brass fixtures throughout, vintage-style gold faucet with cross handles on pedestal sink, gold-framed rectangular mirror with subtle art deco lines, glass walk-in shower enclosure with gold hinges and gold rainfall showerhead, gold towel rack.

FURNITURE: White porcelain pedestal sink classic Parisian style, white marble floating shelf with gold brackets.

DECOR: Fluffy white towels neatly rolled, minimalist amber glass bottles, white candles in gold holders.

Bright natural daylight from window creating soft shadows, clean and fresh atmosphere. Five-star Parisian hotel bathroom aesthetic, Instagram luxury.`,
  },

  // ─────────────────────────────────────────────────────────────
  // CAFÉ PARIS — No reference image yet
  // ─────────────────────────────────────────────────────────────
  cafe_paris: {
    id: 'cafe_paris',
    name: 'Café parisien chic',
    category: 'cafe',
    description: 'Upscale Parisian café terrace',
    referenceImageUrl: undefined, // No reference yet
    instagramLocationId: undefined,
    compatibleSlots: ['morning', 'midday', 'evening'],
    prompt: `Upscale Parisian cafe terrace in elegant neighborhood, classic rattan bistro chairs with beige cushions, small round marble table with brass legs, white porcelain espresso cup and saucer.

Haussmann building facades in background with ornate iron balconies and flower boxes. Cobblestone sidewalk, golden hour warm sunlight casting long shadows.

Elegant Parisian atmosphere, not crowded, intimate seating. Fashion-forward clientele area, 8th arrondissement vibes.

Shot on iPhone, natural photography, lifestyle content.`,
  },

  // ─────────────────────────────────────────────────────────────
  // SPA LUXE — No reference image yet
  // ─────────────────────────────────────────────────────────────
  spa_luxe: {
    id: 'spa_luxe',
    name: 'Spa luxe',
    category: 'spa',
    description: 'Luxury spa with heated pool',
    referenceImageUrl: undefined,
    instagramLocationId: undefined,
    compatibleSlots: ['morning', 'midday', 'evening'],
    prompt: `Luxury spa setting, outdoor heated infinity pool with steam gently rising from warm water surface.

Snowy mountain panorama in background (French Alps), pine trees dusted with snow, clear blue winter sky.

Minimalist modern spa architecture, clean lines, natural wood and stone materials. Pristine white towels folded nearby.

Exclusive five-star resort atmosphere, peaceful and serene. Ultimate relaxation destination.

Shot on iPhone, natural photography.`,
  },

  // ═══════════════════════════════════════════════════════════════
  // NEW TRAVEL LOCATIONS — For more variety (40% of Elena content)
  // ═══════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────
  // MILAN FASHION — Hotel 5*, Fashion streets
  // ─────────────────────────────────────────────────────────────
  milan_fashion: {
    id: 'milan_fashion',
    name: 'Milano Fashion District',
    category: 'travel',
    description: 'Milan fashion district, luxury hotels and Via Montenapoleone',
    referenceImageUrl: undefined,
    instagramLocationId: undefined,
    compatibleSlots: ['morning', 'midday', 'evening', 'night'],
    prompt: `Elegant Milan fashion district street, Via Montenapoleone luxury boutiques.

Classic Italian architecture, designer storefronts (Prada, Gucci, Versace visible), cobblestone street, warm afternoon light.

Sophisticated Milanese atmosphere, fashion-forward pedestrians, luxury cars parked. Duomo visible in distance.

Italian elegance meets high fashion, Instagram model street style moment.

Shot on iPhone, natural photography, golden hour lighting.`,
  },

  // ─────────────────────────────────────────────────────────────
  // MILAN HOTEL — 5-star suite
  // ─────────────────────────────────────────────────────────────
  milan_hotel: {
    id: 'milan_hotel',
    name: 'Milan Luxury Hotel',
    category: 'travel',
    description: 'Five-star Milan hotel suite',
    referenceImageUrl: undefined,
    instagramLocationId: undefined,
    compatibleSlots: ['morning', 'evening', 'night', 'late_night'],
    prompt: `Luxurious Milan hotel suite, contemporary Italian design.

King bed with crisp white linens, floor-to-ceiling windows with Milan skyline view, Duomo visible.

Marble bathroom visible through open door, designer furniture, fresh flowers, champagne on ice.

Five-star Italian hospitality atmosphere, elegant and refined. Fashion week accommodation aesthetic.

Shot on iPhone, natural photography, warm ambient lighting.`,
  },

  // ─────────────────────────────────────────────────────────────
  // BACKSTAGE SHOOTING — Studio, coulisses
  // ─────────────────────────────────────────────────────────────
  backstage_shooting: {
    id: 'backstage_shooting',
    name: 'Backstage Shooting',
    category: 'travel',
    description: 'Fashion photo studio backstage',
    referenceImageUrl: undefined,
    instagramLocationId: undefined,
    compatibleSlots: ['morning', 'midday', 'evening'],
    prompt: `Professional fashion photo studio backstage area.

Makeup station with Hollywood mirror, clothing racks with designer pieces, soft lighting rigs visible.

Bustling creative atmosphere, makeup brushes, styling products, polaroids pinned to wall.

Behind-the-scenes fashion shoot energy, authentic model working moment.

Shot on iPhone, natural photography, soft diffused studio lighting.`,
  },

  // ─────────────────────────────────────────────────────────────
  // YACHT MEDITERRANEAN — Luxury summer
  // ─────────────────────────────────────────────────────────────
  yacht_mediterranean: {
    id: 'yacht_mediterranean',
    name: 'Yacht Méditerranée',
    category: 'travel',
    description: 'Luxury yacht in Mediterranean sea',
    referenceImageUrl: undefined,
    instagramLocationId: undefined,
    compatibleSlots: ['morning', 'midday', 'evening'],
    prompt: `Luxury yacht deck in crystal clear Mediterranean Sea.

Pristine white deck, teak wood details, turquoise water visible, Amalfi Coast cliffs in background.

Champagne and fresh fruit on deck table, plush sun loungers, nautical elegance.

Ultimate summer luxury lifestyle, exclusive yacht charter atmosphere.

Shot on iPhone, natural photography, bright summer daylight.`,
  },

  // ─────────────────────────────────────────────────────────────
  // LONDON ROOFTOP — Bar, evening
  // ─────────────────────────────────────────────────────────────
  london_rooftop: {
    id: 'london_rooftop',
    name: 'London Rooftop Bar',
    category: 'travel',
    description: 'Trendy London rooftop bar with city views',
    referenceImageUrl: undefined,
    instagramLocationId: undefined,
    compatibleSlots: ['evening', 'night'],
    prompt: `Trendy London rooftop bar at sunset.

Panoramic London skyline view, The Shard and St Paul's visible, golden hour light.

Stylish outdoor seating, cocktails on marble table, fairy lights strung overhead.

Sophisticated London nightlife atmosphere, fashion-forward crowd.

Shot on iPhone, natural photography, warm evening light.`,
  },

  // ─────────────────────────────────────────────────────────────
  // MALDIVES SUITE — Luxury beach vacation
  // ─────────────────────────────────────────────────────────────
  maldives_suite: {
    id: 'maldives_suite',
    name: 'Maldives Overwater Suite',
    category: 'travel',
    description: 'Luxury overwater bungalow in Maldives',
    referenceImageUrl: undefined,
    instagramLocationId: undefined,
    compatibleSlots: ['morning', 'midday', 'evening'],
    prompt: `Luxury Maldives overwater villa with infinity pool.

Crystal clear turquoise lagoon, white sand beach visible, private deck with loungers.

Minimalist tropical luxury interior visible through open doors, outdoor shower, fresh tropical flowers.

Ultimate paradise escape, honeymoon destination aesthetic.

Shot on iPhone, natural photography, bright tropical daylight.`,
  },

  // ─────────────────────────────────────────────────────────────
  // AIRPORT LOUNGE — Transit, work
  // ─────────────────────────────────────────────────────────────
  airport_lounge: {
    id: 'airport_lounge',
    name: 'Airport Business Lounge',
    category: 'travel',
    description: 'First class airport lounge',
    referenceImageUrl: undefined,
    instagramLocationId: undefined,
    compatibleSlots: ['morning', 'midday', 'evening'],
    prompt: `Luxury first class airport lounge with runway views.

Designer furniture, floor-to-ceiling windows showing planes, quiet sophisticated atmosphere.

Champagne bar visible, business travelers in background, laptop and passport on table.

Jet-setter lifestyle, frequent flyer aesthetic, work and travel blend.

Shot on iPhone, natural photography, soft ambient lounge lighting.`,
  },
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get location by ID
 */
export function getElenaLocation(id: string): ElenaLocation | undefined {
  return ELENA_LOCATIONS[id];
}

/**
 * Get all locations with reference images
 */
export function getElenaLocationsWithReferences(): ElenaLocation[] {
  return Object.values(ELENA_LOCATIONS).filter(loc => loc.referenceImageUrl);
}

/**
 * Get locations compatible with a slot
 */
export function getElenaLocationsForSlot(
  slot: 'morning' | 'midday' | 'evening' | 'night' | 'late_night'
): ElenaLocation[] {
  return Object.values(ELENA_LOCATIONS).filter(loc => 
    loc.compatibleSlots.includes(slot)
  );
}

/**
 * Check if a location has a reference image
 */
export function hasLocationReference(id: string): boolean {
  const loc = ELENA_LOCATIONS[id];
  return !!loc?.referenceImageUrl;
}

