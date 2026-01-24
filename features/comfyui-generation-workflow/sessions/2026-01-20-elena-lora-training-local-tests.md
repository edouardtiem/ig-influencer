# 📝 FIN DE SESSION — Elena LoRA Training Local Tests

**Date** : 20 janvier 2026  
**Durée** : ~2h

---

## ✅ Ce qui a été fait cette session :

1. **🎯 Préparation dataset LoRA Elena**
   - Téléchargement de 10 images Elena depuis Cloudinary (corps + visage visibles)
   - Redimensionnement à 512x512 (412x512 après resize)
   - Création de captions pour chaque image avec trigger word "elena"
   - Dataset sauvegardé dans `lora-dataset-elena/10_elena/`

2. **🤖 Entraînement LoRA local (Mac M3 Pro 18GB)**
   - Utilisation de kohya_ss/sd-scripts
   - Modèle de base : `bigLust_v16.safetensors` (SDXL)
   - Paramètres optimisés pour Mac :
     - LoRA rank: 8 (réduit pour mémoire)
     - Alpha: 4
     - Steps: 100
     - Batch size: 1
     - Résolution: 512x512
     - Flags: `--lowram`, `--gradient_checkpointing`, `--cache_latents_to_disk`
   - **Durée** : ~2h15min (100 steps)
   - **Résultat** : LoRA sauvegardé → `~/ComfyUI/models/loras/elena_body_face_v2.safetensors` (57MB)

3. **🧪 Tests génération avec le LoRA**
   - **Test 1** : LoRA 0.8 + IP-Adapter 0.3 (body ref)
     - ✅ Corps : OK
     - ❌ Visage : ~5% similarité, pas satisfaisant
     - ❌ Seins : Trop grands (D-cup)
   
   - **Test 2** : LoRA 1.0 + IP-Adapter 0.3, seins C-cup
     - ❌ Seins : Trop petits
     - ❌ Visage : Encore pire
   
   - **Test 3** : LoRA 1.2 + IP-Adapter 0.15, seins "natural"
     - ❌ Seins : Encore trop petits
     - ❌ Visage : Trop différent
   
   - **Test 4** : LoRA 0.8 + IP-Adapter 0.0 (sans IP-Adapter)
     - ✅ Corps : OK
     - ✅ Seins : "full natural breasts" - acceptable
     - ❌ Visage : Meilleur que test 1 mais toujours pas satisfaisant (~10-15% similarité)
   
   - **Test 5** : LoRA 0.8 + FaceID Plus v2 0.7 (visage uniquement)
     - ❌ Visage : **Pire** que sans FaceID
     - Conclusion : FaceID interfère négativement avec le LoRA

4. **📊 Analyse et conclusions**
   - Le LoRA apprend bien le **corps** d'Elena
   - Le LoRA n'apprend **pas assez le visage** avec seulement 10 images
   - IP-Adapter interfère avec le visage du LoRA
   - FaceID ne fonctionne pas bien en combo avec LoRA
   - **Problème principal** : Dataset trop petit (10 images) pour apprendre un visage consistant

---

## 📁 Fichiers créés/modifiés :

### Créés :
- ✅ `lora-dataset-elena/10_elena/` — Dataset avec 10 images + captions
- ✅ `train-elena-lora.sh` — Script d'entraînement LoRA (modifié pour v2)
- ✅ `app/scripts/test-elena-lora.mjs` — Script de test LoRA (modifié plusieurs fois)
- ✅ `~/ComfyUI/models/loras/elena_body_face_v2.safetensors` — LoRA entraîné (57MB)
- ✅ `lora-training-v2.log` — Logs d'entraînement
- ✅ `docs/sessions/2026-01-20-elena-lora-training-local-tests.md` — Ce document

### Modifiés :
- ✅ `train-elena-lora.sh` — Mis à jour pour v2 (100 steps, output name `elena_body_face_v2`)
- ✅ `app/scripts/test-elena-lora.mjs` — Modifié pour tester différents paramètres

---

## 🚧 En cours (non terminé) :

- ⏳ **Training cloud RunPod** — À faire dans prochaine session
  - Collecter 25-30 images Elena (corps + visage)
  - Lancer training sur RunPod avec GPU A100
  - Paramètres optimaux : rank 32, 300-500 steps, résolution 1024x1024

---

## 📋 À faire prochaine session :

### 🔴 URGENT

- [ ] **Setup RunPod API** — Obtenir clé API RunPod
- [ ] **Collecter plus d'images** — 25-30 images Elena depuis Cloudinary (visage bien visible)
- [ ] **Créer script RunPod** — Automatiser création pod, upload dataset, training, download LoRA

### 🟠 IMPORTANT

- [ ] **Tester nouveau LoRA** — Une fois training RunPod terminé, tester dans ComfyUI
- [ ] **Comparer résultats** — LoRA local vs LoRA cloud (qualité visage)
- [ ] **Documenter workflow** — Créer guide complet pour futurs trainings

---

## 🐛 Bugs découverts :

### BUG-019 : LoRA local ne capture pas assez le visage ✅ IDENTIFIÉ

**Description** : 
- Avec 10 images d'entraînement, le LoRA apprend bien le corps mais pas le visage
- Similarité visage estimée : ~10-15% seulement
- Même avec FaceID, le résultat est pire

**Cause** : 
- Dataset trop petit (10 images minimum recommandé, mais 25-30 idéal)
- Training sur Mac M3 avec paramètres limités (rank 8 au lieu de 32)
- Pas assez de variété d'angles du visage

**Solution proposée** : 
- Training cloud sur RunPod avec GPU A100
- 25-30 images avec visage bien visible
- Rank 32, 300-500 steps, résolution 1024x1024

**Impact** : 🟠 IMPORTANT — Bloque la génération d'images avec visage consistant

---

## 💡 Idées notées :

### 1. **Training cloud vs local**

**Avantages cloud (RunPod)** :
- GPU A100/H100 beaucoup plus puissant
- Peut utiliser rank 32 (vs 8 local)
- Plus de steps possibles (300-500 vs 100)
- Résolution plus haute (1024x1024 vs 512x512)
- Coût : ~$1-2 pour un training complet

**Inconvénients cloud** :
- Nécessite upload/download des données
- Dépendance service externe
- Coût (même si faible)

### 2. **Alternative : ReActor/FaceSwap**

Si le LoRA cloud ne donne toujours pas de bons résultats visage :
- Utiliser LoRA pour le corps uniquement
- Post-process avec ReActor pour swap le visage avec vraie photo
- Visage 100% consistant mais peut paraître "collé"

### 3. **Dataset idéal pour visage**

Pour un bon LoRA visage :
- **25-30 images minimum**
- Visage bien visible et net sur toutes
- Variété d'angles : face, 3/4, profil
- Variété d'éclairages
- Même personne, expressions différentes
- Résolution haute (1024x1024 idéalement)

---

## 📝 Notes importantes :

### Paramètres training local (Mac M3 Pro 18GB)

```bash
# Optimisé pour mémoire limitée
NETWORK_DIM=8        # Rank (réduit pour mémoire)
NETWORK_ALPHA=4     # Alpha = dim/2
MAX_TRAIN_STEPS=100 # Steps (minimal)
RESOLUTION="512,512"
BATCH_SIZE=1
LEARNING_RATE="1e-4"

# Flags mémoire
--lowram
--gradient_checkpointing
--cache_latents_to_disk
--max_data_loader_n_workers=0
```

### Paramètres proposés pour RunPod (GPU A100)

```bash
# Optimisé pour qualité maximale
NETWORK_DIM=32       # Rank (meilleure qualité)
NETWORK_ALPHA=16     # Alpha = dim/2
MAX_TRAIN_STEPS=300-500  # Steps (plus d'apprentissage)
RESOLUTION="1024,1024"   # Résolution plus haute
BATCH_SIZE=2-4      # Batch size plus grand possible
LEARNING_RATE="1e-4"

# Pas besoin de flags mémoire avec A100
```

### Résultats tests

| Test | LoRA | IP-Adapter | FaceID | Corps | Seins | Visage | Résultat |
|------|------|------------|--------|-------|-------|--------|----------|
| 1    | 0.8  | 0.3        | -      | ✅ OK | ❌ Trop grand | ❌ ~5% | Échec |
| 2    | 1.0  | 0.3        | -      | ✅ OK | ❌ Trop petit | ❌ Pire | Échec |
| 3    | 1.2  | 0.15       | -      | ✅ OK | ❌ Trop petit | ❌ Différent | Échec |
| 4    | 0.8  | 0.0        | -      | ✅ OK | ✅ OK | ❌ ~10-15% | Meilleur |
| 5    | 0.8  | 0.0        | 0.7    | ✅ OK | ✅ OK | ❌ Pire | Échec |

**Conclusion** : Test 4 (LoRA seul 0.8) donne le meilleur résultat mais visage toujours insuffisant.

### Images utilisées pour training

10 images téléchargées depuis Cloudinary :
1. `elena_01.jpg` - carousel-1-1768245582
2. `elena_02.jpg` - carousel-2-1767875851
3. `elena_03.jpg` - carousel-3-1767554094
4. `elena_04.jpg` - carousel-2-1767554046
5. `elena_05.jpg` - carousel-1-1767553995
6. `elena_06.jpg` - balcony_golden_hour-1767457151
7. `elena_07.jpg` - carousel-3-1767530035
8. `elena_08.jpg` - balcony_golden_hour-1767435656
9. `elena_09.jpg` - yoga_flexibility-1767370720
10. `elena_10.jpg` - carousel-3-1767271008

Toutes avec visage + corps visibles, résolution 412x512 après resize.

---

## 🔗 Références

- [kohya_ss Documentation](https://github.com/bmaltais/kohya_ss)
- [SDXL LoRA Training Guide](https://github.com/bmaltais/kohya_ss/wiki/Training-LoRA-for-SDXL)
- [RunPod Documentation](https://docs.runpod.io/)
- [ComfyUI LoRA Usage](https://github.com/comfyanonymous/ComfyUI)

---

## 🎯 Plan prochaine session : RunPod Training

### Objectifs
1. Collecter 25-30 images Elena (visage bien visible)
2. Setup RunPod API
3. Créer script automatisé pour :
   - Créer pod GPU A100
   - Installer kohya_ss
   - Uploader dataset
   - Lancer training avec paramètres optimaux
   - Télécharger LoRA final
   - Supprimer pod
4. Tester nouveau LoRA dans ComfyUI
5. Comparer avec LoRA local

### Coût estimé
- GPU A100 40GB : ~$1.10/h
- Training estimé : 30-60 min
- **Total : ~$1-2**

---

**Commits** : 
- À faire : Commit des fichiers créés/modifiés

**Status** : ✅ Tests locaux terminés, prêt pour training cloud RunPod
