/**
 * DA Test: All 6 Fusions
 * 
 * Generate one image per art direction fusion concept
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

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const ELENA_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png';

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

// ═══════════════════════════════════════════════════════════════════════════
// THE 6 FUSIONS
// ═══════════════════════════════════════════════════════════════════════════

const FUSIONS = [
  {
    id: 1,
    name: "Sin City Mediterranean",
    concept: "B&W silhouette with ONE warm color pop element",
    prompt: `Dramatic black and white photography with selective color.

Young Mediterranean woman in a dark bar or restaurant at night.
High contrast black and white image, deep shadows, film noir aesthetic.
She wears a dark dress, sitting at a bar counter.

SELECTIVE COLOR: Only her RED LIPS and a RED WINE GLASS have color.
Everything else is pure black and white, high contrast.

Dramatic side lighting creating strong shadows on her face.
Mysterious, sensual atmosphere. Sin City movie aesthetic.
Shot on high contrast black and white film with selective color processing.

--no color except red lips and red wine`,
  },
  {
    id: 2,
    name: "Golden Shadow",
    concept: "Silhouette but with warm golden tones (not cold B&W)",
    prompt: `Golden hour silhouette photography.

Young Mediterranean woman standing by large window at sunset.
She is backlit, creating a beautiful silhouette against golden light.
Warm amber and orange tones flooding the room.

Her silhouette is dark but surrounded by warm golden light.
Long flowing hair visible in silhouette, catching golden rim light.
Sheer curtains diffusing the sunset light.

Mystery meets warmth - silhouette style but with Mediterranean golden colors.
Romantic, dreamy atmosphere. Summer evening feeling.
Shot during magic hour, natural warm light only.

--no cold tones, no blue, no harsh shadows`,
  },
  {
    id: 4,
    name: "Analog Future",
    concept: "Film grain vintage texture + subtle neon accents",
    prompt: `Vintage film photograph with neon lighting.

Young Mediterranean woman in a late night cafe or diner.
Shot on expired 35mm film with heavy grain and light leaks.
Warm vintage base tones - slightly faded, nostalgic.

NEON ACCENT: Pink/purple neon sign glow reflecting on her face.
The neon creates a modern contrast against the vintage film look.

She sits by window, neon sign visible outside or reflected.
Coffee cup in frame, late night urban atmosphere.
Retro-futuristic mood - 1980s film stock meets modern neon city.

Hasselblad medium format aesthetic with visible film grain.
Color palette: warm browns, cream, with pink/magenta neon highlights.

--no digital look, no clean modern aesthetic`,
  },
  {
    id: 5,
    name: "Intimate Cinema",
    concept: "Cinematic 2.35:1 letterbox format + mundane moments",
    prompt: `Cinematic widescreen photograph, 2.35:1 aspect ratio letterbox format.

Young Mediterranean woman in an intimate everyday moment.
She is lying in bed, morning light, just waking up.
Messy hair on white pillow, soft natural expression.

CINEMATIC FRAMING: Wide letterbox composition like a film still.
Negative space on sides, subject slightly off-center.
Shallow depth of field, focus on her eyes.

Soft diffused morning light through window.
Intimate, quiet moment - like a frame from an art house film.
Muted color palette, slightly desaturated.

Shot by cinematographer Roger Deakins, natural light, 35mm anamorphic lens.

--no posed look, no artificial lighting`,
  },
  {
    id: 6,
    name: "Annotated Life",
    concept: "Clean photo + hand-drawn doodles/text overlay aesthetic",
    prompt: `Clean minimalist photograph designed for hand-drawn overlay.

Young Mediterranean woman in simple setting - white/cream background.
She holds a coffee cup, casual candid moment.
Clean, bright, minimal composition with lots of white space around her.

Simple outfit - white t-shirt or cream sweater.
Natural smile, looking slightly off camera.
Soft even lighting, no harsh shadows.

The image should have space for hand-drawn annotations.
Polaroid/scrapbook aesthetic - simple and personal.
Warm but clean color palette.

Shot in natural light, minimal styling, authentic moment.

--no busy background, no complex lighting`,
  },
];

async function generateFusion(fusion) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🎨 FUSION ${fusion.id}: ${fusion.name}`);
  console.log(`   ${fusion.concept}`);
  console.log(`${'═'.repeat(60)}`);
  
  const startTime = Date.now();
  
  try {
    const output = await replicate.run("google/nano-banana-pro", {
      input: {
        prompt: fusion.prompt,
        reference_images: [ELENA_REF],
        aspect_ratio: fusion.id === 5 ? "16:9" : "3:4", // Letterbox for Intimate Cinema
        number_of_images: 1,
      }
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ⏱️  ${duration}s`);
    
    const imageUrl = extractUrl(output);
    if (!imageUrl) {
      console.log(`   ❌ No URL extracted`);
      return null;
    }
    
    // Download
    const response = await fetch(imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    
    const filename = `da_fusion_${fusion.id}_${fusion.name.toLowerCase().replace(/\s+/g, '_')}.jpg`;
    const filepath = path.join(__dirname, '..', filename);
    fs.writeFileSync(filepath, buffer);
    
    console.log(`   ✅ Saved: ${filename}`);
    return { ...fusion, filepath, imageUrl };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║     🎨 DA TEST: ALL FUSIONS                                    ║
║     Generating one image per art direction concept             ║
╠════════════════════════════════════════════════════════════════╣
║  1. Sin City Mediterranean - B&W + warm color pop              ║
║  2. Golden Shadow - Warm silhouette                            ║
║  3. Editorial Mess - (already generated)                       ║
║  4. Analog Future - Film grain + neon                          ║
║  5. Intimate Cinema - Letterbox + mundane                      ║
║  6. Annotated Life - Clean + space for doodles                 ║
╚════════════════════════════════════════════════════════════════╝
`);

  const results = [];
  
  for (const fusion of FUSIONS) {
    const result = await generateFusion(fusion);
    if (result) results.push(result);
    
    // Small delay between requests
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`                    📊 SUMMARY`);
  console.log(`${'═'.repeat(60)}\n`);
  
  console.log(`✅ ${results.length}/${FUSIONS.length} images generated\n`);
  
  results.forEach(r => {
    console.log(`   ${r.id}. ${r.name}`);
    console.log(`      ${r.filepath}\n`);
  });
  
  console.log(`\n💡 Open all: open "${path.join(__dirname, '..')}"/da_fusion_*.jpg`);
}

main().catch(console.error);
