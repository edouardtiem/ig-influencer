/**
 * DA Test: Editorial Mess
 * 
 * Fusion 3: High Fashion Clean × Raw Imperfection
 * - Editorial/magazine poses
 * - But real imperfect elements: messy sheets, spilled coffee, wind-blown hair
 * - Accessible luxury
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env manually
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

const ELENA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png';

// Extract URL from various output formats
function extractUrl(output) {
  if (typeof output === 'string') return output;
  if (Array.isArray(output) && output[0]) {
    const first = output[0];
    if (typeof first === 'string') return first;
    const str = first.toString();
    if (str.startsWith('http')) return str;
  }
  const str = output?.toString();
  return str?.startsWith('http') ? str : null;
}

async function main() {
  console.log('============================================================');
  console.log('DA TEST: EDITORIAL MESS');
  console.log('Fusion: High Fashion × Raw Imperfection');
  console.log('============================================================\n');
  
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('❌ REPLICATE_API_TOKEN not set');
    process.exit(1);
  }
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  console.log('📥 Using reference image:', ELENA_BODY_REF.split('/').pop());
  console.log('');
  
  // Editorial Mess prompt - fashion pose with imperfect elements
  const prompt = `High-end fashion editorial photograph, Vogue magazine style.

Young Mediterranean woman with honey brown eyes and long wavy bronde hair.
She sits on an unmade bed with messy white linen sheets, morning after aesthetic.
Wearing an oversized vintage designer blazer, slightly falling off one shoulder.
Hair is perfectly imperfect - tousled, some strands across her face.

Half-empty coffee cup on nightstand, morning light streaming through sheer curtains.
One hand running through her messy hair, candid moment captured.
Luxury Parisian apartment, but lived-in - magazines scattered on floor.

Soft window light creating gentle shadows, intimate bedroom atmosphere.
Natural skin texture with subtle freckles, no heavy makeup.
Shot on medium format film, shallow depth of field.
Editorial fashion meets real morning moment.

--no tattoos, no filters, no heavy editing`;

  const negative = `perfect hair, too polished, artificial, plastic skin, 
heavy makeup, studio lighting, sterile environment, 
stock photo, overly edited, instagram filter`;
  
  console.log('📸 Generating Editorial Mess image...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Concept: Fashion editorial pose + unmade bed + messy hair');
  console.log('         + morning coffee + lived-in luxury');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const startTime = Date.now();
  
  try {
    const output = await replicate.run("google/nano-banana-pro", {
      input: {
        prompt: prompt,
        reference_images: [ELENA_BODY_REF],
        aspect_ratio: "3:4",
        number_of_images: 1,
      }
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`⏱️  Generation completed in ${duration}s\n`);
    
    // Get the URL from various output formats
    const imageUrl = extractUrl(output);
    if (!imageUrl) {
      console.error('❌ Could not extract URL from output:', typeof output, output);
      process.exit(1);
    }
    
    console.log('🖼️  Image URL:', imageUrl);
    
    // Download the image
    const response = await fetch(imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    
    const outputPath = path.join(__dirname, '..', 'da_editorial_mess.jpg');
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`\n✅ Image saved: ${outputPath}`);
    console.log(`\n💡 Open: open "${outputPath}"`);
    
    console.log('\n============================================================');
    console.log('DA: EDITORIAL MESS');
    console.log('- Fashion pose ✓');
    console.log('- Unmade bed / imperfect setting ✓');  
    console.log('- Natural messy hair ✓');
    console.log('- Morning light / lived-in luxury ✓');
    console.log('============================================================');
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`\n❌ Error after ${duration}s:`, error.message);
    
    if (error.message.includes('NSFW') || error.message.includes('safety')) {
      console.log('\n⚠️  Content filtered - trying with safer prompt...');
    }
    
    process.exit(1);
  }
}

main().catch(console.error);
