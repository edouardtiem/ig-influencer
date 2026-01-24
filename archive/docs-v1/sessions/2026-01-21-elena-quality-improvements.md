# Elena - Amélioration Qualité & Face Consistency - Session 21 Janvier 2026

## Résumé

**Objectif** : Améliorer la qualité des images générées (réduire le grain) et atteindre 100% de ressemblance avec Elena (actuellement 95%).

**Découvertes majeures** :
- ✅ **Big Love XL** testé sur RunPod → Couleurs plus naturelles que SDXL Base
- ✅ **InstantID** en post-processing → Excellent pour visage (95% ressemblance)
- ✅ **RunPod workflow** fonctionnel : BigLove + LoRA + InstantID
- ❌ **ImageSharpen** amplifie le grain (ne pas utiliser)
- ⚠️ **Grain** : Toujours présent malgré prompts optimisés → Prochaine priorité

---

## 1. Changement de Checkpoint : Big Love XL

### Contexte
- **Ancien checkpoint** : `bigLust_v16.safetensors` → 85% ressemblance Elena
- **Nouveau checkpoint** : `bigLove_xl1.safetensors` (CivitAI ID: 897413)

### Recherche Perplexity
**Question** : "Meilleurs SDXL checkpoints pour NSFW réaliste en janvier 2026 vs BigLust"

**Résultats** :
- **Big Love** (ID: 897413) : Meilleure qualité visage et texture peau que BigLust
- Version recommandée : **Photo5** (la plus récente)
- Téléchargé : **XL1** (version disponible)

### Comparaison

| Critère | BigLust v16 | Big Love XL1 |
|---------|-------------|--------------|
| **Visage** | Correct | **Meilleur** (plus naturel) |
| **Texture peau** | Bon | **Excellent** |
| **Ressemblance Elena** | ~85% | **~95%** |
| **Grain** | Présent | Présent (même niveau) |

### Installation
```bash
# Téléchargé manuellement depuis CivitAI
# Placé dans : ~/ComfyUI/models/checkpoints/bigLove_xl1.safetensors
# Taille : 6.5GB
```

---

## 2. InstantID pour Face Consistency

### Problème initial
- LoRA seul : 85% ressemblance
- LoRA + FaceID ensemble : Visages plastiques/artificiels ❌

### Solution : InstantID en post-processing

**Workflow découvert** :
1. **Générer avec LoRA seul** → Corps parfait
2. **Appliquer InstantID après** → Visage fidèle

### Résultats

| Setup | Résultat |
|-------|----------|
| BigLust + LoRA seul | ~85% Elena |
| Big Love + LoRA seul | ~85% Elena (meilleure qualité) |
| **Big Love + LoRA + InstantID** | **~95% Elena** ✅ |

### Paramètres InstantID optimaux
- **Weight** : 0.85
- **Face reference** : `elena_face_ref.jpg` (photo frontale)
- **Checkpoint** : Big Love XL1
- **LoRA strength** : 1.0

### Script créé
- `app/scripts/elena-instantid-test.mjs` : Test InstantID avec prompt détaillé

---

## 3. Prompting Détaillé pour Elena

### Analyse des photos de référence
5 photos Elena analysées pour créer un prompt ultra-détaillé :

**Visage** :
- Forme : Ovale/cœur, contours doux, pommettes hautes
- Yeux : Noisette-vert avec tons dorés/miel (hazel eyes)
- Nez : Droit avec légère pente, bout arrondi
- Lèvres : Pulpeuses, lèvre inférieure plus grande, arc de cupidon défini
- Grain de beauté : Joue droite, près de la pommette (signature !)
- Peau : Bronzée dorée, sun-kissed, texture lisse

**Cheveux** :
- Couleur : Bronde - racines foncées + balayage blond doré/miel
- Style : Mi-longs, beach waves texturées

**Corps** :
- Athlétique mais curvy
- Taille fine, hanches larges
- Poitrine naturelle pleine
- Bras toniques

**Accessoires signature** :
- Colliers dorés superposés avec médaillon
- Bracelet chaîne dorée

### Prompt template créé
Voir `app/scripts/elena-instantid-test.mjs` pour le prompt complet.

---

## 4. Tests Qualité / Réduction Grain

### Problème identifié
- Images générées avec **grain visible** ("points gris partout")
- Qualité bonne mais manque de netteté

### Tests effectués

#### Test 1 : ImageSharpen (post-processing)
**Résultat** : ❌ **ÉCHEC**
- Amplifie le grain au lieu de le réduire
- Image encore plus dégradée
- **Conclusion** : Ne pas utiliser ImageSharpen sur images granuleuses

**Script** : Workflow simple avec node `ImageSharpen`
**Output** : `quality_tests/test_sharpen_00001_.png`

#### Test 2 : Upscaler 4x-UltraSharp
**Résultat** : ❌ **ERREUR**
```
RuntimeError: view size is not compatible with input tensor's size and stride
```
- Modèle téléchargé : `4x-UltraSharp.pth` (64MB)
- Erreur lors de l'upscaling
- **À refaire sur RunPod** (problème de compatibilité locale)

#### Test 3 : Upscaler RealESRGAN x4plus
**Résultat** : ❌ **ERREUR**
- Même erreur tensor que 4x-UltraSharp
- Modèle téléchargé : `RealESRGAN_x4plus.pth` (64MB)
- **À refaire sur RunPod**

#### Test 4 : Sharp prompt + 40 steps + CFG 3.5
**Résultat** : ⏳ **INTERROMPU**
- Génération trop lente avec InstantID sur CPU local
- Prompt amélioré avec "ultra sharp focus, crystal clear, no grain"
- **À refaire sur RunPod** (GPU)

#### Test 5 : High-res sans InstantID (1024x1536)
**Résultat** : ⏳ **INTERROMPU**
- Génération bloquée ou très lente
- **À refaire sur RunPod**

### Modèles installés
- ✅ `4x-UltraSharp.pth` : `~/ComfyUI/models/upscale_models/`
- ✅ `RealESRGAN_x4plus.pth` : `~/ComfyUI/models/upscale_models/`
- ✅ `codeformer.pth` : `~/ComfyUI/models/facerestore_models/` (376MB)
- ✅ `ComfyUI-Impact-Pack` : `~/ComfyUI/custom_nodes/` (pour face restoration)

---

## 5. Plan RunPod pour Tests Qualité

### Objectif
Refaire les tests de qualité sur RunPod avec GPU pour :
1. Upscaler (4x-UltraSharp ou RealESRGAN)
2. Face restoration (CodeFormer via Impact Pack)
3. Génération haute résolution avec sharp prompt

### Workflow à automatiser

```
1. Créer pod RunPod avec ComfyUI
2. Upload workflow + modèles nécessaires
3. Lancer génération avec paramètres optimaux
4. Télécharger résultats
5. Arrêter pod
```

### Scripts à créer

#### `app/scripts/runpod-quality-tests.mjs`
- Créer pod avec ComfyUI pré-installé
- Upload workflow de test
- Lancer génération
- Télécharger outputs
- Terminer pod

#### Tests à exécuter sur RunPod

**Test A : Upscale seul**
- Input : `Elena_Hotel_Nude_00001_.png`
- Upscaler : 4x-UltraSharp
- Output : `quality_tests/runpod_test1_upscale_4x.png`

**Test B : Face restoration seul**
- Input : `Elena_Hotel_Nude_00001_.png`
- CodeFormer via Impact Pack
- Output : `quality_tests/runpod_test2_facefix.png`

**Test C : Upscale + Face restoration**
- Input : `Elena_Hotel_Nude_00001_.png`
- Pipeline : Upscale → CodeFormer
- Output : `quality_tests/runpod_test3_upscale_then_facefix.png`

**Test D : Régénération haute résolution**
- Setup : Big Love + LoRA + InstantID
- Résolution : 1024x1536 ou 1536x2048
- Steps : 40-50
- CFG : 3.5-4.0
- Prompt : Sharp focus, no grain
- Output : `quality_tests/runpod_test4_highres_sharp.png`

---

## 6. Problèmes Restants (5% manquants)

### 1. Direction du regard
**Problème** : Elena regarde toujours en haut à gauche (à droite sur photo)
- Cause probable : Photo de référence InstantID (`elena_face_ref.jpg`)
- Solution : Utiliser photo avec regard caméra direct
- Prompt : Ajouter `looking at camera`, `direct eye contact`

### 2. Grain / Qualité
**Problème** : Images granuleuses malgré bon checkpoint
- Solutions à tester sur RunPod :
  - Upscaler post-processing
  - Face restoration
  - Génération haute résolution
  - Différents samplers (euler, dpm++)

### 3. Seins "faux"
**Problème** : Seins trop parfaits/artificiels
- Solution : Prompt ajusté avec "natural sag, soft breast tissue"
- Negative : "fake breasts, silicone, implants, perfect round breasts"

---

## 7. Workflow Final Optimal (Actuel)

### Setup
- **Checkpoint** : `bigLove_xl1.safetensors`
- **LoRA** : `elena_v4_cloud.safetensors` (strength: 1.0)
- **Face consistency** : InstantID (weight: 0.85)
- **Face reference** : `elena_face_ref.jpg`

### Paramètres génération
- **Résolution** : 832x1216
- **Steps** : 30
- **CFG** : 3.0
- **Sampler** : `dpmpp_2m_sde`
- **Scheduler** : `karras`

### Prompt structure
```
[Description visage détaillée Elena]
[Description corps]
[Pose/scène]
[Qualité: masterpiece, photorealistic, 8k uhd]
```

### Résultat actuel
- **Ressemblance** : ~95% Elena
- **Corps** : Excellent
- **Visage** : Très bon (manque 5%)
- **Qualité** : Bonne mais grain présent

---

## 8. Références

### Scripts créés
- `app/scripts/elena-instantid-test.mjs` : Test InstantID avec prompt détaillé
- `app/scripts/test-checkpoint-comparison.mjs` : Comparaison checkpoints
- `app/scripts/elena-biglove-batch.mjs` : Batch génération avec Big Love
- `app/scripts/perplexity-search.mjs` : Recherche Perplexity API

### Images de référence
- `~/ComfyUI/input/elena_face_ref.jpg` : Photo frontale pour InstantID
- `~/ComfyUI/input/elena_face_ref_2.jpg` : Alternative
- `temp-elena-ref/` : 5 photos Elena analysées

### Outputs tests
- `~/ComfyUI/output/Elena_Hotel_Nude_00001_.png` : Image de référence (granuleuse)
- `~/ComfyUI/output/quality_tests/test_sharpen_00001_.png` : Test sharpen (échec)
- `~/ComfyUI/output/quality_tests/` : Dossier pour tous les tests qualité

### Modèles installés
- Checkpoint : `bigLove_xl1.safetensors` (6.5GB)
- Upscalers : `4x-UltraSharp.pth`, `RealESRGAN_x4plus.pth`
- Face restoration : `codeformer.pth` (376MB)
- Custom nodes : `ComfyUI-Impact-Pack`

---

## 9. Tests RunPod avec BigLove (21 Jan 2026 - Soir)

### Setup RunPod
- **Pod** : NVIDIA RTX A5000 (24GB VRAM)
- **ComfyUI** : v0.10.0
- **Torch** : 2.4.0 (nécessaire pour ComfyUI récent)

### Problèmes rencontrés et résolus
1. **comfy_kitchen incompatible** → Désinstallé (optionnel)
2. **torch.compiler.is_compiling** manquant → Upgrade torch 2.2→2.4
3. **torch.library.custom_op** manquant → Même fix torch 2.4

### Configuration testée
```
Checkpoint : bigLove_xl1.safetensors ✅
LoRA : elena_v4_cloud.safetensors (strength: 1.0)
InstantID : ip-adapter.bin (weight: 0.85)
Face ref : elena_face_ref.jpg
Résolution : 832x1216
Steps : 40
CFG : 3.0
Sampler : dpmpp_2m_sde + karras
```

### Prompts utilisés
**Positive** :
```
elena, fully nude, completely naked, no clothes, bare breasts, nipples visible, 
beautiful woman, 24 year old Italian woman, natural lighting, soft diffused light, 
realistic skin tones, raw photo, smooth skin, no grain, no noise, clean image, 
oval heart-shaped face, honey brown hazel eyes, bronde hair dark roots golden highlights, 
sun-kissed skin, small beauty mark on right cheek, natural breasts, athletic curvy body, 
slim waist, wide hips, lying on white bed sheets, bedroom, intimate setting, 
masterpiece, best quality, photorealistic
```

**Negative** :
```
clothes, underwear, bikini, bra, panties, clothing, dressed, grainy, noisy, 
film grain, oversaturated, orange skin, unnatural colors, worst quality, 
low quality, blurry, cartoon, anime, plastic skin, deformed, bad anatomy
```

### Résultat
- **Output** : `output/runpod-quality-tests/elena_biglove_nude_00001_.png` (1.1MB, 832×1216)
- **Verdict** : ✅ **Satisfaisant** - Couleurs plus naturelles qu'avant
- **Problème restant** : ⚠️ **Grain encore présent** malgré prompts "no grain"

### Comparaison SDXL Base vs BigLove
| Critère | SDXL Base | BigLove XL |
|---------|-----------|------------|
| Couleurs | Plus froides/saturées | **Plus naturelles** ✅ |
| Peau | Correcte | **Plus réaliste** ✅ |
| Grain | Présent | Présent (similaire) |
| Visage | Bon avec InstantID | **Meilleur** ✅ |

---

## 10. Prochaines étapes

### Réduction du grain (priorité)
- [ ] Tester CFG encore plus bas (2.0-2.5)
- [ ] Tester sampler `euler` ou `dpmpp_3m_sde`
- [ ] Tester génération à résolution plus haute puis downscale
- [ ] Tester upscaler 4x-UltraSharp sur RunPod
- [ ] Tester denoising léger en post-processing

### Court terme
- [ ] Changer photo référence InstantID (regard caméra)
- [ ] Optimiser prompt pour seins naturels

### Moyen terme
- [ ] Évaluer SUPIR (super-resolution) si upscalers ne suffisent pas
- [ ] Documenter workflow optimal final

---

## 11. Notes techniques

### InstantID vs FaceID
- **FaceID** : Interfère avec LoRA → visages plastiques
- **InstantID** : Fonctionne mieux en post-processing → visages naturels

### Ordre d'application recommandé
1. Générer avec LoRA (corps)
2. Appliquer InstantID (visage)
3. Post-processing : Upscale + Face restoration (si nécessaire)

### Problèmes de compatibilité locale
- Upscalers : Erreurs tensor (probablement problème mémoire/GPU)
- Impact Pack : Dépendances manquantes (torchvision)
- **Solution** : Utiliser RunPod avec GPU dédié

---

**Document créé le** : 21 Janvier 2026  
**Dernière mise à jour** : 21 Janvier 2026, 23h30

---

## Fichiers générés

| Fichier | Description |
|---------|-------------|
| `output/runpod-quality-tests/elena_biglove_nude_00001_.png` | BigLove + LoRA + InstantID (1.1MB) |
| `output/runpod-quality-tests/elena_nude_natural_00001_.png` | SDXL Base + LoRA + InstantID |
| `output/runpod-quality-tests/elena_nude_4x_00001_.png` | Version upscalée 4x |
