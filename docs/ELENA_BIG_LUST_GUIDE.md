# Elena NSFW Generation — Quick Start Guide

> **Version:** 2.0 — Fully automated CLI generation  
> **Last Updated:** January 19, 2026  
> **Status:** Production ready ✅

---

## 🚀 Quick Start (30 seconds)

### 1. Start ComfyUI Server (if not running)

```bash
cd ~/ComfyUI && python main.py
```

Wait for: `To see the GUI go to: http://127.0.0.1:8188`

### 2. Generate Images

```bash
cd "/Users/edouardtiem/Cursor Projects/IG-influencer"

# Nude poses (5 images, ~20 min)
node app/scripts/batch-elena-nude.mjs

# Masturbation selfies (4 images, ~15 min)
node app/scripts/batch-elena-masturbation.mjs

# Single custom image (~4 min)
node app/scripts/test-elena-nude.mjs
```

### 3. Find Your Images

```bash
ls ~/ComfyUI/output/Elena_*.png
```

---

## ⚙️ Core Settings (VALIDATED)

| Setting | Value | Notes |
|---------|-------|-------|
| **Model** | `bigLust_v16.safetensors` | SDXL checkpoint |
| **Resolution** | 832 × 1216 | Portrait ratio |
| **Steps** | 30 | |
| **CFG** | 3.5 | Low CFG = better quality |
| **Sampler** | DPM++ 2M SDE | |
| **Scheduler** | Karras | |
| **IP-Adapter Weight** | 0.3 | Body consistency |
| **IP-Adapter Model** | `ip-adapter-plus_sdxl_vit-h.safetensors` | |
| **Body Reference** | `elena_body_reference.png` | Fit body, large breasts |

---

## 👩 Elena Character Definition

### Body Type (VALIDATED)
```
fit athletic toned body, large natural breasts, D-cup,
defined slim waist, toned stomach, smooth skin
```

### Face Features
```
24 year old Italian woman named Elena,
honey brown warm eyes,
bronde hair with dark roots and golden blonde balayage, long voluminous beach waves,
small beauty mark on right cheekbone
```

### Accessories
```
gold layered necklaces with medallion pendant, gold bracelet
```

### Skin
```
natural skin texture, glowing sun-kissed skin
```

---

## 📝 Prompt Templates

### Base Positive Prompt (ALWAYS START WITH THIS)

```
masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
24 year old Italian woman named Elena,
honey brown warm eyes, bronde hair with dark roots and golden blonde balayage, long voluminous beach waves,
small beauty mark on right cheekbone,
fit athletic toned body, large natural breasts, D-cup, defined slim waist, toned stomach,
{CLOTHES_OR_NUDE},
{POSE_AND_ACTION},
{LOCATION_AND_SCENE},
natural skin texture, {LIGHTING},
gold layered necklaces with medallion pendant, gold bracelet,
shot on Canon EOS R5, shallow depth of field, {PHOTO_STYLE}
```

### Base Negative Prompt (ALWAYS INCLUDE)

```
{UNWANTED_ELEMENTS},
flat chest, small breasts, A-cup, B-cup,
worst quality, low quality, blurry, cartoon, anime, illustration,
bad anatomy, bad hands, extra fingers, deformed, mutated,
watermark, censored, mosaic, plastic skin,
male, man
```

---

## 🎨 Customization Variables

### {CLOTHES_OR_NUDE}

| Type | Prompt |
|------|--------|
| Nude | `completely nude, naked, no clothes` |
| Nude + Explicit | `completely nude, naked, exposed pussy visible, legs spread` |
| Topless | `topless, breasts exposed, wearing only panties` |
| Lingerie | `wearing black lace lingerie, exposed cleavage` |
| Bikini | `wearing tiny string bikini` |

### {POSE_AND_ACTION}

| Pose | Prompt |
|------|--------|
| Legs spread (lying) | `lying on back, legs spread wide open, knees bent` |
| Legs spread (sitting) | `sitting with legs spread wide apart, leaning back` |
| On knees | `kneeling on bed with knees spread wide apart` |
| Doggy | `on all fours, ass up, looking back over shoulder` |
| Side lying | `lying on side, one leg raised high` |
| Masturbation | `touching herself, fingers on pussy, masturbating` |
| Selfie | `holding phone taking selfie, self-shot, amateur` |
| Mirror selfie | `taking mirror selfie, phone visible in reflection` |

### {LOCATION_AND_SCENE}

| Location | Prompt | Add to Negative |
|----------|--------|-----------------|
| Hotel room | `luxury hotel room, white bedding, warm ambient lighting, intimate atmosphere` | `outdoor, mountains, pool, beach` |
| Bedroom | `luxurious Parisian bedroom, white sheets, soft morning light from window` | `outdoor, public` |
| Bathroom | `luxury bathroom, white marble, steam, wet skin` | `bedroom, outdoor` |
| Shower | `standing in luxury shower, water droplets on skin, wet hair` | `dry` |
| Pool | `by infinity pool, tropical setting, golden hour` | `indoor, bedroom` |
| Beach | `on private beach, sunset, sand, ocean background` | `indoor, bedroom` |

### {LIGHTING}

| Mood | Prompt |
|------|--------|
| Morning | `soft morning light from window` |
| Afternoon | `warm afternoon sunlight` |
| Golden hour | `golden hour lighting, warm sunset glow` |
| Night | `warm ambient lighting, intimate atmosphere` |
| Dramatic | `dramatic side lighting, shadows` |

### {PHOTO_STYLE}

| Style | Prompt |
|-------|--------|
| Amateur | `amateur photo aesthetic, r/gonewild style` |
| Professional | `professional boudoir photography` |
| Selfie | `iPhone selfie, authentic intimate moment` |
| POV | `POV shot, first person perspective` |

### {UNWANTED_ELEMENTS}

| If you want | Add to negative |
|-------------|-----------------|
| Solo (no man) | `male, man, men, penis, cock, couple, two people, sex, penetration` |
| Indoor only | `outdoor, mountains, snow, pool, beach, public` |
| No face | `visible face, clear face, full face visible` |
| Specific body | `curvy body, wide hips, thick thighs` (if you want fit) |

---

## 📸 Ready-to-Use Prompts

### Nude - Legs Spread - Hotel Room

**Positive:**
```
masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
24 year old Italian woman named Elena,
honey brown warm eyes, bronde hair with dark roots and golden blonde balayage, long voluminous beach waves,
small beauty mark on right cheekbone,
fit athletic toned body, large natural breasts, D-cup, defined slim waist, toned stomach,
completely nude, naked, no clothes, exposed pussy visible,
lying on white bed sheets, legs spread wide open, knees bent,
intimate pose, seductive expression,
luxury hotel room, white bedding, warm ambient lighting,
natural skin texture, soft warm lighting,
gold layered necklaces with medallion pendant, gold bracelet,
shot on Canon EOS R5, shallow depth of field, amateur photo aesthetic
```

**Negative:**
```
visible face, clear face, mountains, snow, outdoor, pool,
flat chest, small breasts, A-cup, B-cup,
worst quality, low quality, blurry, cartoon, anime,
bad anatomy, bad hands, extra fingers, deformed,
watermark, censored, mosaic, plastic skin,
male, man
```

---

### Masturbation Selfie - Close-up

**Positive:**
```
masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
24 year old Italian woman named Elena, SOLO, ALONE,
honey brown warm eyes, bronde hair with dark roots and golden blonde balayage,
fit athletic toned body, large natural breasts, D-cup,
completely nude, naked,
solo female masturbation, touching herself alone, fingers on her own pussy,
lying on bed, fingers spreading pussy lips, two fingers inside wet pussy,
glistening wet aroused pussy, visible wetness,
thighs spread wide, intimate self-shot,
amateur selfie, authentic intimate solo moment,
luxury hotel room, white bedding, warm ambient lighting,
natural skin texture, soft warm lighting,
gold necklaces, gold bracelet,
shot on iPhone, shallow depth of field
```

**Negative:**
```
male, man, men, penis, cock, couple, two people, sex, penetration,
dry pussy, clothes, dressed,
flat chest, small breasts,
worst quality, low quality, blurry, cartoon, anime,
bad anatomy, bad hands, extra fingers, deformed,
watermark, censored, mosaic
```

---

## 🔧 Creating Custom Generation Script

If you need a specific generation not covered by existing scripts:

### Template Script

```javascript
// Save as: app/scripts/custom-elena.mjs
import { queuePrompt, getHistory, checkConnection } from './comfyui-api.mjs';

// === CUSTOMIZE THESE ===
const POSITIVE = `YOUR POSITIVE PROMPT HERE`;
const NEGATIVE = `YOUR NEGATIVE PROMPT HERE`;
const FILENAME_PREFIX = 'Elena_Custom';
// === END CUSTOMIZE ===

function buildWorkflow(seed) {
  return {
    "1": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": "bigLust_v16.safetensors" } },
    "2": { "class_type": "IPAdapterModelLoader", "inputs": { "ipadapter_file": "ip-adapter-plus_sdxl_vit-h.safetensors" } },
    "3": { "class_type": "CLIPVisionLoader", "inputs": { "clip_name": "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors" } },
    "4": { "class_type": "LoadImage", "inputs": { "image": "elena_body_reference.png" } },
    "5": { "class_type": "CLIPTextEncode", "inputs": { "text": POSITIVE, "clip": ["1", 1] } },
    "6": { "class_type": "CLIPTextEncode", "inputs": { "text": NEGATIVE, "clip": ["1", 1] } },
    "7": { "class_type": "EmptyLatentImage", "inputs": { "width": 832, "height": 1216, "batch_size": 1 } },
    "8": {
      "class_type": "IPAdapterAdvanced",
      "inputs": {
        "model": ["1", 0], "ipadapter": ["2", 0], "image": ["4", 0],
        "weight": 0.3, "weight_type": "linear", "combine_embeds": "concat",
        "start_at": 0.0, "end_at": 1.0, "embeds_scaling": "V only", "clip_vision": ["3", 0]
      }
    },
    "9": {
      "class_type": "KSampler",
      "inputs": {
        "seed": seed, "steps": 30, "cfg": 3.5, "sampler_name": "dpmpp_2m_sde", "scheduler": "karras", "denoise": 1.0,
        "model": ["8", 0], "positive": ["5", 0], "negative": ["6", 0], "latent_image": ["7", 0]
      }
    },
    "10": { "class_type": "VAEDecode", "inputs": { "samples": ["9", 0], "vae": ["1", 2] } },
    "11": { "class_type": "SaveImage", "inputs": { "filename_prefix": FILENAME_PREFIX, "images": ["10", 0] } }
  };
}

async function main() {
  const status = await checkConnection();
  if (!status.connected) { console.error('❌ ComfyUI not running'); process.exit(1); }
  
  const seed = Math.floor(Math.random() * 1000000000);
  const { prompt_id } = await queuePrompt(buildWorkflow(seed));
  console.log(`Generating... Prompt ID: ${prompt_id}`);
  
  // Poll for completion
  while (true) {
    const history = await getHistory(prompt_id);
    if (history[prompt_id]?.outputs && Object.keys(history[prompt_id].outputs).length > 0) {
      const img = Object.values(history[prompt_id].outputs).find(o => o.images)?.images[0];
      console.log(`✅ Done: ~/ComfyUI/output/${img?.filename}`);
      break;
    }
    await new Promise(r => setTimeout(r, 5000));
  }
}

main().catch(console.error);
```

**Run with:**
```bash
node app/scripts/custom-elena.mjs
```

---

## 📁 File Locations

| Resource | Path |
|----------|------|
| **This Guide** | `docs/ELENA_BIG_LUST_GUIDE.md` |
| **Progress/History** | `docs/ELENA_BIG_LUST_PROGRESS.md` |
| **Generation Scripts** | `app/scripts/batch-elena-*.mjs` |
| **API Client** | `app/scripts/comfyui-api.mjs` |
| **Body Reference** | `~/ComfyUI/input/elena_body_reference.png` |
| **Output Images** | `~/ComfyUI/output/Elena_*.png` |
| **ComfyUI Server** | `~/ComfyUI/` |

---

## ⚡ Troubleshooting

### ComfyUI not responding

```bash
# Check if running
curl http://127.0.0.1:8188/system_stats

# If not, restart
cd ~/ComfyUI && python main.py
```

### Generation too slow (>10 min)

```bash
# Restart ComfyUI to free RAM
pkill -f "python main.py"
cd ~/ComfyUI && python main.py
```

### Man appears in solo image

Add to negative: `male, man, men, penis, cock, couple, two people, sex, penetration`

### Scene shows mountains/pool instead of bedroom

Lower IP-Adapter weight to 0.3 and add `NOT mountains, NOT outdoor` to positive or add `mountains, outdoor, pool` to negative.

### Body not consistent

Make sure workflow includes IP-Adapter with `elena_body_reference.png` and weight 0.3.

---

## 🔮 Future: Face Consistency

Face consistency is not yet implemented. Models are installed but workflow not created.

**When needed, ask:**
> "Add face consistency to Elena generation using IP-Adapter FaceID. See docs/ELENA_BIG_LUST_PROGRESS.md for installed models."

---

## 📋 Generation Request Template

When asking for new Elena images in a new chat, use this format:

```
Generate [NUMBER] photos of Elena:
- Pose: [POSE]
- Action: [ACTION]  
- Location: [LOCATION]
- Clothes: [CLOTHES OR NUDE]
- Special: [ANY SPECIAL REQUESTS]

See @docs/ELENA_BIG_LUST_GUIDE.md for settings.
```

**Example:**
```
Generate 3 photos of Elena:
- Pose: on all fours, doggy style
- Action: looking back over shoulder, teasing
- Location: luxury yacht, sunset
- Clothes: completely nude
- Special: wet skin, just came out of water

See @docs/ELENA_BIG_LUST_GUIDE.md for settings.
```

---

**Ready to generate!** 🔥
