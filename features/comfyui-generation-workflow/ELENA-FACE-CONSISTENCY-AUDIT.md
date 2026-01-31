# AUDIT: Elena Face Consistency Project
**Date**: 2026-01-31
**Objectif**: Générer des images d'Elena avec un visage cohérent et réaliste

---

## RESUME EXECUTIF

Après une semaine d'expérimentations intensives, nous avons trouvé une solution qui fonctionne à **95% de similarité** avec BigLove XL + InstantID post-processing. Cependant, nous cherchions à améliorer avec Z-Image pour une meilleure qualité de peau, ce qui s'est avéré beaucoup plus complexe que prévu.

### Statut actuel (Mis à jour 2026-01-31 13:15)
- **BigLove XL**: FONCTIONNE (95% similarité) - qualité peau moyenne
- **Z-Image Full**: ✅ **FONCTIONNE** - Modèle officiel 12.3GB génère des portraits haute qualité
- **Elena LoRA v2**: ❌ INCOMPATIBLE - Architecture différente (ostris vs Comfy-Org)

---

## 1. CE QUI FONCTIONNE (Validé)

### 1.1 BigLove XL + InstantID (Solution actuelle)

| Composant | Configuration | Résultat |
|-----------|--------------|----------|
| Checkpoint | BigLove XL1 (CivitAI 897413) | Couleurs naturelles, bonne qualité |
| LoRA Elena v4 | Weight 0.7 | Corps excellent, visage 85% |
| IP-Adapter FaceID v2 | Weight 0.85 | Améliore similarité |
| InstantID post-process | Weight 0.85 | **95% similarité finale** |
| Sampler | dpmpp_2m_sde | Réduit le grain |
| CFG | 4.0 | Couleurs naturelles |
| Upscale | 4x-UltraSharp | 4096x6144 |

**Scripts fonctionnels**:
- `app/scripts/elena-simple-test.mjs` (recommandé)
- `app/scripts/elena-instantid-test.mjs`
- `app/scripts/elena-biglove-batch.mjs`

### 1.2 LoRA Elena Training

| Version | Statut | Résultat |
|---------|--------|----------|
| v1 | Echec | Captions génériques, pas de trigger token |
| v2 | Echec | NaN loss avec fp16 |
| v3 | Echec | NaN loss avec fp16 |
| v4 (bf16) | **Succès** | Loss 0.116, corps excellent, visage 85% |

**Leçons apprises**:
- **bf16 obligatoire** (fp16 cause NaN loss)
- Trigger token "elena" important
- 1500 steps suffisent pour bf16
- Corps s'apprend bien, visage difficile

---

## 2. CE QUI NE FONCTIONNE PAS

### 2.1 Z-Image Face Reference (ECHEC TOTAL)

Testé les 8 configurations possibles dans `TASK-010`:

| Option | Méthode | Résultat |
|--------|---------|----------|
| A | image2 sans prompt | Lignes ondulées |
| B | "reference image" wording | Lignes horizontales |
| C | "image one" spelled | Grille/bruit |
| D | image1 + text in prompt | Erreur |
| E | cfg_guidance_start_end | Erreur |
| F | Multi-image | Watermarks texte |
| G | Low CFG 1.5 | Artefact "image1" |
| H | Portrait 768x1024 | Watermarks |

**Conclusion**: TextEncodeZImageOmni est cassé/incompatible pour la face reference.

### 2.2 Z-Image Workflow — **RÉSOLU** ✅

**Problème initial**: Génère QR code ou image noire au lieu d'images

**CAUSE RACINE IDENTIFIÉE**: Mauvais fichier modèle!
- Ancien modèle: 7.9GB (source inconnue/mingyi456)
- Modèle officiel: **12.3GB** (Comfy-Org/z_image HuggingFace)

**Solution**: Télécharger le modèle officiel de https://huggingface.co/Comfy-Org/z_image

### Configuration Z-Image FONCTIONNELLE

```
UNETLoader: z_image_bf16.safetensors (12.3GB, OFFICIEL)
CLIPLoader: qwen_3_4b_bf16.safetensors, type="lumina2"
VAELoader: ae.safetensors
ModelSamplingAuraFlow: shift=3.0
KSampler: sampler="res_multistep", scheduler="simple", steps=25, cfg=4.0
EmptySD3LatentImage: 1024x1024
```

**Résultat**: Portraits haute qualité avec texture de peau réaliste

### 2.3 Elena LoRA v2 — INCOMPATIBLE

- LoRA entraînée sur **ostris/Z-Image-De-Turbo**
- Architecture différente: `diffusion_model.layers.*` vs `context_refiner.*`
- **Ne fonctionne PAS** avec Comfy-Org Z-Image Full
- Besoin de réentraîner la LoRA sur le modèle officiel

### 2.3 FLUX (Rejeté définitivement)

Testé et rejeté à cause de la texture "peau plastique" inhérente à l'architecture.

---

## 3. PODS VAST.AI UTILISES

### Pods de cette session

| Pod | GPU | Location | Prix | Usage | Statut |
|-----|-----|----------|------|-------|--------|
| ssh -p 27228 root@ssh3.vast.ai | RTX 3090 | Spain | $0.15/hr | Tests Z-Image | **Actif** |
| (précédent) | RTX 3090 | Hungary | $0.145/hr | LoRA training | Crashed (disk full) |
| (précédent) | RTX 4090 | Sweden | ~$0.30/hr | Tests | CUDA incompatible |
| (précédent) | RTX 5090 | US | ~$0.40/hr | Tests | sm_120 non supporté |

### Problèmes rencontrés

1. **RTX 5090**: Compute capability sm_120 non supportée par PyTorch
2. **Certains RTX 4090**: CUDA 13.0 incompatible avec PyTorch CUDA 12.4
3. **Disk quota**: Training crash à 52GB/50GB
4. **SSH timeouts**: Connexions instables pendant downloads

### Scripts Vast.ai créés
- `app/scripts/vastai-connect.mjs` - Gestion instance
- `app/scripts/vastai-create-eu.mjs` - Création pod EU
- `app/scripts/vastai-search-eu.mjs` - Recherche GPU EU

---

## 4. LORA ELENA V2 (En cours)

### Training effectué

- **Dataset**: 56 images (Cloudinary)
- **Trigger**: "elena"
- **Captions**: Per-image uniques
- **Modèle base**: Z-Image (tentative)
- **Rank**: 32, Alpha: 16
- **Steps**: 4500
- **LR**: 8e-5

**Statut**: LoRA créée (`elena_zimage_v2.safetensors`, 162MB) mais non testée car workflow Z-Image ne fonctionne pas.

---

## 5. RECHERCHES PERPLEXITY EFFECTUEES

| Date | Sujet | Fichier | Insight clé |
|------|-------|---------|-------------|
| 31/01 | Vast.ai setup | `2026-01-31-1155.vastai-comfyui-setup-*` | Template officiel ComfyUI |
| 31/01 | Z-Image QR fix | `2026-01-31-1236.comfyui-z-image-qr-code-*` | res_multistep sampler |
| 31/01 | Z-Image Full | `2026-01-31-1233.z-image-full-model-*` | Steps 20-30, CFG 4-6 |
| 31/01 | Z-Image Turbo | `2026-01-31-1220.z-image-comfyui-*` | Steps 6-9, CFG 1-3 |
| 30/01 | Z-Image LoRA | `2026-01-30-2201.best-caption-format-*` | Trigger token placement |
| 30/01 | Z-Image Omni | `2026-01-30-0945.z-image-omni-*` | Face ref broken |
| 28/01 | Z-Image vs FLUX | `2026-01-28-z-image-skin-realism-*` | Z-Image meilleure peau |

---

## 6. DECISIONS PRISES

### Confirmées
1. **FLUX rejeté** - Texture peau plastique inhérente
2. **BigLove XL > BigLust v16** - Couleurs plus naturelles
3. **bf16 pour training** - fp16 cause NaN loss
4. **CFG 4.0 optimal** - Réduit grain et surexposition
5. **InstantID en post-process** - Meilleure similarité

### En suspens
1. Z-Image Base vs Turbo - Lequel utiliser?
2. Z-Image LoRA - Compatible avec le workflow?
3. Face reference - Quelle alternative?

---

## 7. FICHIERS CLES

### Documentation
- `features/comfyui-generation-workflow/README.md` - Config actuelle
- `features/comfyui-generation-workflow/DECISIONS.md` - Historique décisions
- `features/comfyui-generation-workflow/TESTS.md` - Résultats tests

### Tasks actives
- `TASK-010-zimage-face-reference-fix.md` - BLOQUEE (tous tests échoués)
- `TASK-011-zimage-elena-lora-training.md` - LoRA créée, workflow cassé
- `TASK-012-elena-lora-v2-optimization.md` - Plan d'optimisation

### Scripts de test
- `app/scripts/elena-simple-test.mjs` - **Recommandé** (BigLove)
- `app/scripts/elena-zimage-basic-test.mjs` - Z-Image (ne fonctionne pas)
- `app/scripts/elena-zimage-faceref-test.mjs` - Face ref (ne fonctionne pas)

---

## 8. PROCHAINES ETAPES RECOMMANDEES

### Option A: Continuer avec BigLove XL (Solution rapide)
1. Utiliser BigLove XL + InstantID (95% similarité)
2. Accepter la qualité de peau actuelle
3. Se concentrer sur le contenu plutôt que la technique

### Option B: Déboguer Z-Image (Solution technique)
1. Télécharger modèles officiels de Comfy-Org/z_image
2. Utiliser le template ComfyUI officiel Vast.ai
3. Tester workflow JSON officiel sans modification
4. Si fonctionne, intégrer LoRA Elena v2

### Option C: Approche hybride
1. Générer corps avec Z-Image (qualité peau)
2. Face swap avec BigLove + InstantID
3. Combiner les deux approches

---

## 9. POD ACTIF

```bash
ssh -p 27228 root@ssh3.vast.ai
```

- **GPU**: RTX 3090 (24GB)
- **Location**: Spain
- **ComfyUI**: Running on port 8188
- **Modèles installés** (MIS À JOUR):
  - z_image_bf16.safetensors (**12.3GB** - OFFICIEL Comfy-Org) ✅
  - qwen_3_4b_bf16.safetensors (7.5GB) ✅
  - ae.safetensors (320MB) ✅
  - elena_zimage_v2.safetensors (163MB LoRA) — ❌ incompatible

---

## 10. PROCHAINES ÉTAPES (Après Option B)

### Z-Image fonctionne, mais pas de face consistency Elena

**Options pour Elena face consistency avec Z-Image**:

1. **Réentraîner LoRA Elena sur Z-Image Full officiel**
   - Télécharger le modèle de-distillé Comfy-Org si disponible
   - Ou adapter le training config pour Z-Image Full architecture
   - Temps estimé: ~5-6 heures de training

2. **Utiliser IP-Adapter avec Z-Image**
   - Télécharger IP-Adapter compatible Lumina2/Z-Image
   - Charger image de référence Elena
   - Moins d'identity preservation que LoRA

3. **Approche hybride BigLove + Z-Image**
   - Générer corps avec Z-Image (qualité peau supérieure)
   - Inpaint visage avec BigLove + InstantID
   - Plus complexe mais combine les avantages

4. **Continuer avec BigLove XL seul** (Solution rapide)
   - 95% similarité déjà atteinte
   - Qualité de peau acceptable
   - Workflow fonctionnel et testé

---

*Document mis à jour - 2026-01-31 13:15*
