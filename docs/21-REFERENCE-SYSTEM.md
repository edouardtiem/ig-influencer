# 21 - Système de Références pour Cohérence

> Guide complet du système de références (face, body, location) pour maintenir la cohérence des personnages et lieux.

---

## 📋 Vue d'ensemble

Le système utilise **3 types de références** pour garantir la cohérence des images générées :

| Type | But | Utilisé quand |
|------|-----|---------------|
| **Face Ref** | Visage identique | Toujours |
| **Body Ref** | Silhouette cohérente | Toujours |
| **Location Ref** | Appartement/lieu reconnaissable | Lieux connus (home_*) |

---

## 👤 MILA (@mila.aurorae)

### Références Character

| Ref | URL Cloudinary | Description |
|-----|----------------|-------------|
| **Face** | `Photo_1_ewwkky.png` | Visage hero, sourire, lumière naturelle |
| **Body** | `Photo_5_kyx12v.png` | Corps entier, silhouette athlétique |

```javascript
const MILA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png';
const MILA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_5_kyx12v.png';
```

### Références Location

| Location | URL Cloudinary | Description |
|----------|----------------|-------------|
| **home_bedroom** | `1._Chambre_Paris_u2lyut.png` | Chambre bohème, draps gris, monstera |
| **home_living_room** | `2._Salon_Paris_ltyd8r.png` | Salon beige, vue toits Paris, affiches |

```javascript
const LOCATION_REFS = {
  home_bedroom: 'https://res.cloudinary.com/dily60mr0/image/upload/v1764794597/1._Chambre_Paris_u2lyut.png',
  home_living_room: 'https://res.cloudinary.com/dily60mr0/image/upload/v1764794600/2._Salon_Paris_ltyd8r.png',
};
```

### Usage dans carousel-post.mjs

```javascript
// Build references - face + body + location (if available)
const refs = [MILA_FACE_REF, MILA_BODY_REF];

// Add location reference if available
const locationRef = LOCATION_REFS[locationId];
if (locationRef && location.hasLocationRef) {
  refs.push(locationRef);
}
```

---

## 🌟 ELENA (@elenav.paris)

### Références Character

| Ref | URL Cloudinary | Description |
|-----|----------------|-------------|
| **Face** | `replicate-prediction-qh51japk...` | Visage doux, sourire warm |
| **Body** | `replicate-prediction-ws5fpmjp...` | Corps curvy, silhouette voluptueuse |

```javascript
const ELENA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';
const ELENA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png';
```

### Références Location

| Location | URL Cloudinary | Description |
|----------|----------------|-------------|
| **loft_living** | `replicate-prediction-aphj5sdd...` | Salon luxe, canapé mauve, fenêtres |
| **loft_bedroom** | `replicate-prediction-nnns47vw...` | Chambre élégante, vanity Hollywood |
| **bathroom_luxe** | `replicate-prediction-cq10n9h3...` | Salle de bain marbre blanc, or |

```javascript
const LOCATION_REFS = {
  loft_living: 'https://res.cloudinary.com/dily60mr0/image/upload/v1766009920/replicate-prediction-aphj5sddfxrmc0cv5sf8eqe2pw_c0otnl.png',
  loft_bedroom: 'https://res.cloudinary.com/dily60mr0/image/upload/v1766009918/replicate-prediction-nnns47vwgdrme0cv5shbd0b224_d0ghoj.png',
  bathroom_luxe: 'https://res.cloudinary.com/dily60mr0/image/upload/v1766009922/replicate-prediction-cq10n9h3jsrma0cv5sgrn0x5mr_swbswr.png',
};
```

---

## 🔧 Comment ça marche

### 1. Prompt avec référence location

Quand une location a `hasLocationRef: true`, le prompt commence par :

```
Based on the provided location reference image, place the subject in this exact [room].

[Description détaillée de la pièce...]
```

Cela force le modèle à respecter l'apparence du lieu.

### 2. Ordre des références

L'ordre des références dans le tableau est important :

```javascript
const refs = [
  FACE_REF,      // 1. Priorité visage
  BODY_REF,      // 2. Priorité silhouette  
  LOCATION_REF,  // 3. Contexte lieu (optionnel)
];
```

### 3. Flag hasLocationRef

Chaque location définit si elle a une référence :

```javascript
home_bedroom: {
  name: 'Chambre Mila',
  hasLocationRef: true,  // ← Utilise la ref
  setting: `Based on the provided location reference image...`,
},
paris_cafe: {
  name: 'Café parisien',
  hasLocationRef: false, // ← Pas de ref, prompt libre
  setting: 'charming Parisian sidewalk café...',
},
```

---

## 📊 Tableau récapitulatif

### Mila

| Script | Face | Body | Location |
|--------|------|------|----------|
| `carousel-post.mjs` | ✅ | ✅ | ✅ (home_*) |
| `vacation-reel-post.mjs` | ✅ | ✅ | ❌ (vacation themes) |

### Elena

| Script | Face | Body | Location |
|--------|------|------|----------|
| `carousel-post-elena.mjs` | ✅ | ✅ | ✅ (loft_*, bathroom_*) |
| `vacation-reel-post-elena.mjs` | ✅ | ✅ | ❌ (vacation themes) |

---

## 🎯 Best Practices

### ✅ DO

- Toujours inclure face + body refs
- Utiliser location ref pour les lieux récurrents (appartement)
- Commencer le prompt par "Based on the provided location reference image..."
- Garder les descriptions de lieu détaillées même avec la ref

### ❌ DON'T

- N'utilise pas de location ref pour les lieux génériques (café, rue)
- Ne surcharge pas avec trop de refs (max 4)
- N'oublie pas de vérifier `hasLocationRef` avant d'ajouter

---

## 🚀 Ajouter une nouvelle location avec référence

1. **Générer l'image du lieu vide** (sans personnage)
2. **Upload sur Cloudinary** dans le bon dossier
3. **Ajouter l'URL** dans `LOCATION_REFS`
4. **Mettre `hasLocationRef: true`** dans la config
5. **Écrire le prompt** avec "Based on the provided location reference image..."

### Exemple :

```javascript
// 1. Ajouter la ref
const LOCATION_REFS = {
  // ... existing
  home_bathroom: 'https://res.cloudinary.com/xxx/image/upload/mila-bathroom.png',
};

// 2. Configurer la location
home_bathroom: {
  name: 'Salle de bain Mila',
  hasLocationRef: true,
  setting: `Based on the provided location reference image, place the subject in this exact bathroom.
  
  [Description détaillée...]`,
  instagramLocationId: '101156775033710',
  actions: [...],
},
```

---

## 📁 Fichiers concernés

| Fichier | Description |
|---------|-------------|
| `app/scripts/carousel-post.mjs` | Carousel Mila avec refs |
| `app/scripts/carousel-post-elena.mjs` | Carousel Elena avec refs |
| `app/scripts/vacation-reel-post.mjs` | Reels Mila (face+body only) |
| `app/scripts/vacation-reel-post-elena.mjs` | Reels Elena (face+body only) |
| `app/src/config/locations.ts` | Config lieux Mila (centralisée) |
| `app/src/config/locations-elena.ts` | Config lieux Elena (centralisée) |

---

---

## ⚠️ IMPORTANT : Format des Références pour Nano Banana Pro

> **Découverte du 22 décembre 2024** — Le format de passage des références est CRITIQUE.

### ❌ Méthode qui NE FONCTIONNE PAS

```javascript
// URLs directes dans reference_images
const output = await replicate.run('google/nano-banana-pro', {
  input: {
    prompt: "...",
    reference_images: [url1, url2, url3], // ❌ WRONG
  },
});
```

**Résultat** : Le modèle ne respecte pas bien les références, génère des visages différents.

### ✅ Méthode CORRECTE

```javascript
// 1. Convertir URLs en base64
async function urlToBase64(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const contentType = response.headers.get('content-type') || 'image/png';
  return `data:${contentType};base64,${base64}`;
}

// 2. Passer dans image_input (PAS reference_images)
const base64Images = await Promise.all(urls.map(url => urlToBase64(url)));

const output = await replicate.run('google/nano-banana-pro', {
  input: {
    prompt: "...",
    image_input: base64Images, // ✅ CORRECT
  },
});
```

**Résultat** : Le modèle respecte parfaitement les références, le visage reste identique.

### Pourquoi ?

| Paramètre | Format | Comportement |
|-----------|--------|--------------|
| `reference_images` | URLs | Traitement "inspiration" légère |
| `image_input` | Base64 | Traitement prioritaire, pixels directs |

> Voir `carousel-post.mjs` pour l'implémentation de production qui utilise déjà cette méthode.

---

*Dernière mise à jour : 22 décembre 2024*

