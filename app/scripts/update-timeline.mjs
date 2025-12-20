/**
 * Update Timeline to 2024-2025
 * Current date: December 20, 2025
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function updateTimeline() {
  console.log('📅 Updating timeline to 2024-2025...\n');

  // Delete old timeline
  const { error: deleteError } = await supabase
    .from('timeline_events')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (deleteError) {
    console.log('⚠️ Delete warning:', deleteError.message);
  }

  // New timeline (current date: December 20, 2025)
  const events = [
    // 2024
    {
      event_date: '2024-06-15',
      event_type: 'meeting',
      title: 'La rencontre',
      description: 'Mila et Elena se rencontrent sur un shooting. Mila était photographe, Elena mannequin. Connexion immédiate autour d\'un café après le shooting.',
      characters: ['mila', 'elena'],
      location: 'paris',
      emotional_tone: 'nostalgic',
      shareable: true,
    },
    {
      event_date: '2024-08-12',
      event_type: 'trip',
      title: 'Premier weekend ensemble',
      description: 'Elena accompagne Mila chez ses parents à Nice. Premier vrai voyage ensemble, début de l\'amitié.',
      characters: ['mila', 'elena'],
      location: 'nice',
      emotional_tone: 'nostalgic',
      shareable: true,
    },
    {
      event_date: '2024-10-15',
      event_type: 'memory',
      title: 'Halloween à Paris',
      description: 'Soirée déguisées ensemble. Mila en Catwoman, Elena en Wednesday Addams. Photos iconiques.',
      characters: ['mila', 'elena'],
      location: 'paris',
      emotional_tone: 'funny',
      shareable: true,
    },
    {
      event_date: '2024-12-24',
      event_type: 'milestone',
      title: 'Premier Noël ensemble',
      description: 'Réveillon à deux dans l\'appartement de Mila. Champagne, cadeaux, et promesse de voyager ensemble en 2025.',
      characters: ['mila', 'elena'],
      location: 'paris',
      emotional_tone: 'romantic',
      shareable: true,
    },

    // 2025
    {
      event_date: '2025-02-10',
      event_type: 'trip',
      title: 'Ski Trip Courchevel',
      description: 'Une semaine aux sports d\'hiver. Elena apprend à skier (catastrophique mais drôle). Jacuzzi tous les soirs.',
      characters: ['mila', 'elena'],
      location: 'courchevel',
      emotional_tone: 'adventurous',
      shareable: true,
    },
    {
      event_date: '2025-04-20',
      event_type: 'trip',
      title: 'Weekend Milan',
      description: 'Elena pour un shooting, Mila l\'accompagne. Shopping Via Montenapoleone, pasta et Aperol.',
      characters: ['mila', 'elena'],
      location: 'milan',
      emotional_tone: 'adventurous',
      shareable: true,
    },
    {
      event_date: '2025-06-15',
      event_type: 'milestone',
      title: '1 an d\'amitié',
      description: 'Un an depuis leur rencontre. Dîner au Meurice pour fêter ça. Posts nostalgie sur leurs deux comptes.',
      characters: ['mila', 'elena'],
      location: 'paris',
      emotional_tone: 'nostalgic',
      shareable: true,
    },
    {
      event_date: '2025-08-01',
      event_type: 'trip',
      title: 'Bali Trip',
      description: 'Le voyage de rêve. 2 semaines à Bali - villas, plages privées, yoga sunrise, cérémonies traditionnelles.',
      characters: ['mila', 'elena'],
      location: 'bali',
      emotional_tone: 'adventurous',
      shareable: true,
    },
    {
      event_date: '2025-09-15',
      event_type: 'memory',
      title: 'Fashion Week Paris',
      description: 'Elena défile, Mila la photographie backstage. Moment fort de leur collaboration professionnelle.',
      characters: ['mila', 'elena'],
      location: 'paris',
      emotional_tone: 'excited',
      shareable: true,
    },
    {
      event_date: '2025-11-01',
      event_type: 'milestone',
      title: 'Elena nouveau loft',
      description: 'Elena emménage dans son nouveau loft parisien du 8ème. Crémaillère avec Mila première invitée.',
      characters: ['elena'],
      location: 'paris',
      emotional_tone: 'excited',
      shareable: true,
    },
    {
      event_date: '2025-12-01',
      event_type: 'memory',
      title: 'Marché de Noël',
      description: 'Première sortie au marché de Noël des Champs-Élysées. Vin chaud et photos devant les illuminations.',
      characters: ['mila', 'elena'],
      location: 'paris',
      emotional_tone: 'cozy',
      shareable: true,
    },
    {
      event_date: '2025-12-15',
      event_type: 'memory',
      title: 'Shopping de Noël',
      description: 'Shopping aux Galeries Lafayette. Choix des cadeaux pour leurs familles. Mila galère, Elena est organisée.',
      characters: ['mila', 'elena'],
      location: 'paris',
      emotional_tone: 'funny',
      shareable: true,
    },
  ];

  const { data, error } = await supabase
    .from('timeline_events')
    .insert(events)
    .select();

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  console.log('✅ Timeline updated:', data.length, 'events\n');
  
  console.log('📅 Timeline 2024-2025:');
  console.log('─'.repeat(50));
  
  data.sort((a, b) => a.event_date.localeCompare(b.event_date));
  
  let currentYear = '';
  data.forEach(e => {
    const year = e.event_date.substring(0, 4);
    if (year !== currentYear) {
      console.log(`\n${year}`);
      console.log('────');
      currentYear = year;
    }
    console.log(`  ${e.event_date.substring(5)} │ ${e.title}`);
  });

  // Also update relationship met_date
  console.log('\n\n📝 Updating relationship met_date...');
  
  const { error: relError } = await supabase
    .from('relationships')
    .update({ met_date: '2024-06-15' })
    .eq('character_1', 'mila')
    .eq('character_2', 'elena');

  if (relError) {
    console.log('⚠️ Relationship update error:', relError.message);
  } else {
    console.log('✅ Relationship met_date updated to 2024-06-15');
  }

  console.log('\n✅ Done!\n');
}

updateTimeline().catch(console.error);

