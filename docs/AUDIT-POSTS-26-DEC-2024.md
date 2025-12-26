# 🔍 Audit Posts — 26 Décembre 2024

> Analyse complète des posts générés vs publiés

**Date** : 26 décembre 2024  
**Script** : `scripts/audit-posts.mjs`

---

## 📊 Résultats de l'audit

**Total posts analysés** : 26 (7 derniers jours)

---

## 🔴 CRITIQUE : Posts marqués "posted" mais sans instagram_post_id

**9 posts** ont été marqués comme "posted" alors qu'ils n'ont jamais été publiés sur Instagram.

### Liste des posts affectés :

| Date | Heure | Personnage | Location | Status | Instagram ID |
|------|-------|------------|----------|--------|--------------|
| 2025-12-26 | 10:00 | Elena | Penthouse Dubai Marina | posted | **NULL** |
| 2025-12-25 | 12:30 | Mila | Plage Hossegor | posted | **NULL** |
| 2025-12-25 | 12:30 | Elena | Hôtel Claridge's London | posted | **NULL** |
| 2025-12-23 | 21:00 | Elena | Chambre Elena | posted | **NULL** |
| 2025-12-23 | 21:00 | Mila | Villa Mykonos | posted | **NULL** |
| 2025-12-23 | 13:30 | Elena | Villa Bali | posted | **NULL** |
| 2025-12-23 | 12:30 | Mila | L'Usine Paris | posted | **NULL** |
| 2025-12-23 | 10:00 | Elena | Loft Elena Paris 8e | posted | **NULL** |
| 2025-12-23 | 08:00 | Mila | Chambre Mila | posted | **NULL** |

---

## 🐛 Cause racine

**BUG-010** : Le code `publishCarousel()` dans `scheduled-post.mjs` ne vérifie pas les erreurs retournées par l'API Instagram.

### Code actuel (ligne 761-795) :

```javascript
async function publishCarousel(character, imageUrls, caption) {
  // ... création containers ...
  
  const publishData = await publishResponse.json();
  
  log(`✅ Carousel published! ID: ${publishData.id}`);
  return publishData.id;  // ❌ Retourne undefined si erreur !
}
```

**Problème** :
- Si l'API retourne une erreur (token invalide, rate limit, etc.), `publishData.id` est `undefined`
- Le code retourne quand même `undefined` sans vérifier
- `cron-executor.mjs` marque le post comme "posted" avec `instagram_post_id: undefined`
- Le post est considéré comme publié alors qu'il ne l'est pas

---

## 📋 Impact

### Perte de contenu :
- **9 carrousels** générés (27 images au total)
- Images uploadées sur Cloudinary ✅
- Mais **jamais publiés sur Instagram** ❌

### Faux positifs :
- Le système pense que les posts sont publiés
- Pas de retry automatique
- Pas d'alerte d'erreur visible

---

## 🔧 Solution

### 1. Fix immédiat : Ajouter gestion d'erreurs

```javascript
async function publishCarousel(character, imageUrls, caption) {
  // ... création containers ...
  
  const publishData = await publishResponse.json();
  
  // ✅ Vérifier les erreurs API
  if (publishData.error) {
    throw new Error(`Instagram API error: ${publishData.error.message} (code: ${publishData.error.code})`);
  }
  
  // ✅ Vérifier que l'ID existe
  if (!publishData.id) {
    throw new Error('Instagram API returned no post ID - publication may have failed');
  }
  
  log(`✅ Carousel published! ID: ${publishData.id}`);
  return publishData.id;
}
```

### 2. Corriger les posts existants

Les 9 posts doivent être :
- Status changé de "posted" → "failed"
- Permettre retry automatique
- Ou régénérer les posts manquants

---

## 📁 Scripts concernés

### Scripts qui génèrent des photos via Replicate :

1. **`scheduled-post.mjs`** ⚠️ **PRINCIPAL**
   - Utilisé par `cron-executor.mjs`
   - Génère images + publie
   - **BUG-010** : Pas de gestion d'erreurs

2. **`carousel-post.mjs`** (Mila auto-post)
   - Script standalone pour Mila
   - Génère + publie directement
   - À vérifier gestion d'erreurs

3. **`carousel-post-elena.mjs`** (Elena auto-post)
   - Script standalone pour Elena
   - Génère + publie directement
   - À vérifier gestion d'erreurs

4. **`duo-post.mjs`** (Duo posts)
   - Posts Mila x Elena
   - Génère + publie
   - À vérifier gestion d'erreurs

5. **`photo-reel-post.mjs`** / **`photo-reel-post-elena.mjs`**
   - Anciens scripts reels (plus utilisés)
   - Génèrent images pour slideshow

### Scripts qui publient uniquement :

- **`cron-executor.mjs`** : Appelle `publishCarouselToInstagram()` depuis `scheduled-post.mjs`
- **`scheduled-post.mjs`** : Exporte `publishCarouselToInstagram()` et `publishReelToInstagram()`

---

## 🎯 Actions recommandées

### Priorité 🔴 HIGH :

1. **Fixer BUG-010** : Ajouter gestion d'erreurs dans `publishCarousel()` et `publishReel()`
2. **Corriger les 9 posts** : Reset status pour permettre retry
3. **Vérifier autres scripts** : `carousel-post.mjs`, `carousel-post-elena.mjs`, `duo-post.mjs`

### Priorité 🟡 MEDIUM :

4. **Monitoring** : Ajouter alertes si `instagram_post_id` est null après publication
5. **Logs** : Logger toutes les erreurs API pour debugging
6. **Retry automatique** : Améliorer le système de retry pour les erreurs API

---

## 📝 Notes

- Les images sont bien générées et uploadées sur Cloudinary
- Le problème est uniquement dans la publication Instagram
- Le bug existe depuis au moins le 23 décembre (premier post affecté)
- Les tokens GitHub ont été synchronisés le 24 décembre, mais le bug persiste car pas de gestion d'erreurs

---

**Prochaine étape** : Fixer BUG-010 immédiatement pour éviter de nouvelles pertes de contenu.

