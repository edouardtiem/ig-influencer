# Plan : Scripts RunPod pour Tests Qualité

## Objectif

Automatiser les tests de qualité sur RunPod avec GPU pour :
1. Upscaler (4x-UltraSharp, RealESRGAN)
2. Face restoration (CodeFormer)
3. Génération haute résolution avec sharp prompt

---

## Script à créer : `app/scripts/runpod-quality-tests.mjs`

### Fonctionnalités

#### 1. Création Pod ComfyUI
- Image : ComfyUI pré-installé (ou installer via script)
- GPU : RTX A5000 ou équivalent
- Volume : 50GB (pour modèles)
- Ports : 8188 (ComfyUI), 22 (SSH)
- Support public IP : true

#### 2. Setup ComfyUI
- Installer Impact Pack (face restoration)
- Installer modèles upscaler si manquants
- Installer CodeFormer si manquant
- Vérifier que tout fonctionne

#### 3. Upload fichiers nécessaires
- Image de test : `Elena_Hotel_Nude_00001_.png`
- Workflow ComfyUI (JSON)
- Modèles si nécessaires

#### 4. Exécution tests

**Test A : Upscale seul**
```javascript
Workflow:
  LoadImage → UpscaleModelLoader (4x-UltraSharp) → ImageUpscaleWithModel → SaveImage
Output: quality_tests/runpod_test1_upscale_4x.png
```

**Test B : Face restoration seul**
```javascript
Workflow:
  LoadImage → FaceDetailer (CodeFormer) → SaveImage
Output: quality_tests/runpod_test2_facefix.png
```

**Test C : Upscale + Face restoration**
```javascript
Workflow:
  LoadImage → Upscale → FaceDetailer → SaveImage
Output: quality_tests/runpod_test3_upscale_then_facefix.png
```

**Test D : Régénération haute résolution**
```javascript
Workflow:
  CheckpointLoader (BigLove) → LoRALoader (elena_v4_cloud) → 
  InstantID → KSampler (40 steps, CFG 3.5) → 
  EmptyLatentImage (1024x1536) → VAEDecode → SaveImage
Output: quality_tests/runpod_test4_highres_sharp.png
```

#### 5. Téléchargement résultats
- Download tous les outputs depuis `~/ComfyUI/output/quality_tests/`
- Sauvegarder localement dans `output/runpod-quality-tests/`

#### 6. Nettoyage
- Terminer le pod
- Libérer les ressources

---

## Structure du script

```javascript
// app/scripts/runpod-quality-tests.mjs

import { createPod, checkPodStatus, terminatePod, sshCommand, scpUpload, scpDownload } from './runpod-api.mjs';

const CONFIG = {
  gpuTypeId: 'NVIDIA RTX A5000',
  gpuCount: 1,
  volumeInGb: 50,
  imageName: 'runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel-ubuntu22.04',
  // ou image ComfyUI pré-configurée si disponible
};

async function setupComfyUI(podId, ip, port) {
  // Installer ComfyUI si pas déjà installé
  // Installer Impact Pack
  // Installer modèles upscaler
  // Installer CodeFormer
}

async function uploadTestFiles(podId, ip, port) {
  // Upload image de test
  // Upload workflows JSON
}

async function runTests(podId, ip, port) {
  // Test A: Upscale
  // Test B: Face restoration
  // Test C: Upscale + Face restoration
  // Test D: High-res generation
}

async function downloadResults(podId, ip, port) {
  // Download tous les outputs
}

async function main() {
  // 1. Créer pod
  // 2. Setup ComfyUI
  // 3. Upload fichiers
  // 4. Lancer tests
  // 5. Download résultats
  // 6. Terminer pod
}
```

---

## Workflows ComfyUI (JSON)

### Test A : Upscale
```json
{
  "1": {
    "class_type": "LoadImage",
    "inputs": { "image": "Elena_Hotel_Nude_00001_.png" }
  },
  "2": {
    "class_type": "UpscaleModelLoader",
    "inputs": { "model_name": "4x-UltraSharp.pth" }
  },
  "3": {
    "class_type": "ImageUpscaleWithModel",
    "inputs": {
      "upscale_model": ["2", 0],
      "image": ["1", 0]
    }
  },
  "4": {
    "class_type": "SaveImage",
    "inputs": {
      "filename_prefix": "quality_tests/runpod_test1_upscale_4x",
      "images": ["3", 0]
    }
  }
}
```

### Test B : Face Restoration
```json
{
  "1": {
    "class_type": "LoadImage",
    "inputs": { "image": "Elena_Hotel_Nude_00001_.png" }
  },
  "2": {
    "class_type": "FaceDetailer",
    "inputs": {
      "image": ["1", 0],
      "model": "...",
      "facedetection": "face_yolov8n.pt",
      "facerestore": "codeformer.pth"
    }
  },
  "3": {
    "class_type": "SaveImage",
    "inputs": {
      "filename_prefix": "quality_tests/runpod_test2_facefix",
      "images": ["2", 0]
    }
  }
}
```

### Test C : Upscale + Face Restoration
```json
{
  "1": { "class_type": "LoadImage", "inputs": { "image": "Elena_Hotel_Nude_00001_.png" } },
  "2": { "class_type": "UpscaleModelLoader", "inputs": { "model_name": "4x-UltraSharp.pth" } },
  "3": { "class_type": "ImageUpscaleWithModel", "inputs": { "upscale_model": ["2", 0], "image": ["1", 0] } },
  "4": { "class_type": "FaceDetailer", "inputs": { "image": ["3", 0], ... } },
  "5": { "class_type": "SaveImage", "inputs": { "filename_prefix": "quality_tests/runpod_test3_upscale_then_facefix", "images": ["4", 0] } }
}
```

### Test D : High-res Generation
Voir `app/scripts/elena-instantid-test.mjs` pour le workflow complet, adapté pour :
- Résolution : 1024x1536 ou 1536x2048
- Steps : 40-50
- CFG : 3.5-4.0
- Prompt : Sharp focus, no grain

---

## Commandes SSH nécessaires

### Setup ComfyUI
```bash
# Installer ComfyUI
cd /workspace
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI
pip install -r requirements.txt

# Installer Impact Pack
cd custom_nodes
git clone https://github.com/ltdrdata/ComfyUI-Impact-Pack.git
cd ComfyUI-Impact-Pack
pip install -r requirements.txt

# Installer modèles upscaler (si manquants)
# Les modèles doivent être dans models/upscale_models/
```

### Lancer ComfyUI
```bash
cd /workspace/ComfyUI
python main.py --listen 0.0.0.0 --port 8188
```

### Vérifier que ça tourne
```bash
curl http://localhost:8188/system_stats
```

---

## Coût estimé

- **Pod RTX A5000** : ~$0.30/heure
- **Temps estimé** : 30-60 minutes (setup + 4 tests)
- **Coût total** : ~$0.15-$0.30

---

## Checklist avant de lancer

- [ ] Vérifier crédits RunPod disponibles
- [ ] Image de test prête (`Elena_Hotel_Nude_00001_.png`)
- [ ] Workflows JSON préparés
- [ ] Script de setup testé localement si possible
- [ ] Dossier output local créé (`output/runpod-quality-tests/`)

---

## Notes

- Les tests peuvent être lancés séquentiellement ou en parallèle
- Garder le pod actif entre les tests pour éviter les coûts de setup répétés
- Télécharger les résultats après chaque test pour éviter les pertes
- Logger toutes les commandes et outputs pour debug

---

**Document créé le** : 21 Janvier 2026  
**Implémenté le** : 21 Janvier 2026  
**Script** : `app/scripts/runpod-quality-tests.mjs` ✅
