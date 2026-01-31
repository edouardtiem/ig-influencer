# TASK-014: Train Elena LoRA on Official Comfy-Org Z-Image Full

**Status**: ⏸️ PAUSED (training running on pod)
**Created**: 2026-01-31
**Feature**: [ComfyUI Generation Workflow](../README.md)

---

## Goal

Train a new Elena LoRA specifically for the **official Comfy-Org Z-Image Full model** (12.3GB from huggingface.co/Comfy-Org/z_image). Previous LoRA v2 was trained on ostris/Z-Image-De-Turbo which has incompatible architecture.

---

## Background

**Why this task exists:**
- TASK-011 trained LoRA on `ostris/Z-Image-De-Turbo` model
- That LoRA uses tensor names like `diffusion_model.layers.*`
- Official Comfy-Org model uses `context_refiner.*`, `cap_embedder.*`
- **Architecture mismatch = LoRA doesn't apply**

**What we learned:**
- Official Z-Image Full (12.3GB) generates beautiful portraits
- Wrong model file (7.9GB) was causing QR code/black images
- Need LoRA trained specifically on official architecture

---

## Acceptance Criteria

- [x] Research Z-Image Full LoRA training method (may need SimpleTuner or Kohya)
- [x] Verify training toolkit supports Comfy-Org Z-Image architecture
- [x] Upload 56 Elena training images to pod (already prepared in `lora-dataset-elena-zimage/`)
- [x] Configure training: bf16, rank 32-48, trigger token "elena"
- [x] Start training on Vast.ai pod (RTX 3090)
- [ ] Monitor training loss (should decrease, no NaN) — IN PROGRESS (loss decreasing: 0.37→0.30)
- [ ] Download trained LoRA when complete
- [ ] Test LoRA with Z-Image Full workflow in ComfyUI
- [ ] Verify Elena face is recognizable in generated images
- [ ] Save final LoRA as `elena_zimage_v3_comfyorg.safetensors`

---

## Approach

### Phase 1: Research Training Method

1. Check if Kohya/SimpleTuner supports Z-Image Full architecture
2. Search for Z-Image Full LoRA training guides (not Turbo/De-Distilled)
3. Find correct model config for Comfy-Org Z-Image (lumina2-based)

### Phase 2: Setup Training Environment

1. Use existing pod: `ssh -p 27228 root@ssh3.vast.ai`
2. Install training toolkit (SimpleTuner or Kohya)
3. Download official Z-Image Full for training base:
   ```bash
   # Already on pod at /workspace/ComfyUI/models/unet/z_image_bf16.safetensors
   ```
4. Upload dataset from `lora-dataset-elena-zimage/processed/`

### Phase 3: Training

```yaml
# Suggested config (adjust based on research)
model_path: /workspace/ComfyUI/models/unet/z_image_bf16.safetensors
clip_path: /workspace/ComfyUI/models/text_encoders/qwen_3_4b_bf16.safetensors
vae_path: /workspace/ComfyUI/models/vae/ae.safetensors
dataset_path: /workspace/elena-dataset/
output_dir: /workspace/output/elena_v3/
trigger_token: elena
resolution: 1024
batch_size: 1
learning_rate: 5e-5
lora_rank: 32
lora_alpha: 16
steps: 3000
precision: bf16
save_every: 500
```

### Phase 4: Testing

1. Copy LoRA to ComfyUI: `models/loras/elena_zimage_v3_comfyorg.safetensors`
2. Use working Z-Image workflow from TASK-013
3. Add LoraLoader node with weight 0.7-1.0
4. Generate test portraits with "elena" trigger
5. Verify face matches Elena reference photos

---

## Files Involved

- `lora-dataset-elena-zimage/processed/` — 56 training images + captions (EXISTS)
- `/workspace/ComfyUI/models/unet/z_image_bf16.safetensors` — Base model (EXISTS on pod)
- `/workspace/output/elena_v3/` — Training output (CREATE)
- `elena_zimage_v3_comfyorg.safetensors` — Final LoRA (OUTPUT)

---

## Technical Details

### Pod Connection
```bash
ssh -p 27228 root@ssh3.vast.ai
```

- **GPU**: RTX 3090 (24GB)
- **Location**: Spain
- **Disk**: 72GB available

### Model Architecture (Official Comfy-Org)
- Architecture: Lumina2-based
- Tensor naming: `context_refiner.*`, `cap_embedder.*`, NOT `diffusion_model.*`
- Text encoder: qwen_3_4b (Qwen 2.5 3B)
- VAE: ae.safetensors

### Key Differences from TASK-011
| Aspect | TASK-011 (Failed) | TASK-014 (This) |
|--------|-------------------|-----------------|
| Base model | ostris/Z-Image-De-Turbo | Comfy-Org Z-Image Full |
| Size | ~7.9GB | 12.3GB |
| Architecture | `diffusion_model.layers.*` | `context_refiner.*` |
| Compatibility | ❌ Incompatible | ✅ Should work |

---

## Constraints

- **MUST use official Comfy-Org model** (not ostris, not mingyi456)
- bf16 precision required (fp16 causes NaN loss)
- RTX 3090 has 24GB VRAM - batch size 1 recommended
- Training toolkit must support Lumina2/Z-Image architecture

---

## Progress Log

### 2026-01-31
- Task created after discovering TASK-011 LoRA is incompatible
- Root cause: architecture mismatch between ostris and Comfy-Org models
- Dataset already prepared from TASK-011
- Pod already has official Z-Image Full model installed

### 2026-01-31 - Ralph Iteration 1-6
- **Research**: Found Musubi Tuner (kohya-ss) supports Z-Image with `networks.lora_zimage`
- **Setup**: Installed Musubi Tuner on pod, fixed libGL dependencies
- **Upload**: SCP'd 56 images + captions to `/workspace/elena-dataset/`
- **Config**: Created `/workspace/elena_dataset.toml` (fixed format from initial error)
- **Training v1**: Started with 2000 steps, stopped to optimize

### 2026-01-31 - Optimized Training Config
- **Researched best practices** from Z-Image guides and Musubi Tuner docs
- **Increased steps**: 2000 → 3500 (~6 epochs for 56 images)
- **Added cosine scheduler** for better convergence
- **Final training config**:
  ```
  network_dim: 32, network_alpha: 16
  learning_rate: 1e-4
  lr_scheduler: cosine
  optimizer: adamw8bit
  timestep_sampling: shift, discrete_flow_shift: 2.0
  max_train_steps: 3500
  save_every_n_steps: 500
  ```
- **Captions verified**: 56 unique captions with "elena" trigger + per-image descriptions
- **Training started**: Loss healthy (0.37 → 0.31), no NaN

### 2026-01-31 - SESSION PAUSED
- **Training running in background** on Vast.ai pod
- **ETA**: ~4 hours total from start
- **Checkpoints**: Will save at 500, 1000, 1500, 2000, 2500, 3000, 3500

## Resume Instructions

```bash
# Check training status
ssh -p 27228 root@ssh3.vast.ai "grep -oP 'steps:.*avr_loss=[\d.]+' /workspace/training.log | tail -5"

# Check if complete
ssh -p 27228 root@ssh3.vast.ai "ls -la /workspace/output/elena_v3/"

# When done, download LoRA
scp -P 27228 root@ssh3.vast.ai:/workspace/output/elena_v3/elena_zimage_v3_comfyorg_comfyui.safetensors .
```

---

## Outcome

_Fill when task is complete, then rename file to DONE-014-elena-lora-comfyorg-zimage.md_

---

## Ralph Sessions

_Automatically filled when Ralph completes this task_
