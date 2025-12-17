# 📝 Session 17 Décembre 2024 — Simplification Références Images

**Date** : 17 décembre 2024  
**Durée** : ~30min

---

## ✅ Ce qui a été fait cette session

### 1. Diagnostic GitHub Actions
- Analysé les 3 workflows actifs :
  - `auto-post.yml` (Mila) — 4 posts/jour
  - `auto-post-elena.yml` (Elena) — 5 posts/jour
  - `vacation-reel.yml` (Mila Reel) — 1 post/jour
- Identifié que les images se génèrent sur Replicate mais ne se postent pas sur Instagram
- **Cause probable** : Token Instagram expiré ou secrets GitHub manquants

### 2. Diagnostic Inconsistance Visage Mila
- Identifié le problème : trop de références d'images (3-5) causent une "confusion" du modèle
- Le modèle Nano Banana Pro "moyenne" les caractéristiques au lieu de les reproduire fidèlement
- Solution : réduire à **2 références seulement** (visage + corps)

### 3. Simplification des Références
**Avant** :
```javascript
// 3-5 références qui diluent l'identité
const refs = [PRIMARY_FACE_URL, ...FACE_REFS.slice(0, 2)];
if (!isHero && heroImageUrl) {
  refs.unshift(heroImageUrl);
  refs.unshift(heroImageUrl);
}
```

**Après** :
```javascript
// 2 références claires et distinctes
const MILA_FACE_REF = '...Photo_1_ewwkky.png';
const MILA_BODY_REF = '...Photo_5_kyx12v.png';
const refs = [MILA_FACE_REF, MILA_BODY_REF];
```

---

## 📁 Fichiers modifiés

| Fichier | Changement |
|---------|------------|
| `app/scripts/carousel-post.mjs` | Simplifié à 2 références (MILA_FACE_REF + MILA_BODY_REF) |
| `app/scripts/carousel-post-elena.mjs` | Simplifié à 2 références (ELENA_FACE_REF + ELENA_BODY_REF), supprimé dépendance env vars |
| `.github/workflows/auto-post-elena.yml` | Supprimé secrets inutiles (ELENA_PRIMARY_FACE_URL, ELENA_FACE_REF_1/2) |

---

## 📊 Nouvelles Références

| Personnage | Face Reference | Body Reference |
|------------|----------------|----------------|
| **Mila** | `Photo_1_ewwkky.png` | `Photo_5_kyx12v.png` |
| **Elena** | `replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png` | `replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png` |

---

## 📋 À faire prochaine session

- [ ] Vérifier les logs GitHub Actions pour diagnostic exact du problème de posting
- [ ] Vérifier/renouveler les tokens Instagram si expirés
- [ ] Tester un post manuel pour valider la nouvelle config références
- [ ] Envisager un LoRA fine-tuned pour consistance maximale

---

## 💡 Notes importantes

- **Moins de références = mieux** pour Nano Banana Pro
- Les références multiples créent un "blend" plutôt qu'une identité cohérente
- Pour une consistance parfaite, un LoRA fine-tuné sur 20-30 photos serait idéal
- Alternative : utiliser Flux avec PuLID/InstantID pour face-locking

---

*Session terminée — Commit: `fix: simplify image references for better consistency`*

