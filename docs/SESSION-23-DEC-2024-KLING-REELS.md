# 📅 Session 23 Décembre 2024 — Kling Video Reels Migration

**Date** : 23 décembre 2024  
**Durée** : ~1h30

---

## ✅ Ce qui a été fait cette session

### 1. Migration tous les reels vers Kling v2.5
- **Suppression des "photo reels"** (slideshows FFmpeg)
- **Tous les reels** utilisent maintenant Kling pour l'animation
- 3 images → 3 clips animés → 1 vidéo de ~15 secondes

### 2. Nouveau style Instagram 2026
- Prompts mis à jour pour un look authentique
- "iPhone 15 Pro quality, authentic influencer aesthetic"
- "Main character energy, effortlessly cool"
- Évite le look studio/magazine

### 3. Kling Prompts optimisés
- **Real-time speed** (NO slow motion)
- Mouvements subtils naturels (respiration, cheveux, micro-expressions)
- Caméra statique ou très léger pan
- Style "caught on camera" authentique

### 4. Script de test créé
- `test-reel-kling-pipeline.mjs` pour valider le pipeline
- Support Mila et Elena
- Debug des outputs Replicate

---

## 📁 Fichiers créés/modifiés

### Créé
- `app/scripts/test-reel-kling-pipeline.mjs` — Script de test standalone

### Modifié
- `app/scripts/scheduled-post.mjs` — Intégration Kling + nouveaux prompts
- `app/scripts/cron-scheduler.mjs` — Force `reel_type: 'video'`
- `app/scripts/cron-executor.mjs` — Simplifie affichage reel info

---

## 🔧 Détails techniques

### Nouveau flow Reel
```
1. Nano Banana Pro → 3 images (9:16)
2. Kling v2.5 → 3 clips animés (5 sec chacun, parallèle)
3. FFmpeg → Assemblage 15 sec
4. Cloudinary → Upload vidéo
5. Instagram → Publication (sans musique)
6. Manuel → Ajout son trending via app
```

### Kling Prompt Template
```javascript
function buildKlingPrompt(action, setting, mood) {
  return `SETTING: ${setting}

ACTION: ${action}

STYLE: Instagram Reel 2026 aesthetic
- iPhone video quality, authentic content vibe
- Natural casual movement (not choreographed)
- "Caught on camera" authentic feel

SPEED CRITICAL:
- REAL-TIME SPEED only
- NO slow motion whatsoever
- Normal human movement pace

MOVEMENTS (subtle and natural):
- Gentle breathing visible in shoulders
- Hair moving slightly with natural air
- Natural eye blinks
- Micro-expressions

CAMERA: Static or very subtle pan.

MOOD: ${mood}`;
}
```

### Coûts estimés
- **Nano Banana Pro** : ~$0.05/image × 3 = $0.15
- **Kling v2.5 Turbo Pro** : ~$0.45/clip × 3 = $1.35
- **Total par reel** : ~$1.50

### Temps de génération
- Images : ~2 minutes (séquentiel pour scene consistency)
- Clips Kling : ~2-3 minutes (parallèle)
- Assembly FFmpeg : <5 secondes
- **Total** : ~5-7 minutes par reel

---

## 🎵 Musique — Décision

**Choix : Pas de musique automatique**

Raisons :
1. Les musiques trending Instagram = +50-200% de reach
2. L'algo récompense les "native sounds"
3. Musiques ajoutées via FFmpeg ne sont pas reconnues comme trending

**Workflow final :**
1. Système publie le reel sans audio
2. Notification reçue
3. Ouvrir app Instagram → Edit → Add music → Son trending
4. ~30 secondes de travail manuel pour un gros boost

---

## 📋 À faire prochaine session

- [ ] Tester un reel complet en production (via scheduler)
- [ ] Monitorer la qualité Kling vs photo slideshows
- [ ] Ajouter des métriques de comparaison engagement

---

## 💡 Idées notées

- **Library de musiques royalty-free** avec timestamps des "drops" pour fallback automatique
- **Notification push** avec suggestion de son trending basé sur le mood du reel

---

## 📝 Notes importantes

### Format images
- **Carousels** : 4:5 (portrait Instagram classique)
- **Reels** : 9:16 (vertical plein écran)

### Bug corrigé
- **URL extraction Replicate** : L'output Kling n'était pas une simple string, ajout de logique robuste pour extraire l'URL depuis différents formats

---

## 🧪 Commandes de test

```bash
# Test Mila
node scripts/test-reel-kling-pipeline.mjs

# Test Elena
node scripts/test-reel-kling-pipeline.mjs elena

# Voir les fichiers générés
open app/generated/test-kling-pipeline/
```

---

*Session documentée le 23 décembre 2024*

