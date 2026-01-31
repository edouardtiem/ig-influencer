# Ralph Launcher

**Target Task**: features/comfyui-generation-workflow/tasks/TASK-014-elena-lora-comfyorg-zimage.md

**Status**: ⏸️ PAUSED - Training running on Vast.ai pod

## Current Progress

- [x] Research Z-Image Full LoRA training method (Musubi Tuner)
- [x] Verify training toolkit supports Comfy-Org Z-Image architecture
- [x] Upload 56 Elena training images to pod
- [x] Configure training: bf16, rank 32, trigger token "elena"
- [x] Start training on Vast.ai pod (RTX 3090)
- [ ] Monitor training loss — **RUNNING** (3500 steps, ~4h ETA)
- [ ] Download trained LoRA when complete
- [ ] Test LoRA with Z-Image Full workflow in ComfyUI
- [ ] Verify Elena face is recognizable in generated images
- [ ] Save final LoRA as `elena_zimage_v3_comfyorg.safetensors`

## Training Config (Optimized)

```
Steps: 3500 (6 epochs for 56 images)
LR: 1e-4 with cosine scheduler
Network: dim=32, alpha=16
Optimizer: adamw8bit
Checkpoints: every 500 steps
```

## Resume Instructions

```bash
# Check training status
ssh -p 27228 root@ssh3.vast.ai "grep -oP 'steps:.*avr_loss=[\d.]+' /workspace/training.log | tail -5"

# Check if complete
ssh -p 27228 root@ssh3.vast.ai "ls -la /workspace/output/elena_v3/"

# When done, download LoRA
scp -P 27228 root@ssh3.vast.ai:/workspace/output/elena_v3/elena_zimage_v3_comfyorg_comfyui.safetensors .
```

## Pod Info

```bash
ssh -p 27228 root@ssh3.vast.ai
```

- RTX 3090 (24GB), Spain
- Training log: `/workspace/training.log`
- Output dir: `/workspace/output/elena_v3/`

---

Run `/ralph` to continue monitoring and complete remaining criteria.
