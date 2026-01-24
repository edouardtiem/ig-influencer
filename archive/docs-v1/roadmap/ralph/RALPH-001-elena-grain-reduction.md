# RALPH-TASK: Elena Grain Reduction - Refiner Pass

> Archive: `roadmap/ralph/RALPH-001-elena-grain-reduction.md`

## Overview
Réduire le grain dans les images Elena générées sur RunPod en ajoutant un refiner pass et en optimisant les paramètres (CFG, denoise).

## Success Criteria
- [ ] Image générée sans grain visible (ou significativement réduit)
- [ ] Qualité visage maintenue (InstantID toujours actif)
- [ ] Couleurs naturelles préservées (BigLove XL)

## Context
- **Checkpoint**: BigLove XL (SDXL-based, 6.5GB)
- **Problème actuel**: Grain visible malgré prompts "no grain"
- **Cause identifiée**: CFG trop bas (3.0) + pas de refiner pass
- **Solution**: CFG 7 + double KSampler (refiner sur latent)

## Tasks

### 1. Créer pod RunPod
**Priority**: HIGH
**Status**: PENDING
**Acceptance Criteria**:
- [ ] Pod créé avec GPU (RTX A5000 ou équivalent)
- [ ] SSH accessible

**Notes**: Utiliser `node app/scripts/runpod-quality-tests.mjs create`

---

### 2. Setup ComfyUI + modèles
**Priority**: HIGH
**Status**: PENDING
**Acceptance Criteria**:
- [ ] ComfyUI installé et running (port 8188)
- [ ] torch >= 2.4.0 (fix comfy_kitchen)
- [ ] BigLove XL uploadé dans `/workspace/ComfyUI/models/checkpoints/`
- [ ] Elena LoRA uploadé dans `/workspace/ComfyUI/models/loras/`
- [ ] InstantID models téléchargés (ip-adapter.bin, instantid_controlnet.safetensors)
- [ ] InsightFace antelopev2 models téléchargés
- [ ] Face reference uploadée dans `/workspace/ComfyUI/input/`

**Notes**: BigLove = 6.5GB, prévoir ~10 min upload

---

### 3. Générer avec workflow optimisé (Refiner Pass)
**Priority**: HIGH
**Status**: PENDING
**Acceptance Criteria**:
- [ ] Workflow exécuté sans erreur
- [ ] Image sauvegardée dans output/quality_tests/

**ComfyUI Workflow Order (CRITICAL)**:
```
Node 1:  CheckpointLoaderSimple (bigLove_xl1.safetensors)
         → outputs: model, clip, vae

Node 2:  LoraLoader (elena_v4_cloud.safetensors, strength 1.0)
         → inputs: model[1,0], clip[1,1]
         → outputs: model, clip

Node 3:  InstantIDModelLoader (ip-adapter.bin)
         → outputs: instantid

Node 4:  InstantIDFaceAnalysis (provider: CUDA)
         → outputs: insightface

Node 5:  LoadImage (elena_face_ref.jpg)
         → outputs: image

Node 6:  ControlNetLoader (instantid_controlnet.safetensors)
         → outputs: controlnet

Node 7:  CLIPTextEncode (POSITIVE prompt)
         → inputs: clip[2,1]
         → outputs: conditioning

Node 8:  CLIPTextEncode (NEGATIVE prompt)
         → inputs: clip[2,1]
         → outputs: conditioning

Node 9:  ApplyInstantID (weight 0.85)
         → inputs: instantid[3,0], insightface[4,0], controlnet[6,0],
                   image[5,0], model[2,0], positive[7,0], negative[8,0]
         → outputs: model, positive, negative

Node 10: EmptyLatentImage (832x1216, batch 1)
         → outputs: latent

Node 11: KSampler #1 - MAIN GENERATION
         → inputs: model[9,0], positive[9,1], negative[9,2], latent[10,0]
         → params: steps=30, CFG=7.0, sampler=dpmpp_2m, scheduler=karras, denoise=0.8
         → outputs: latent (noisy)

Node 12: KSampler #2 - REFINER PASS
         → inputs: model[9,0], positive[9,1], negative[9,2], latent[11,0]
         → params: steps=15, CFG=7.0, sampler=dpmpp_2m, scheduler=karras, denoise=0.25
         → outputs: latent (refined, less grain)

Node 13: VAEDecode
         → inputs: samples[12,0], vae[1,2]
         → outputs: image

Node 14: SaveImage (filename_prefix: quality_tests/elena_refiner)
         → inputs: images[13,0]
```

**Prompts**:
- Positive: `elena, fully nude, completely naked, bare breasts, nipples visible, beautiful woman, 24 year old Italian woman, natural lighting, realistic skin tones, raw photo, smooth skin, clean image, oval face, honey brown hazel eyes, bronde hair, sun-kissed skin, natural breasts, athletic curvy body, lying on white bed sheets, bedroom, masterpiece, best quality, photorealistic, sharp focus, high detail`
- Negative: `clothes, underwear, grainy, noisy, film grain, artifacts, oversaturated, orange skin, worst quality, low quality, blurry, cartoon, anime, plastic skin, deformed`

---

### 4. Télécharger et évaluer résultat
**Priority**: HIGH
**Status**: PENDING
**Acceptance Criteria**:
- [ ] Image téléchargée localement dans `output/runpod-quality-tests/`
- [ ] Comparaison visuelle avec image précédente (grain réduit ?)
- [ ] Qualité visage maintenue

---

### 5. Terminer pod
**Priority**: HIGH
**Status**: PENDING
**Acceptance Criteria**:
- [ ] Pod terminé (pas juste pause)
- [ ] Confirmation via API qu'aucun pod actif

---

### 6. Documenter résultats
**Priority**: MEDIUM
**Status**: PENDING
**Acceptance Criteria**:
- [ ] Session doc mise à jour avec résultats
- [ ] Comparaison avant/après documentée
- [ ] Paramètres optimaux notés si succès

---

## Constraints
- Budget RunPod: Minimiser temps d'utilisation
- Upload BigLove: ~10 min (6.5GB)
- Workflow order: Refiner DOIT travailler sur latent, pas image

## Exit Conditions
- Image générée avec grain significativement réduit
- OU identification claire de la prochaine piste si échec
- Pod terminé
- Documentation à jour
