# TASK-005: RunPod Persistent Setup

**Status**: 🟡 In Progress
**Created**: 24 January 2026
**Feature**: [ComfyUI Generation](../README.md)

---

## Goal

Configure the existing RunPod network volume (`elena-models`) with all models and ComfyUI, then create a workflow to launch a pod connected to this volume on-demand.

---

## Acceptance Criteria

- [ ] Network volume configured with all models (BigLove XL, Elena LoRA, IP-Adapter, etc.)
- [ ] Script `startup.sh` that launches ComfyUI automatically on pod start
- [ ] Local script `runpod-connect.mjs` to start/stop pods on-demand
- [ ] End-to-end test: start pod → generate image without manual intervention
- [ ] No linter errors introduced

---

## Approach

1. Create new pod connected to existing network volume `box5nuv45v`
2. Install ComfyUI on the volume
3. Download/upload all required models
4. Install custom nodes (IPAdapter Plus, Impact Pack)
5. Create `startup.sh` auto-launch script
6. Create local `runpod-connect.mjs` management script
7. End-to-end test

---

## Current State

| Resource | Status | ID |
|----------|--------|-----|
| **Network Volume** | ✅ Exists | `box5nuv45v` (elena-models, 50GB, US-KS-2) |
| **Template** | ✅ Exists | `gijmo2nbr7` (elena-comfyui-worker) |
| **Pod** | ⚠️ Not connected to volume | `l2qs6633hmvp4c` |

---

## Target Architecture

```
Network Volume: elena-models (box5nuv45v)
├── comfyui/
│   ├── models/
│   │   ├── checkpoints/bigLove_xl1.safetensors
│   │   ├── loras/elena_v4_cloud.safetensors
│   │   ├── ipadapter/ip-adapter-faceid-plusv2_sdxl.bin
│   │   ├── clip_vision/CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors
│   │   ├── insightface/buffalo_l/
│   │   ├── ultralytics/bbox/face_yolov8m.pt
│   │   ├── sams/sam_vit_b_01ec64.pth
│   │   └── upscale_models/4x-UltraSharp.pth
│   ├── custom_nodes/
│   │   ├── ComfyUI_IPAdapter_plus/
│   │   └── ComfyUI-Impact-Pack/
│   └── input/elena_face_ref.jpg
└── startup.sh

Pod (on-demand) → mounts /workspace → ComfyUI ready
```

---

## Models to Install

| Model | Destination | Source |
|-------|-------------|--------|
| `bigLove_xl1.safetensors` | checkpoints/ | Upload from Mac |
| `elena_v4_cloud.safetensors` | loras/ | Upload from Mac |
| `ip-adapter-faceid-plusv2_sdxl.bin` | ipadapter/ | HuggingFace |
| `CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors` | clip_vision/ | HuggingFace |
| `buffalo_l/` | insightface/ | HuggingFace |
| `face_yolov8m.pt` | ultralytics/bbox/ | Ultralytics |
| `sam_vit_b_01ec64.pth` | sams/ | Meta |
| `4x-UltraSharp.pth` | upscale_models/ | HuggingFace |
| `elena_face_ref.jpg` | input/ | Upload from Mac |

---

## Files Involved

- `app/scripts/runpod-connect.mjs` — New script to create
- `app/scripts/runpod-lora-training.mjs` — Reference for RunPod API usage

---

## Constraints

- Volume exists: `box5nuv45v` in US-KS-2
- RunPod token in `.env.local`
- Large files to upload from Mac: bigLove_xl1 (6.5GB), elena_v4_cloud, elena_face_ref.jpg

---

## Configuration

```javascript
const CONFIG = {
  volumeId: 'box5nuv45v',
  volumeName: 'elena-models',
  region: 'US-KS-2',
  gpuType: 'NVIDIA GeForce RTX 4090',
  templateId: 'gijmo2nbr7'  // elena-comfyui-worker
};
```

---

## Progress Log

### 24 Jan 2026
- Task migrated from `roadmap/ralph/RALPH-002-runpod-persistent-setup.md`
- Network volume and template already exist
- Current pod not connected to volume

---

## Outcome

_Fill when task is complete, then rename file to DONE-005-runpod-persistent-setup.md_

---

## Ralph Sessions

### 24 Jan 2026 — MIGRATED
**Original**: `roadmap/ralph/RALPH-002-runpod-persistent-setup.md`
**Status**: Not yet executed by Ralph
