import { ContentTemplate, ContentType } from '@/types';

/**
 * Content Templates for Mila Verne
 * Each template defines: clothing, pose, setting, captions, hashtags
 */

export const CONTENT_TEMPLATES: ContentTemplate[] = [
  // LIFESTYLE (40%)
  {
    type: 'lifestyle',
    clothing: 'beige linen blazer over white crop top, high waisted blue jeans',
    pose: 'sitting at Parisian café terrace, holding coffee cup, relaxed confident pose, looking at camera with soft smile',
    setting: 'charming French café with rattan chairs, morning golden hour light',
    captions: [
      'Le café d\'abord, le reste après ☕',
      'Chargement de vitamine D en cours ☀️',
      'Dimanche mood 🤍',
      'Les matins parisiens ont un truc en plus...',
      'Terrasse + soleil = bonheur simple',
    ],
    hashtags: ['#parisienne', '#coffeelover', '#frenchgirl', '#vieparisienne', '#ootd', '#weekend'],
  },
  {
    type: 'lifestyle',
    clothing: 'flowing midi dress in terracotta, white sneakers',
    pose: 'walking on Parisian street, hair flowing, candid movement shot, happy expression',
    setting: 'beautiful Haussmann building background, cobblestone street, soft afternoon light',
    captions: [
      'Cette lumière... 🤌',
      'Me perdre dans les rues de Paris',
      'Golden hour et bonnes vibes ✨',
      'Protagoniste de ma propre vie',
      'Balade du dimanche',
    ],
    hashtags: ['#ruesdeparis', '#goldenhour', '#streetstyle', '#modeparisienne', '#stylefrancais'],
  },
  
  // FITNESS (30%)
  {
    type: 'fitness',
    clothing: 'matching olive green sports bra and high waisted leggings, Alo Yoga style',
    pose: 'mid-workout pose in gym, slight sweat glow, confident stance, looking at camera',
    setting: 'modern bright gym with mirrors, natural light from large windows',
    captions: [
      'Le glow post-workout > le maquillage 💪',
      'Courbatures mais fière de moi',
      'La régularité, c\'est la clé',
      'Routine matinale non-négociable',
      'On lâche rien 🔥',
    ],
    hashtags: ['#fitgirl', '#motivation', '#workout', '#fitfrenchgirl', '#healthy'],
  },
  {
    type: 'fitness',
    clothing: 'black bike shorts, oversized white hoodie slightly pulled up showing waist',
    pose: 'relaxed post-workout pose, sitting on yoga mat, peaceful expression',
    setting: 'bright minimalist home gym corner, yoga mat, morning light',
    captions: [
      'Le Pilates m\'a changé la vie',
      'Jour de repos bien mérité 🧘‍♀️',
      'Corps et esprit alignés',
      'Mode récup activé',
      'Self-care du dimanche',
    ],
    hashtags: ['#pilates', '#yoga', '#homeworkout', '#selfcare', '#bienetre'],
  },
  
  // SUMMER / BEACH (15%)
  {
    type: 'summer',
    clothing: 'elegant terracotta bikini, simple classic cut',
    pose: 'standing on beach, one hand in hair, relaxed sensual pose, confident smile',
    setting: 'Mediterranean beach Nice France, blue sea, golden hour sunset light, soft waves',
    captions: [
      'La saison des bikinis, c\'est un état d\'esprit 👙',
      'Du sel dans les cheveux, du soleil sur la peau',
      'Chez moi 🌊',
      'Éternellement en mode été',
      'La Méditerranée me manquait',
    ],
    hashtags: ['#plage', '#summer', '#nice', '#mermediterranee', '#bikini', '#cotedazur'],
  },
  {
    type: 'summer',
    clothing: 'elegant one-piece swimsuit in cream white, flattering cut',
    pose: 'lounging by pool edge, legs in water, looking over shoulder at camera',
    setting: 'rooftop pool with city view, blue water, bright summer day',
    captions: [
      'Les journées piscine sont les meilleures',
      'Vitamine Sea 🌴',
      'Profiter de chaque instant',
      'L\'été ne finit jamais vraiment',
      'Moment suspendu',
    ],
    hashtags: ['#piscine', '#ete', '#maillotdebain', '#rooftop', '#summervibes'],
  },
  
  // SEXY LIGHT (10%)
  {
    type: 'sexy_light',
    clothing: 'black mini skirt, fitted white bodysuit, gold jewelry',
    pose: 'mirror selfie pose, confident stance, slight smile, hand on hip',
    setting: 'stylish bedroom with full length mirror, warm evening light',
    captions: [
      'Me sentir bien dans ma peau ✨',
      'Prête pour sortir',
      'La confiance, ça va à tout le monde',
      'Ce look quand même 🖤',
      'Miroir miroir...',
    ],
    hashtags: ['#ootd', '#mirrorselfie', '#soiree', '#allblack', '#style'],
  },
  {
    type: 'sexy_light',
    clothing: 'elegant backless black dress, gold earrings',
    pose: 'looking over shoulder showing back, elegant pose, mysterious smile',
    setting: 'rooftop terrace at night, city lights in background, ambient lighting',
    captions: [
      'Le dos de cette robe 🖤',
      'Ces soirées-là...',
      'Créer des souvenirs',
      'Lumières de la ville et bonnes vibes',
      'La nuit nous appartient',
    ],
    hashtags: ['#soiree', '#petiterobenoire', '#nightout', '#elegance', '#parisbynight'],
  },
  
  // SEXY MEDIUM (5%)
  {
    type: 'sexy_medium',
    clothing: 'cream silk slip dress, delicate lace details, barefoot',
    pose: 'sitting on bed edge, soft morning light, natural relaxed pose, gentle smile',
    setting: 'bright minimalist bedroom, white sheets, morning light through sheer curtains',
    captions: [
      'Matinées paresseuses ☁️',
      'Mode douceur activé',
      'Weekend mood 🤍',
      'Dimanche au ralenti',
      'Ces moments de calme',
    ],
    hashtags: ['#matin', '#cocooning', '#douceur', '#weekend', '#aesthetic'],
  },
  {
    type: 'sexy_medium',
    clothing: 'matching lingerie set in dusty rose, elegant not explicit, silk robe open',
    pose: 'standing by window, silhouette pose, looking outside, peaceful expression',
    setting: 'Parisian apartment with tall windows, morning golden light streaming in',
    captions: [
      'La magie de la lumière du matin ✨',
      'Moments de calme',
      'Bien commencer la journée',
      'Ces matins parisiens',
      'Quand la lumière est parfaite',
    ],
    hashtags: ['#matinparisien', '#lumiere', '#lingerie', '#selfcare', '#apartmentgoals'],
  },
  
  // CASUAL (bonus)
  {
    type: 'casual',
    clothing: 'oversized cream knit sweater, bike shorts underneath, cozy socks',
    pose: 'curled up on couch with coffee, cozy relaxed pose, warm smile',
    setting: 'cozy living room, soft blankets, warm interior lighting, plants',
    captions: [
      'Saison cocooning 🍂',
      'Soirée à la maison ce soir',
      'Netflix et plaid (littéralement)',
      'Home sweet home ☕',
      'Le bonheur est dans les petites choses',
    ],
    hashtags: ['#cocooning', '#chezmoi', '#confort', '#homesweethome', '#cozy'],
  },
  
  // GLAM (bonus)
  {
    type: 'glam',
    clothing: 'fitted black dress, statement gold earrings, red lips',
    pose: 'elegant standing pose, one hand touching hair, confident sultry look',
    setting: 'upscale restaurant or bar entrance, warm ambient lighting, blurred background',
    captions: [
      'Soirée en amoureux 🍷',
      'Se faire belle sans raison',
      'Cette robe, c\'est oui',
      'Envie de glamour ce soir',
      'Les belles soirées parisiennes',
    ],
    hashtags: ['#soiree', '#allblack', '#glamour', '#parisbynight', '#datenight'],
  },
];

/**
 * Get a random template by type
 */
export function getRandomTemplate(type?: ContentType): ContentTemplate {
  const templates = type 
    ? CONTENT_TEMPLATES.filter(t => t.type === type)
    : CONTENT_TEMPLATES;
  
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Get a weighted random template based on content distribution
 * 40% lifestyle, 30% fitness, 15% summer, 10% sexy_light, 5% sexy_medium
 */
export function getWeightedRandomTemplate(): ContentTemplate {
  const weights: Record<ContentType, number> = {
    lifestyle: 40,
    fitness: 30,
    summer: 15,
    sexy_light: 7,
    sexy_medium: 3,
    casual: 3,
    glam: 2,
  };
  
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (const [type, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) {
      return getRandomTemplate(type as ContentType);
    }
  }
  
  return getRandomTemplate();
}

/**
 * Get random caption from template
 */
export function getRandomCaption(template: ContentTemplate): string {
  const caption = template.captions[Math.floor(Math.random() * template.captions.length)];
  const hashtags = template.hashtags.slice(0, 5).join(' '); // Max 5 hashtags
  return `${caption}\n\n${hashtags}`;
}

