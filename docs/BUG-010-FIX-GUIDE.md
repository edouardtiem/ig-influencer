# 🔧 BUG-010 Fix Guide — Gestion d'erreurs API Instagram

> Guide pour corriger la gestion d'erreurs dans tous les scripts de publication Instagram

**Date** : 26 décembre 2024  
**Bug** : BUG-010 — Pas de gestion d'erreurs API Instagram  
**Status** : ✅ Fixé dans `scheduled-post.mjs`

---

## 🎯 Problème

Les scripts de publication Instagram ne vérifient pas les erreurs retournées par l'API. Si l'API retourne une erreur (token invalide, rate limit, etc.), le code marque quand même le post comme "posted" avec `instagram_post_id: null`.

### Symptômes

- Post marqué `status: 'posted'` dans la base de données
- Mais `instagram_post_id: null` → jamais publié sur Instagram
- Images générées et uploadées sur Cloudinary ✅
- Mais publication Instagram échouée silencieusement ❌

---

## ✅ Solution appliquée dans `scheduled-post.mjs`

### Avant (❌ Incorrect)

```javascript
const publishData = await publishResponse.json();

log(`✅ Carousel published! ID: ${publishData.id}`);
return publishData.id;  // ❌ Retourne undefined si erreur !
```

### Après (✅ Correct)

```javascript
const publishData = await publishResponse.json();

// ✅ Vérifier les erreurs API
if (publishData.error) {
  throw new Error(`Failed to publish carousel: ${publishData.error.message} (code: ${publishData.error.code})`);
}

// ✅ Vérifier que l'ID existe
if (!publishData.id) {
  throw new Error('Carousel publication failed: Instagram API returned no post ID');
}

log(`✅ Carousel published! ID: ${publishData.id}`);
return publishData.id;
```

---

## 📋 Checklist de correction

Pour chaque appel API Instagram, ajouter :

1. ✅ **Vérifier `response.error`** après chaque `response.json()`
2. ✅ **Vérifier que l'ID existe** avant de retourner
3. ✅ **Throw une erreur descriptive** si problème détecté
4. ✅ **Logger l'erreur** pour debugging

---

## 🔧 Scripts à corriger

### 1. `carousel-post.mjs` (Mila auto-post)

**Fonction** : `publishCarousel()` (ligne ~621)

**À corriger** :
- Vérifier erreurs lors de création des containers (ligne ~631)
- Vérifier erreurs lors de création du carousel container (ligne ~650)
- Vérifier erreurs lors de la publication (ligne ~670)

**Pattern à appliquer** :

```javascript
// Après chaque fetch + json()
const data = await response.json();

if (data.error) {
  throw new Error(`Failed to [action]: ${data.error.message} (code: ${data.error.code})`);
}

if (!data.id) {
  throw new Error('[Action] failed: no ID returned');
}
```

---

### 2. `carousel-post-elena.mjs` (Elena auto-post)

**Fonction** : `publishCarousel()` (ligne ~626)

**À corriger** :
- Même pattern que `carousel-post.mjs`
- Vérifier erreurs à chaque étape (containers, carousel, publication)

---

### 3. `duo-post.mjs` (Duo posts Mila x Elena)

**Fonction** : `publishCarousel()` (ligne ~372)

**À corriger** :
- Vérifier erreurs lors de création des containers (ligne ~380)
- Vérifier erreurs lors de création du carousel container
- Vérifier erreurs lors de la publication

**Note** : Ce script publie sur les deux comptes, donc vérifier les erreurs pour chaque publication.

---

## 📝 Template de code à utiliser

### Pour création de containers

```javascript
// Create media containers for each image
const containerIds = [];
for (let i = 0; i < imageUrls.length; i++) {
  const url = imageUrls[i];
  const response = await fetch(
    `https://graph.facebook.com/v21.0/${accountId}/media?image_url=${encodeURIComponent(url)}&is_carousel_item=true&access_token=${accessToken}`,
    { method: 'POST' }
  );
  const data = await response.json();
  
  // ✅ CHECK ERROR
  if (data.error) {
    throw new Error(`Failed to create media container ${i + 1}/${imageUrls.length}: ${data.error.message} (code: ${data.error.code})`);
  }
  
  // ✅ CHECK ID EXISTS
  if (!data.id) {
    throw new Error(`Media container ${i + 1}/${imageUrls.length} creation failed: no ID returned`);
  }
  
  containerIds.push(data.id);
}
```

### Pour création du carousel container

```javascript
const carouselResponse = await fetch(
  `https://graph.facebook.com/v21.0/${accountId}/media?media_type=CAROUSEL&children=${containerIds.join(',')}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`,
  { method: 'POST' }
);
const carouselData = await carouselResponse.json();

// ✅ CHECK ERROR
if (carouselData.error) {
  throw new Error(`Failed to create carousel container: ${carouselData.error.message} (code: ${carouselData.error.code})`);
}

// ✅ CHECK ID EXISTS
if (!carouselData.id) {
  throw new Error('Carousel container creation failed: no ID returned');
}
```

### Pour publication

```javascript
const publishResponse = await fetch(
  `https://graph.facebook.com/v21.0/${accountId}/media_publish?creation_id=${carouselData.id}&access_token=${accessToken}`,
  { method: 'POST' }
);
const publishData = await publishResponse.json();

// ✅ CHECK ERROR
if (publishData.error) {
  throw new Error(`Failed to publish carousel: ${publishData.error.message} (code: ${publishData.error.code})`);
}

// ✅ CHECK ID EXISTS
if (!publishData.id) {
  throw new Error('Carousel publication failed: Instagram API returned no post ID');
}

log(`✅ Carousel published! ID: ${publishData.id}`);
return publishData.id;
```

---

## 🧪 Tests à effectuer

Après avoir appliqué le fix :

1. **Test avec token invalide** :
   - Mettre un token invalide temporairement
   - Vérifier que l'erreur est bien catchée et throw
   - Vérifier que le post n'est pas marqué "posted"

2. **Test avec rate limit** :
   - Faire plusieurs publications rapidement
   - Vérifier que les erreurs de rate limit sont bien catchées

3. **Test normal** :
   - Vérifier que les publications normales fonctionnent toujours

---

## 📊 Impact attendu

Après correction de tous les scripts :

- ✅ **Plus de faux positifs** : Les posts ne seront marqués "posted" que s'ils sont réellement publiés
- ✅ **Retry automatique** : Les erreurs seront catchées et le système pourra retry
- ✅ **Meilleur debugging** : Les erreurs seront loggées avec détails (message + code)
- ✅ **Pas de perte de contenu** : Les images générées seront publiées ou retry automatiquement

---

## 🔗 Références

- [BUG-010 Bug Report](../roadmap/bugs/BUG-010-api-error-handling.md)
- [Audit Posts 26 Dec](../docs/AUDIT-POSTS-26-DEC-2024.md)
- [Session 24 Dec](../docs/SESSION-24-DEC-2024-CAROUSEL-ONLY.md)

---

## ✅ Checklist finale

- [x] Fix appliqué dans `scheduled-post.mjs`
- [ ] Fix appliqué dans `carousel-post.mjs`
- [ ] Fix appliqué dans `carousel-post-elena.mjs`
- [ ] Fix appliqué dans `duo-post.mjs`
- [ ] Tests effectués sur tous les scripts
- [ ] Documentation mise à jour

---

**Prochaine étape** : Appliquer le fix aux autres scripts selon ce guide.

