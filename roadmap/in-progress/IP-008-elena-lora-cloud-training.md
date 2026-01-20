# 🚧 IP-008 — Elena LoRA Cloud Training (RunPod)

**Status** : 🚧 In Progress  
**Priorité** : 🟠 Medium  
**Créé** : 20 janvier 2026  
**Dernière mise à jour** : 20 janvier 2026

---

## 📋 Objectif

Entraîner un LoRA Elena de haute qualité sur RunPod (GPU cloud) pour obtenir une meilleure consistance du visage dans les générations ComfyUI.

**Problème actuel** : Le LoRA local (10 images, rank 8, 100 steps) apprend bien le corps mais pas assez le visage (~10-15% similarité).

**Solution** : Training cloud avec GPU A100, 25-30 images, rank 32, 300-500 steps.

---

## 🎯 Objectifs spécifiques

- [ ] Collecter 25-30 images Elena depuis Cloudinary (visage bien visible)
- [ ] Setup RunPod API et script automatisé
- [ ] Lancer training avec paramètres optimaux :
  - Rank: 32 (vs 8 local)
  - Steps: 300-500 (vs 100 local)
  - Résolution: 1024x1024 (vs 512x512 local)
  - Batch size: 2-4 (vs 1 local)
- [ ] Télécharger LoRA final dans ComfyUI
- [ ] Tester et comparer avec LoRA local
- [ ] Documenter workflow complet

---

## 📊 Résultats attendus

**Métriques de succès** :
- Visage : Similarité > 50% (vs ~10-15% actuel)
- Corps : Maintien qualité actuelle (déjà OK)
- Temps training : 30-60 min
- Coût : ~$1-2

**Critères d'acceptation** :
- ✅ Visage reconnaissable comme Elena
- ✅ Corps reste consistant
- ✅ Génération fonctionne dans ComfyUI
- ✅ Pas de régression vs LoRA local

---

## 🔧 Paramètres training

### Local (Mac M3 Pro 18GB) — Référence

```bash
NETWORK_DIM=8
NETWORK_ALPHA=4
MAX_TRAIN_STEPS=100
RESOLUTION="512,512"
BATCH_SIZE=1
LEARNING_RATE="1e-4"
Flags: --lowram --gradient_checkpointing --cache_latents_to_disk
```

### Cloud (RunPod A100) — Cible

```bash
NETWORK_DIM=32          # Rank plus élevé = meilleure qualité
NETWORK_ALPHA=16       # Alpha = dim/2
MAX_TRAIN_STEPS=300-500 # Plus d'apprentissage
RESOLUTION="1024,1024"  # Résolution plus haute
BATCH_SIZE=2-4         # Batch size plus grand
LEARNING_RATE="1e-4"
# Pas besoin de flags mémoire avec A100
```

---

## 📁 Fichiers à créer

- [ ] `app/scripts/runpod-lora-training.mjs` — Script automatisé RunPod
- [ ] `app/scripts/collect-elena-images.mjs` — Collecte images Cloudinary
- [ ] `docs/RUNPOD-LORA-TRAINING-GUIDE.md` — Guide complet
- [ ] `roadmap/done/DONE-079-elena-lora-cloud-training.md` — Documentation finale

---

## 🔗 Références

- [Session locale tests](./../docs/sessions/2026-01-20-elena-lora-training-local-tests.md)
- [RunPod API Documentation](https://docs.runpod.io/serverless/endpoints)
- [kohya_ss SDXL Training](https://github.com/bmaltais/kohya_ss/wiki/Training-LoRA-for-SDXL)

---

## 📝 Notes

### Images dataset idéal

- **25-30 images minimum**
- Visage bien visible et net sur toutes
- Variété d'angles : face, 3/4, profil
- Variété d'éclairages
- Même personne, expressions différentes
- Résolution haute (1024x1024 idéalement)

### Coût estimé

- GPU A100 40GB : ~$1.10/h
- Training estimé : 30-60 min
- **Total : ~$1-2**

### Alternative si échec

Si le LoRA cloud ne donne toujours pas de bons résultats visage :
- Utiliser LoRA pour le corps uniquement
- Post-process avec ReActor pour swap le visage avec vraie photo
- Visage 100% consistant mais peut paraître "collé"

---

**Assigné à** : Assistant AI  
**Dépendances** : RunPod API key, images Cloudinary
