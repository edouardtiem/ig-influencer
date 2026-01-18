# Elena NSFW Generation — Big Lust v1.6 Step-by-Step Guide

## Overview

This guide covers generating NSFW photos of Elena Visconti using **Big Lust v1.6** (BigASP v2 + LUSTIFY v4 merge).

---

## Step 1: Download & Install Big Lust

### 1.1 Download the Model

1. Go to: https://civitai.com/models/575395/big-lust
2. Download **Big Lust v1.6** (6.46 GB, `.safetensors`)
3. This is an SDXL checkpoint optimized for NSFW photorealism

### 1.2 Install in ComfyUI

```
ComfyUI/models/checkpoints/BigLust_v1.6.safetensors
```

Restart ComfyUI after placing the file.

### 1.3 Alternative: Automatic1111

```
stable-diffusion-webui/models/Stable-diffusion/BigLust_v1.6.safetensors
```

---

## Step 2: Generation Parameters for Elena

### 2.1 Optimal Settings

| Parameter | Value | Notes |
|-----------|-------|-------|
| **Resolution** | 1024x1024 or 896x1152 | SDXL native ratios |
| **Sampler** | DPM++ 2M SDE | Best for Big Lust |
| **Scheduler** | Karras or Exponential | |
| **Steps** | 28-30 | Sweet spot |
| **CFG Scale** | 3.0-4.0 | **LOW CFG is critical** |
| **Clip Skip** | 2 | |

### 2.2 Upscaling (Optional)

| Parameter | Value |
|-----------|-------|
| Hires.fix | 1.4-1.5x |
| Denoising | 0.35-0.45 |
| Upscaler | 4x-UltraSharp |

---

## Step 3: Elena Character Prompt

### 3.1 Elena Base Description (ALWAYS include)

```
24 year old Italian woman, soft round pleasant face not angular,
honey brown warm eyes, bronde hair dark roots golden blonde balayage long beach waves,
very large natural F-cup breasts, narrow waist, wide hips,
glowing sun-kissed skin, small beauty mark on right cheekbone,
gold layered necklaces with medallion, gold chunky chain bracelet
```

### 3.2 Elena Negative Prompt (ALWAYS include)

```
angular face, sharp jawline, square face, classic model face,
skinny thin body, flat chest, small breasts, medium breasts,
A-cup, B-cup, C-cup, D-cup, average bust,
worst quality, low quality, blurry, out of focus,
bad anatomy, extra limbs, deformed, mutated hands, extra fingers,
watermark, signature, text, censored, mosaic censoring,
airbrushed skin, plastic skin, oversaturated
```

---

## Step 4: Complete Prompts by Content Type

### 4.1 Lingerie / Boudoir

**Positive:**
```
masterpiece, best quality, photorealistic, 8k uhd,
24 year old Italian woman, soft round pleasant face not angular,
honey brown warm eyes inviting gaze, bronde hair dark roots golden blonde balayage long voluminous beach waves,
very large natural F-cup breasts, narrow waist, wide hips, feminine shapely figure,
glowing sun-kissed skin warm undertones, small beauty mark on right cheekbone,
wearing white lace lingerie set, plunging neckline showing generous cleavage,
gold layered necklaces with medallion pendant, gold chunky chain bracelet,
lying on bed, playful seductive pose, looking at camera,
luxurious Parisian bedroom, white sheets, soft morning light from window,
shot on Canon EOS R5, shallow depth of field, natural lighting,
r/gonewild style, amateur intimate photo
```

**Negative:**
```
angular face, sharp jawline, skinny body, flat chest, small breasts,
A-cup, B-cup, C-cup, D-cup, medium breasts,
worst quality, low quality, blurry, bad anatomy, extra limbs,
watermark, signature, censored, mosaic, plastic skin
```

**Settings:** Steps 30, CFG 3.5, DPM++ 2M SDE Karras

---

### 4.2 Topless / Nude Bedroom

**Positive:**
```
masterpiece, best quality, photorealistic, 8k uhd,
24 year old Italian woman, soft round pleasant face warm smile,
honey brown warm eyes, bronde hair dark roots golden blonde balayage long beach waves,
topless, very large natural F-cup breasts exposed, visible nipples, realistic breast shape,
narrow waist, wide hips, feminine curves,
glowing sun-kissed skin natural texture, small beauty mark on right cheekbone,
gold layered necklaces resting on chest, gold chunky bracelet,
sitting on bed, one hand in hair, confident relaxed expression,
elegant Parisian apartment bedroom, neutral beige white tones, natural daylight,
shot on iPhone 15 Pro, selfie angle from above, natural lighting,
r/amateur style, intimate bedroom setting
```

**Negative:**
```
angular face, sharp jawline, skinny body, flat chest, small breasts,
A-cup, B-cup, C-cup, D-cup, saggy breasts,
worst quality, low quality, blurry, bad anatomy, deformed nipples,
watermark, censored, mosaic, plastic fake looking
```

**Settings:** Steps 30, CFG 3.5, DPM++ 2M SDE Karras

---

### 4.3 Full Nude / Explicit

**Positive:**
```
masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
24 year old Italian woman, soft round pleasant face seductive expression,
honey brown warm eyes looking at camera, bronde hair dark roots golden blonde balayage long beach waves,
fully nude, very large natural F-cup breasts, detailed realistic nipples,
narrow waist, wide hips, feminine shapely body,
legs spread, explicit nude, uncensored, detailed anatomy, realistic pussy,
glowing sun-kissed skin natural texture pores, small beauty mark on right cheekbone,
gold layered necklaces, gold chunky bracelet,
lying on white bed sheets, intimate POV angle,
luxurious Parisian bedroom, soft warm afternoon light from window,
shot on Canon EOS 5D, shallow depth of field,
r/gonewild style, amateur photo, intimate setting
```

**Negative:**
```
angular face, sharp jawline, skinny body, flat chest, small breasts,
A-cup, B-cup, C-cup, D-cup,
worst quality, low quality, blurry, bad anatomy, extra limbs,
deformed genitals, bad pussy, unrealistic anatomy,
watermark, censored, mosaic, bar censor,
plastic skin, airbrushed, oversaturated
```

**Settings:** Steps 30, CFG 3.0-3.5, DPM++ 2M SDE Karras

---

### 4.4 Bathroom / Shower

**Positive:**
```
masterpiece, best quality, photorealistic, 8k uhd,
24 year old Italian woman, soft round face relaxed expression,
honey brown eyes, wet bronde hair dark roots golden blonde slicked back,
topless in shower, very large natural F-cup breasts wet skin,
water droplets on skin, narrow waist wide hips,
glowing sun-kissed skin glistening wet, small beauty mark right cheekbone,
gold necklaces (waterproof), standing in luxury shower,
luxurious Parisian bathroom, white marble walls grey veins, gold fixtures,
steam, soft diffused lighting, water running,
shot on Canon EOS R5, natural lighting from window,
r/showerbeer style, candid intimate moment
```

**Negative:**
```
angular face, sharp jawline, skinny body, flat chest, small breasts,
dry hair, dry skin,
worst quality, low quality, blurry, bad anatomy,
watermark, censored, plastic skin
```

**Settings:** Steps 30, CFG 3.5, DPM++ 2M SDE Karras

---

### 4.5 Mirror Selfie (Suggestive to Explicit)

**Positive:**
```
masterpiece, best quality, photorealistic, 8k uhd,
24 year old Italian woman taking mirror selfie, soft round pleasant face,
honey brown warm eyes, bronde hair dark roots golden blonde balayage beach waves,
wearing only tiny black lace thong, topless very large natural F-cup breasts,
narrow waist, wide hips, feminine curves,
glowing sun-kissed skin, small beauty mark right cheekbone,
holding iPhone, other hand on hip,
gold layered necklaces, gold chunky bracelet visible,
bedroom mirror, vanity table with Hollywood lights visible,
phone camera flash, bedroom background,
r/mirrorselfie style, amateur selfie, confident pose
```

**Negative:**
```
angular face, sharp jawline, skinny body, flat chest, small breasts,
A-cup, B-cup, C-cup, D-cup,
worst quality, blurry, bad anatomy, deformed hands holding phone,
watermark, censored
```

**Settings:** Steps 28, CFG 3.5, DPM++ 2M SDE Karras

---

## Step 5: Face Consistency with InstantID (Optional but Recommended)

For consistent Elena face across generations:

### 5.1 Requirements

- InstantID ComfyUI nodes
- Elena reference face image (square, face centered)
- IP-Adapter FaceID Plus V2

### 5.2 Workflow Integration

```
1. Load Checkpoint: Big Lust v1.6
2. Load Reference Image: Elena face photo (224x224 crop auto)
3. InstantID Apply: weight 0.8-1.0
4. IP-Adapter FaceID: weight 0.3-0.5 (subtle refinement)
5. KSampler: your prompt + settings
6. VAE Decode
7. (Optional) FaceDetailer: denoise 0.3
8. Save Image
```

### 5.3 InstantID Settings

| Parameter | Value |
|-----------|-------|
| InstantID weight | 0.8-1.0 |
| IP-Adapter weight | 0.3-0.5 |
| Start at | 0.0 |
| End at | 1.0 |

---

## Step 6: Quality Checklist

Before publishing, verify:

### Face (Critical)
- [ ] Soft round face, NOT angular
- [ ] Honey brown eyes
- [ ] Bronde hair with dark roots + golden balayage
- [ ] Beauty mark on RIGHT cheekbone
- [ ] Natural expression

### Body (Critical)
- [ ] Very large F-cup breasts (proportionate)
- [ ] Narrow waist, wide hips
- [ ] Sun-kissed skin tone
- [ ] No anatomical deformations
- [ ] Correct hand anatomy (5 fingers)

### Accessories
- [ ] Gold layered necklaces visible (when appropriate)
- [ ] Gold chunky bracelet (when appropriate)

### Technical
- [ ] Resolution ≥ 1024px
- [ ] No blur
- [ ] Natural lighting
- [ ] No watermarks/artifacts
- [ ] Coherent background

**Minimum score: 10/14 checks for publication**

---

## Step 7: Batch Generation Workflow

### 7.1 Daily Content Plan (2-3 images)

| Time | Content Type | Setting |
|------|--------------|---------|
| Morning | Lingerie/bedroom | Soft morning light |
| Afternoon | Bathroom/shower | Steam, wet skin |
| Evening | Explicit/nude | Warm evening light |

### 7.2 Variation Seeds

For variety while maintaining Elena:
- Use same prompt structure
- Change seed for pose variations
- Modify lighting keywords
- Swap settings (bedroom → bathroom → outdoor)

### 7.3 ComfyUI Batch Settings

```
Batch size: 4
Queue prompt: 3x
Total: 12 variations per prompt
Select best 2-3
```

---

## Step 8: Troubleshooting

### Problem: Face doesn't look like Elena

**Solution:**
1. Add InstantID with reference image
2. Increase "soft round face" emphasis
3. Add "NOT angular, NOT sharp jawline" to negative
4. Lower CFG to 3.0

### Problem: Breasts too small

**Solution:**
1. Emphasize "very large F-cup breasts" in prompt
2. Add to negative: "small breasts, medium breasts, A-cup, B-cup, C-cup, D-cup, flat chest"
3. Add "prominent bust, generous cleavage"

### Problem: Anatomical errors (NSFW)

**Solution:**
1. Lower CFG to 3.0
2. Add "realistic anatomy, correct proportions" to positive
3. Add "deformed, bad anatomy, unrealistic" to negative
4. Use FaceDetailer post-processing

### Problem: Plastic/fake skin

**Solution:**
1. Add "natural skin texture, pores, realistic skin"
2. Add "plastic skin, airbrushed, oversaturated" to negative
3. Use "r/amateur" or "r/gonewild" style tags

---

## Quick Reference Card

```
MODEL: Big Lust v1.6
RESOLUTION: 1024x1024 or 896x1152
STEPS: 28-30
CFG: 3.0-4.0 (LOW!)
SAMPLER: DPM++ 2M SDE
SCHEDULER: Karras

ELENA MUST-HAVES:
- Soft round face (not angular)
- Honey brown eyes
- Bronde hair (dark roots + golden blonde)
- F-cup breasts
- Narrow waist, wide hips
- Sun-kissed skin
- Beauty mark right cheekbone
- Gold necklaces + bracelet

MAGIC TAGS:
- r/gonewild, r/amateur, r/nsfw
- shot on Canon EOS R5
- amateur photo, intimate setting
```

---

## File Locations

| Resource | Path |
|----------|------|
| Elena Character Config | `app/src/config/character-elena.ts` |
| This Guide | `docs/ELENA_BIG_LUST_GUIDE.md` |
| Panel NSFW Reference | `archive/old-docs/PANEL_NSFW_AI.md` |

---

**Version:** 1.0  
**Last Updated:** January 2026  
**Model:** Big Lust v1.6 (SDXL)
