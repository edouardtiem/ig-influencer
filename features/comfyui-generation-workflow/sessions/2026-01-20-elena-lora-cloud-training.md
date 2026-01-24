# Elena LoRA Cloud Training - Session 20 Janvier 2026

## Résumé

**Objectif** : Entraîner un LoRA SDXL pour Elena avec 35 images (vs 10 précédemment) pour améliorer la consistance du visage.

**Résultats** :
- **V3** : Training complété mais **problèmes de NaN** → LoRA corrompu, aucune ressemblance
- **V4** : Training réussi sans NaN (bf16, LR 5e-5) → LoRA fonctionnel mais **visage pas assez fidèle** (corps OK)

---

## 1. Problèmes RunPod API et Solutions

### Problème 1 : `runtime: null` - Pod ne démarre pas

**Symptôme** : Le pod est créé avec status "RUNNING" mais `runtime` reste `null` et aucun port SSH n'est assigné.

**Cause** : Le paramètre `volumeMountPath` était manquant lors de la création du pod avec un volume.

**Solution** :
```javascript
// ❌ INCORRECT - Ne pas oublier volumeMountPath
mutation {
  podFindAndDeployOnDemand(input: {
    volumeInGb: 50,
    // ... autres params
  })
}

// ✅ CORRECT - Toujours spécifier volumeMountPath avec un volume
mutation {
  podFindAndDeployOnDemand(input: {
    volumeInGb: 50,
    volumeMountPath: "/workspace",  // OBLIGATOIRE !
    // ... autres params
  })
}
```

**Erreur dans les logs du pod** :
```
error creating container: invalid mount config for type "volume": field Target must not be empty
```

### Problème 2 : Pas de ports publics

**Symptôme** : Pod démarre mais pas de ports SSH exposés.

**Solution** : Ajouter `supportPublicIp: true` dans la mutation :
```javascript
mutation {
  podFindAndDeployOnDemand(input: {
    supportPublicIp: true,  // Pour avoir des ports TCP publics
    startSsh: true,
    ports: "22/tcp",
    // ... autres params
  })
}
```

### Template de création de pod fonctionnel

```bash
curl -s -X POST https://api.runpod.io/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RUNPOD_API_KEY" \
  -d '{
    "query": "mutation { podFindAndDeployOnDemand(input: { 
      cloudType: ALL, 
      gpuCount: 1, 
      volumeInGb: 50, 
      volumeMountPath: \"/workspace\", 
      containerDiskInGb: 40, 
      gpuTypeId: \"NVIDIA RTX A5000\", 
      name: \"elena-lora\", 
      imageName: \"runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel-ubuntu22.04\", 
      startSsh: true, 
      supportPublicIp: true, 
      ports: \"22/tcp\" 
    }) { id name machineId } }"
  }'
```

---

## 2. Ce qui a été fait

### Dataset
- **35 images** téléchargées depuis Cloudinary
- Redimensionnées en **1024x1024**
- Captions générées automatiquement avec trigger word `elena`
- Structure : `/workspace/dataset/10_elena/` (10 repeats)

### Configuration du Training

```bash
accelerate launch sdxl_train_network.py \
  --pretrained_model_name_or_path="sd_xl_base_1.0.safetensors" \
  --train_data_dir="/workspace/dataset" \
  --output_dir="/workspace/output" \
  --output_name="elena_v3_cloud" \
  --resolution="1024,1024" \
  --train_batch_size=1 \
  --gradient_accumulation_steps=2 \
  --max_train_steps=2100 \
  --learning_rate=1e-4 \
  --unet_lr=1e-4 \
  --text_encoder_lr=1e-5 \
  --lr_scheduler="constant_with_warmup" \
  --lr_warmup_steps=100 \
  --network_module=networks.lora \
  --network_dim=32 \
  --network_alpha=32 \
  --optimizer_type="AdamW" \
  --max_grad_norm=1.0 \
  --mixed_precision="fp16" \
  --save_every_n_steps=500 \
  --caption_extension=".txt" \
  --shuffle_caption \
  --keep_tokens=1 \
  --xformers \
  --seed=42
```

### Problème pendant le training

**NaN Loss** dès les premiers steps :
```
steps: 0%| | 1/2100 [00:05<3:14:53, 5.57s/it, avr_loss=nan]
```

Le training a continué mais tous les checkpoints sont corrompus → images générées de bonne qualité technique mais **aucune ressemblance**.

---

## 3. Fichiers générés

| Fichier | Taille | Status |
|---------|--------|--------|
| `elena_v3_cloud-step00000500.safetensors` | 218MB | ❌ Corrompu (NaN) |
| `elena_v3_cloud-step00001000.safetensors` | 218MB | ❌ Corrompu (NaN) |
| `elena_v3_cloud-step00001500.safetensors` | 218MB | ❌ Corrompu (NaN) |
| `elena_v3_cloud-step00002000.safetensors` | 218MB | ❌ Corrompu (NaN) |
| `elena_v3_cloud.safetensors` | 218MB | ❌ Corrompu (NaN) |

**Coût RunPod** : ~$0.50 (RTX A5000 @ $0.16/h pendant ~3h avec les tests)

---

## 4. Prochain Training - Paramètres Recommandés

### Changements clés pour éviter les NaN :

1. **Learning Rate plus bas** :
   - `unet_lr=5e-5` (au lieu de 1e-4)
   - `text_encoder_lr=5e-6` (au lieu de 1e-5)

2. **Utiliser bf16 au lieu de fp16** :
   - `--mixed_precision="bf16"` (plus stable numériquement)

3. **Warmup plus long** :
   - `--lr_warmup_steps=200` (au lieu de 100)

4. **Ne pas utiliser min_snr_gamma** avec fp16

5. **Alpha = Dim** :
   - `--network_alpha=32` (égal à network_dim=32)

### Script de training corrigé

```bash
#!/bin/bash
cd /workspace/sd-scripts

MODEL="/workspace/models/sd_xl_base_1.0.safetensors"
DATASET="/workspace/dataset"
OUTPUT="/workspace/output"

accelerate launch --mixed_precision=bf16 sdxl_train_network.py \
  --pretrained_model_name_or_path="$MODEL" \
  --train_data_dir="$DATASET" \
  --output_dir="$OUTPUT" \
  --output_name="elena_v4_cloud" \
  --resolution="1024,1024" \
  --train_batch_size=1 \
  --gradient_accumulation_steps=2 \
  --max_train_steps=1500 \
  --learning_rate=5e-5 \
  --unet_lr=5e-5 \
  --text_encoder_lr=5e-6 \
  --lr_scheduler="cosine_with_restarts" \
  --lr_warmup_steps=200 \
  --network_module=networks.lora \
  --network_dim=32 \
  --network_alpha=32 \
  --optimizer_type="AdamW" \
  --max_grad_norm=1.0 \
  --mixed_precision="bf16" \
  --save_precision="fp16" \
  --save_every_n_steps=300 \
  --save_model_as="safetensors" \
  --caption_extension=".txt" \
  --shuffle_caption \
  --keep_tokens=1 \
  --cache_latents \
  --enable_bucket \
  --bucket_no_upscale \
  --gradient_checkpointing \
  --xformers \
  --seed=42
```

### GPU recommandé

- **RTX A5000** (24GB) - $0.16/h - Suffisant
- **RTX 4090** (24GB) - $0.34/h - Plus rapide si dispo

---

## 5. Workflow Complet pour le Prochain Training

### Étape 1 : Créer le pod
```bash
cd "/Users/edouardtiem/Cursor Projects/IG-influencer"
node app/scripts/runpod-lora-training.mjs create
```

### Étape 2 : Attendre les ports SSH
```bash
# Vérifier avec
./runpodctl get pod --allfields
# Attendre que PORTS ne soit plus vide
```

### Étape 3 : Uploader le dataset
```bash
scp -i ~/.runpod/ssh/RunPod-Key-Go -P [PORT] -r lora-dataset-elena-cloud/10_elena root@[IP]:/workspace/dataset/
```

### Étape 4 : Setup et training
```bash
ssh -i ~/.runpod/ssh/RunPod-Key-Go -p [PORT] root@[IP]

# Sur le pod :
cd /workspace
git clone https://github.com/kohya-ss/sd-scripts.git
cd sd-scripts && pip install -r requirements.txt
pip install xformers bitsandbytes

# Télécharger SDXL
mkdir -p /workspace/models
wget -P /workspace/models https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors

# Lancer le training (avec le script corrigé ci-dessus)
```

### Étape 5 : Télécharger le LoRA
```bash
scp -i ~/.runpod/ssh/RunPod-Key-Go -P [PORT] root@[IP]:/workspace/output/elena_v4_cloud.safetensors ./
```

### Étape 6 : Stopper le pod
```bash
./runpodctl stop pod [POD_ID]
```

---

## 6. Références

- **Session document** : `docs/sessions/2026-01-20-elena-lora-cloud-training.md`
- **Dataset local** : `lora-dataset-elena-cloud/10_elena/`
- **Script de préparation** : `app/scripts/prepare-lora-dataset-cloud.mjs`
- **Script RunPod** : `app/scripts/runpod-lora-training.mjs`
- **LoRA dans ComfyUI** : `/Users/edouardtiem/ComfyUI/models/loras/elena_v3_step500.safetensors`

---

## 7. Image de test générée (V3)

L'image générée avec le LoRA corrompu montre une femme de bonne qualité mais **sans ressemblance avec Elena** :
- Yeux : OK (marron)
- Cheveux : Partiellement OK (bruns avec balayage)
- **Visage : Pas Elena** - traits différents, grain de beauté absent

**Conclusion** : Le LoRA n'a pas appris l'identité faciale à cause des NaN pendant le training.

---

## 8. Training V4 - Succès Technique

### Pod utilisé
- **ID** : `tezd17nf32oe0m` (elena-lora-tcp)
- **GPU** : RTX A5000 (24GB)
- **IP:Port** : `69.30.85.189:22161`
- **Coût** : ~$0.14 (51 min @ $0.16/h)

### Paramètres corrigés (NaN-safe)

```bash
accelerate launch --mixed_precision=bf16 sdxl_train_network.py \
  --pretrained_model_name_or_path="/workspace/models/sd_xl_base_1.0.safetensors" \
  --train_data_dir="/workspace/dataset" \
  --output_dir="/workspace/output" \
  --output_name="elena_v4_cloud" \
  --resolution="1024,1024" \
  --train_batch_size=1 \
  --gradient_accumulation_steps=2 \
  --max_train_steps=1500 \
  --learning_rate=5e-5 \
  --unet_lr=5e-5 \
  --text_encoder_lr=5e-6 \
  --lr_scheduler="cosine_with_restarts" \
  --lr_warmup_steps=200 \
  --network_module=networks.lora \
  --network_dim=32 \
  --network_alpha=32 \
  --optimizer_type="AdamW" \
  --max_grad_norm=1.0 \
  --mixed_precision="bf16" \
  --save_precision="fp16" \
  --save_every_n_steps=300 \
  --save_model_as="safetensors" \
  --caption_extension=".txt" \
  --shuffle_caption \
  --keep_tokens=1 \
  --cache_latents \
  --enable_bucket \
  --bucket_no_upscale \
  --gradient_checkpointing \
  --xformers \
  --seed=42
```

### Résultats du training

| Métrique | Valeur |
|----------|--------|
| **Steps** | 1500/1500 (100%) |
| **Loss finale** | 0.116 (stable, pas de NaN) |
| **Durée** | ~51 minutes |
| **Checkpoints** | 300, 600, 900, 1200, 1500 |
| **Fichier final** | `elena_v4_cloud.safetensors` (218MB) |

**✅ Succès** : Training complet sans erreur NaN, loss stable et décroissante.

---

## 9. Tests ComfyUI

### Test 1 : LoRA + FaceID (Workflow original)

**Configuration** :
- LoRA : `elena_v4_cloud.safetensors` (strength 0.8)
- FaceID : `faceid.plusv2.sdxl.bin` (weight 0.7)
- Prompt : Bikini blanc au bord d'une piscine
- Résolution : 832x1216

**Résultat** :
- ✅ **Corps** : Excellent, proportions correctes, style cohérent
- ❌ **Visage** : Pas de ressemblance avec Elena, traits génériques

**Conclusion** : FaceID interfère avec le LoRA, le visage ne ressemble pas à Elena.

### Test 2 : LoRA seul (sans FaceID)

**Configuration** :
- LoRA : `elena_v4_cloud.safetensors`
- Strength : 1.0 puis 1.2
- Pas de FaceID
- Même prompt

**Résultats** :
- ✅ **Corps** : Toujours excellent
- ⚠️ **Visage** : Légèrement mieux mais toujours pas fidèle

**Fichiers générés** :
- `Elena_V4_str1_00001_.png` (strength 1.0)
- `Elena_V4_str1.2_00001_.png` (strength 1.2)

**Script utilisé** : `app/scripts/test-elena-lora-simple.mjs`

---

## 10. Diagnostic & Analyse

### Problème identifié

Le LoRA V4 fonctionne techniquement (pas de NaN, loss stable) mais **n'apprend pas l'identité faciale d'Elena**.

**Symptômes** :
- Corps : ✅ Style et proportions corrects
- Visage : ❌ Traits génériques, pas de ressemblance

### Causes probables (recherche Perplexity)

1. **Dataset insuffisant** :
   - 35 images est en dessous de l'idéal (50-100 recommandé)
   - Manque de diversité d'angles (face, 3/4, profil)
   - Trigger word `elena` trop commun (devrait être un token rare comme "sks")

2. **Paramètres sous-optimaux** :
   - Network Dim 32 → Recommandé 64 pour les visages
   - Pas assez de steps pour 35 images × 10 repeats

3. **Limitations SDXL** :
   - SDXL nécessite plus d'images que Flux pour apprendre l'identité
   - Moins tolérant aux erreurs de paramètres

### Solutions recommandées

#### Solution 1 : Inpainting (Court terme) ⭐
- Générer avec le LoRA corps (fonctionne bien)
- Masquer le visage
- Re-générer le visage avec FaceID seul ou un LoRA facial séparé

**Avantage** : Rapide à tester, réutilise le LoRA actuel

#### Solution 2 : LoRA facial séparé (Moyen terme) ⭐⭐
1. Recadrer les 35 images sur le visage uniquement
2. Entraîner un LoRA facial séparé avec ces headshots
3. Combiner : LoRA corps + LoRA visage dans ComfyUI

**Avantage** : Meilleur contrôle, spécialisation par partie

#### Solution 3 : Améliorer le dataset (Long terme) ⭐⭐⭐
- Ajouter 15-50 images supplémentaires
- Diversité d'angles : 40% face, 30% trois-quarts, 20% profil
- Trigger word unique : "sks", "elx", "dcai" (pas "elena")
- Network Dim 64 au lieu de 32

#### Solution 4 : Passer à Flux (Alternative) ⭐⭐⭐
- Flux apprend mieux l'identité faciale
- Nécessite moins d'images
- Plus tolérant aux erreurs de paramètres

---

## 11. Prochaines étapes

### Immédiat
- [ ] Tester l'inpainting avec FaceID sur les images générées
- [ ] Comparer les résultats strength 1.0 vs 1.2

### Court terme
- [ ] Recadrer les 35 images sur le visage
- [ ] Entraîner un LoRA facial séparé
- [ ] Tester la combinaison LoRA corps + LoRA visage

### Moyen terme
- [ ] Collecter 15-50 images supplémentaires
- [ ] Refaire les captions avec trigger word unique
- [ ] Retrainer avec Network Dim 64

### Long terme
- [ ] Évaluer le passage à Flux pour les prochains LoRAs
- [ ] Documenter le workflow deux-LoRAs (corps + visage)

### Complété (21 Janvier 2026)
- [x] Script RunPod quality tests créé (`app/scripts/runpod-quality-tests.mjs`)
- [x] Test upscaler 4x-UltraSharp sur RunPod ✅
- [x] Test génération haute résolution (1024x1536) ✅
- [ ] Test face restoration (nécessite modèle ONNX)

---

## 12. Références mises à jour

- **Session document** : `docs/sessions/2026-01-20-elena-lora-cloud-training.md`
- **Dataset local** : `lora-dataset-elena-cloud/10_elena/`
- **Script de préparation** : `app/scripts/prepare-lora-dataset-cloud.mjs`
- **Script RunPod** : `app/scripts/runpod-lora-training.mjs`
- **Script test simple** : `app/scripts/test-elena-lora-simple.mjs`
- **LoRA V4 dans ComfyUI** : `/Users/edouardtiem/ComfyUI/models/loras/elena_v4_cloud.safetensors`
- **Images de test** : `/Users/edouardtiem/ComfyUI/output/Elena_V4_str*.png`

---

## 13. Plan Futur - Double LoRA Strategy

### Constat Session 20 Janvier 2026 (soir)

**Découverte importante** : Le LoRA V4 seul (sans FaceID) produit de **meilleurs résultats** que LoRA + FaceID ensemble. FaceID interférait avec le LoRA et rendait les visages artificiels.

### Stratégie proposée

#### Phase 1 : LoRA Corps/General
- **Dataset** : 50+ photos random d'Elena (corps entier, poses variées)
- **Focus** : Silhouette, proportions, style général
- **Trigger word** : `elena_body` (unique)

#### Phase 2 : LoRA Visage
- **Dataset** : 30+ photos du visage d'Elena uniquement (headshots)
- **Focus** : Traits du visage, expressions, angles variés
- **Trigger word** : `elena_face` (unique)
- **Résolution** : Crops 512x512 ou 768x768 centrés sur le visage

#### Phase 3 : Tests de combinaison
1. **LoRA corps seul** → Génère le corps
2. **Inpainting visage** avec LoRA visage (pas FaceID)
3. Ou : **Deux LoRA ensemble** (corps + visage) avec strengths différents

### Avantages
- Chaque LoRA se spécialise sur une tâche
- Pas de confusion entre apprentissage corps/visage
- Plus de contrôle sur la génération finale

### À préparer
- [ ] Collecter 50+ photos corps entier Elena
- [ ] Collecter 30+ photos headshots Elena (angles variés)
- [ ] Créer les datasets avec captions appropriés
- [ ] Définir les paramètres de training optimaux (basés sur V4)

---

## 14. Améliorations Post-Training - Session 21 Janvier 2026

### Découvertes majeures

#### 1. Changement de Checkpoint : Big Love XL
- **Ancien** : `bigLust_v16.safetensors` → 85% ressemblance
- **Nouveau** : `bigLove_xl1.safetensors` → **95% ressemblance** ✅
- **Source** : CivitAI ID 897413
- **Avantage** : Meilleure qualité visage et texture peau

#### 2. InstantID pour Face Consistency
- **Problème** : LoRA seul = 85%, LoRA + FaceID ensemble = visages plastiques
- **Solution** : **InstantID en post-processing** après génération LoRA
- **Résultat** : **95% ressemblance Elena** ✅
- **Paramètres** : Weight 0.85, face ref `elena_face_ref.jpg`

#### 3. Prompting Détaillé
- Analyse de 5 photos Elena pour créer prompt ultra-précis
- Détails : Forme visage, yeux hazel, grain de beauté, cheveux bronde, etc.
- Script : `app/scripts/elena-instantid-test.mjs`

### Workflow Optimal Actuel

```
Checkpoint: bigLove_xl1.safetensors
LoRA: elena_v4_cloud.safetensors (strength: 1.0)
Face: InstantID (weight: 0.85) en post-processing
Résolution: 832x1216
Steps: 30, CFG: 3.0
```

**Résultat** : 95% ressemblance Elena, corps excellent, visage très bon

### Problèmes restants (5%)

1. **Direction regard** : Toujours en haut à gauche (changer photo ref InstantID)
2. **Grain** : Images granuleuses (tests upscaler/face restoration sur RunPod)
3. **Seins** : Parfois trop "parfaits" (prompt ajusté)

### Tests qualité sur RunPod - Résultats (21 Janvier 2026)

**Script créé** : `app/scripts/runpod-quality-tests.mjs` ✅

#### Session 1 : Tests basiques (sans InstantID)

| Test | Description | Résultat | Fichier |
|------|-------------|----------|---------|
| A: Upscale 4x | 4x-UltraSharp upscaler | ✅ **Succès** - 93MB output | `test1_upscale_4x_00001_.png` |
| D: High-res Gen | LoRA + SDXL 1024x1536 | ✅ **Succès** - 2.2MB output | `test4_highres_sharp_00001_.png` |

#### Session 2 : Pipeline complet avec InstantID ⭐

| Test | Description | Résultat | Fichier |
|------|-------------|----------|---------|
| InstantID | LoRA + InstantID 1024x1536 | ✅ **Succès** - 2.7MB | `elena_instantid_00001_.png` |
| InstantID + 4x | Upscale de l'image InstantID | ✅ **Succès** - 34MB (4096x6144) | `elena_instantid_4x_00001_.png` |

**Résultats téléchargés** : `output/runpod-quality-tests/`

**Workflow InstantID utilisé** :
```
CheckpointLoader (SDXL) → LoraLoader (elena_v4_cloud) → 
InstantIDModelLoader → InstantIDFaceAnalysis (CUDA) → 
LoadImage (elena_face_ref.jpg) → ControlNetLoader (instantid_controlnet) →
ApplyInstantID (weight: 0.85) → KSampler (40 steps, CFG 3.5) → 
VAEDecode → SaveImage
```

**Modèles installés sur RunPod** :
- `ip-adapter.bin` (InstantID, 1.6GB)
- `instantid_controlnet.safetensors` (2.4GB)
- `antelopev2/` (InsightFace, 5 fichiers ONNX)
- `4x-UltraSharp.pth` (64MB)
- `sd_xl_base_1.0.safetensors` (6.5GB)
- `elena_v4_cloud.safetensors` (218MB)

**Coût RunPod total** : ~$0.30 (2 sessions × ~30 min @ $0.30/hr)

### Documentation complète
- **Session qualité** : `docs/sessions/2026-01-21-elena-quality-improvements.md`
- **Scripts** : Voir section "Références" dans doc session 21 janvier
