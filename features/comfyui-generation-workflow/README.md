# ComfyUI Generation Workflow

> LoRA training, checkpoints, IP-Adapter FaceID, face consistency, and image quality

**Status**: 🟡 In Progress (face refinement pending)  
**Last updated**: 24 January 2026

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

### RunPod Configuration

| Setting | Value |
|---------|-------|
| **Pod ID** | `l2qs6633hmvp4c` |
| **GPU** | RTX 4090 (24GB) |
| **ComfyUI URL** | `https://l2qs6633hmvp4c-8188.proxy.runpod.net` |
| **SSH** | `ssh -i ~/.runpod/ssh/RunPod-Key-Go root@103.196.86.108 -p 14109` |
| **Speed** | ~24s/image (vs 5min local) |

**Installed on RunPod**: SDXL Base, Elena LoRA, IP-Adapter FaceID, CLIP Vision
**Missing**: BigLove XL (needs CivitAI token or upload from Mac)

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
| **RunPod RTX 4090** | ~24s/image vs 5min local, pod `l2qs6633hmvp4c` |

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

**Next**: Installer Qwen2.5-VL sur RunPod et tester face refinement

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
