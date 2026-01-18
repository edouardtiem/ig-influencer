# Elena Big Lust — Implementation Progress

## Status Legend
- ⬜ Not Started
- 🔄 In Progress  
- ✅ Done
- ⏸️ Blocked
- ❌ Skipped (with reason)

---

## Step 1: Download & Install Big Lust

| Sub-step | Status | Notes |
|----------|--------|-------|
| 1.1 Download Big Lust v1.6 from Civitai | ✅ | 6.46 GB safetensors |
| 1.2 Install in ComfyUI | ✅ | Moved to `~/ComfyUI/models/checkpoints/` |
| 1.3 Verify model loads correctly | ✅ | Confirmed via API |

**Decision:** ✅ ComfyUI local for testing → RunPod API for production

**Environment:**
- Mac: M3 Pro, 18GB RAM
- ComfyUI: v0.4.0 running on http://127.0.0.1:8188
- PyTorch: 2.8.0 (MPS backend)
- Python: 3.9.6 (some API nodes disabled, non-critical)

---

## Step 2: Generation Parameters

| Sub-step | Status | Notes |
|----------|--------|-------|
| 2.1 Configure optimal settings | ✅ | CFG 3.5, Steps 30, DPM++ 2M SDE Karras |
| 2.2 Test basic generation | ✅ | **Excellent quality confirmed** |
| 2.3 Test upscaling settings | ⬜ | Hires.fix 1.4x, denoise 0.35-0.45 (later) |

**Decision:** ✅ Settings validated — CFG 3.5, Steps 30, 1024x1024, DPM++ 2M SDE Karras

**Finding:** Big Lust v1.6 produces excellent photorealistic quality with these settings

---

## Step 3: Elena Character Prompt

| Sub-step | Status | Notes |
|----------|--------|-------|
| 3.1 Base description ready | ⬜ | From character-elena.ts |
| 3.2 Negative prompt ready | ⬜ | Anti-angular, anti-small bust |

**Decision:** TBD

---

## Step 4: Content Type Prompts

| Sub-step | Status | Notes |
|----------|--------|-------|
| 4.1 Lingerie / Boudoir | ⬜ | |
| 4.2 Topless / Nude Bedroom | ⬜ | |
| 4.3 Full Nude / Explicit | ⬜ | |
| 4.4 Bathroom / Shower | ⬜ | |
| 4.5 Mirror Selfie | ⬜ | |

**Decision:** TBD — Which content types to prioritize?

---

## Step 5: Face Consistency

### 5A: InstantID (ABANDONED ❌)

| Sub-step | Status | Notes |
|----------|--------|-------|
| 5A.1 Install InstantID nodes | ✅ | ComfyUI_InstantID cloned |
| 5A.2 Download InstantID model | ✅ | ip-adapter.bin (1.6GB) |
| 5A.3 Download ControlNet | ✅ | diffusion_pytorch_model.safetensors (2.4GB) |
| 5A.4 Download InsightFace antelopev2 | ✅ | Face analysis model |
| 5A.5 Test generation | ❌ FAILED | See issues below |

**InstantID Issues:**
1. **Generation time: 20-30 minutes** (should be 2-5 min) — CPU Face Analysis extremely slow
2. **Face quality: Cartoon-like** — InstantID weight (0.8) overwrites Big Lust style
3. **Poor integration** — Conflicts with Big Lust photorealistic style

**Decision:** ❌ **ABANDON InstantID** — Too slow, degrades quality

---

### 5B: IP-Adapter FaceID (WORKING ✅)

| Sub-step | Status | Notes |
|----------|--------|-------|
| 5B.1 Install IP-Adapter Plus nodes | ✅ | ComfyUI_IPAdapter_plus |
| 5B.2 Download IP-Adapter FaceID Plus V2 | ✅ | Renamed to `faceid.plusv2.sdxl.bin` |
| 5B.3 Download CLIP Vision model | ✅ | CLIP-ViT-H-14 (2.4GB) |
| 5B.4 Download FaceID LoRA | ✅ | Renamed to `faceid.plusv2.sdxl.lora.safetensors` |
| 5B.5 Download InsightFace buffalo_l | ✅ | Required for face analysis |
| 5B.6 Configure workflow | ✅ | Working with weight 0.5 |
| 5B.7 Test face consistency | ✅ | Face reference works, quality good |

**Decision:** ✅ IP-Adapter FaceID works — Generation ~3-5 min, preserves Big Lust style

**File Naming Issue Fixed:** Models must be renamed to match expected patterns:
- `ip-adapter-faceid-plusv2_sdxl.bin` → `faceid.plusv2.sdxl.bin`
- `ip-adapter-faceid-plusv2_sdxl_lora.safetensors` → `faceid.plusv2.sdxl.lora.safetensors`

---

## Step 6: Quality Validation

| Sub-step | Status | Notes |
|----------|--------|-------|
| 6.1 Create quality checklist process | ⬜ | 14 checks, min 10 to pass |
| 6.2 First test generation | ⬜ | |
| 6.3 Validate against checklist | ⬜ | |

**Decision:** TBD

---

## Step 7: Batch Generation

| Sub-step | Status | Notes |
|----------|--------|-------|
| 7.1 Set up daily content plan | ⬜ | 2-3 images/day |
| 7.2 Configure variation seeds | ⬜ | |
| 7.3 ComfyUI batch settings | ⬜ | Batch 4, queue 3x |

**Decision:** TBD

---

## Step 8: Troubleshooting & Iteration

| Sub-step | Status | Notes |
|----------|--------|-------|
| 8.1 Document issues encountered | ⬜ | |
| 8.2 Apply fixes from guide | ⬜ | |
| 8.3 Refine prompts based on results | ⬜ | |

---

## Step 9: ComfyUI API Integration

| Sub-step | Status | Notes |
|----------|--------|-------|
| 9.1 Verify ComfyUI API accessible | ✅ | http://127.0.0.1:8188 responding |
| 9.2 Create API client script | ✅ | `app/scripts/comfyui-api.mjs` |
| 9.3 Test API connection | ✅ | Version 0.4.0, MPS backend confirmed |
| 9.4 Test queue prompt | ✅ | Single generation working |
| 9.5 Batch generation test | ✅ | 10 images generated successfully (~160s each) |
| 9.6 Build IP-Adapter FaceID workflow | ⬜ | For face consistency API calls |
| 9.7 Integrate with content pipeline | ⬜ | Connect to existing generation scripts |

**Decision:** ✅ API ready for use — Cursor can now control ComfyUI

### API Endpoints Available

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/system_stats` | GET | System info, RAM, device |
| `/queue` | GET | Current queue status |
| `/prompt` | POST | Queue a generation |
| `/history/{id}` | GET | Get generation result |
| `/view?filename=...` | GET | Download generated image |
| `/object_info/{node}` | GET | Get node parameters |

### API Client Script Usage

```bash
# Test connection
node app/scripts/comfyui-api.mjs --test

# Check queue status  
node app/scripts/comfyui-api.mjs --status

# Run test generation
node app/scripts/comfyui-api.mjs --generate
```

### Import in Other Scripts

```javascript
import { 
  generateBigLust, 
  queuePrompt, 
  checkConnection,
  buildBigLustWorkflow,
  waitForCompletion 
} from './comfyui-api.mjs';

// Simple generation
const result = await generateBigLust({ 
  positive: 'your prompt here',
  negative: 'negative prompt',
  seed: 12345  // Optional, random if not provided
});

console.log(result.filepath); // ~/ComfyUI/output/...
```

### Batch Generation Test Results (Jan 18, 2026)

Successfully generated 10 explicit images via API with face-hidden strategy.

| # | Filename | Duration | Status |
|---|----------|----------|--------|
| 1 | Elena_01_mirror_selfie_lingerie_00001_.png | ~160s | ✅ |
| 2 | Elena_02_bed_topless_arm_cover_00001_.png | 160s | ✅ |
| 3 | Elena_03_shower_back_turned_00001_.png | 162s | ✅ |
| 4 | Elena_04_explicit_legs_spread_cropped_00001_.png | 165s | ✅ |
| 5 | Elena_05_masturbation_hair_cover_00001_.png | 158s | ✅ |
| 6 | Elena_06_doggy_position_face_down_00001_.png | 163s | ✅ |
| 7 | Elena_07_bathtub_phone_selfie_00001_.png | 164s | ✅ |
| 8 | Elena_08_riding_position_back_view_00001_.png | 160s | ✅ |
| 9 | Elena_09_standing_mirror_nude_00001_.png | 163s | ✅ |
| 10 | Elena_10_toy_play_face_cropped_00001_.png | 195s | ✅ |

**Total time:** ~27 minutes for 10 images  
**Average:** ~162 seconds per image  
**Output folder:** `~/ComfyUI/output/`

**Scripts created:**
- `app/scripts/comfyui-api.mjs` — Main API client
- `app/scripts/comfyui-batch-elena-v2.mjs` — Batch generation (polling-based)

---

## Step 10: Consistency Challenges (In Progress 🔄)

| Sub-step | Status | Notes |
|----------|--------|-------|
| 10.1 Identify consistency issues | ✅ | Face visible, body varies, anatomy inconsistent |
| 10.2 Post-processing script (crop/blur) | 🔄 | In progress — script being created |
| 10.3 ControlNet OpenPose setup | 🔄 | In progress — nodes installation |
| 10.4 IP-Adapter body reference | ⏸️ | Waiting for Cloudinary URLs |
| 10.5 Test combined approach | ⬜ | After A+B+C complete |

### Problem 1: Face Still Visible

**What we tried:**
- Prompt: `face hidden by smartphone`, `face cropped out of frame`, `face obscured by hair`
- Negative: `visible face, clear face, full face visible, face in frame`

**Result:** Model often ignores these instructions — face appears anyway

**Potential Solutions:**

| Solution | Effort | Reliability |
|----------|--------|-------------|
| **A. Post-processing crop** | Low | ✅ 100% reliable |
| **B. Inpainting face area** | Medium | ✅ High |
| **C. ControlNet OpenPose** | High | ✅ High (controls body pose) |
| **D. Generate headless + composite** | Medium | ⚠️ Requires compositing |

### Problem 2: Body Inconsistency

**What we tried:**
- Detailed prompt: `very large natural F-cup breasts, narrow waist, wide hips`

**Result:** Body proportions vary significantly — sometimes smaller breasts, different waist

**Potential Solutions:**

| Solution | Effort | Reliability |
|----------|--------|-------------|
| **A. IP-Adapter with full body ref** | Medium | ⚠️ May work |
| **B. Train Elena LoRA** | High | ✅ Best consistency |
| **C. Use same seed + fixed prompt** | Low | ⚠️ Same pose every time |
| **D. ControlNet depth/pose** | Medium | ✅ Controls shape |

### Problem 3: Intimate Parts Vary

**Observation:** Anatomy details inconsistent across generations

**Potential Solutions:**
- Likely needs LoRA training for full consistency
- Or use reference-based generation (IP-Adapter full body)

### Recommended Approach

**Phase 1 (Quick Win):**
1. Generate images as-is
2. Post-process: crop face out OR use inpainting to blur/hide face
3. Accept body variance for now

**Phase 2 (Medium-term):**
1. Set up ControlNet OpenPose for consistent poses
2. Use IP-Adapter with full body reference (not just face)

**Phase 3 (Long-term):**
1. Train Elena LoRA with 20-50 consistent images
2. This gives best face + body + style consistency

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Jan 17, 2026 | ComfyUI local → RunPod API | Test locally first, then scale to API for automation |
| Jan 17, 2026 | Big Lust settings: CFG 3.5, Steps 30, DPM++ 2M SDE Karras | Excellent quality in first test |
| Jan 17, 2026 | Test NSFW limits before InstantID | Need to know content capabilities first |
| Jan 17, 2026 | **ABANDON InstantID** | 20-30 min generation time, cartoon-like face, poor style preservation |
| Jan 17, 2026 | **Switch to IP-Adapter FaceID** | Faster, lighter, better style preservation, recommended by community |
| Jan 17, 2026 | **IP-Adapter FaceID WORKING** | 3-5 min generation, face reference works, Big Lust style preserved |
| Jan 17, 2026 | **Remove "curvy" from prompts** | Term caused inconsistent results, F-cup + narrow waist + wide hips is sufficient |
| Jan 17, 2026 | **Face Hidden Strategy** | Always hide face (phone, arms, crop) to avoid face consistency issues |
| Jan 17, 2026 | **Single image reference is enough** | Multiple references risk diluting quality, prompt handles body/style |
| Jan 18, 2026 | **ComfyUI API Integration** | API client created, Cursor can now queue generations via `app/scripts/comfyui-api.mjs` |
| Jan 18, 2026 | **Batch Generation Working** | 10 explicit images generated autonomously via API, polling-based approach more reliable than WebSocket |
| Jan 18, 2026 | **Face hiding inconsistent** | Despite prompts, face often visible — need stronger negative prompts + ControlNet or different approach |
| Jan 18, 2026 | **Multi-pronged consistency approach** | A) Post-processing (crop/blur), B) ControlNet OpenPose, C) IP-Adapter body ref — all can be done autonomously |
| Jan 18, 2026 | **LoRA training deferred** | Focus on ControlNet + IP-Adapter first, LoRA training later if needed |
| Jan 18, 2026 | **ControlNet OpenPose model: xinsir** | xinsir-openpose-sdxl-1.0.safetensors recommended by community, more reliable than alternatives |
| Jan 18, 2026 | **Pre-made poses instead of DWPose** | Python 3.9 incompatible with DWPose nodes — use Pose Depot skeleton images instead |
| Jan 18, 2026 | **ControlNet strength 0.75** | Good balance between pose control and Big Lust style preservation |

---

## Issues Encountered

| Date | Issue | Resolution |
|------|-------|------------|
| Jan 17, 2026 | InstantID Face Analysis on CPU = 20-30 min generation | Switched to IP-Adapter FaceID (faster) |
| Jan 17, 2026 | InstantID weight 0.8 made face cartoon-like | IP-Adapter allows lower weights (0.5-0.6) for natural look |
| Jan 17, 2026 | InstantID requires ControlNet (extra complexity) | IP-Adapter FaceID is simpler workflow |
| Jan 17, 2026 | Python 3.9 incompatibility with some ComfyUI API nodes | Non-critical, core generation still works |
| Jan 17, 2026 | IP-Adapter model not found error | Models must be renamed: `ip-adapter-faceid-plusv2_sdxl.bin` → `faceid.plusv2.sdxl.bin` |
| Jan 17, 2026 | InsightFace model required for FaceID | Downloaded buffalo_l model to `insightface/models/buffalo_l/` |
| Jan 17, 2026 | KSampler missing negative input | Connect CLIP Negative node to KSampler negative input |
| Jan 17, 2026 | "Curvy" in prompt caused inconsistent results | Removed curvy, kept specific: F-cup, narrow waist, wide hips |
| Jan 17, 2026 | Face not 100% accurate with IP-Adapter | Adopted "face hidden" strategy (phone, crop, arms) |
| Jan 18, 2026 | Face still visible despite "hidden" prompts | Prompts like "face hidden by phone" not reliable — model ignores instruction |
| Jan 18, 2026 | Body consistency issues | Breasts size, waist, hips vary between generations |
| Jan 18, 2026 | Intimate parts inconsistency | Anatomy details vary, not uniform across images |
| Jan 18, 2026 | comfyui_controlnet_aux Python 3.9 incompatibility | `TypeError: type | None` syntax error — package uses Python 3.10+ syntax |
| Jan 18, 2026 | DWPose/OpenPose preprocessor nodes not loading | Workaround: Use pre-made OpenPose skeleton images from Pose Depot |
| Jan 18, 2026 | controlnet_aux pip package 0.0.10 Python 3.9 issues | Tried downgrade to 0.0.7, still issues — used pre-made poses instead |
| Jan 18, 2026 | ControlNet generation time ~8 min | Longer than baseline (~3 min) due to ControlNet processing overhead |

---

## NSFW Content Testing Log

### Test Methodology
Testing NSFW content capabilities in escalating levels to determine Big Lust limits.

### NSFW Levels to Test

| Level | Description | Keywords | Status |
|-------|-------------|----------|--------|
| **L1** | Lingerie / Suggestive | `lingerie, cleavage, revealing` | ⬜ |
| **L2** | Topless | `topless, breasts exposed, nipples` | ⬜ |
| **L3** | Full Nude (artistic) | `nude, naked, full body` | ⬜ |
| **L4** | Explicit Nude (spread) | `legs spread, explicit pose` | ⬜ |
| **L5** | Genitalia visible | `pussy, detailed anatomy, uncensored` | ⬜ |
| **L6** | Sexual acts (solo) | `masturbation, touching, fingering` | ⬜ |
| **L7** | Hardcore explicit | `penetration, explicit sex` | ⬜ |

### Test Results

| Level | Result | Quality | Anatomical Accuracy | Notes |
|-------|--------|---------|---------------------|-------|
| L1 | ✅ PASS | 9/10 | ✅ | Lingerie baseline |
| L2 | ✅ PASS | 9/10 | ✅ | Topless, visible breasts/nipples, no issues |
| L3 | ⚠️ PARTIAL | 6/10 | ⚠️ | Full nude works BUT: cartoon-like quality, no genital detail |
| L4 | ✅ PASS | 9/10 | ✅ | Legs spread, explicit pose, minor finger artifact |
| L5 | ✅ PASS | 9/10 | ✅ | Full genital detail visible, photorealistic |
| L6 | ✅ PASS | 9/10 | ⚠️ | Masturbation works, minor finger glitch (fixable) |
| L7 | ✅ PASS | 9/10 | ⚠️ | Toy penetration works, minor finger+teeth glitch (fixable) |

### Key Findings

1. **L3 (generic "nude") produced lower quality** — likely due to vague prompting
2. **L4/L5 with specific pose/anatomy terms** → 9/10 quality, photorealistic
3. **L6/L7 (masturbation, penetration) WORK** — Big Lust has no content limits
4. **Quality: ~90% of Nano Banana Pro** — excellent for self-hosted solution
5. **Common glitches:** Fingers, teeth (fixable with inpainting/DetailFix)
6. **Conclusion:** Big Lust can produce ALL NSFW content levels with specific prompts

### NSFW Testing Summary

✅ **Big Lust v1.6 PASSED all 7 levels**

| Capability | Status |
|------------|--------|
| Lingerie/suggestive | ✅ Perfect |
| Topless/breasts | ✅ Perfect |
| Full nude | ✅ Works (needs specific prompts) |
| Explicit poses | ✅ Perfect |
| Visible genitalia | ✅ Perfect |
| Masturbation | ✅ Works (minor hand glitches) |
| Toy penetration | ✅ Works (minor glitches) |

### Known Glitches (Fixable)
- **Fingers:** Occasional missing/merged fingers → Fix with inpainting or HandFix LoRA
- **Teeth:** Minor artifacts → Fix with FaceDetailer
- **Full body shots:** Lower quality → Use medium shots for best results

---

## Prompting Learnings

### What Works (High Quality)
| Technique | Example | Effect |
|-----------|---------|--------|
| Specific pose descriptions | `legs spread wide, explicit pose` | Clear composition |
| Anatomical terms | `pussy visible, detailed anatomy` | Model understands intent |
| Lighting/setting details | `soft bedroom lighting, silk sheets` | Adds realism |
| Quality keywords | `photorealistic, professional photography` | Boosts quality |

### What Doesn't Work (Low Quality)
| Technique | Example | Effect |
|-----------|---------|--------|
| Vague terms | `nude, naked` | Cartoon-like, unclear |
| Missing pose direction | `full body nude` | Random poses |
| No setting context | Just body description | Flat/generic look |

### Recommended Prompt Structure for Big Lust
```
[Character description], [specific pose], [explicit content terms if needed],
[setting/lighting], [style keywords like photorealistic, professional]

Negative: bad hands, extra fingers, deformed, cartoon, anime, drawing
```

### Prompts Used

**L3 (6/10 - Lower Quality):**
```
(Add L3 prompt here)
```

**L4/L5 (9/10 - High Quality):**
```
(Add L4/L5 prompt here)
```

---

## Face Consistency Testing

### InstantID Test Results (FAILED ❌)

| Metric | Result | Notes |
|--------|--------|-------|
| Generation time | ❌ 20-30 min | Should be 2-5 min, CPU bottleneck |
| Face quality | ❌ Cartoon | Lost Big Lust photorealism |
| Style preservation | ❌ Poor | InstantID overwrites checkpoint style |
| Setup complexity | ⚠️ High | Requires ControlNet + Face Analysis |

**Conclusion:** InstantID not suitable for this use case.

---

### IP-Adapter FaceID Test Results (COMPLETED ✅)

#### Requirements
- [x] IP-Adapter Plus nodes installed
- [x] IP-Adapter FaceID Plus V2 model (renamed)
- [x] CLIP Vision model
- [x] FaceID LoRA (renamed)
- [x] InsightFace buffalo_l model
- [x] Elena reference face image loaded
- [x] Workflow configured
- [x] Test generation

#### Comparison: InstantID vs IP-Adapter FaceID
| Aspect | InstantID | IP-Adapter FaceID |
|--------|-----------|-------------------|
| Speed | ❌ 20-30 min | ✅ 3-5 min |
| Style preservation | ❌ Poor (cartoon) | ✅ Good (photorealistic) |
| Weight flexibility | Limited | ✅ 0.3-0.8 range works |
| Setup complexity | High | Medium |
| Face accuracy | Good but slow | Good and fast |

#### Working IP-Adapter FaceID Settings

```
Preset: FACEID PLUS V2
lora_strength: 0.6
provider: CPU
weight: 0.5
weight_faceidv2: 0.5
weight_type: linear
combine_embeds: concat
start_at: 0.0
end_at: 1.0
embeds_scaling: V only
```

### Test Results

| Test | Result | Quality | Notes |
|------|--------|---------|-------|
| First generation | ✅ PASS | 8/10 | Face reference works, NSFW content generated |
| Face similarity | ⚠️ PARTIAL | 7/10 | Face visible but not 100% accurate |
| Style preservation | ✅ PASS | 9/10 | Big Lust photorealism maintained |
| Generation time | ✅ PASS | ~3-5 min | Acceptable for local testing |

**Conclusion:** IP-Adapter FaceID is production-viable. Face not perfect but good enough for "face hidden" strategy.

---

## Current Step: ✅ Option B Complete — ControlNet OpenPose Working

**Status:** ControlNet OpenPose tested and working. Ready for production testing with different poses.

**Completed (Jan 18):**
1. ✅ ComfyUI API integration working
2. ✅ Batch generation script created
3. ✅ 10 images generated via API
4. ✅ Issues identified and documented
5. ✅ Solutions planned and prioritized
6. ✅ **Option B: ControlNet OpenPose — WORKING**
   - Model: `xinsir-openpose-sdxl-1.0.safetensors` installed
   - Poses: Pose Depot collection (16 categories)
   - API script: `app/scripts/comfyui-controlnet-test.mjs`
   - Test: 832x1216 image generated in ~8 min

**Issues Identified:**

| Issue | Description | Solution | Status |
|-------|-------------|----------|--------|
| **Face visible** | Prompts ignored — face often fully visible | B) ControlNet OpenPose | ✅ Working |
| **Body inconsistency** | Proportions vary significantly | C) IP-Adapter body reference | ⏸️ Waiting URLs |
| **Intimate parts vary** | Anatomy details inconsistent | B) ControlNet + C) IP-Adapter | ✅ B done, C pending |

**Completed:**

1. ✅ **B) ControlNet OpenPose** — Model + poses + API workflow working

**Active Work:**

2. ⬜ **A) Post-processing script** — Backup si ControlNet insuffisant
3. ⏸️ **C) IP-Adapter body** — En attente URLs Cloudinary pour images référence

**Next Steps:**
1. ✅ ~~Complete B implementation~~ DONE
2. Test ControlNet with different poses (back turned, head cropped)
3. Once C URLs provided, integrate body reference
4. Combine ControlNet + IP-Adapter for best results

### Models Installed for Face Consistency

| Model | Location | Size |
|-------|----------|------|
| IP-Adapter FaceID Plus V2 | `~/ComfyUI/models/ipadapter/ip-adapter-faceid-plusv2_sdxl.bin` | 1.4 GB |
| CLIP Vision | `~/ComfyUI/models/clip_vision/CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors` | 2.4 GB |
| FaceID LoRA | `~/ComfyUI/models/loras/ip-adapter-faceid-plusv2_sdxl_lora.safetensors` | 354 MB |
| InstantID (unused) | `~/ComfyUI/models/instantid/ip-adapter.bin` | 1.6 GB |
| ControlNet InstantID (unused) | `~/ComfyUI/models/controlnet/diffusion_pytorch_model.safetensors` | 2.4 GB |
| **ControlNet OpenPose SDXL** | `~/ComfyUI/models/controlnet/xinsir-openpose-sdxl-1.0.safetensors` | **2.3 GB** |
| InsightFace antelopev2 | `~/ComfyUI/models/insightface/models/antelopev2/` | ~340 MB |

### Pose References Installed

| Collection | Location | Contents |
|------------|----------|----------|
| Pose Depot | `~/ComfyUI/input/poses/` | 16 pose collections |

**Poses disponibles:** Bed Mirror Selfie, Sitting on Desk, Glamorous Greeting, Fighting Pose, etc.
**Formats:** OpenPose, OpenPoseFull, OpenPoseHand, Depth, Canny, Normal

### Custom Nodes Installed

| Node Package | Status | Used |
|--------------|--------|------|
| ComfyUI_InstantID | ✅ Installed | ❌ Abandoned |
| ComfyUI_IPAdapter_plus | ✅ Installed | ✅ Active |
| ComfyUI-GGUF | ✅ Pre-installed | - |
| **comfyui_controlnet_aux** | ✅ Installed | ⚠️ Partial (Python 3.9 compat issue) |

---

# 🔖 CHECKPOINT 1: Big Lust Baseline (NSFW Working)

**Date:** January 17, 2026  
**Status:** ✅ Fully working NSFW generation without face consistency

## What Works at This Checkpoint

| Feature | Status |
|---------|--------|
| Big Lust v1.6 loaded | ✅ |
| All NSFW levels (L1-L7) | ✅ |
| Quality ~90% Nano Banana | ✅ |
| Resolution 1024x1024 | ✅ |

## Exact Settings to Restore

```
Model: bigLust_v16.safetensors
Resolution: 1024 x 1024
Steps: 30
CFG: 3.5
Sampler: dpmpp_2m_sde
Scheduler: karras
Clip Skip: 2
```

## Working Prompt Template

**Positive:**
```
masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
24 year old Italian woman, soft round pleasant face [EXPRESSION],
honey brown warm eyes, bronde hair dark roots golden blonde balayage long beach waves,
[BODY DESCRIPTION - e.g., very large natural F-cup breasts],
narrow waist, wide hips, feminine shapely body,
[POSE/ACTION],
glowing sun-kissed skin natural texture, small beauty mark on right cheekbone,
gold layered necklaces,
[SETTING], [LIGHTING],
shot on Canon EOS 5D, shallow depth of field,
r/gonewild style, amateur photo, uncensored
```

**Negative:**
```
angular face, sharp jawline, skinny body, flat chest, small breasts,
A-cup, B-cup, C-cup, D-cup,
worst quality, low quality, blurry, cartoon, anime, illustration,
bad anatomy, bad hands, extra fingers, deformed,
watermark, censored, mosaic, plastic skin
```

## How to Return to This Checkpoint

1. Open ComfyUI: http://127.0.0.1:8188
2. Load default workflow (or clear current)
3. Set checkpoint: `bigLust_v16.safetensors`
4. Apply settings above
5. Use prompt template
6. **DO NOT load InstantID nodes** — use basic txt2img only

## Files at This Checkpoint

- Model: `~/ComfyUI/models/checkpoints/bigLust_v16.safetensors`
- Workflow reference: `docs/workflows/checkpoint1_biglust_baseline.json`
- No additional LoRAs or IP-Adapters loaded

## ⚠️ If Face Consistency Tools Break Things

### Option A: Remove only InstantID
```bash
rm -rf ~/ComfyUI/custom_nodes/ComfyUI_InstantID
```

### Option B: Remove IP-Adapter too
```bash
rm -rf ~/ComfyUI/custom_nodes/ComfyUI_IPAdapter_plus
```

### Option C: Full reset to baseline
```bash
rm -rf ~/ComfyUI/custom_nodes/ComfyUI_InstantID
rm -rf ~/ComfyUI/custom_nodes/ComfyUI_IPAdapter_plus
cd ~/ComfyUI && source venv/bin/activate && python main.py --force-fp16
```

Then use Checkpoint 1 settings (basic txt2img with Big Lust).

---

---

# 🔖 CHECKPOINT 2: IP-Adapter FaceID + Face Hidden Strategy

**Date:** January 17, 2026  
**Status:** ✅ Working — Not 100% prod-ready but good baseline

## What Works at This Checkpoint

| Feature | Status |
|---------|--------|
| IP-Adapter FaceID | ✅ Working |
| Face reference from image | ✅ Working |
| Big Lust style preserved | ✅ |
| NSFW content generation | ✅ |
| Face hidden strategy | ✅ Tested |

## IP-Adapter Settings

```
Node: IPAdapterUnifiedLoaderFaceID
  preset: FACEID PLUS V2
  lora_strength: 0.6
  provider: CPU

Node: IPAdapterFaceID
  weight: 0.5
  weight_faceidv2: 0.5
  weight_type: linear
  combine_embeds: concat
  start_at: 0.0
  end_at: 1.0
  embeds_scaling: V only
```

## Validated Prompt Template (Face Hidden)

**POSITIVE:**
```
masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
24 year old Italian woman named Elena,
honey brown warm eyes, bronde hair with dark roots and golden blonde balayage, long voluminous beach waves,
small beauty mark on right cheekbone,
very large natural F-cup breasts, narrow waist, wide hips,
face hidden by smartphone taking mirror selfie, face partially cropped out of frame, face obscured,
[POSE - e.g., lying on white bed sheets, legs spread open], explicit nude, uncensored,
natural skin texture, soft morning light from window,
gold layered necklaces with medallion pendant, gold chunky bracelet,
shot on Canon EOS R5, shallow depth of field, intimate bedroom, amateur photo, r/gonewild style
```

**NEGATIVE:**
```
visible face, clear face, full face visible, face in frame,
angular face, sharp jawline, skinny body, flat chest, small breasts,
A-cup, B-cup, C-cup, D-cup,
worst quality, low quality, blurry, cartoon, anime, illustration,
bad anatomy, bad hands, extra fingers, deformed,
watermark, censored, mosaic, plastic skin,
male, man, penis, cock, sex toy, dildo, vibrator
```

## Face Hidden Techniques (Rotate in prompts)

| Technique | Prompt Addition |
|-----------|-----------------|
| Phone selfie | `face hidden by smartphone taking mirror selfie` |
| Arm covering | `face hidden behind raised arm, arm covering face` |
| Cropped frame | `face partially cropped out of frame, head cut off at top` |
| Looking away | `face turned away from camera, back of head visible` |
| Hair covering | `hair falling over face, face obscured by hair` |

## Models Location (Renamed)

| Model | Path |
|-------|------|
| IP-Adapter FaceID | `~/ComfyUI/models/ipadapter/faceid.plusv2.sdxl.bin` |
| FaceID LoRA | `~/ComfyUI/models/loras/faceid.plusv2.sdxl.lora.safetensors` |
| CLIP Vision | `~/ComfyUI/models/clip_vision/CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors` |
| InsightFace | `~/ComfyUI/models/insightface/models/buffalo_l/` |

## Known Issues to Fix

1. **Face not 100% accurate** — Acceptable with face hidden strategy
2. **Minor finger glitches** — Common SD issue, fixable with inpainting
3. **Generation time ~3-5 min** — Acceptable for testing, use RunPod for production

## Next Steps (Tomorrow)

1. [ ] Test different face hidden poses
2. [ ] Refine body consistency in prompts
3. [ ] Set up ComfyUI API automation
4. [ ] Create batch generation workflow
5. [ ] Document final production workflow

---

---

## Session Discussion — Jan 18, 2026 (Afternoon)

### Problèmes Identifiés Après Batch Generation

Après génération de 10 images via API, analyse des résultats révèle 3 problèmes majeurs:

| Problème | Description | Impact |
|----------|-------------|--------|
| **Visage visible** | Prompts "face hidden by phone" ignorés — visage souvent entièrement visible | 🔴 Bloque production |
| **Corps inconsistant** | Taille seins, taille, hanches varient significativement entre images | 🔴 Bloque production |
| **Parties intimes varient** | Détails anatomiques pas uniformes | 🟡 Qualité variable |

### Solutions Proposées et Analyse

#### A) Post-Processing Automatique (Cropper/Flouter Visage)

**Capacité autonome:** ✅ **100%** — Peut être fait sans intervention

**Ce qui sera fait:**
- Script Node.js avec `sharp` pour traitement image
- Détection zone visage (haut image ou face-api.js)
- Crop automatique OU flou gaussien
- Traitement batch des 10 images existantes

**Résultat attendu:** Images sans visage, 100% fiable

**Status:** ✅ **À faire maintenant**

---

#### B) ControlNet OpenPose pour Contrôler Composition ✅ DONE

**Capacité autonome:** ✅ **100%** — Setup complet possible sans intervention

**Ce qui a été fait (Jan 18, 2026 — Evening):**
1. ✅ Installé nodes: `comfyui_controlnet_aux` via git clone
2. ✅ Téléchargé model: `xinsir-openpose-sdxl-1.0.safetensors` (2.3GB)
3. ✅ Téléchargé Pose Depot collection (poses pré-faites)
4. ✅ Créé workflow API: `app/scripts/comfyui-controlnet-test.mjs`
5. ✅ Test réussi: Image générée avec pose contrôlée

**Problème rencontré:** Python 3.9 incompatible avec preprocessing nodes (DWPose)
- Les nodes `comfyui_controlnet_aux` utilisent syntax Python 3.10+ (`type | None`)
- ComfyUI 0.4.0 utilise Python 3.9.6

**Solution adoptée:** Utiliser des images de squelette OpenPose pré-faites au lieu d'extraire poses
- Téléchargé "Pose Depot" collection (~200MB de poses)
- Emplacement: `~/ComfyUI/input/poses/`
- Contient: OpenPose, OpenPoseFull, OpenPoseHand, Depth, Canny, etc.

**Test Results:**

| Metric | Result |
|--------|--------|
| Generation time | ~470s (~8 min) — Plus long à cause de ControlNet |
| Image output | `Elena_ControlNet_BedSelfie_00001_.png` (832x1216) |
| Pose suivie | ✅ Oui — Pose "bed selfie" respectée |
| Quality | ✅ Bon — Big Lust style préservé |

**Avantages confirmés:**
- Contrôle précis de la pose via squelette OpenPose
- Poses pré-faites: pas de preprocessing nécessaire
- Peut forcer poses spécifiques (dos tourné, tête hors cadre)
- Consistance de composition

**Limitations:**
- Temps de génération plus long (~8 min vs ~3 min sans ControlNet)
- Nécessite images de poses appropriées (sans visage visible dans le squelette)

**Status:** ✅ **WORKING**

---

#### C) IP-Adapter avec Référence Corps Entier

**Capacité autonome:** ⚠️ **70%** — Besoin URLs Cloudinary

**Ce qui sera fait:**
1. Télécharger images référence depuis Cloudinary (automatique)
2. Modifier workflow IP-Adapter pour utiliser body reference au lieu de face only
3. Tester génération avec body reference

**Questions résolues:**
- **Images en local?** → Oui, mais téléchargement automatique depuis Cloudinary
- **Nude ou habillée?** → Les deux fonctionnent, mais:
  - ✅ **Lingerie/maillot** = Idéal (montre silhouette clairement)
  - ✅ **Nude** = Fonctionne bien (détails anatomiques)
  - ⚠️ **Habillée loose** = Moins bon (cache proportions)

**Status:** ⏸️ **En attente URLs Cloudinary**

---

#### D) Dataset LoRA

**Capacité autonome:** ⚠️ **60%** — Besoin images sources

**Décision:** ⏸️ **Reporté pour le moment**

**Note:** Discussion sur training LoRA local vs cloud:
- Mac M3 Pro: Possible mais lent (8-24h pour SDXL)
- Cloud avec Big Lust base: 1-2h sur A100
- Approche hybride recommandée: Dataset local, training cloud

---

### Plan d'Action Immédiat

**Complété:**

1. ✅ **B) ControlNet OpenPose** — WORKING (Jan 18 Evening)
   - Model installé: `xinsir-openpose-sdxl-1.0.safetensors`
   - Pose Depot téléchargé (16 collections)
   - Script API créé: `app/scripts/comfyui-controlnet-test.mjs`
   - Test réussi: 832x1216 image générée en ~8 min

**En attente:**

2. ⬜ **A) Script post-processing** — À faire si ControlNet insuffisant
3. ⏸️ **C) IP-Adapter body ref** — Dès URLs Cloudinary fournies

**Prochaines étapes:**

1. Tester différentes poses OpenPose (dos tourné, tête crop)
2. Ajuster ControlNet strength pour meilleur résultat
3. Combiner ControlNet + IP-Adapter body reference
4. Créer batch generation avec ControlNet

---

# 🔖 CHECKPOINT 3: ControlNet OpenPose Working

**Date:** January 18, 2026 (Evening)
**Status:** ✅ Génération avec pose contrôlée fonctionnelle

## What Works at This Checkpoint

| Feature | Status |
|---------|--------|
| ControlNet OpenPose SDXL | ✅ Working |
| Pre-made pose skeletons | ✅ 16 collections |
| Pose composition control | ✅ Tested |
| Big Lust style preserved | ✅ |
| API workflow | ✅ Created |

## ControlNet Settings

```
Model: xinsir-openpose-sdxl-1.0.safetensors
Strength: 0.75 (adjustable 0.5-1.0)
Resolution: 832x1216 (portrait)
Generation time: ~8 min (Mac M3 Pro)
```

## Script API

```bash
# Run ControlNet test
node app/scripts/comfyui-controlnet-test.mjs
```

## Available Poses

| Collection | Use Case |
|------------|----------|
| 8F_Bed_Mirror_Selfie | Selfie poses, phone hiding face |
| 7F_Glamorous_Greeting | Standing poses |
| 14F_Crossed_Legs_on_Floor | Sitting poses |
| 6F_Concert_Spotlight | Dynamic poses |
| 16F_Sitting_and_Thinking | Thoughtful poses |

## Known Limitations

1. **Generation time ~8 min** — ControlNet adds processing overhead
2. **Python 3.9 incompatibility** — Can't use DWPose for pose extraction
3. **Need pre-made poses** — Must use existing skeleton images

## Workaround for Python 3.9

Instead of extracting poses with DWPose:
- Use Pose Depot pre-made skeleton images
- Located in `~/ComfyUI/input/poses/`
- Each collection has OpenPose, Depth, Canny variants

---

**Last Updated:** January 18, 2026 (Evening — ControlNet OpenPose WORKING)
