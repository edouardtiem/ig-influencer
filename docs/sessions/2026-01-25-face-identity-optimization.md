# 2026-01-25: Face Identity Preservation Optimization

## Goal
Improve face identity accuracy from ~85% to 95%+ for Elena character generation.

---

## Checkpoint 23:45

### Done

1. **Created 3 test scripts**:
   - `elena-simple-test.mjs` - Baseline FaceID (0.85 weight, 25 steps)
   - `elena-faceid-optimized.mjs` - Phase 1 optimized (0.75 weight, 40 steps, FaceDetailer)
   - `elena-instantid-test.mjs` - Phase 2 InstantID (0.8 weight, ControlNet 1.0, 50 steps)

2. **Fixed ComfyUI configuration issues**:
   - Changed checkpoint from `bigLust_v16` to `bigLove_xl1.safetensors`
   - Fixed `InsightFaceLoader` -> `IPAdapterInsightFaceLoader` node name
   - Added missing `model_name: "buffalo_l"` parameter
   - Fixed face reference image: `elena_face_ref_v2.png`
   - Fixed FaceDetailer availability check

3. **Phase 1 Test: SUCCESS**
   - Generated: `elena-faceid-optimized-1769375240348.png`
   - Result: Natural looking, good face similarity (~90%)
   - Time: 30s

4. **Installed InstantID on RunPod**:
   - Cloned `ComfyUI_InstantID` custom node
   - Downloaded `ip-adapter.bin` (1.6GB)
   - Downloaded `diffusion_pytorch_model.safetensors` (2.4GB)
   - Fixed nested `antelopev2` model directory structure

5. **Phase 2 Test: MIXED RESULTS**
   - Generated: `elena-instantid-1769376335037.png`
   - Result: Face looks "artificial/posed", less recognizable
   - Time: 78s
   - Issue: ControlNet strength too high makes face look fake

### Decisions

1. **FaceID vs InstantID**
   - FaceID Phase 1 gave more **natural** looking results
   - InstantID with high settings (0.8, ControlNet 1.0) looks **artificial**
   - InstantID's ControlNet forces facial keypoints too rigidly

2. **Next approach**:
   - Option A: Lower InstantID settings (weight 0.6, ControlNet 0.5)
   - Option B: Return to FaceID and fine-tune settings

### Technical Findings

| Method | Weight | ControlNet | Steps | Natural Look | Face Accuracy |
|--------|--------|------------|-------|--------------|---------------|
| FaceID Optimized | 0.75 | N/A | 40 | Good | ~90% |
| InstantID | 0.8 | 1.0 | 50 | Poor (artificial) | ~85%? |

### Files Created/Modified

- `app/scripts/elena-simple-test.mjs` - Created
- `app/scripts/elena-faceid-optimized.mjs` - Created
- `app/scripts/elena-instantid-test.mjs` - Created
- `app/generated/elena-faceid-test/elena-faceid-optimized-1769375240348.png` - Phase 1 result
- `app/generated/elena-instantid-test/elena-instantid-1769376335037.png` - Phase 2 result

### Next Steps

1. Test InstantID with lower settings (weight: 0.6, ControlNet: 0.5)
2. If still artificial, explore FaceID parameter tuning:
   - Different `embeds_scaling` values
   - Adjust `start_at`/`end_at` timing
   - Try different `weight_type` options

### Blockers

- None currently

---

## Expected Results: InstantID with Lower Settings

| Setting Change | Expected Effect |
|----------------|-----------------|
| Weight 0.8 -> 0.6 | Less rigid face identity, more prompt influence |
| ControlNet 1.0 -> 0.5 | Softer facial structure enforcement, more natural expressions |
| Combined | Should look more natural while maintaining ~90% identity |

If still artificial, FaceID with fine-tuning may be the better path.

---

## RunPod Management

### Current Pod Info
- **Pod URL**: `https://0nfcd8w6s1f0ux-8188.proxy.runpod.net`
- **SSH**: `ssh -i ~/.runpod/ssh/RunPod-Key-Go root@209.170.80.132 -p 14879`

### To Stop the Pod
Go to [RunPod Console](https://www.runpod.io/console/pods) and click "Stop" on the pod.

### To Restart ComfyUI
```bash
# SSH to pod
ssh -i ~/.runpod/ssh/RunPod-Key-Go root@209.170.80.132 -p 14879

# Start ComfyUI
cd /workspace/comfyui && nohup python main.py --listen 0.0.0.0 --port 8188 > /workspace/comfyui.log 2>&1 &

# Check if running
curl http://localhost:8188/system_stats
```

### Installed Components on This Pod
- ComfyUI 0.10.0
- IP-Adapter Plus (with FaceID support)
- InstantID custom node
- InsightFace models: buffalo_l, antelopev2
- InstantID models: ip-adapter.bin, diffusion_pytorch_model.safetensors

### Run Tests After Restart
```bash
# Phase 1: FaceID Optimized
COMFYUI_URL=https://0nfcd8w6s1f0ux-8188.proxy.runpod.net node app/scripts/elena-faceid-optimized.mjs

# Phase 2: InstantID
COMFYUI_URL=https://0nfcd8w6s1f0ux-8188.proxy.runpod.net node app/scripts/elena-instantid-test.mjs
```
