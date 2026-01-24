# TASK-004: Qwen Face Refinement

**Status**: 🟡 In Progress (testing phase)
**Created**: 23 January 2026
**Feature**: [ComfyUI Generation](../README.md)

---

## Goal

Améliorer la précision du visage d'Elena de 85% à 95%+ en utilisant Qwen pour du face refinement intelligent.

---

## Key Finding (Perplexity 24 Jan)

**Important distinction:**
- **Qwen2.5-VL** (installé) = VLM pour analyser/décrire images, PAS pour éditer
- **Qwen-Image-Edit** = modèle d'édition d'images (différent)

**Workflow recommandé:**
```
SDXL → QwenEdit (face) → FaceDetailer → IP-Adapter → Output
```

**Options:**
1. Utiliser QwenVL pour générer des prompts améliorés pour FaceDetailer
2. Installer Qwen-Image-Edit (modèle séparé) pour édition directe

---

## Approach (Updated)

### Option A: QwenVL Prompt Enhancement
1. ✅ ComfyUI-QwenVL installé
2. ✅ Qwen2.5-VL-7B téléchargé
3. Créer workflow: Image → QwenVL (analyze) → Generate better FaceDetailer prompt
4. Tester si les prompts améliorés donnent de meilleurs visages

### Option B: Qwen-Image-Edit (Direct Editing) ✅ READY
1. ✅ ComfyUI-GGUF installé
2. ✅ `qwen-image-edit-2511-Q4_K_M.gguf` téléchargé (12.3GB)
3. Workflow: SDXL → QwenEdit (face mask) → FaceDetailer → Output
4. Settings: Steps 8, Denoise 0.6-0.75, Ref strength 0.8

---

## Acceptance Criteria

- [ ] Visage Elena reconnaissable à 95%+ (vs 85% actuel)
- [ ] Workflow fonctionnel et reproductible
- [ ] Temps de génération < 60s par image
- [ ] Documentation du workflow choisi

---

## Requirements

- **GPU**: RTX 4090 24GB ✅
- **RunPod**: Volume persistant `elena-comfyui` ✅
- **Installed**: ComfyUI-QwenVL, Qwen2.5-VL-7B-Instruct ✅
- **Installed**: ComfyUI-GGUF, qwen-image-edit-2511-Q4_K_M.gguf ✅

---

## Progress Log

### 24 Jan 2026 (Session 4)
- ComfyUI-GGUF installé ✅
- qwen-image-edit-2511-Q4_K_M.gguf téléchargé (12.3GB) ✅
- Nodes GGUF disponibles: UnetLoaderGGUF, CLIPLoaderGGUF, etc. ✅
- **Infrastructure complète** - prêt pour tests
- Espace utilisé: ~40GB / 50GB sur volume
- **Next**: Créer workflow de test avec Qwen-Image-Edit

### 24 Jan 2026 (Session 3)
- Recherche Perplexity sur workflow optimal ✅
- **Découverte clé**: Qwen2.5-VL = VLM (analyse), pas édition d'images
- **Option A**: Utiliser QwenVL pour prompt enhancement → FaceDetailer
- **Option B**: Installer Qwen-Image-Edit pour édition directe
- Workflow recommandé: SDXL → QwenEdit → FaceDetailer → IP-Adapter

### 24 Jan 2026 (Session 2)
- ComfyUI-QwenVL installé sur pod persistent ✅
- Qwen2.5-VL-7B-Instruct téléchargé (16GB) ✅
- Cache HuggingFace sur volume : `/workspace/huggingface_cache` ✅
- startup.sh mis à jour avec `HF_HOME` ✅
- Espace total utilisé : ~28GB / 50GB

### 24 Jan 2026 (Session 1)
- RunPod fonctionne à nouveau ✅
- Pod RTX 4090 configuré avec workflow Elena complet
- Modèles installés : SDXL Base, Elena LoRA, IP-Adapter FaceID, CLIP Vision
- Test génération réussi (~24s vs 5min local)
- **Manque** : BigLove XL (CivitAI token requis)

### 23 Jan 2026
- Recherche Perplexity effectuée sur Qwen2.5-VL setup
- RunPod en maintenance réseau → impossible de démarrer les pods
- Pods créés (`elena-comfyui-4090`, `elena-comfyui-qwen`) mais bloqués
- Pods stoppés pour éviter les frais
- **Blocker**: Attendre que RunPod soit stable

---

## Next Steps (Tests à faire)

### 1. Charger le workflow CivitAI
- Ouvrir ComfyUI: https://vm0e18rm4w72xr-8188.proxy.runpod.net
- Charger `Qwen Image Edit Workflow.json` (dans ~/Downloads)
- Vérifier que tous les nodes se connectent

### 2. Configurer le workflow
- Node `UnetLoaderGGUF` → sélectionner `qwen-image-edit-2511-Q4_K_M.gguf`
- Ajouter image Elena comme input
- Prompt: "Improve face details, maintain identity, photorealistic skin texture"

### 3. Test initial
- Générer une image Elena avec le workflow actuel (sans Qwen)
- Passer cette image dans Qwen-Image-Edit pour refinement
- Comparer avant/après

### 4. Intégrer dans pipeline complet
- Workflow: SDXL → IP-Adapter FaceID → Qwen-Image-Edit → FaceDetailer → Output
- Settings recommandés:
  - Qwen: Steps 8, Denoise 0.6-0.75
  - FaceDetailer: CFG 4-6, Steps 20-25

### 5. Mesurer résultats
- Comparer reconnaissance faciale avant/après
- Mesurer temps de génération (objectif < 60s)
- Documenter le workflow final

---

## Resources

- Perplexity search (setup): `docs/perplexity-searches/2026-01-23-1608.qwen25-vl-image-edit-comfyui-setup-workflow-2025-2.md`
- Perplexity search (workflow): `docs/perplexity-searches/2026-01-24-1034.comfyui-qwenvl-qwen25-vl-face-refinement-workflow.md`
- ComfyUI-QwenVL: https://github.com/1038lab/ComfyUI-QwenVL
- Qwen-Image-Edit: https://unsloth.ai/docs/models/qwen-image-2512
- ThinkDiffusion FaceDetailer: https://learn.thinkdiffusion.com/comfyui-face-detailer/

---

## Outcome

_Fill when task is complete, then rename file to DONE-004-qwen-face-refinement.md_
