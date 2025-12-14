#!/usr/bin/env node
/**
 * Custom generation script - Work Mode Salon
 * Run with: node scripts/generate-work-mode.mjs
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment from .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

// Reference images
const FACE_REFERENCES = [
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_2_q8kxit.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767098/Photo_3_nopedx.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_4_pna4fo.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_5_kyx12v.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_6_i5rdpa.png',
];

const SALON_REFERENCE = 'https://res.cloudinary.com/dily60mr0/image/upload/v1764794600/2._Salon_Paris_ltyd8r.png';

// Convert URL to base64
async function urlToBase64(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const contentType = response.headers.get('content-type') || 'image/png';
  return `data:${contentType};base64,${base64}`;
}

// Custom prompt - Work Mode Salon NIGHT
const PROMPT = `Amateur iPhone photo, heavy HDR glow, deeply crushed shadows, Instagram aesthetic 2025, authentic social media photo, casual snapshot vibe, not professional photography,

Young French woman Mila, 22 years old, sitting on beige linen sofa in her Parisian apartment living room at night,

[FACE - USE REFERENCE IMAGES] 
oval face, high cheekbones, copper auburn curly hair type 3A shoulder-length loose curls, hazel-green eyes with golden flecks, straight nose slightly upturned tip, naturally full lips, light tan Mediterranean skin, light golden freckles on nose and cheekbones, small dark beauty mark above left lip corner, beauty mark on right cheekbones.
CRITICAL: Use the EXACT face from the reference photos provided. Maintain her distinctive features, beauty marks, freckles, hair color and texture.

[BODY] slim athletic physique 168cm, toned but feminine, natural full bust DD-cup,

[OUTFIT] wearing tight black sport shorts (cycliste moulant showing legs), oversized grey hoodie unzipped showing black sports bra underneath, bare toned legs visible tucked on sofa,

[POSE] sitting casually on beige linen sofa with MacBook Pro on lap, leaning slightly forward engaged with screen, one hand on keyboard typing, focused concentrated expression looking at screen, brows slightly furrowed, working mode energy, professional girl boss moment,

[SETTING - USE SALON REFERENCE IMAGE FOR ROOM LAYOUT]
Use the salon reference image as base for the room layout, furniture placement, and aesthetic. You CAN change the camera angle and framing from the reference.
Cozy Parisian living room, beige linen sofa, herringbone parquet floor, vintage Persian rug, coffee table cluttered with magazines Vogue i-D, Canon AE-1 camera, half-drunk coffee cup with coffee ring stain, monstera plant in corner, acoustic guitar leaning against wall, polaroids on wall, vinyl records on shelf,

[LIGHTING - CRITICAL NIGHTTIME]
It is NIGHTTIME. The scene is lit by:
- Warm floor lamp glowing in corner
- Soft warm ambient indoor lighting
- MacBook screen glow on her face
THROUGH THE WINDOWS: Complete darkness outside, black night sky, maybe distant city lights of Paris visible, NO DAYLIGHT, NO SUNSET, it is clearly night outside.
Interior cozy warm artificial lighting contrasting with dark night outside.

[ACCESSORIES] thin gold necklace with minimalist star pendant MUST be visible on her neck, hair in messy bun with loose auburn curls framing face, AirPods case visible on coffee table,

[MOOD] focused, ambitious, girl boss energy, authentic candid late-night working moment, French creative professional vibe, not posed - caught in the middle of actual work, cozy night in aesthetic,

[CAMERA ANGLE FLEXIBILITY] You can shoot from different angles than the reference photos - side angle, three-quarter view, slightly above, etc. The reference is for face consistency and room aesthetic, not exact framing.

[INSTAGRAM 2025 STYLE] This should look like a real Instagram photo from 2025 - slightly imperfect, authentic, heavy contrast, crushed blacks, warm HDR glow, not overly polished, could have been taken by a friend or self-timer,

--no tattoos, --no glasses, --no heavy makeup, --no daylight through windows, --no sunset, --no golden hour outside, --no perfect airbrushed skin, --no 8k, --no 4k, --no ultra realistic, --no hyper realistic`;

async function main() {
  console.log('🚀 Starting Work Mode Salon generation...\n');
  
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    console.error('❌ REPLICATE_API_TOKEN not found in .env.local');
    process.exit(1);
  }
  
  const replicate = new Replicate({ auth: apiToken });
  
  // Convert all reference images to base64
  console.log('📷 Converting reference images to base64...');
  // Use 3 best face references + salon (fewer = more stable)
  const selectedFaces = FACE_REFERENCES.slice(0, 3);
  const allReferenceUrls = [...selectedFaces, SALON_REFERENCE];
  
  try {
    const base64Images = await Promise.all(
      allReferenceUrls.map(async (url, i) => {
        const b64 = await urlToBase64(url);
        const type = i < FACE_REFERENCES.length ? 'Face' : 'Salon';
        console.log(`  ✅ ${type} ref ${i + 1}: converted`);
        return b64;
      })
    );
    
    console.log(`\n📝 Prompt preview:\n${PROMPT.substring(0, 500)}...\n`);
    console.log('🎨 Calling Nano Banana Pro...');
    console.log(`   References: 3 face + 1 salon (4 total for stability)`);
    
    const startTime = Date.now();
    
    const output = await replicate.run("google/nano-banana-pro", {
      input: {
        prompt: PROMPT,
        image_input: base64Images,
        aspect_ratio: "4:5",
        resolution: "2K",
        output_format: "jpg",
        safety_filter_level: "block_only_high",
      }
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n⏱️  Generation completed in ${duration}s`);
    
    // Handle output
    if (typeof output === 'string') {
      console.log('\n✅ SUCCESS! Image URL:');
      console.log(output);
      return output;
    }
    
    if (Array.isArray(output) && typeof output[0] === 'string') {
      console.log('\n✅ SUCCESS! Image URL:');
      console.log(output[0]);
      return output[0];
    }
    
    // Handle binary stream
    if (output && typeof output === 'object' && Symbol.asyncIterator in output) {
      const chunks = [];
      for await (const chunk of output) {
        if (chunk instanceof Uint8Array) {
          chunks.push(chunk);
        }
      }
      
      if (chunks.length > 0) {
        const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }
        
        // Save to file
        const outputDir = path.join(__dirname, '..', 'generated');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const filename = `work-mode-salon-${Date.now()}.jpg`;
        const filepath = path.join(outputDir, filename);
        fs.writeFileSync(filepath, combined);
        
        console.log('\n✅ SUCCESS! Image saved to:');
        console.log(filepath);
        return filepath;
      }
    }
    
    console.log('\n⚠️ Unexpected output format:', typeof output);
    console.log(output);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
