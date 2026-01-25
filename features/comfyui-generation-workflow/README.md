# ComfyUI Generation Workflow

> LoRA training, checkpoints, IP-Adapter FaceID, face consistency, and image quality

**Status**: 🟡 In Progress (all models uploaded, test generation pending)
**Last updated**: 25 January 2026 (Session 6)

---

## Current State

Image generation is **95% working**. Body consistency and image quality are now **excellent**. Main remaining issue is **face refinement** (face is ~85% accurate, needs to be 95%+).

### Active Configuration

| Component | Value | Notes |
|-----------|-------|-------|
| **Checkpoint** | `bigLove_xl1.safetensors` | Better than BigLust for skin |
| **LoRA** | `elena_v4_cloud.safetensors` | Strength: **0.7** |
| **Face consistency** | IP-Adapter FaceID v2 | Weight: 0.85 |
| **Face reference** | `elena_face_ref.jpg` | Frontal photo |
| **Resolution** | 1024x1024 | Square, upscaled 4x |
| **Steps** | 25 | |
| **CFG** | **4.0** | Low for SDXL = less grain |
| **Sampler** | `dpmpp_2m_sde` + `karras` | |
| **Post-process** | 4x-UltraSharp | Upscale to 4096x4096 |
| **Face enhancement** | FaceDetailer (Impact Pack) | denoise 0.4 |

### File Locations (Local)

- LoRA: `~/ComfyUI/models/loras/elena_v4_cloud.safetensors`
- Checkpoint: `~/ComfyUI/models/checkpoints/bigLove_xl1.safetensors`
- Face ref: `~/ComfyUI/input/elena_face_ref.jpg`
- Dataset: `lora-dataset-elena-cloud/10_elena/` (35 images)

### RunPod Configuration (US-TX-3)

| Setting | Value |
|---------|-------|
| **Pod ID** | `adlni6ocoi3sip` (stopped, resume with runpod-connect.mjs) |
| **Volume** | `aml40rql5h` (elena-comfyui-US-TX-3, 50GB) ✅ PERSISTENT |
| **GPU** | RTX 4090 (24GB) |
| **ComfyUI URL** | `https://{pod-id}-8188.proxy.runpod.net` (dynamic) |
| **Speed** | ~50s/image |
| **Datacenter** | US-TX-3 |

**Installed Models** (persistent on volume):
- ✅ **BigLove XL** (6.94GB) - `bigLove_xl1.safetensors`
- ✅ Elena LoRA v4 (218MB)
- ✅ IP-Adapter FaceID v2 (1.4GB)
- ✅ CLIP Vision (2.4GB)
- ✅ FaceID LoRA (355MB)
- ✅ 4x-UltraSharp (64MB)
- ✅ SAM vit_b
- ✅ elena_face_ref.jpg
- ✅ **Qwen Text Encoder** (16GB) - `qwen_2.5_vl_7b.safetensors`
- ✅ **Qwen VAE** (243MB) - `qwen_image_vae.safetensors`
- ✅ **Qwen-Image-Edit GGUF** (12.3GB) - `qwen-image-edit-2511-Q4_K_M.gguf`

**Custom Nodes**: ComfyUI_IPAdapter_plus, ComfyUI-Impact-Pack, **ComfyUI-GGUF**

### Quick Start RunPod

```bash
# Check status
node app/scripts/runpod-connect.mjs --status

# Connect (shows URLs)
node app/scripts/runpod-connect.mjs

# Stop pod (saves $, data preserved on volume)
node app/scripts/runpod-connect.mjs --stop
```

**Note**: Data persists on volume. You can stop/terminate pods without losing models.

---

## What Works ✅

| What | Details |
|------|---------|
| **BigLove XL checkpoint** | Better skin tones than SDXL Base or BigLust |
| **LoRA V4 @ 0.7** | Excellent body proportions, less "overfit" than 1.0 |
| **IP-Adapter FaceID v2** | Good face consistency with pose freedom |
| **CFG 4.0 + dpmpp_2m_sde** | Reduces grain significantly vs CFG 7+ |
| **4x-UltraSharp upscaler** | Works locally on Mac M3 Pro |
| **FaceDetailer (Impact Pack)** | Améliore qualité visage + peau, denoise 0.4 |
| **Python 3.10 venv** | Required for Impact Pack (3.9 incompatible) |
| **Simplified workflow** | Single IP-Adapter (face only), no style adapter needed |
| **Prompt body control** | `natural breasts D cup` fonctionne bien |
| **Batch generation** | 5 photos en ~14 min local |
| **bf16 training** | Prevents NaN loss (vs fp16) |
| **LR 5e-5** | Stable training (vs 1e-4 which caused NaN) |
| **RunPod RTX 4090** | ~50s/image with Qwen, pod `dortewt0b3tom3` |
| **Qwen-Image-Edit** | Works! Generation test successful (~50s for 1024x1024) |

## What Doesn't Work ❌

| What | Details |
|------|---------|
| **CivitAI direct download** | Nécessite token API pour télécharger BigLove sur RunPod |
| **Voyeur silhouettes in prompts** | SDXL ignore les silhouettes floues en arrière-plan |
| **ImageSharpen** | Amplifies grain |
| **LoRA weight 1.0** | Too strong, reduces flexibility |
| **CFG 7.0+** | Creates grain/noise |
| **Dual IP-Adapter (face + style)** | Unnecessary complexity, style can come from prompt |
| **fp16 training** | Causes NaN loss |
| **LR 1e-4** | Too high, causes NaN |

## Open Questions ❓

- Qwen2.5-VL pour copier le visage de référence ?
- Face-only LoRA from cropped headshots?

---

## Active Tasks

| # | Task | Status | Priority | Link |
|---|------|--------|----------|------|
| 004 | Qwen face refinement (85% → 95%) | 🟡 In Progress | Immediate | [→](./tasks/TASK-004-qwen-face-refinement.md) |
| 005 | RunPod persistent setup | 🟡 In Progress | High | [→](./tasks/TASK-005-runpod-persistent-setup.md) |

**Next**: Start pod, launch ComfyUI, test Qwen face refinement workflow

### Backlog

- Create face-only LoRA from cropped headshots
- Add 15-50 more images to dataset
- Retrain with Network Dim 64 (vs 32)
- Use unique trigger word ("sks" vs "elena")

## Completed Tasks

| # | Task | Completed | Link |
|---|------|-----------|------|
| 001 | Grain reduction (CFG 4.0 + dpmpp_2m_sde) | 23 Jan 2026 | [→](./tasks/DONE-001-grain-reduction.md) |

---

## Quick Links

- [Decisions →](./DECISIONS.md)
- [Tests →](./TESTS.md)
- [Tasks →](./tasks/)

---

## Scripts

| Script | Purpose |
|--------|---------|
| `app/scripts/elena-simple-test.mjs` | **Simplified workflow** (recommended) |
| `app/scripts/elena-detailer-test.mjs` | **FaceDetailer workflow** (best quality) |
| `app/scripts/elena-hotel-pack.mjs` | **Batch 5 photos** explicit hotel pack |
| `app/scripts/elena-luxury-wife-pack.mjs` | **Batch 5 photos** luxury wife voyeur pack |
| `app/scripts/runpod-lora-training.mjs` | RunPod pod creation & training |
| `app/scripts/test-elena-lora-simple.mjs` | Test LoRA without FaceID |
| `app/scripts/elena-instantid-test.mjs` | Test InstantID workflow |
| `app/scripts/runpod-quality-tests.mjs` | Quality tests on RunPod |
| `app/scripts/elena-biglove-batch.mjs` | Batch generation with BigLove |

---

## Elena Physical Description (for prompts)

**Face**:
- Shape: Oval/heart, soft contours, high cheekbones
- Eyes: Hazel-green with golden/honey tones
- Nose: Straight with slight slope, rounded tip
- Lips: Full, larger lower lip, defined cupid's bow
- Beauty mark: Right cheek, near cheekbone (signature!)
- Skin: Golden tan, sun-kissed, smooth texture

**Hair**:
- Color: Bronde - dark roots + golden blonde/honey balayage
- Style: Mid-length, textured beach waves

**Body**:
- Athletic but curvy
- Slim waist, wide hips
- Natural breasts D cup (use in prompt)
- Toned arms

**Signature accessories**:
- Layered gold necklaces with medallion
- Gold chain bracelet
