#!/usr/bin/env node
/**
 * Schedule all 3 posts for tomorrow via Make.com + Buffer
 * - 13h: Cozy morning coffee
 * - 16h: Yoga stretching
 * - 22h: Apéro at home
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) process.env[key.trim()] = val.join('=').trim();
});

// Tomorrow's posts
const POSTS = [
  {
    time: '13h',
    scheduledFor: getTomorrowAt(13, 0), // 13:00
    image: 'https://res.cloudinary.com/dily60mr0/image/upload/v1765541737/mila-posts/tomorrow/cozy-morning-coffee-1765541736308.jpg',
    caption: `13h. Toujours au lit. No regrets. ☕️

Hier soir c'était... beaucoup 😅
Aujourd'hui c'est mode koala activé 🐨

Le café fait effet dans combien de temps déjà ?

.
.
.
#lazysaturday #weekendmood #postparty #coffeetime #parisienne #cozyvibes #saturdaymorning #recoveryday`
  },
  {
    time: '16h',
    scheduledFor: getTomorrowAt(16, 0), // 16:00
    image: 'https://res.cloudinary.com/dily60mr0/image/upload/v1765542489/mila-posts/tomorrow/yoga-home-1765542488840.jpg',
    caption: `16h. Stretching post-soirée = survie 🧘‍♀️

Mon corps après hier soir: "tu te moques de moi ?"
Moi: "on va faire un peu de yoga ça va aller"

Le samedi c'est fait pour récupérer non ? 😅

Vous aussi le sport du samedi c'est plutôt... étirements ? 

.
.
.
#saturdayyoga #homeworkout #selfcaresaturday #yogaathome #stretchingtime #wellnessjourney #parisienne #recoveryday #mindfulness #weekendvibes`
  },
  {
    time: '22h',
    scheduledFor: getTomorrowAt(22, 0), // 22:00
    image: 'https://res.cloudinary.com/dily60mr0/image/upload/v1765541605/mila-posts/tomorrow/apero-home-sexy-1765541604044.jpg',
    caption: `22h. Apéro time 🍷

"Venez on fait un truc chill à la maison"
→ 3h plus tard on refait le monde

Le samedi soir parfait c'est celui où tu restes en chaussettes 🧦✨

Vous êtes plutôt sortie ou cocooning ce soir ?

.
.
.
#saturdaynight #apero #homeparty #winenight #parisienne #cozynights #hostesswiththemostess #weekendvibes #frenchgirl #chillnight`
  }
];

function getTomorrowAt(hour, minute) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(hour, minute, 0, 0);
  return tomorrow.toISOString();
}

async function main() {
  console.log('📅 Scheduling 3 posts for tomorrow (Saturday)...\n');
  
  const webhookUrl = process.env.MAKE_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('❌ MAKE_WEBHOOK_URL not found');
    process.exit(1);
  }
  
  for (const post of POSTS) {
    console.log(`\n⏰ ${post.time}`);
    console.log(`   📸 ${post.image.split('/').pop()}`);
    console.log(`   🕐 Scheduled: ${post.scheduledFor}`);
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: post.image,
          caption: post.caption,
          scheduled_at: post.scheduledFor,
          time: post.time,
        }),
      });
      
      if (response.ok) {
        console.log(`   ✅ Sent to Buffer!`);
      } else {
        console.log(`   ⚠️ Response: ${response.status}`);
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
    
    // Small delay between posts
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('\n' + '═'.repeat(50));
  console.log('📋 SUMMARY');
  console.log('═'.repeat(50));
  console.log('\nPosts scheduled for tomorrow (Saturday):');
  POSTS.forEach(p => {
    console.log(`  ${p.time} - ${p.caption.split('\n')[0]}`);
  });
  console.log('\n✅ Check Buffer to confirm scheduling!');
  console.log('   https://publish.buffer.com/');
}

main().catch(console.error);

