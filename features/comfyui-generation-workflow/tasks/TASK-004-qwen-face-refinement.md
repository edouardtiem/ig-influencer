# TASK-004: Qwen Face Refinement

**Status**: 🟡 In Progress (RunPod ready, Qwen not tested yet)
**Created**: 23 January 2026
**Feature**: [ComfyUI Generation](../README.md)

---

## Goal

Améliorer la précision du visage d'Elena de 85% à 95%+ en utilisant Qwen2.5-VL pour du face refinement intelligent post-génération.

---

## Approach

1. Démarrer pod RunPod avec GPU 24GB+ (RTX 4090, A5000, ou A6000)
2. Installer ComfyUI + ComfyUI-QwenVL custom nodes
3. Télécharger Qwen2.5-VL-7B-Instruct (GGUF, ~8GB)
4. Créer workflow : Image → Mask visage → Qwen edit → Output
5. Tester avec instruction : "Improve face details, keep identity"

---

## Requirements

- **GPU**: 24GB+ VRAM (Qwen 7B + ComfyUI)
- **RunPod**: Stable (actuellement en maintenance)
- **Models**: Qwen2.5-VL-7B-Instruct-GGUF

---

## Progress Log

### 24 Jan 2026
- RunPod fonctionne à nouveau ✅
- Pod RTX 4090 configuré avec workflow Elena complet
- Modèles installés : SDXL Base, Elena LoRA, IP-Adapter FaceID, CLIP Vision
- Test génération réussi (~24s vs 5min local)
- **Manque** : BigLove XL (CivitAI token requis), Qwen pas encore installé/testé
- **Next** : Installer Qwen2.5-VL sur le pod et tester face refinement

### 23 Jan 2026
- Recherche Perplexity effectuée sur Qwen2.5-VL setup
- RunPod en maintenance réseau → impossible de démarrer les pods
- Pods créés (`elena-comfyui-4090`, `elena-comfyui-qwen`) mais bloqués
- Pods stoppés pour éviter les frais
- **Blocker**: Attendre que RunPod soit stable

---

## Resources

- Perplexity search: `docs/perplexity-searches/2026-01-23-1608.qwen25-vl-image-edit-comfyui-setup-workflow-2025-2.md`
- ComfyUI-QwenVL: https://github.com/ceruleandeep/ComfyUI-QwenVL

---

## Outcome

_Fill when task is complete, then rename file to DONE-004-qwen-face-refinement.md_
