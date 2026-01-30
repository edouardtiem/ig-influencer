# TASK-010: Fix Z-Image Omni Face Reference

**Status**: 🟡 In Progress
**Created**: 2026-01-30
**Feature**: [ComfyUI Generation Workflow](../README.md)

---

## Goal

Systematically test all TextEncodeZImageOmni configurations to achieve working face reference with Elena's identity preserved in Z-Image Full generations.

---

## Background

- Z-Image Full NSFW generation works (uncensored)
- TextEncodeZImageOmni node has `image1`, `image2`, `image3` inputs for face reference
- Previous attempts with `<image1>` prompt syntax produced corrupted/artifact outputs
- VAE connection also produced corruption (pixelated) - **DO NOT RETRY**
- Perplexity searches confirm face reference SHOULD work with Z-Image Omni

---

## Test Options Matrix

| Option | Description | Prompt Syntax | CLIP Vision | Image Input | Notes |
|--------|-------------|---------------|-------------|-------------|-------|
| A | No prompt ref, just image1 | Generic portrait prompt | ❌ None | image1 | Let model auto-detect |
| B | "reference image" wording | "the woman in the reference image" | ❌ None | image1 | Natural language ref |
| C | "image one" (spelled out) | "the woman from image one" | ❌ None | image1 | Per Perplexity docs |
| D | CLIP Vision encoder | `<image1>` | ✅ Connected | image1 | Full pipeline |
| E | CLIP Vision no prompt ref | Generic prompt | ✅ Connected | image1 | CLIP does the work |
| F | Multiple images | "face from image1, pose from image2" | ❌ None | image1 + image2 | Multi-ref test |
| G | Lower CFG (2.0-2.5) | `<image1>` | ❌ None | image1 | Reduce artifacts |
| H | Portrait resolution | `<image1>` | ❌ None | image1 | 768x1152 not square |

---

## Acceptance Criteria

- [x] Option A tested and image saved
- [x] Option B tested and image saved
- [x] Option C tested and image saved
- [x] Option D tested and image saved (with CLIP Vision) — ERROR: shape mismatch
- [x] Option E tested and image saved — SKIPPED (same CLIP Vision incompatibility)
- [x] Option F tested and image saved (multi-image)
- [x] Option G tested and image saved (low CFG)
- [x] Option H tested and image saved (portrait resolution)
- [x] All test images downloaded to `features/comfyui-generation-workflow/tests/zimage-face-ref-options/`
- [x] Summary comparison table created with results
- [x] Working configuration identified (if any) — **NONE WORK**
- [ ] ~~If face ref works, test with NSFW prompt~~ — N/A, no working config found

---

## Test Image Naming Convention

```
option-A-no-prompt-ref.png
option-B-reference-image-wording.png
option-C-image-one-spelled.png
option-D-clip-vision-full.png
option-E-clip-vision-no-ref.png
option-F-multi-image.png
option-G-low-cfg.png
option-H-portrait-resolution.png
```

---

## Technical Details

### Pod Connection
- SSH: `ssh -p 18094 root@ssh2.vast.ai`
- ComfyUI: localhost:8188 via tunnel
- GPU: RTX 3090 24GB (Hungary)

### Models Available
- UNet: `z_image_bf16.safetensors` (Z-Image Full)
- CLIP: `qwen_3_4b.safetensors` (type: lumina2)
- VAE: `ae.safetensors`

### Elena Reference Image
- Location on pod: `/workspace/comfyui/input/elena_face_ref_1024.png`
- Resolution: 1024x1024 (already resized)

### Base Workflow Settings
- Steps: 30
- CFG: 4.0 (except Option G)
- Sampler: euler
- Scheduler: normal
- Resolution: 1024x1024 (except Option H)

### Output Folder (Local)
```
features/comfyui-generation-workflow/tests/zimage-face-ref-options/
```

---

## Files Involved

- Pod workflows: `/workspace/comfyui/workflows/option_*.json`
- Test outputs: `features/comfyui-generation-workflow/tests/zimage-face-ref-options/*.png`
- This task: `features/comfyui-generation-workflow/tasks/TASK-010-zimage-face-reference-fix.md`

---

## Constraints

- DO NOT test VAE connection (already failed with pixelation)
- Use same seed (42) across all tests for fair comparison
- Download each test image before proceeding to next
- Stop early if a working option is found

---

## Progress Log

### 2026-01-30
- Task created
- Test options matrix defined (A through H)
- Local folder created for test images

### 2026-01-30 - Ralph Iteration 1-8
- **Working on**: All 8 test options (A through H)
- **Actions**: Created and executed workflows for each option, downloaded results
- **Results**:

| Option | Result | Description |
|--------|--------|-------------|
| A | ❌ CORRUPTED | Wavy line artifacts, face distorted |
| B | ❌ CORRUPTED | Horizontal line artifacts, not Elena |
| C | ❌ CORRUPTED | Grid/noise overlay, face distorted |
| D | ❌ ERROR | CLIP Vision shape mismatch (incompatible architecture) |
| E | ⏭️ SKIPPED | Same CLIP Vision incompatibility |
| F | ❌ CORRUPTED | Text watermarks ("GBAMBFIND"), split image, Asian faces |
| G | ❌ CORRUPTED | Text artifact "image1" visible, Asian woman |
| H | ❌ CORRUPTED | Text watermarks all over, fashion show style |

- **Problems**:
  - TextEncodeZImageOmni image1/image2/image3 inputs cause severe corruption regardless of prompt syntax
  - CLIP Vision encoder incompatible with Z-Image architecture (shape mismatch error)
  - All prompt variations produce artifacts: `<image1>`, "reference image", "image one" spelled out
  - Low CFG (2.0) reduces but doesn't eliminate corruption
  - Portrait resolution doesn't help
- **Conclusion**: **Z-Image Omni face reference is BROKEN** - the TextEncodeZImageOmni node's image inputs don't work correctly with this model

---

## Outcome

### Which option(s) worked: **NONE**

All 8 TextEncodeZImageOmni configurations failed:
- Options A, B, C, F, G, H: Severe visual corruption (artifacts, text watermarks, wrong faces)
- Options D, E: CLIP Vision architecture incompatibility error

### Best configuration found: **N/A**

Z-Image Full's TextEncodeZImageOmni face reference feature appears to be broken or requires a specific configuration not documented.

### Whether NSFW + face ref is achievable with Z-Image: **NO**

- Z-Image Full NSFW text-to-image: ✅ Works
- Z-Image Full face reference: ❌ Does not work
- Z-Image Full NSFW + face ref: ❌ Not achievable

### Recommended alternatives:
1. **SD3.5 + IP-Adapter FaceID** - Proven face conditioning, local weights available
2. **Post-generation face swap** - Generate NSFW with Z-Image, swap face after with ReActor
3. **Img2img with low denoise** - Preserves Elena but can't change pose/scene dramatically

---

## Ralph Sessions

### 2026-01-30 — COMPLETED
**Iterations**: 9
**Summary**: Systematically tested 8 TextEncodeZImageOmni configurations. All failed with corruption or errors. Z-Image Omni face reference is confirmed broken.

**Problems Encountered**:
- All image1 input variations → visual corruption (wavy lines, text artifacts, wrong faces)
- CLIP Vision → architecture incompatibility (shape mismatch error)

**Decisions Made**:
- Marked CLIP Vision options D/E as incompatible after D failed with shape error
- Tested all remaining options despite early failures to be thorough

**Files Modified**:
- `features/comfyui-generation-workflow/tests/zimage-face-ref-options/*.png` — 7 test images saved
- `features/comfyui-generation-workflow/tasks/TASK-010-zimage-face-reference-fix.md` — this file
