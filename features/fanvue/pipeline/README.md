# Fanvue Pipeline

> Automated workflow: BigLust generation → Face crop → Validation → Fanvue upload

**Status**: 📋 Planned (TODO-018)  
**Last updated**: 23 January 2026

---

## Current State

Pipeline is **designed but not implemented**. Currently:
- Face cropping is manual
- Upload to vaults is manual
- No PPV tracking

---

## Planned Architecture

```
1. GENERATION (ComfyUI/BigLust)
        ↓
2. CROP (MediaPipe) — Auto-crop face
        ↓
3. VALIDATION — Human review folder
        ↓
4. UPLOAD (Fanvue API) — To vault
        ↓
5. TRACKING (Supabase) — Avoid duplicates
```

### Planned Folder Structure

```
~/elena-content-pipeline/
├── 1_raw/              # Raw images from ComfyUI
├── 2_cropped/          # After auto-crop
├── 3_review/           # Human validation
├── 4_approved/         # Ready for upload
├── 5_uploaded/         # Already on Fanvue
└── rejected/           # Rejected images
```

---

## Implementation Phases

### Phase 1: MediaPipe Face Crop (~2h)
- [ ] Python script `auto-crop-face.py`
- [ ] MediaPipe Face Mesh (468 landmarks)
- [ ] Options: `no_face`, `lips_only`, `chin`

### Phase 2: Folder Structure + Watcher (~1h)
- [ ] Create folder structure
- [ ] Node.js watcher for `~/ComfyUI/output/`
- [ ] Auto-trigger crop script

### Phase 3: Supabase Table (~30min)
- [ ] Create `elena_content` table
- [ ] Track status, vault, PPV sales

### Phase 4: Upload Script (~2h)
- [ ] `upload-to-fanvue.mjs`
- [ ] Vault management
- [ ] Supabase metadata save

### Phase 5: CLI (~1h)
- [ ] `elena-pipeline.mjs`
- [ ] Commands: `crop`, `upload`, `status`

---

## Vault System

| Vault | Usage | Content |
|-------|-------|---------|
| `elena-feed` | Feed posts | "Free" for subscribers |
| `elena-ppv` | PPV messages | Paid content in DMs |
| `elena-archive` | Already used | Track what's been sent |

---

## Why MediaPipe?

- 100% local (no cloud censorship of NSFW)
- Fast (~20ms/image)
- Precise (468 facial landmarks)
- Can crop at different levels

---

## Quick Links

- [Design Session →](./sessions/2026-01-19-biglust-fanvue-workflow-design.md)
- [ComfyUI Generation →](../../comfyui-generation-workflow/)
