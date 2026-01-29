# TASK-009: Z-Image Skin Quality Test (Vast.ai Pivot)

**Status**: 🟡 In Progress
**Created**: 2026-01-29
**Feature**: [ComfyUI Generation Workflow](../README.md)

---

## Goal

Test Z-Image Full model for realistic skin quality. Originally planned for local Mac, pivoted to **Vast.ai** after RunPod platform-wide failures.

---

## Acceptance Criteria

- [x] Z-Image Full model downloaded (12.3GB)
- [x] Basic test generation works on Vast.ai RTX 4090
- [x] Skin quality assessment: **EXCELLENT** - natural texture, pores, freckles
- [ ] Elena face reference generation (IP-Adapter FaceID)
- [ ] NSFW generation test
- [ ] Document final comparison with BigLove XL

---

## Approach

1. Install ComfyUI via git clone
2. Create Python virtual environment
3. Install dependencies with MPS support
4. Download Z-Image-Turbo from HuggingFace
5. Launch ComfyUI with --force-fp16 for memory efficiency
6. Create simple workflow JSON for testing
7. Generate test image and evaluate skin quality

---

## Files Involved

- `~/comfyui/` — Local ComfyUI installation (outside project)
- `app/scripts/elena-z-image-test.mjs` — Can reuse workflow logic
- Local models: `~/comfyui/models/checkpoints/z-image-turbo.safetensors`

---

## Constraints

- **Memory**: 18GB unified memory (tight for large models)
- **Speed**: ~60-90s per image (vs ~5-10s on RTX 4090)
- **MPS backend**: Some ComfyUI nodes may not work on Mac
- **Purpose**: Testing only - production stays on RunPod

---

## Technical Details

**ComfyUI Mac Installation:**
```bash
git clone https://github.com/comfyanonymous/ComfyUI.git ~/comfyui
cd ~/comfyui
python3 -m venv venv
source venv/bin/activate
pip install torch torchvision torchaudio
pip install -r requirements.txt
```

**Z-Image-Turbo Download:**
```bash
cd ~/comfyui/models/checkpoints
wget https://huggingface.co/Tongyi-MAI/Z-Image-Turbo/resolve/main/z-image-turbo.safetensors
```

**Launch Command:**
```bash
python main.py --force-fp16 --preview-method auto
```

**Test Parameters:**
- Model: z-image-turbo.safetensors
- Steps: 8
- CFG: 4.0
- Sampler: dpmpp_sde
- Scheduler: karras
- Resolution: 1024x1024

---

## Progress Log

### 2026-01-29 - Session 1 (Vast.ai Pivot)

**RunPod Issues:**
- Tried 6+ GPU types (RTX 4090, 3090, A5000, A6000)
- Tried 6+ datacenters (US-TX-3, EUR-IS-1, EU-NL-1, etc.)
- All pods stuck at "RUNNING" with `runtime: null`
- Perplexity search confirmed platform-wide container runtime issue

**Local Mac Attempt:**
- ComfyUI already installed with MPS support
- Downloaded Z-Image Full (12.3GB) - too large for 18GB unified memory
- Generation started but extremely slow (~5+ min for 3%)

**Vast.ai Pivot (SUCCESS!):**
- Created Vast.ai account, got $5 signup credit
- RTX 4090 at **$0.14/hr** (vs RunPod $0.34/hr)
- Instance started successfully in Ukraine datacenter
- Installed ComfyUI + Z-Image models via SSH

**First Test Result:**
- Generated `z_image_skin_test.png` in **34 seconds**
- **Skin quality: AMAZING** - natural pores, freckles, film grain
- NOT plastic/airbrushed like FLUX

**Elena Face Reference (IN PROGRESS):**
- Installed IP-Adapter Plus custom node
- Downloaded CLIP Vision H (2.4GB) and IP-Adapter FaceID model
- Hit InsightFace model path issue - needs buffalo_l in correct location
- **Stopped session to save costs**

---

## Resume Instructions

To restart this session:

```bash
# 1. Create new Vast.ai RTX 4090 instance
#    API Key: (in .env.local as VAST_API_KEY)
#    Image: runpod/pytorch:2.4.0-py3.11-cuda12.4.1-devel-ubuntu22.04
#    Disk: 50GB

# 2. SSH in and clone ComfyUI
ssh -p PORT root@sshX.vast.ai
cd /workspace
git clone https://github.com/comfyanonymous/ComfyUI.git comfyui
cd comfyui && pip install -r requirements.txt

# 3. Download models
mkdir -p models/diffusion_models models/text_encoders models/vae
wget -O models/diffusion_models/z_image_bf16.safetensors "https://huggingface.co/Comfy-Org/z_image/resolve/main/split_files/diffusion_models/z_image_bf16.safetensors"
wget -O models/text_encoders/qwen_3_4b.safetensors "https://huggingface.co/Comfy-Org/z_image_turbo/resolve/main/split_files/text_encoders/qwen_3_4b.safetensors"
wget -O models/vae/ae.safetensors "https://huggingface.co/Comfy-Org/z_image_turbo/resolve/main/split_files/vae/ae.safetensors"

# 4. Install IP-Adapter for face reference
cd custom_nodes
git clone https://github.com/cubiq/ComfyUI_IPAdapter_plus.git
pip install insightface onnxruntime
# Download InsightFace buffalo_l to ~/.insightface/models/buffalo_l/

# 5. Launch ComfyUI
cd /workspace/comfyui
python main.py --listen 0.0.0.0 --port 8188
```

**Next Steps:**
1. Fix InsightFace buffalo_l model path
2. Run Elena face reference test with IP-Adapter FaceID
3. Test NSFW generation (no content filter on self-hosted)
4. Compare quality with BigLove XL

---

## Outcome

**Partial Success:**
- Z-Image Full produces **excellent natural skin** (better than FLUX)
- Vast.ai is a reliable RunPod alternative ($0.14/hr RTX 4090)
- Face reference test pending (IP-Adapter setup incomplete)

**Test Image:**
- `z_image_skin_test.png` saved to project root
- Shows natural skin texture, pores, freckles - NOT plastic

---

## Key Findings

| Model | Skin Quality | Speed | Notes |
|-------|--------------|-------|-------|
| **Z-Image Full** | ✅ Natural, realistic | 34s (RTX 4090) | Best so far |
| FLUX.1 [dev] | ❌ Plastic, airbrushed | ~30s | Rejected |
| FLUX.2 Klein 9B | ❌ AI-clean look | ~10s | Rejected |
| BigLove XL | ✅ Natural | ~50s | Current baseline |

---

## Vast.ai vs RunPod

| Aspect | Vast.ai | RunPod |
|--------|---------|--------|
| Price (RTX 4090) | $0.14/hr | $0.34/hr |
| Availability | ✅ Works | ❌ Platform issues (Jan 2026) |
| SSH Access | ✅ Direct | Via proxy |
| Reliability | Good (98%+) | Issues this week |

---

## Ralph Sessions

### 2026-01-29 — IN PROGRESS
**Summary**: Pivoted to Vast.ai after RunPod failures. Z-Image skin test successful, face reference pending.

**Files Modified**:
- `z_image_skin_test.png` — Test output (amazing skin quality)
- `docs/perplexity-searches/` — RunPod issues research, alternatives research
