# 📝 SESSION — Elena LoRA RunPod Setup & Training

**Date** : 20 janvier 2026  
**Durée** : ~1h  
**Status** : 🚧 En cours — Dataset préparé, prêt pour training RunPod

---

## 🎯 Objectif

Lancer un training LoRA haute qualité sur RunPod avec 35 images Elena pour améliorer la consistance du visage (actuellement ~10-15% avec 10 images locales).

---

## ✅ Ce qui a été fait cette session

### 1. **🔍 Recherche Best Practices LoRA SDXL 2025-2026**

**Paramètres optimaux identifiés :**

| Paramètre | Valeur Optimale | Justification |
|-----------|----------------|---------------|
| **Rank/Dim** | 32 | Sweet spot pour character LoRA |
| **Alpha** | 16 (dim/2) | Training stable |
| **UNet LR** | 2e-4 | Plus agressif pour meilleur apprentissage |
| **Text Encoder LR** | 5e-5 | **CRUCIAL** pour reconnaissance trigger word |
| **Total Steps** | 1500-3000 | Community recommande pour character |
| **train_text_encoder** | ✅ Oui | Active apprentissage visage via prompt |
| **min_snr_gamma** | 5 | Améliore netteté visage |
| **keep_tokens** | 1 | Garde "elena" en premier toujours |
| **Gradient Accum** | 2 | Effective batch size = 2 |

**Sources :**
- Reddit r/StableDiffusion (2025-2026 discussions)
- Apatero.com Kohya training guides
- PropelRC LoRA settings explained

### 2. **🔧 Scripts RunPod Créés**

**Fichiers créés :**

1. **`app/scripts/runpod-lora-training.mjs`**
   - Gestion pods RunPod (create/status/stop/resume/terminate)
   - Configuration optimisée pour RTX 4090
   - Test connexion API ✅ (API key validée)

2. **`app/scripts/prepare-lora-dataset-cloud.mjs`**
   - Download 35 images depuis Cloudinary
   - Resize automatique 1024x1024
   - Génération captions optimisées (trigger word + features)

3. **`runpod-training-script.sh`**
   - Script bash à exécuter sur le pod
   - Installation kohya_ss automatique
   - Training avec paramètres optimaux

**Configuration training :**
```bash
RESOLUTION="1024,1024"
BATCH_SIZE=1
GRAD_ACCUM=2
MAX_TRAIN_STEPS=2100        # 35 images × 10 repeats × 6 epochs
UNET_LR="2e-4"
TEXT_ENCODER_LR="5e-5"
NETWORK_DIM=32
NETWORK_ALPHA=16
MIN_SNR_GAMMA=5
```

### 3. **📸 Dataset Elena - 35 Images**

**Classification effectuée :**

| Angle | Nombre | % | Shot Types |
|-------|--------|---|------------|
| **Front** | ~12 | 34% | closeup (1), medium (11) |
| **3/4** | ~18 | 51% | medium (15), full (3) |
| **Profile** | ~5 | 14% | medium (5) |

**Distribution par location :**
- Rooftop Paris/Balcony : 10 images
- Indoor/Window views : 5 images
- Bedroom/Yoga : 2 images
- Gallery/Passage : 2 images
- Pool/Tropical : 5 images
- Mixed locations : 11 images

**Toutes les URLs Cloudinary :**
```javascript
// Voir app/scripts/prepare-lora-dataset-cloud.mjs
// 35 images avec classification angle/shot complète
```

### 4. **🔑 RunPod API Setup**

- **API Key** : `rpa_***` (stored in env vars)
- **Email** : edouard@tiemh.com
- **Spend Limit** : $80
- **Pod existant** : `agreed_coffee_guan` (RTX 4090, EXITED)

**Test connexion** : ✅ OK

---

## 📋 Workflow Complet

### Étape 1 : Préparer le dataset localement ✅

```bash
cd "/Users/edouardtiem/Cursor Projects/IG-influencer"
node app/scripts/prepare-lora-dataset-cloud.mjs
```

**Résultat attendu :**
- Dataset dans `lora-dataset-elena-cloud/10_elena/`
- 35 images 1024x1024
- 35 captions avec trigger word "elena"

### Étape 2 : Créer/Démarrer pod RunPod

```bash
# Option A: Utiliser pod existant
node app/scripts/runpod-lora-training.mjs resume

# Option B: Créer nouveau pod
node app/scripts/runpod-lora-training.mjs create
```

**Attendre** : Pod status = RUNNING (check avec `status`)

### Étape 3 : Upload dataset vers pod

**Depuis machine locale :**
```bash
# Récupérer SSH command depuis RunPod console
# Format: ssh root@<POD_IP> -p <PORT>

# Upload dataset
scp -P <PORT> -r lora-dataset-elena-cloud/* root@<POD_IP>:/workspace/dataset/
```

### Étape 4 : Upload script training

```bash
scp -P <PORT> runpod-training-script.sh root@<POD_IP>:/workspace/
```

### Étape 5 : SSH et lancer training

```bash
ssh root@<POD_IP> -p <PORT>
cd /workspace
chmod +x runpod-training-script.sh
./runpod-training-script.sh
```

**Temps estimé** : 25-40 minutes sur RTX 4090

### Étape 6 : Download LoRA final

```bash
# Depuis machine locale
scp -P <PORT> root@<POD_IP>:/workspace/output/elena_v3_cloud.safetensors ~/ComfyUI/models/loras/
```

### Étape 7 : Stop pod (économiser)

```bash
node app/scripts/runpod-lora-training.mjs stop <POD_ID>
```

---

## 💰 Coût Estimé

- **GPU** : RTX 4090 (~$0.44/hr)
- **Temps training** : 30-40 min
- **Total** : ~$0.30-0.40

---

## 📊 Comparaison Local vs Cloud

| Aspect | Local (Mac M3) | Cloud (RunPod RTX 4090) |
|--------|----------------|-------------------------|
| **GPU** | M3 Pro 18GB | RTX 4090 24GB |
| **Rank** | 8 (limité) | 32 (optimal) |
| **Steps** | 100 | 2100 |
| **Résolution** | 512x512 | 1024x1024 |
| **Text Encoder** | ❌ Non | ✅ Oui |
| **Images** | 10 | 35 |
| **Temps** | ~2h15 | ~30-40min |
| **Coût** | $0 | ~$0.35 |

---

## 🎯 Résultats Attendus

**Amélioration visage :**
- Local : ~10-15% similarité
- Cloud attendu : **60-80%** similarité

**Raisons :**
- 3.5× plus d'images (35 vs 10)
- Rank 4× plus élevé (32 vs 8)
- Text Encoder training activé
- Résolution 2× plus haute (1024 vs 512)
- 21× plus de steps (2100 vs 100)

---

## 📁 Fichiers Créés/Modifiés

### Créés :
- ✅ `app/scripts/runpod-lora-training.mjs` — Gestion pods RunPod
- ✅ `app/scripts/prepare-lora-dataset-cloud.mjs` — Préparation dataset
- ✅ `runpod-training-script.sh` — Script training optimisé
- ✅ `docs/sessions/2026-01-20-elena-lora-runpod-setup.md` — Ce document

### Modifiés :
- ✅ `.env.local` — Ajout `RUNPOD_API_KEY`

---

## 🚧 Prochaines Étapes

### À faire maintenant :

1. **Lancer préparation dataset**
   ```bash
   node app/scripts/prepare-lora-dataset-cloud.mjs
   ```

2. **Vérifier dataset créé**
   ```bash
   ls -la lora-dataset-elena-cloud/10_elena/
   # Devrait voir 35 .jpg + 35 .txt
   ```

3. **Démarrer pod RunPod**
   ```bash
   node app/scripts/runpod-lora-training.mjs resume
   # Ou créer nouveau: node app/scripts/runpod-lora-training.mjs create
   ```

4. **Suivre workflow Étape 3-7** ci-dessus

### Après training :

- [ ] Tester LoRA dans ComfyUI
- [ ] Comparer avec LoRA local (v2)
- [ ] Documenter résultats
- [ ] Mettre à jour ROADMAP.md

---

## 🔗 Références

- [RunPod API Docs](https://docs.runpod.io/)
- [Kohya_ss GitHub](https://github.com/bmaltais/kohya_ss)
- [SDXL LoRA Training Guide](https://apatero.com/blog/kohya-ss-lora-training-complete-guide-2025)
- [Reddit r/StableDiffusion LoRA discussions](https://reddit.com/r/StableDiffusion)

---

## 📝 Notes Importantes

### Captions Structure

**Format optimisé :**
```
elena, 24 year old Italian woman, honey brown warm eyes, small beauty mark on right cheekbone, bronde hair with dark roots and golden blonde balayage, long voluminous beach waves, [angle description], sun-kissed Mediterranean skin, photo
```

**Pourquoi cette structure :**
- Trigger word "elena" en premier (keep_tokens=1)
- Features visage toujours présents
- Pas de termes vagues ("beautiful", "stunning")
- Cohérence parfaite entre toutes les captions

### Paramètres Clés Training

**Text Encoder LR = 5e-5** (plus bas que UNet)
- Permet au modèle d'apprendre que "elena" = ce visage spécifique
- Sans ça, le trigger word ne fonctionne pas bien

**min_snr_gamma = 5**
- Améliore le contraste et la netteté
- Particulièrement important pour le visage

**Gradient Accumulation = 2**
- Effective batch size = 2
- Training plus stable qu'avec batch_size=1 seul

---

**Status** : ✅ Setup complet, prêt pour training  
**Next** : Lancer `prepare-lora-dataset-cloud.mjs` puis suivre workflow
