# Tests — Elena Image Generation

All tests run, with results and learnings.

---

## Summary Table

| Test | Date | Result | Notes |
|------|------|--------|-------|
| LoRA V3 training (fp16, LR 1e-4) | 2026-01-20 | ❌ Fail | NaN loss, corrupted model |
| LoRA V4 training (bf16, LR 5e-5) | 2026-01-20 | ✅ Pass | Stable, 1500 steps, loss 0.116 |
| LoRA + FaceID together | 2026-01-20 | ❌ Fail | Plastic/artificial faces |
| LoRA alone (no FaceID) | 2026-01-20 | ⚠️ Partial | Body ✅, Face 85% |
| BigLove + LoRA + InstantID | 2026-01-21 | ✅ Pass | 95% similarity |
| ImageSharpen post-process | 2026-01-21 | ❌ Fail | Amplifies grain |
| 4x-UltraSharp local | 2026-01-21 | ❌ Error | Tensor size error |
| 4x-UltraSharp RunPod | 2026-01-21 | ✅ Pass | Works perfectly |
| High-res 1024x1536 | 2026-01-21 | ✅ Pass | Good quality |
| InstantID + 4x upscale | 2026-01-21 | ✅ Pass | 4096x6144, 34MB |
| BigLove vs SDXL Base | 2026-01-21 | ✅ BigLove | More natural colors |

---

## Detailed Test Logs

### Test: LoRA V3 Training (fp16)
**Date**: 2026-01-20  
**Goal**: Train Elena LoRA on RunPod with 35 images

**Setup**:
- GPU: RTX A5000 (24GB)
- Mixed precision: fp16
- Learning rate: 1e-4
- Steps: 2100
- Network Dim: 32

**Result**: ❌ FAIL
```
steps: 0%| | 1/2100 [00:05<3:14:53, 5.57s/it, avr_loss=nan]
```
- NaN loss from step 1
- All checkpoints corrupted
- Generated images show no Elena resemblance

**Conclusion**: fp16 + LR 1e-4 is unstable for SDXL LoRA training

---

### Test: LoRA V4 Training (bf16)
**Date**: 2026-01-20  
**Goal**: Fix NaN issue and complete training

**Setup**:
- GPU: RTX A5000 (24GB)
- Mixed precision: **bf16** (changed)
- Learning rate: **5e-5** (lowered)
- LR warmup: **200 steps** (increased)
- Steps: 1500
- Network Dim: 32
- Network Alpha: 32

**Result**: ✅ PASS
- Training completed without errors
- Final loss: 0.116 (stable, decreasing)
- Duration: 51 minutes
- Cost: ~$0.14

**Conclusion**: bf16 + lower LR = stable training

**Output**: `elena_v4_cloud.safetensors` (218MB)

---

### Test: LoRA + FaceID Together
**Date**: 2026-01-20  
**Goal**: Improve face consistency during generation

**Setup**:
- LoRA: elena_v4_cloud (strength 0.8)
- FaceID: faceid.plusv2.sdxl.bin (weight 0.7)
- Both applied during generation

**Result**: ❌ FAIL
- Body: Good
- Face: Plastic, artificial, uncanny valley

**Conclusion**: FaceID interferes with LoRA. Don't use together.

---

### Test: LoRA Alone (without FaceID)
**Date**: 2026-01-20  
**Goal**: Test LoRA V4 without face enhancement

**Setup**:
- LoRA: elena_v4_cloud
- Strength: 1.0 and 1.2
- No FaceID

**Result**: ⚠️ PARTIAL
- Body: ✅ Excellent - style, proportions correct
- Face: ⚠️ 85% - generic traits, not distinctly Elena

**Conclusion**: LoRA learns body/style well, but not facial identity. Need separate solution for face.

**Output**: `Elena_V4_str1_00001_.png`, `Elena_V4_str1.2_00001_.png`

---

### Test: BigLove + LoRA + InstantID
**Date**: 2026-01-21  
**Goal**: Achieve 95%+ Elena face similarity

**Setup**:
- Checkpoint: `bigLove_xl1.safetensors`
- LoRA: `elena_v4_cloud.safetensors` (1.0)
- InstantID: weight 0.85 (post-processing)
- Face ref: `elena_face_ref.jpg`
- Resolution: 832x1216
- Steps: 40, CFG: 3.0

**Result**: ✅ PASS
- Face similarity: ~95%
- Body: Excellent
- Skin: Natural, not over-saturated
- Grain: Still present (separate issue)

**Conclusion**: This is the current optimal setup

**Output**: `elena_biglove_nude_00001_.png` (1.1MB)

---

### Test: ImageSharpen Post-processing
**Date**: 2026-01-21  
**Goal**: Reduce grain in generated images

**Setup**:
- Input: `Elena_Hotel_Nude_00001_.png`
- Node: ImageSharpen

**Result**: ❌ FAIL
- Grain amplified instead of reduced
- Image quality degraded

**Conclusion**: Do NOT use ImageSharpen on grainy images. Try other methods.

**Output**: `quality_tests/test_sharpen_00001_.png`

---

### Test: 4x-UltraSharp Upscaler (Local)
**Date**: 2026-01-21  
**Goal**: Upscale images locally

**Setup**:
- Input: Generated Elena image
- Model: `4x-UltraSharp.pth`
- Platform: Mac M3 Pro

**Result**: ❌ ERROR
```
RuntimeError: view size is not compatible with input tensor's size and stride
```

**Conclusion**: Local Mac can't run these upscalers. Use RunPod.

---

### Test: 4x-UltraSharp Upscaler (RunPod)
**Date**: 2026-01-21  
**Goal**: Upscale images on cloud GPU

**Setup**:
- Input: Elena image 832x1216
- Model: `4x-UltraSharp.pth`
- GPU: RTX A5000

**Result**: ✅ PASS
- Output: 3328x4864 (4x)
- File size: 93MB
- Quality: Clean, no artifacts

**Conclusion**: RunPod works perfectly for upscaling

**Output**: `test1_upscale_4x_00001_.png`

---

### Test: High-res Generation (1024x1536)
**Date**: 2026-01-21  
**Goal**: Generate at higher resolution directly

**Setup**:
- Resolution: 1024x1536
- LoRA + SDXL Base
- Steps: 40, CFG: 3.5

**Result**: ✅ PASS
- Quality: Good
- File size: 2.2MB
- Grain: Present but acceptable

**Output**: `test4_highres_sharp_00001_.png`

---

### Test: InstantID + 4x Upscale Pipeline
**Date**: 2026-01-21  
**Goal**: Full quality pipeline on RunPod

**Setup**:
1. Generate 1024x1536 with LoRA + InstantID
2. Upscale 4x with UltraSharp

**Result**: ✅ PASS
- InstantID output: 2.7MB
- Final 4x output: 4096x6144, 34MB
- Face: 95% Elena
- Body: Excellent
- Quality: High

**Conclusion**: This is the production pipeline for quality images

**Output**: 
- `elena_instantid_00001_.png`
- `elena_instantid_4x_00001_.png`

---

### Test: BigLove vs SDXL Base Comparison
**Date**: 2026-01-21  
**Goal**: Compare checkpoint quality

**Setup**: Same prompt, same LoRA, different checkpoints

**Result**:
| Criteria | SDXL Base | BigLove XL |
|----------|-----------|------------|
| Colors | Colder/saturated | **More natural** ✅ |
| Skin | Correct | **More realistic** ✅ |
| Grain | Present | Present (similar) |
| Face | Good with InstantID | **Better** ✅ |

**Conclusion**: BigLove XL is the better checkpoint for Elena

---

## Pending Tests

| Test | Goal | Status |
|------|------|--------|
| CFG 2.0-2.5 | Reduce grain | ⏳ To do |
| Euler sampler | Compare quality | ⏳ To do |
| CodeFormer face restoration | Fix face details | ⏳ To do |
| Network Dim 64 training | Better face learning | ⏳ To do |
| Rare trigger word ("sks") | Better identity | ⏳ To do |
| Face-only LoRA | Specialized face model | ⏳ To do |
