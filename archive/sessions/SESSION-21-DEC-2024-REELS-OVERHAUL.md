# 📝 SESSION — 21 Décembre 2024 (Partie 2)

## 🎬 Reels System Overhaul — Photo vs Video Reels

**Date** : 21 décembre 2024  
**Durée** : ~1h

---

### ✅ Ce qui a été fait cette session :

1. **Renommage des scripts reels** pour clarté
   - `vacation-reel-post.mjs` → `photo-reel-post.mjs`
   - `vacation-reel-post-elena.mjs` → `photo-reel-post-elena.mjs`
   - `sauna-reel-v2.mjs` → `video-reel-post.mjs` (refactorisé)

2. **Nouveau système dual reel_type**
   - `photo` : Slideshow 3 photos FFmpeg (~2min)
   - `video` : Animation Kling v2.5 Turbo Pro (~10min, premium)

3. **Exploration rule "minimum 2 reels/jour"**
   - Obligatoire si 3+ posts prévus
   - Video reel recommandé Mar/Jeu/Sam

4. **Vitesse Kling corrigée**
   - Prompts explicites "REAL-TIME SPEED, NO SLOW MOTION"
   - Mouvements naturels et dynamiques

5. **Executor mis à jour**
   - Route vers `photo-reel-post.mjs` ou `video-reel-post.mjs`
   - Passe le `reel_theme` en argument

---

### 📁 Fichiers créés/modifiés :

**Renommés :**
- `app/scripts/vacation-reel-post.mjs` → `photo-reel-post.mjs`
- `app/scripts/vacation-reel-post-elena.mjs` → `photo-reel-post-elena.mjs`

**Créés :**
- `app/scripts/video-reel-post.mjs` — Script générique pour reels animés Kling

**Modifiés :**
- `app/scripts/cron-scheduler.mjs` — Ajout `reel_type`, `reel_theme`, règle min 2 reels
- `app/scripts/cron-executor.mjs` — Routing vers bon script selon `reel_type`

---

### 🚧 En cours (non terminé) :
- Rien — Tous les objectifs atteints ✅

---

### 📋 À faire prochaine session :
- [ ] Créer `video-reel-post-elena.mjs` (version Elena avec ses références)
- [ ] Ajouter plus de thèmes video-reel (yoga, street, cozy)
- [ ] Tester un video-reel en production
- [ ] Tracker performance photo-reel vs video-reel

---

### 🐛 Bugs découverts :
- Aucun bug découvert cette session

---

### 💡 Idées notées :
- Ajouter un système de "budget" Kling (max X video-reels/semaine pour coûts)
- Créer des templates de video prompts par mood (cozy, energetic, peaceful)
- Cross-account video reel (Mila + Elena dans le même reel)

---

### 📝 Notes importantes :

**Architecture finale des reels :**

```
SCHEDULER décide:
├── post_type: "reel"
├── reel_type: "photo" | "video"
└── reel_theme: "fitness" | "spa" | "lifestyle" | "travel"

EXECUTOR route vers:
├── reel_type: "photo" → photo-reel-post.mjs (slideshow)
└── reel_type: "video" → video-reel-post.mjs (Kling animé)
```

**Modèle utilisé pour video-reels :**
- **Kling v2.5 Turbo Pro** (`kwaivgi/kling-v2.5-turbo-pro`)
- Veo 3.1 identifié comme upgrade futur (meilleur mais plus cher)

**Règles d'exploration ajoutées :**
```javascript
// Minimum 2 reels si 3+ posts
if (postsCount >= 3) {
  rule: 'OBLIGATOIRE: Minimum 2 REELS par jour'
}

// Video reel recommandé certains jours
const videoReelDays = [2, 4, 6]; // Mar, Jeu, Sam
if (videoReelDays.includes(dayOfWeek)) {
  rule: 'RECOMMANDÉ: Inclure 1 video-reel animé (Kling)'
}
```

**Exemple output Elena :**
```
10:00 │ REEL (photo)  │ ✨ Chambre Elena
14:00 │ REEL (video)  │ 📸 Villa Bali [Kling animé]
20:00 │ CAROUSEL      │ ✨ Loft Elena
```

---

### 📊 Comparaison photo vs video reel

| Critère | Photo Reel | Video Reel |
|---------|------------|------------|
| **Temps génération** | ~2 min | ~10 min |
| **Coût API** | ~$0.15 | ~$0.50 |
| **Engagement** | Baseline | +30% estimé |
| **Usage recommandé** | Quotidien | 3x/semaine |
| **Script** | `photo-reel-post.mjs` | `video-reel-post.mjs` |

---

**Commits de cette session :**
```
02b46a9  feat: Reel system overhaul - photo vs video reels + minimum 2 reels/day
```

