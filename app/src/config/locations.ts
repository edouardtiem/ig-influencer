/**
 * Recurring Locations Configuration for Mila
 * Active locations + future locations
 */

export interface Location {
  id: string;
  name: string;
  category: 'nice_fitness' | 'nice_lifestyle' | 'nice_beach' | 'nice_urban' | 'home' | 'paris' | 'travel';
  description: string;
  prompt: string;
  mood: string;
  timeOfDay: 'morning' | 'afternoon' | 'golden_hour' | 'evening' | 'night' | 'any';
  frequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
  referenceImageUrl?: string; // Cloudinary URL for reference image
  status?: 'active' | 'pending'; // 'active' = ready to use, 'pending' = future (default)
  compatibleSlots?: ('morning' | 'midday' | 'evening' | 'night')[]; // Calendar slots
}

// ═══════════════════════════════════════════════════════════════
// ACTIVE LOCATIONS — Ready to use (with real prompts)
// ═══════════════════════════════════════════════════════════════

export const ACTIVE_LOCATIONS: Location[] = [
  // ─────────────────────────────────────────────────────────────
  // HOME — Mila's Apartment Paris 18e
  // ─────────────────────────────────────────────────────────────
  {
    id: 'home_bedroom',
    name: 'Chambre Mila',
    category: 'home',
    description: 'Cozy bohemian bedroom, artiste sportive punk rock fun aesthetic',
    prompt: `Cozy bohemian bedroom with edgy artistic vibe, windows with curtains.

Unmade bed with rumpled grey linen sheets, chunky knit terracotta throw blanket. Mix of pillows - some solid black, olive green, one with abstract pattern.

Nightstand cluttered with real life items: iPhone face-down, AirPods case, half-empty water bottle, open skincare products, small succulent in concrete pot, vintage film camera (Canon AE-1).

Wall behind bed: vintage rock band poster (Nirvana/Blondie style), polaroid photos taped casually, one framed black and white photography print.

Corner of room visible: acoustic guitar leaning against wall, pair of white Nike Air Force 1 sneakers on floor, resistance bands draped over chair, yoga mat rolled up, DSLR camera with strap on the desk.

Wooden floor with worn vintage rug (not perfect). Plant in corner - large monstera.

Lived-in aesthetic, creative messy-chic. Shot on iPhone. The room of a 22-year-old fitness girl who's also a photographer - energetic but cozy, artistic but sporty.`,
    mood: 'Cozy, intimate, creative',
    timeOfDay: 'any',
    frequency: 'daily',
    status: 'active',
    compatibleSlots: ['morning', 'evening', 'night'],
    referenceImageUrl: 'https://res.cloudinary.com/dily60mr0/image/upload/v1764794597/1._Chambre_Paris_u2lyut.png',
  },
  {
    id: 'home_living_room',
    name: 'Salon Mila',
    category: 'home',
    description: 'Parisian living room with rooftop view, bohemian-artistic vibe',
    prompt: `Based on the reference bedroom image provided, create the matching living room of the same apartment. Maintain exact same aesthetic, color palette, and vibe.

Cozy Parisian apartment living room in 18th arrondissement Montmartre, bohemian-artistic vibe matching the bedroom.

ARCHITECTURE: Small but bright Parisian living room (25-30m²), tall ceiling, large traditional French windows with white wood frames. VIEW THROUGH WINDOW: Paris zinc rooftops, chimneys, typical Montmartre skyline visible - she lives on upper floor (4th-5th étage). Original herringbone parquet floor (honey oak, slightly worn) - same as bedroom.

WALLS: Off-white/cream walls with character. Wall decor includes:
- Vintage rock band poster (Blondie or Arctic Monkeys style) in simple black frame
- Grid of polaroid photos casually taped/pinned
- One framed black and white photography print (her own work)
- Small floating shelf with vinyl records leaning

SOFA: Comfortable linen sofa in warm beige/sand color, lived-in look with:
- Mix of throw pillows (black, olive green, terracotta, one abstract pattern)
- Chunky knit terracotta throw blanket draped casually (same as bedroom)

COFFEE TABLE: Vintage wooden coffee table (slightly worn) CLUTTERED with real life mess:
- Stack of magazines (Vogue, i-D) some open, some closed
- Vintage film camera (Canon AE-1) with strap
- Small succulent in concrete pot
- Half-drunk coffee cup, coffee ring stain
- Open notebook with handwritten notes and pen
- iPhone face down
- AirPods case open
- TV remote
- Hair scrunchie
- Lip balm / hand cream tube
- A few loose polaroid photos
- Water bottle half empty

CORNER ELEMENTS:
- Large monstera plant in terracotta pot
- Acoustic guitar leaning against wall (same guitar as bedroom)
- Yoga mat rolled up standing in corner
- Vintage Persian rug under coffee table (faded reds, creams, worn - same style as bedroom)

SHELVING: Simple wooden bookshelf with books, vinyl records, plants, DSLR camera, candles.

FLOOR: Pair of white Nike Air Force 1 sneakers left near sofa. Resistance bands draped over chair.

Authentic Parisian apartment with rooftop view, iPhone quality. Creative messy-chic with personality.`,
    mood: 'Cozy, warm, creative',
    timeOfDay: 'any',
    frequency: 'daily',
    status: 'active',
    compatibleSlots: ['evening', 'night'],
    referenceImageUrl: 'https://res.cloudinary.com/dily60mr0/image/upload/v1764794600/2._Salon_Paris_ltyd8r.png',
  },
  
  // ─────────────────────────────────────────────────────────────
  // CAFÉ — KB CaféShop Paris 18e
  // ─────────────────────────────────────────────────────────────
  {
    id: 'nice_old_town_cafe', // Keep ID for compatibility
    name: 'KB CaféShop',
    category: 'paris',
    description: 'Specialty coffee shop Paris 18e, industrial creative vibe',
    prompt: `Recreate this exact coffee shop interior faithfully.

WALLS: Left wall with worn distressed plaster/stucco in warm beige-terracotta patina, weathered texture with visible patches, industrial aged look. Large "KB" letters visible on wall.

WINDOWS: Floor-to-ceiling black metal frame windows along left side, view of Parisian street with trees outside.

FLOOR: Dark concrete or dark tile flooring.

FURNITURE: Long communal wooden table in light oak wood, rectangular shape. Round wooden seat stools with black metal pedestal base, industrial style, arranged along the table and window bar.

COUNTER/BAR: Right side of frame, light wood counter with shelving behind displaying coffee bags in brown paper packaging, glass jars, products. Black chalkboard menu visible. Pendant industrial lamps hanging above.

COLUMN: Decorative cast iron column (Haussmann style) in the middle of the space, painted dark.

ATMOSPHERE: A few customers casually sitting - someone on laptop by window, person at counter. Relaxed Parisian specialty coffee shop vibe. Not crowded.

STYLE: Authentic industrial-rustic Parisian coffee shop, lived-in patina, not renovated-clean, real texture and character.

Camera angle: Wide shot from inside, looking toward windows and counter, showing the full space.

Photorealistic, iPhone quality photo.`,
    mood: 'Creative, focused, Parisian',
    timeOfDay: 'morning',
    frequency: 'daily',
    status: 'active',
    compatibleSlots: ['morning', 'midday'],
    referenceImageUrl: 'https://res.cloudinary.com/dily60mr0/image/upload/v1764794600/4._KB_Cafe%CC%81Shop_Paris_18_a06ebs.png',
  },
  
  // ─────────────────────────────────────────────────────────────
  // GYM — L'Usine Paris
  // ─────────────────────────────────────────────────────────────
  {
    id: 'nice_gym', // Keep ID for compatibility
    name: "L'Usine Paris",
    category: 'paris',
    description: 'Premium industrial gym, concrete and leather aesthetic',
    prompt: `Recreate this exact gym interior faithfully.

COLUMNS: Large raw concrete industrial pillars/columns, grey-beige stone texture, exposed rough surface, structural industrial style.

WALLS: Dark black painted walls with sections of mustard yellow accent wall on the right side. Industrial warehouse aesthetic.

FLOOR: Dark polished concrete floor, grey-charcoal color, smooth reflective surface.

CEILING: Dark/black painted ceiling with exposed track lighting and spotlights.

EQUIPMENT: Professional weight machines in black metal frames with cognac/caramel brown leather padding and seats. Brand style "VR3" visible on machines. Multiple cable machines, lat pulldown, leg press stations arranged in rows.

WINDOWS: Large industrial windows at the back with diamond/lattice metal security grilles, grey curtains partially drawn, view of greenery outside.

ATMOSPHERE: Empty or near-empty gym, professional high-end fitness club aesthetic. Not a budget gym - premium industrial-luxe style.

COLOR PALETTE: Black, dark grey, raw concrete grey-beige, mustard yellow accents, cognac brown leather.

Camera angle: Wide shot from inside showing the depth of the space, equipment in foreground, windows in background.

Photorealistic, iPhone quality photo.

This is L'Usine Paris gym - industrial warehouse converted to premium fitness club.`,
    mood: 'Energetic, professional, premium',
    timeOfDay: 'any',
    frequency: 'daily',
    status: 'active',
    compatibleSlots: ['morning', 'midday'],
    referenceImageUrl: 'https://res.cloudinary.com/dily60mr0/image/upload/v1764794600/3._Gym_eewa9s.png',
  },
];

// ═══════════════════════════════════════════════════════════════
// PENDING LOCATIONS — To be added later
// ═══════════════════════════════════════════════════════════════

export const LOCATIONS: Location[] = [
  // ═══════════════════════════════════════════════════════════════
  // NICE — FITNESS & WELLNESS (4)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'nice_gym',
    name: 'Salle de Sport Premium',
    category: 'nice_fitness',
    description: 'Modern luxury gym, black equipment, chrome details, floor-to-ceiling windows',
    prompt: 'Modern luxury gym interior, floor-to-ceiling windows overlooking Nice, black fitness equipment with chrome accents, potted tropical plants, polished concrete floor, natural morning light streaming in, empty gym, professional fitness studio atmosphere, high-end equipment, mirrors, minimalist design',
    mood: 'Energetic, professional',
    timeOfDay: 'morning',
    frequency: 'daily',
  },
  {
    id: 'nice_yoga_studio',
    name: 'Studio Yoga Boutique',
    category: 'nice_fitness',
    description: 'Minimalist yoga studio, white walls, light wood floor',
    prompt: 'Minimalist boutique yoga studio, pristine white walls, light oak hardwood floor, neatly rolled yoga mats in terracotta and beige, large windows with sheer white curtains, natural diffused light, zen atmosphere, small potted succulents, empty peaceful space, high ceiling',
    mood: 'Zen, peaceful',
    timeOfDay: 'morning',
    frequency: 'weekly',
  },
  {
    id: 'nice_promenade_run',
    name: 'Promenade des Anglais Running',
    category: 'nice_fitness',
    description: 'Seafront promenade, palm trees, Mediterranean view',
    prompt: 'Nice France Promenade des Anglais at sunrise, Mediterranean Sea on one side, iconic blue chairs, tall palm trees lining the promenade, pink and orange sky, empty jogging path, Baie des Anges in background, French Riviera morning atmosphere, photorealistic',
    mood: 'Athletic, free',
    timeOfDay: 'morning',
    frequency: 'daily',
  },
  {
    id: 'nice_castle_hill',
    name: 'Colline du Château Workout',
    category: 'nice_fitness',
    description: 'Castle Hill with panoramic bay view',
    prompt: 'Colline du Château Nice France, panoramic view of Baie des Anges, stone stairs, lush Mediterranean vegetation, old stone ruins, morning golden light, empty hilltop park, stunning coastal view, outdoor workout setting',
    mood: 'Outdoor adventure',
    timeOfDay: 'morning',
    frequency: 'weekly',
  },

  // ═══════════════════════════════════════════════════════════════
  // NICE — LIFESTYLE & CAFÉS (4)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'nice_old_town_cafe',
    name: 'Café Terrace Vieille Ville',
    category: 'nice_lifestyle',
    description: 'Charming Old Town café with colorful facades',
    prompt: 'Nice Old Town Vieux Nice charming café terrace, classic rattan bistro chairs, small round marble tables, colorful ochre and terracotta building facades, narrow cobblestone street, morning coffee and croissant setup, flower boxes on windows, dappled sunlight, French Riviera charm, empty terrace',
    mood: 'French charm',
    timeOfDay: 'morning',
    frequency: 'daily',
  },
  {
    id: 'nice_rooftop_bar',
    name: 'Rooftop Bar Nice',
    category: 'nice_lifestyle',
    description: 'Chic rooftop with sea view and string lights',
    prompt: 'Luxury rooftop bar terrace in Nice France, panoramic Mediterranean sea view, warm string lights, modern outdoor furniture, sunset golden hour, cocktail lounge setting, potted olive trees, chic sophisticated atmosphere, pink and orange sky, empty elegant terrace',
    mood: 'Chic evening',
    timeOfDay: 'golden_hour',
    frequency: 'weekly',
  },
  {
    id: 'nice_beach_club',
    name: 'Beach Club Plage Privée',
    category: 'nice_lifestyle',
    description: 'Private beach club with white sunbeds',
    prompt: 'Exclusive private beach club French Riviera Nice, pristine white sunbeds with beige cushions, large white parasols, turquoise Mediterranean sea, champagne bucket on side table, luxury beach setting, palm trees, empty elegant beach club, summer afternoon',
    mood: 'Luxury relaxed',
    timeOfDay: 'afternoon',
    frequency: 'weekly',
  },
  {
    id: 'nice_flower_market',
    name: 'Marché Cours Saleya',
    category: 'nice_lifestyle',
    description: 'Famous flower and produce market',
    prompt: 'Cours Saleya market Nice France, vibrant flower stalls with colorful blooms, fresh Provençal produce, striped market awnings, terracotta pots, morning market atmosphere, old town buildings in background, bustling but uncrowded, authentic French market scene',
    mood: 'Authentic, vibrant',
    timeOfDay: 'morning',
    frequency: 'weekly',
  },

  // ═══════════════════════════════════════════════════════════════
  // NICE — BEACH & NATURE (3)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'nice_beach',
    name: 'Plage Publique Nice',
    category: 'nice_beach',
    description: 'Public pebble beach with Promenade view',
    prompt: 'Nice France public beach, smooth grey pebbles, crystal clear turquoise Mediterranean water, Promenade des Anglais in background, blue sky, summer day, beach towel and bag setup, gentle waves, typical Nice beach atmosphere, no people',
    mood: 'Casual beach',
    timeOfDay: 'afternoon',
    frequency: 'weekly',
  },
  {
    id: 'villefranche_beach',
    name: 'Plage Villefranche-sur-Mer',
    category: 'nice_beach',
    description: 'Sandy beach with colorful village',
    prompt: 'Villefranche-sur-Mer beach French Riviera, fine sandy beach, incredibly clear turquoise water, colorful pastel village houses climbing the hillside, fishing boats, Mediterranean paradise, golden hour light, postcard-perfect setting, empty beach',
    mood: 'Paradise',
    timeOfDay: 'golden_hour',
    frequency: 'monthly',
  },
  {
    id: 'cap_ferrat_path',
    name: 'Cap Ferrat Sentier',
    category: 'nice_beach',
    description: 'Coastal hiking path with hidden coves',
    prompt: 'Cap Ferrat coastal hiking path French Riviera, Mediterranean pine trees, rocky coastline, hidden turquoise coves below, winding dirt path, panoramic sea views, wild natural beauty, golden afternoon light, adventure setting',
    mood: 'Adventure, nature',
    timeOfDay: 'afternoon',
    frequency: 'monthly',
  },

  // ═══════════════════════════════════════════════════════════════
  // NICE — URBAN (4)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'nice_place_massena',
    name: 'Place Masséna',
    category: 'nice_urban',
    description: 'Iconic red square with fountain',
    prompt: 'Place Masséna Nice France, iconic red ochre buildings, large fountain, checkered black and white pavement, artistic statue figures on poles, evening blue hour with warm streetlights, empty elegant square, Nice landmark',
    mood: 'Iconic Nice',
    timeOfDay: 'evening',
    frequency: 'weekly',
  },
  {
    id: 'nice_port',
    name: 'Port de Nice',
    category: 'nice_urban',
    description: 'Harbor with yachts and colored boats',
    prompt: 'Port of Nice France, colorful traditional fishing boats, luxury yachts in marina, waterfront restaurants with terraces, Mediterranean blue water reflections, Colline du Château in background, golden hour, authentic harbor atmosphere',
    mood: 'Mediterranean',
    timeOfDay: 'golden_hour',
    frequency: 'weekly',
  },
  {
    id: 'nice_shopping_street',
    name: 'Rue Piétonne Shopping',
    category: 'nice_urban',
    description: 'Pedestrian shopping street with boutiques',
    prompt: 'Avenue Jean Médecin Nice pedestrian shopping street, elegant boutique storefronts, shopping bags, tree-lined avenue, afternoon shoppers blur, upscale retail atmosphere, French Riviera shopping district, clean modern street',
    mood: 'Lifestyle',
    timeOfDay: 'afternoon',
    frequency: 'weekly',
  },
  {
    id: 'nice_liberation',
    name: 'Quartier Libération',
    category: 'nice_urban',
    description: 'Local authentic neighborhood market',
    prompt: 'Quartier Libération Nice France, authentic local neighborhood, daily market stalls, real Niçois life, tree-shaded square, local shops, morning market activity, genuine French daily life atmosphere, not touristy',
    mood: 'Real life',
    timeOfDay: 'morning',
    frequency: 'weekly',
  },

  // ═══════════════════════════════════════════════════════════════
  // MILA'S APARTMENT (5)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'home_bedroom',
    name: 'Chambre Master',
    category: 'home',
    description: 'Modern bedroom with white linens and natural light',
    prompt: 'Modern apartment bedroom Nice France, king size bed with crisp white linen bedding, soft beige throw blanket, large window with sheer curtains letting in natural morning light, full-length mirror with thin gold frame, potted monstera plant, minimalist warm décor, wooden nightstand, cozy intimate atmosphere',
    mood: 'Cozy, intimate',
    timeOfDay: 'morning',
    frequency: 'daily',
  },
  {
    id: 'home_living_room',
    name: 'Salon Lumineux',
    category: 'home',
    description: 'Bright living room with beige sofa',
    prompt: 'Modern apartment living room Nice, large comfortable beige linen sofa with throw pillows, floor-to-ceiling windows with city view, built-in bookshelves with plants and books, Berber style rug, brass floor lamp, natural afternoon light, minimalist Scandinavian-Mediterranean décor, airy bright space',
    mood: 'Home vibes',
    timeOfDay: 'afternoon',
    frequency: 'daily',
  },
  {
    id: 'home_kitchen',
    name: 'Cuisine Ouverte',
    category: 'home',
    description: 'Modern open kitchen with island',
    prompt: 'Modern open kitchen apartment, white cabinets with oak wood accents, kitchen island with marble countertop, two high rattan stools, fresh fruits and smoothie ingredients on counter, morning light through window, healthy lifestyle kitchen, clean minimalist design, copper pendant lights',
    mood: 'Healthy lifestyle',
    timeOfDay: 'morning',
    frequency: 'daily',
  },
  {
    id: 'home_bathroom',
    name: 'Salle de Bain Luxe',
    category: 'home',
    description: 'Luxury bathroom with freestanding tub',
    prompt: 'Luxury apartment bathroom, elegant freestanding white bathtub, white and grey marble walls and floor, large round mirror with gold frame, green potted plants, fluffy white towels, candles, natural light through frosted window, spa-like self-care atmosphere, high-end minimalist design',
    mood: 'Self-care',
    timeOfDay: 'any',
    frequency: 'weekly',
  },
  {
    id: 'home_balcony',
    name: 'Balcon Vue Mer',
    category: 'home',
    description: 'Small balcony with partial sea view',
    prompt: 'Small apartment balcony Nice France, wrought iron railing, potted Mediterranean plants and herbs, small bistro table with morning coffee setup, partial view of Mediterranean sea between buildings, terracotta pots, morning golden light, peaceful morning moment',
    mood: 'Peaceful morning',
    timeOfDay: 'morning',
    frequency: 'daily',
  },

  // ═══════════════════════════════════════════════════════════════
  // PARIS (6)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'paris_cafe',
    name: 'Café Parisien Iconique',
    category: 'paris',
    description: 'Classic Parisian café terrace',
    prompt: 'Classic Parisian café terrace, iconic green or red bistro chairs, small round marble table, croissant and coffee setup, Haussmann building façade in background, morning light, cobblestone sidewalk, quintessential Paris atmosphere, empty terrace seat',
    mood: 'Classic Paris',
    timeOfDay: 'morning',
    frequency: 'monthly',
  },
  {
    id: 'paris_tuileries',
    name: 'Jardin des Tuileries',
    category: 'paris',
    description: 'Tuileries Garden with iconic green chairs',
    prompt: 'Jardin des Tuileries Paris, iconic green metal chairs, octagonal fountain basin, manicured lawns and trees, Louvre palace in distant background, afternoon autumn or spring light, Parisian garden elegance, peaceful atmosphere',
    mood: 'Elegant',
    timeOfDay: 'afternoon',
    frequency: 'monthly',
  },
  {
    id: 'paris_alexandre_bridge',
    name: 'Pont Alexandre III',
    category: 'paris',
    description: 'Ornate bridge with Eiffel Tower view',
    prompt: 'Pont Alexandre III Paris, ornate golden Art Nouveau lampposts, cherub statues, Seine River, Eiffel Tower visible in distance, golden hour sunset light, romantic Parisian atmosphere, one of the most beautiful bridges in Paris',
    mood: 'Romantic',
    timeOfDay: 'golden_hour',
    frequency: 'monthly',
  },
  {
    id: 'paris_marais',
    name: 'Marais Rue Trendy',
    category: 'paris',
    description: 'Trendy Marais district street',
    prompt: 'Le Marais Paris trendy street, vintage boutiques, hip café terraces, historic Parisian buildings, colorful storefronts, fashionable neighborhood atmosphere, afternoon light, quintessential bobo Paris, cobblestone street',
    mood: 'Hipster chic',
    timeOfDay: 'afternoon',
    frequency: 'monthly',
  },
  {
    id: 'paris_rooftop',
    name: 'Rooftop Parisien',
    category: 'paris',
    description: 'Rooftop with zinc rooftops and Eiffel view',
    prompt: 'Parisian rooftop terrace, classic zinc Haussmann rooftops stretching to horizon, Eiffel Tower in distance, elegant outdoor furniture, champagne setup, sunset pink and orange sky, ultimate Paris glamour view, exclusive rooftop atmosphere',
    mood: 'Glamour',
    timeOfDay: 'golden_hour',
    frequency: 'occasional',
  },
  {
    id: 'paris_montmartre',
    name: 'Montmartre Escaliers',
    category: 'paris',
    description: 'Montmartre stairs with Sacré-Cœur',
    prompt: 'Montmartre Paris, famous steep stairs, Sacré-Cœur Basilica white domes in background, artist easels on sidewalk, charming old lampposts, romantic bohemian atmosphere, morning or golden hour light, quintessential Montmartre scene',
    mood: 'Bohème romantic',
    timeOfDay: 'golden_hour',
    frequency: 'occasional',
  },

  // ═══════════════════════════════════════════════════════════════
  // TRAVEL — ITALY (2)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'italy_positano',
    name: 'Positano Amalfi Coast',
    category: 'travel',
    description: 'Colorful cliffside village',
    prompt: 'Positano Amalfi Coast Italy, pastel colored houses cascading down steep cliff to sea, bright pink bougainvillea flowers, Mediterranean blue sea, iconic Italian coastal village, summer golden hour, postcard perfect Amalfi view, no people',
    mood: 'Dolce vita',
    timeOfDay: 'golden_hour',
    frequency: 'occasional',
  },
  {
    id: 'italy_rome',
    name: 'Rome Piazza',
    category: 'travel',
    description: 'Roman piazza with baroque fountain',
    prompt: 'Rome Italy charming piazza, baroque fountain centerpiece, outdoor café terrace with checkered tablecloths, gelato shop, warm ochre Italian buildings, afternoon warm light, la dolce vita atmosphere, authentic Roman neighborhood square',
    mood: 'Italian romance',
    timeOfDay: 'afternoon',
    frequency: 'occasional',
  },

  // ═══════════════════════════════════════════════════════════════
  // TRAVEL — SPAIN (2)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'spain_barcelona',
    name: 'Barcelona Barceloneta Beach',
    category: 'travel',
    description: 'Urban beach with palm trees',
    prompt: 'Barceloneta beach Barcelona Spain, golden sand urban beach, tall palm trees, colorful beach bars chiringuitos, Mediterranean sea, W Hotel sail building in distance, summer beach party atmosphere, Barcelona skyline',
    mood: 'Party beach',
    timeOfDay: 'afternoon',
    frequency: 'occasional',
  },
  {
    id: 'spain_ibiza',
    name: 'Ibiza Beach Club',
    category: 'travel',
    description: 'Luxury beach club with pool',
    prompt: 'Ibiza luxury beach club, all-white décor, infinity pool overlooking Mediterranean, DJ booth area, Balinese day beds, sunset orange and pink sky, exclusive party atmosphere, beach club luxury, palm trees',
    mood: 'Party luxury',
    timeOfDay: 'golden_hour',
    frequency: 'occasional',
  },

  // ═══════════════════════════════════════════════════════════════
  // TRAVEL — GREECE (2)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'greece_santorini',
    name: 'Santorini Blue Domes',
    category: 'travel',
    description: 'Iconic white and blue Santorini',
    prompt: 'Santorini Greece, iconic white cubist buildings, famous blue-domed churches, caldera sea view, bougainvillea flowers, dramatic cliff setting, sunset golden hour, Oia village, most photographed Greek island view, dreamy Mediterranean',
    mood: 'Dream destination',
    timeOfDay: 'golden_hour',
    frequency: 'occasional',
  },
  {
    id: 'greece_mykonos',
    name: 'Mykonos Windmills',
    category: 'travel',
    description: 'Famous windmills at sunset',
    prompt: 'Mykonos Greece famous windmills, row of white traditional windmills, Aegean Sea background, sunset pink and orange sky, whitewashed Cycladic buildings, iconic Greek islands landmark, romantic atmosphere',
    mood: 'Iconic Greece',
    timeOfDay: 'golden_hour',
    frequency: 'occasional',
  },

  // ═══════════════════════════════════════════════════════════════
  // TRAVEL — OTHER (3)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'dubai_marina',
    name: 'Dubai Marina Skyline',
    category: 'travel',
    description: 'Ultra-modern marina with skyscrapers',
    prompt: 'Dubai Marina at night, ultra-modern glass skyscrapers, luxury yachts in marina, illuminated buildings reflecting on water, futuristic city skyline, palm trees, luxury lifestyle setting, impressive modern architecture',
    mood: 'Ultra glam',
    timeOfDay: 'night',
    frequency: 'occasional',
  },
  {
    id: 'bali_terraces',
    name: 'Bali Rice Terraces',
    category: 'travel',
    description: 'Lush green rice terraces',
    prompt: 'Bali Indonesia Tegallalang rice terraces, cascading green paddy fields, tall coconut palm trees, tropical jungle backdrop, morning mist, zen peaceful atmosphere, iconic Bali landscape, spiritual nature setting',
    mood: 'Zen travel',
    timeOfDay: 'morning',
    frequency: 'occasional',
  },
  {
    id: 'maldives_villa',
    name: 'Maldives Overwater Villa',
    category: 'travel',
    description: 'Overwater bungalow paradise',
    prompt: 'Maldives luxury overwater villa, wooden deck extending over crystal clear turquoise lagoon, thatched roof bungalow, white sand visible through water, private infinity pool, ultimate tropical paradise, honeymoon destination, pristine untouched beauty',
    mood: 'Ultimate luxury',
    timeOfDay: 'afternoon',
    frequency: 'occasional',
  },
];

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS — ACTIVE LOCATIONS (Production)
// ═══════════════════════════════════════════════════════════════

/**
 * Get all active locations (ready for use)
 */
export function getActiveLocations(): Location[] {
  return ACTIVE_LOCATIONS;
}

/**
 * Get active location by ID
 */
export function getActiveLocationById(id: string): Location | undefined {
  return ACTIVE_LOCATIONS.find(loc => loc.id === id);
}

/**
 * Get active locations compatible with a calendar slot
 */
export function getActiveLocationsForSlot(slot: 'morning' | 'midday' | 'evening' | 'night'): Location[] {
  return ACTIVE_LOCATIONS.filter(loc => 
    loc.compatibleSlots?.includes(slot) ?? false
  );
}

/**
 * Get a random active location for a slot
 */
export function getRandomActiveLocationForSlot(slot: 'morning' | 'midday' | 'evening' | 'night'): Location | undefined {
  const compatible = getActiveLocationsForSlot(slot);
  if (compatible.length === 0) return undefined;
  return compatible[Math.floor(Math.random() * compatible.length)];
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS — ALL LOCATIONS (Legacy/Future)
// ═══════════════════════════════════════════════════════════════

/**
 * Get locations by category
 */
export function getLocationsByCategory(category: Location['category']): Location[] {
  return LOCATIONS.filter(loc => loc.category === category);
}

/**
 * Get a random location, optionally filtered by category
 */
export function getRandomLocation(category?: Location['category']): Location {
  const pool = category ? getLocationsByCategory(category) : LOCATIONS;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Get locations suitable for a specific time of day
 */
export function getLocationsByTimeOfDay(timeOfDay: Location['timeOfDay']): Location[] {
  return LOCATIONS.filter(loc => loc.timeOfDay === timeOfDay || loc.timeOfDay === 'any');
}

/**
 * Get high-frequency locations (daily/weekly)
 */
export function getFrequentLocations(): Location[] {
  return LOCATIONS.filter(loc => loc.frequency === 'daily' || loc.frequency === 'weekly');
}

/**
 * Get location by ID (searches both active and pending)
 */
export function getLocationById(id: string): Location | undefined {
  return ACTIVE_LOCATIONS.find(loc => loc.id === id) || LOCATIONS.find(loc => loc.id === id);
}

// Stats
export const LOCATION_STATS = {
  active: ACTIVE_LOCATIONS.length,
  pending: LOCATIONS.length,
  total: ACTIVE_LOCATIONS.length + LOCATIONS.length,
};

