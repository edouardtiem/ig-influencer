# 📝 Session 15 Décembre 2024 — Video & Reels Strategy

**Date** : 15 décembre 2024  
**Durée** : ~2h  
**Focus** : Benchmark modèles vidéo I2V, stratégie Reels, documentation

---

## ✅ Ce qui a été fait

### 1. Benchmark Modèles Image-to-Video

Testé 5 modèles avec la même image (morning coffee) :

| Model | Temps | Coût | Verdict |
|-------|-------|------|---------|
| Google Veo 3.1 | 60s | $0.70/8s | ✅ Bon, audio natif |
| MiniMax Hailuo 2.3 | 78s | $0.90/6s | ✅ Mouvements réalistes |
| Wan 2.5 I2V | 91s | $0.30/~3s | ⚠️ Économique mais basique |
| **Kling v2.5 Turbo Pro** | 128s | $0.50/5s | ✅ **CHOISI** |
| Luma Ray | 472s | $0.40/5s | ❌ Trop lent |

### 2. Tests Sora 2 / Sora 2 Pro

- Sora 2 (720p) : $0.80/8s — Résultats inférieurs à Veo/Kling
- Sora 2 Pro (1080p) : $4.00/8s — Qualité mais trop cher

### 3. Test 3 Reels avec Kling

3 scénarios testés avec succès :

| Reel | Image | Résultat |
|------|-------|----------|
| 💪 Workout | gym-04-mirror-selfie | ✅ |
| ☕ Morning | morning-coffee-bodysuit | ✅ |
| ✨ Confidence | mirror-selfie-03-confident | ✅ |

**Coût total tests** : ~$3.50

### 4. Stratégie Reels Documentée

- Target audience analysée
- 3 types de reels définis (Body, Lifestyle, Getting Ready)
- Planning hebdomadaire (3 reels/semaine)
- Concept multi-shot validé (carousel → video)

### 5. Documentation Créée

- `docs/17-VIDEO-REELS-PIPELINE.md` — Pipeline complet Kling
- `docs/README.md` — Mis à jour avec nouvelle structure
- `ROADMAP.md` — Système de tracking créé
- `roadmap/` — Structure complète avec templates

---

## 📁 Fichiers créés/modifiés

### Nouveaux fichiers

```
docs/17-VIDEO-REELS-PIPELINE.md          # Doc pipeline vidéo
docs/README.md                            # Index docs mis à jour
ROADMAP.md                                # Tracking features/bugs/idées
roadmap/README.md                         # Guide roadmap
roadmap/_templates/TEMPLATE-feature.md
roadmap/_templates/TEMPLATE-bug.md
roadmap/_templates/TEMPLATE-idea.md
roadmap/_templates/SESSION-SAVE-SNIPPET.md
roadmap/in-progress/IP-001-reels-pipeline.md
roadmap/todo/TODO-001-multi-shot-reels.md
```

### Scripts de test créés

```
app/scripts/test-sora2-vs-veo31.mjs
app/scripts/test-sora2-only.mjs
app/scripts/test-sora2-pro.mjs
app/scripts/benchmark-i2v-models.mjs
app/scripts/test-kling-scenarios.mjs
app/scripts/test-3-reels-kling.mjs
```

---

## 🎯 Décisions prises

1. **Modèle vidéo** : Kling v2.5 Turbo Pro
   - Meilleur ratio qualité/prix
   - ~$0.50/5s
   - Excellente consistance visage

2. **Stratégie Reels** : 3/semaine
   - Lundi : Workout
   - Mercredi : Lifestyle
   - Vendredi : Getting Ready

3. **Format recommandé** : Multi-shot
   - 3 images carousel → 3 clips 4s → 1 reel 12s
   - Plus dynamique et engageant

4. **Budget vidéo** : $6-15/mois
   - Simple (3×$0.50) = $6/mois
   - Multi-shot (3×3×$0.40) = $14/mois

---

## 📋 À faire prochaine session

- [ ] Implémenter `src/lib/kling.ts`
- [ ] Implémenter `src/lib/ffmpeg.ts` pour assemblage
- [ ] Créer endpoint `/api/reels/generate`
- [ ] Tester pipeline multi-shot avec gym-carousel

---

## 💡 Idées notées

- Pipeline multi-shot carousel → video
- Système de tracking roadmap
- Prompts optimisés par scénario (workout, morning, confidence)

---

## 📝 Notes importantes

- Les prompts Sora 2 vs Kling sont différents — Kling préfère des instructions plus directes
- FFmpeg disponible sur Vercel/Railway par défaut
- Les URLs Replicate sont temporaires — télécharger ou upload Cloudinary rapidement

---

*Session archivée le 15 décembre 2024*

