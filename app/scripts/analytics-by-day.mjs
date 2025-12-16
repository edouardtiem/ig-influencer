#!/usr/bin/env node
/**
 * Analyze engagement by day of week
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

const API = 'https://graph.facebook.com/v21.0';

async function main() {
  console.log('\n📅 ENGAGEMENT PAR JOUR DE LA SEMAINE\n');
  
  // Get all posts
  const params = new URLSearchParams({
    fields: 'id,media_type,timestamp,like_count,comments_count',
    limit: '50',
    access_token: process.env.INSTAGRAM_ACCESS_TOKEN,
  });
  
  const res = await fetch(`${API}/${process.env.INSTAGRAM_ACCOUNT_ID}/media?${params}`);
  const data = await res.json();
  
  if (data.error) {
    console.log('❌ Error:', data.error.message);
    return;
  }
  
  const byDay = {};
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  
  data.data.forEach(post => {
    const date = new Date(post.timestamp);
    const dayIndex = date.getDay();
    const dayName = days[dayIndex];
    
    if (!byDay[dayName]) {
      byDay[dayName] = { count: 0, likes: 0, comments: 0 };
    }
    byDay[dayName].count++;
    byDay[dayName].likes += post.like_count || 0;
    byDay[dayName].comments += post.comments_count || 0;
  });
  
  console.log('Jour       | Posts | Likes moy | Comments | Total Eng');
  console.log('-----------|-------|-----------|----------|----------');
  
  const results = [];
  
  days.forEach(day => {
    const d = byDay[day];
    if (d && d.count > 0) {
      const avgLikes = (d.likes / d.count).toFixed(1);
      const avgComments = (d.comments / d.count).toFixed(1);
      const totalEng = ((d.likes + d.comments) / d.count).toFixed(1);
      results.push({ day, count: d.count, avgLikes: parseFloat(avgLikes), avgComments: parseFloat(avgComments), totalEng: parseFloat(totalEng) });
      console.log(`${day.padEnd(11)}|   ${d.count.toString().padStart(2)}  |    ${avgLikes.padStart(4)}  |   ${avgComments.padStart(4)}   |   ${totalEng.padStart(4)}`);
    } else {
      console.log(`${day.padEnd(11)}|    0  |      -    |     -    |      -`);
    }
  });
  
  // Find best/worst
  if (results.length > 1) {
    const sorted = [...results].sort((a, b) => b.totalEng - a.totalEng);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    
    console.log('\n' + '═'.repeat(50));
    console.log(`\n🏆 Meilleur jour: ${best.day} (${best.totalEng} engagement moyen)`);
    console.log(`📉 Pire jour: ${worst.day} (${worst.totalEng} engagement moyen)`);
    
    if (best.totalEng > worst.totalEng) {
      const diff = ((best.totalEng / worst.totalEng - 1) * 100).toFixed(0);
      console.log(`\n📊 ${best.day} = +${diff}% vs ${worst.day}`);
    }
  }
  
  // Specific comparison: Monday vs Weekend
  const lundi = byDay['Lundi'];
  const samedi = byDay['Samedi'];
  const dimanche = byDay['Dimanche'];
  
  console.log('\n' + '═'.repeat(50));
  console.log('\n🆚 LUNDI vs WEEKEND\n');
  
  if (lundi && lundi.count > 0) {
    const lundiEng = (lundi.likes + lundi.comments) / lundi.count;
    console.log(`Lundi:    ${lundiEng.toFixed(1)} engagement moyen (${lundi.count} posts)`);
  } else {
    console.log('Lundi:    Pas de données');
  }
  
  if (samedi && samedi.count > 0) {
    const samediEng = (samedi.likes + samedi.comments) / samedi.count;
    console.log(`Samedi:   ${samediEng.toFixed(1)} engagement moyen (${samedi.count} posts)`);
  } else {
    console.log('Samedi:   Pas de données');
  }
  
  if (dimanche && dimanche.count > 0) {
    const dimancheEng = (dimanche.likes + dimanche.comments) / dimanche.count;
    console.log(`Dimanche: ${dimancheEng.toFixed(1)} engagement moyen (${dimanche.count} posts)`);
  } else {
    console.log('Dimanche: Pas de données');
  }
  
  console.log('\n');
}

main();

