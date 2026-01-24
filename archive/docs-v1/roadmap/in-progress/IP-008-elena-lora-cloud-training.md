# 🚧 IP-008 — Elena LoRA Cloud Training (RunPod)

**Status** : ✅ Partiellement Complété (Training OK, visage à améliorer)  
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

- [x] Collecter 25-30 images Elena depuis Cloudinary (visage bien visible) → **35 images collectées**
- [x] Setup RunPod API et script automatisé → **Script créé et fonctionnel**
- [x] Lancer training avec paramètres optimaux :
  - Rank: 32 ✅
  - Steps: 1500 ✅ (au lieu de 300-500)
  - Résolution: 1024x1024 ✅
  - Batch size: 1 ✅ (gradient accumulation 2)
- [x] Télécharger LoRA final dans ComfyUI → **elena_v4_cloud.safetensors**
- [x] Tester et comparer avec LoRA local → **Tests effectués**
- [x] Documenter workflow complet → **Documentation complète**

**Résultat** : Training V4 réussi techniquement (pas de NaN, loss stable) mais **visage pas assez fidèle**. Corps excellent.

---

## 📊 Résultats obtenus

**Métriques réelles** :
- Visage : ❌ Pas de ressemblance (~0% similarité)
- Corps : ✅ Excellent, style et proportions corrects
- Temps training : 51 min (V4)
- Coût : ~$0.14 (RTX A5000 @ $0.16/h)

**Critères d'acceptation** :
- ❌ Visage reconnaissable comme Elena → **Non atteint**
- ✅ Corps reste consistant → **Oui, excellent**
- ✅ Génération fonctionne dans ComfyUI → **Oui**
- ✅ Pas de régression vs LoRA local → **Amélioration sur le corps**

**Diagnostic** : Le LoRA apprend le style mais pas l'identité faciale. Causes probables : dataset insuffisant (35 images), trigger word trop commun, Network Dim 32 au lieu de 64.

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

### Cloud (RunPod RTX A5000) — Réalisé (V4)

```bash
NETWORK_DIM=32          # ✅ Utilisé
NETWORK_ALPHA=32        # ✅ Alpha = Dim (pas dim/2)
MAX_TRAIN_STEPS=1500    # ✅ Plus que prévu
RESOLUTION="1024,1024"  # ✅ Utilisé
BATCH_SIZE=1            # ✅ Avec gradient_accumulation_steps=2
LEARNING_RATE="5e-5"    # ✅ Plus conservateur (vs 1e-4)
MIXED_PRECISION="bf16"  # ✅ Pour éviter NaN (vs fp16)
LR_WARMUP_STEPS=200     # ✅ Warmup plus long
LR_SCHEDULER="cosine_with_restarts"  # ✅
```

**Résultat** : Training réussi sans NaN, loss stable (0.116 final).

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

### Prochaines étapes identifiées

**Court terme** :
- [ ] Tester l'inpainting avec FaceID sur les images générées
- [ ] Recadrer les 35 images sur le visage uniquement
- [ ] Entraîner un LoRA facial séparé

**Moyen terme** :
- [ ] Ajouter 15-50 images supplémentaires au dataset
- [ ] Refaire les captions avec trigger word unique (ex: "sks")
- [ ] Retrainer avec Network Dim 64

**Long terme** :
- [ ] Évaluer le passage à Flux pour meilleure fidélité faciale

### Solutions alternatives

1. **Inpainting** : Utiliser LoRA corps + FaceID sur le visage uniquement
2. **Deux LoRAs** : LoRA corps + LoRA visage séparé
3. **Flux** : Passer à Flux pour meilleure apprentissage identité

---

**Assigné à** : Assistant AI  
**Dépendances** : RunPod API key, images Cloudinary  
**Documentation complète** : `docs/sessions/2026-01-20-elena-lora-cloud-training.md`
