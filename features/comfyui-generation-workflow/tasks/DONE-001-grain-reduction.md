# DONE-001: Grain Reduction

**Status**: ✅ Done
**Created**: 23 January 2026
**Completed**: 23 January 2026
**Feature**: [ComfyUI Generation](../README.md)

---

## Goal

Reduce visible grain/noise in generated images while maintaining detail and skin texture quality.

---

## Approach

1. Test lower CFG values (2.0-2.5 instead of 3.0-3.5)
2. Test alternative samplers (`euler`, `dpmpp_3m_sde`)
3. Avoid ImageSharpen (known to amplify grain)

---

## Progress Log

### 23 Jan 2026
- Task created from existing "Next Steps"
- Current CFG: 3.0-3.5 produces noticeable grain
- ImageSharpen tested → makes it worse

### 23 Jan 2026 (evening)
- Simplified workflow tested with:
  - CFG **4.0** (down from 7.0)
  - Sampler **dpmpp_2m_sde** 
  - LoRA weight **0.7** (down from 1.0)
  - 4x-UltraSharp upscale
  - Single IP-Adapter FaceID (removed style adapter)
- **Result**: Grain significantly reduced, body consistency and image quality now excellent

---

## Outcome

**Solution found**: CFG 4.0 + dpmpp_2m_sde sampler + LoRA 0.7 + 4x-UltraSharp upscale

Key insights:
- Lower CFG (4.0) is better for SDXL-based models
- LoRA at 1.0 was too strong, 0.7 gives more flexibility
- 4x-UltraSharp adds detail and reduces noise perception
- Dual IP-Adapter was unnecessary complexity

New script: `app/scripts/elena-simple-test.mjs`

---

## Ralph Sessions

### 23 Jan 2026 — COMPLETED
**Original**: `roadmap/ralph/RALPH-001-elena-grain-reduction.md` (archived)
**Summary**: Reduced grain in Elena images by optimizing CFG, sampler, and LoRA weight. Found optimal settings: CFG 4.0 + dpmpp_2m_sde + LoRA 0.7.

**Files Modified**:
- `app/scripts/elena-simple-test.mjs` — Created simplified workflow script
- `features/comfyui-generation-workflow/README.md` — Updated configuration
