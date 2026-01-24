# Elena RunPod BigLove Testing — Session 23 Jan 2026

## Summary
Testé plusieurs approches pour améliorer la qualité des images Elena sur RunPod avec BigLove checkpoint. Le corps est maintenant très bon, le visage reste à améliorer.

## What Was Done

### 1. Setup RunPod avec BigLove
- Pod RTX A5000 créé
- BigLove XL uploadé (6.5GB, ~15 min)
- ComfyUI + InstantID + Impact Pack installés
- torch 2.4.0 (fix pour comfy_kitchen)

### 2. Tests de réduction du grain

| Test | Config | Résultat |
|------|--------|----------|
| CFG 7 + Refiner (denoise 0.25) | 2 KSamplers | ❌ **Pire** - image dégradée |
| Upscale 4x-UltraSharp | Simple upscale | ⚠️ Trop lisse, peau plastique |
| Upscale + img2img (denoise 0.15) | Texture pass | ✅ **Bon pour corps**, visage plastique |

### 3. Génération de poses
- 5 poses générées (doggy, spread, assup, sitting, standing)
- 3 versions testées (v1, v2, v3) pour cohérence du corps

### 4. Script amélioré
- Ajout `stop` et `resume` pour conserver les données entre sessions
- Coût stockage: ~$0.10/GB/mois vs re-upload à chaque fois

## Configuration Finale Elena (Standard)

```
Checkpoint: bigLove_xl1.safetensors
LoRA: elena_v4_cloud.safetensors (strength 1.0)
InstantID: ip-adapter.bin (weight 0.85)
Face ref: elena_face_ref.jpg

CFG: 3.0
Steps: 40
Sampler: dpmpp_2m_sde + karras
Resolution: 832×1216

Body prompt: "natural breasts, athletic body"
```

## What Worked ✅
- **BigLove + CFG 3.0** → Couleurs naturelles
- **InstantID weight 0.85** → Bonne ressemblance visage
- **Upscale 4x + img2img denoise 0.15** → Bon pour texture corps
- **Body: "natural breasts, athletic body"** → Cohérent

## What Didn't Work ❌
- **CFG 7** → Couleurs saturées, moins naturel
- **Refiner pass (denoise 0.25)** → Dégrade l'image
- **Upscale seul** → Peau trop lisse/plastique
- **"curvy" dans prompt** → Corps incohérent

## Issues Restants
1. **Visage plastique** après upscale + texture
2. **Grain** toujours présent sur images base (acceptable)
3. **Cohérence poses** → Seed différent = résultat différent

## Fichiers Générés

```
output/runpod-quality-tests/
├── elena_biglove_nude_00001_.png      # Base CFG 3 (BEST BASE)
├── elena_upscale_4x_00001_.png        # Upscale brut
├── elena_upscale_texture_00001_.png   # Upscale + texture (BEST BODY)
├── elena_refiner_00001_.png           # Test raté
├── elena_pose[1-5]_*.png              # V1 poses
├── elena_v2_pose[1-5]_*.png           # V2 sans curvy
└── elena_v3_pose[1-5]_*.png           # V3 body cohérent
```

## Files Modified
- `app/scripts/runpod-quality-tests.mjs` — Ajout `stop`/`resume` commands

## RunPod Status
- **Pod ID**: 7fpgk1u1rswgj7
- **Action**: STOP (données conservées)
- **Contenu préservé**: BigLove, LoRA, InstantID models, images générées

## Next Steps
- [ ] Améliorer le visage (FaceDetailer, inpainting, ou autre technique)
- [ ] Tester différentes photos de référence InstantID
- [ ] Automatiser le pipeline complet (génération → upscale → texture)
- [ ] Documenter workflow final dans un script dédié

---

**Durée session**: ~2h  
**Coût RunPod estimé**: ~$1-2
