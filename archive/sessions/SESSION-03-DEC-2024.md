# 📅 Session du 3 Décembre 2024 — Character Sheet V2 & Photos de Base

**Date** : 3 décembre 2024  
**Durée** : En cours  
**Objectif** : Améliorer le character sheet de Mila et générer les photos de référence

---

## ✅ ACCOMPLI

### 1. Character Sheet VERSION 2 Ultra-Détaillée

**Fichier** : `docs/03-PERSONNAGE.md`

#### Modifications Identité & Métier
- ✅ Plus étudiante → **Personal Trainer** (métier principal, 4-5 clients/jour)
- ✅ Ajout **Side hustle : Photographe Lifestyle** (shoots weekends/voyages)
- ✅ Revenus crédibles : ~3-4k€/mois à 22 ans
- ✅ Justification parfaite pour fitness content + voyages

#### Modifications Physiques Détaillées

**Visage :**
- ✅ Forme ovale allongé, pommettes hautes
- ✅ Yeux en amande hazel-vert avec reflets dorés
- ✅ Nez droit, pointe légèrement relevée
- ✅ Lèvres pulpeuses naturelles, légèrement asymétriques
- ✅ Sourcils fournis naturels, légèrement arqués
- ✅ **Cheveux bouclés type 3A** (loose curls), copper auburn, mi-longs épaules

**Signes Distinctifs CRITIQUES (pour consistance IA) :**
- ✅ **3 grains de beauté** avec positions exactes :
  - Lèvre gauche (2mm au-dessus du coin)
  - Pommette droite (centre)
  - Épaule droite (près clavicule)
- ✅ **20-25 taches de rousseur** concentrées nez/pommettes + épaules
- ✅ Collier étoile doré (signature permanente)
- ✅ **Suppression du piercing langue** (décision design)

**Corps :**
- ✅ **Silhouette fine athlétique** (168cm, 56-58kg)
- ✅ **Poitrine natural E-cup / F-cup** (très généreuse mais naturelle) - Itérations progressives
- ✅ Taille 66cm avec abdos subtils visibles
- ✅ Proportions exactes détaillées (épaules 38cm, jambes toniques, etc.)
- ✅ **Pas de lunettes** confirmé
- ✅ **Pas de piercings** (aucun)

#### Enrichissement Contenu

**Expressions & Poses :**
- ✅ **18 variations d'expressions** avec prompts détaillés
  - Confident Smile, Playful Smirk, Serious Gaze, Pensive Look, etc.
  - Chaque expression avec description + mood + contexte usage
  
- ✅ **25 poses organisées** par catégorie :
  - 8 Standing poses
  - 7 Sitting poses
  - 5 Action/Movement poses
  - 5 Intimate/Sensual poses

**Captions :**
- ✅ **50+ exemples de captions** répartis :
  - 20 Lifestyle
  - 20 Fitness/Training (angle Personal Trainer)
  - 20 Sexy-léger/Confidence
  - 10 Photographe/Creative (nouveau métier)

#### Prompts IA VERSION 2

- ✅ **Prompt de base ultra-détaillé** (~700 mots)
  - Tous les détails faciaux précis
  - Les 3 grains de beauté avec positions exactes
  - Les taches de rousseur
  - Proportions corporelles complètes
  - Optimisé pour génération IA (Gemini, Nano Banana Pro, etc.)

- ✅ **Negative prompts détaillés** par type de contenu :
  - Global (toujours inclure)
  - Spécifique Fitness
  - Spécifique Lifestyle
  - Spécifique Beach/Bikini
  - Spécifique Bedroom/Intimate

- ✅ **Checklist de validation** post-génération (12 checks avec priorités)

**Résultat** : Document passé de ~377 lignes → **~700 lignes**

---

### 2. Génération des 6 Photos de Base

**Outil utilisé** : Google AI Studio (Gemini 2.0 Flash)  
**Stratégie** : Photo 1 comme référence master pour toutes les suivantes

#### Photos Générées

| # | Type | Contexte | Status |
|---|------|----------|--------|
| 1 | **Portrait Studio Neutre** | Référence visage master, éclairage parfait | ✅ Généré |
| 2 | **Lifestyle Café Parisien** | Terrasse café, blazer beige, morning vibe | ✅ Généré |
| 3 | **Fitness/Sport** | Gym moderne, tenue Alo Yoga olive, full body | ✅ Généré |
| 4 | **Glamour/Soirée** | Robe noire élégante, mood sensuel sophistiqué | ✅ Généré |
| 5 | **Plage/Été Nice** | Bikini terracotta, Mediterranean beach, golden hour | ✅ Généré |
| 6 | **Selfie Authentique** | Mirror selfie, athleisure cozy, bedroom | ✅ Généré |

**Approche utilisée :**
- Photo 1 : Génération pure avec prompt ultra-détaillé
- Photos 2-6 : Photo 1 en input + prompt contextualisé (garantit cohérence faciale)

**Caractéristiques finales :**
- Poitrine : E-cup / F-cup (très généreuse)
- Pas de piercing
- 3 grains de beauté + 20-25 taches de rousseur
- Cheveux bouclés type 3A copper auburn
- Cohérence maintenue sur les 6 photos

---

---

## ✅ PHASE 2 : Upload Cloudinary (TERMINÉ)

### A. 6 Photos Uploadées sur Cloudinary

| # | Type | URL Cloudinary |
|---|------|----------------|
| 1 | Portrait Studio | `https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png` |
| 2 | Café Parisien | `https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_2_q8kxit.png` |
| 3 | Fitness/Gym | `https://res.cloudinary.com/dily60mr0/image/upload/v1764767098/Photo_3_nopedx.png` |
| 4 | Glamour/Soirée | `https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_4_pna4fo.png` |
| 5 | Plage Nice | `https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_5_kyx12v.png` |
| 6 | Selfie Authentique | `https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_6_i5rdpa.png` |

### B. Configuration `.env.local`

```bash
MILA_BASE_FACE_URL=https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png

MILA_REFERENCE_URLS=https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_2_q8kxit.png,https://res.cloudinary.com/dily60mr0/image/upload/v1764767098/Photo_3_nopedx.png,https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_4_pna4fo.png,https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_5_kyx12v.png,https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_6_i5rdpa.png
```

---

## ✅ PHASE 3 : Implémentation Nano Banana Pro (TERMINÉ)

### Décision : Migration vers Nano Banana Pro

**Modèle choisi** : `google/nano-banana-pro` via Replicate API

**Raisons :**
- ✅ Supporte jusqu'à **14 images de référence** pour consistance faciale
- ✅ Google DeepMind's state-of-the-art model (basé sur Gemini 3 Pro)
- ✅ Résolution jusqu'à 4K
- ✅ 1.8M runs sur Replicate (modèle validé)

### Problèmes Rencontrés & Solutions

#### ❌ Problème 1 : Nom du Modèle Incorrect

**Erreur :** `Model not found`

**Cause :** J'avais utilisé `nanobanana/nanobanana-pro` au lieu du vrai nom.

**Solution :** Le bon nom est `google/nano-banana-pro` (propriétaire = Google)

```typescript
// ❌ INCORRECT
await replicate.run("nanobanana/nanobanana-pro:latest", {...})

// ✅ CORRECT
await replicate.run("google/nano-banana-pro", {...})
```

---

#### ❌ Problème 2 : Paramètres Non Supportés

**Erreur :** `Prediction failed: null` (HTTP 422 Unprocessable Entity)

**Cause :** J'envoyais des paramètres qui n'existent pas pour ce modèle.

**Paramètres INVALIDES (supprimés) :**
- ❌ `negative_prompt`
- ❌ `guidance_scale`
- ❌ `num_inference_steps`
- ❌ `num_outputs`
- ❌ `output_quality`

**Paramètres VALIDES (seuls acceptés) :**
- ✅ `prompt` (required)
- ✅ `image_input` (array of URIs, max 14)
- ✅ `aspect_ratio` (ex: "4:5")
- ✅ `resolution` (ex: "2K")
- ✅ `output_format` (ex: "jpg")
- ✅ `safety_filter_level` (ex: "block_only_high")

**Schéma API récupéré via :**
```bash
curl -s "https://api.replicate.com/v1/models/google/nano-banana-pro" \
  -H "Authorization: Bearer $TOKEN" | jq '.latest_version.openapi_schema.components.schemas.Input'
```

---

#### ❌ Problème 3 : Format de Sortie Binaire

**Erreur :** Image générée avec succès (133s) mais affichage `[object Object]`

**Cause :** Le modèle retourne les **données binaires de l'image** (Uint8Array stream) au lieu d'une URL.

```
[Nano Banana Pro] Stream item: Uint8Array(1186) [112, 63, 35, 29, ...]
[Nano Banana Pro] Stream item: Uint8Array(1186) [116, 82, 86, 54, ...]
[Nano Banana Pro] Stream item: Uint8Array(622) [35, 189, 71, 146, ...]
```

**Solution :** Collecter les chunks binaires et les convertir en base64 :

```typescript
// Collecter tous les chunks du stream
const chunks: Uint8Array[] = [];
for await (const chunk of output as AsyncIterable<Uint8Array>) {
  if (chunk instanceof Uint8Array) {
    chunks.push(chunk);
  }
}

// Combiner en un seul buffer
const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
const combined = new Uint8Array(totalLength);
let offset = 0;
for (const chunk of chunks) {
  combined.set(chunk, offset);
  offset += chunk.length;
}

// Convertir en data URI base64
const base64 = Buffer.from(combined).toString('base64');
const imageUrl = `data:image/jpeg;base64,${base64}`;
```

---

#### ❌ Problème 4 : Images de Référence (URLs vs Base64)

**Erreur :** `Prediction failed: null` uniquement avec `image_input`

**Cause :** Le modèle n'acceptait pas les URLs HTTP Cloudinary directement.

**Hypothèse confirmée :** Sans références = ✅ fonctionne | Avec références = ❌ échoue

**Solution :** Convertir les URLs Cloudinary en **data URIs base64** avant envoi :

```typescript
async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const contentType = response.headers.get('content-type') || 'image/png';
  return `data:${contentType};base64,${base64}`;
}

// Dans generateImage()
const base64Images = await Promise.all(
  allReferenceUrls.map(url => urlToBase64(url))
);
input.image_input = base64Images;
```

---

### Architecture Finale

**Fichier** : `app/src/lib/nanobanana.ts`

```
┌─────────────────────────────────────────────────────────────┐
│                    generateImage()                          │
├─────────────────────────────────────────────────────────────┤
│ 1. Récupérer les 6 URLs Cloudinary (base-portraits.ts)      │
│ 2. Convertir chaque URL en base64 data URI                  │
│ 3. Construire le prompt (character.ts + template)           │
│ 4. Appeler google/nano-banana-pro via Replicate             │
│    - prompt: string                                         │
│    - image_input: string[] (base64 data URIs)               │
│    - aspect_ratio: "4:5"                                    │
│    - resolution: "2K"                                       │
│    - output_format: "jpg"                                   │
│ 5. Collecter les chunks Uint8Array du stream                │
│ 6. Combiner en buffer unique                                │
│ 7. Convertir en base64 data URI pour affichage              │
│ 8. Retourner { success: true, imageUrl: data:image/... }    │
└─────────────────────────────────────────────────────────────┘
```

**Fichier** : `app/src/config/base-portraits.ts`

- URLs Cloudinary des 6 photos par défaut
- Variables `.env.local` pour override

**Fichier** : `app/src/app/api/test-nanobanana/route.ts`

- Endpoint POST pour tests
- Utilise `generateImage()` de nanobanana.ts

**Fichier** : `app/src/app/test-nanobanana/page.tsx`

- Interface de test avec toggle références ON/OFF
- Affichage résultat + historique
- Lightbox pour comparaison

---

### Performances Mesurées

| Métrique | Valeur |
|----------|--------|
| **Temps génération** | 60-150 secondes |
| **Taille image** | ~500KB-1MB (JPEG 2K) |
| **Coût estimé** | ~$0.05-0.10 par image |
| **Taux de succès** | ✅ 100% (après corrections) |

---

### Résultat Final

**✅ Nano Banana Pro fonctionne** avec les 6 photos de référence Cloudinary !

L'image générée :
- Maintient les traits du visage des références
- Respecte le prompt (vêtements, pose, décor)
- Qualité 2K Instagram-ready
- Format JPEG optimisé

---

---

## ✅ PHASE 4 : Lieux Actifs (TERMINÉ)

### 4 Lieux avec prompts ultra-détaillés

| # | Lieu | Style | Créneaux |
|---|------|-------|----------|
| 1 | **Chambre Mila** | Bohème punk rock fun | morning, evening, night |
| 2 | **Salon Mila** | Vue toits Paris, même aesthetic | evening, night |
| 3 | **KB CaféShop** | Specialty coffee Paris 18e | morning, midday |
| 4 | **L'Usine Paris** | Gym industriel premium | morning, midday |

**Approche** : Prompts basés sur photos réelles (KB CaféShop, L'Usine) pour plus d'authenticité et possibilité de tagger les lieux.

**Documentation** : `docs/11-LIEUX-ACTIFS.md`

---

## ✅ PHASE 5 : Calendrier Intelligent (TERMINÉ)

### Système créé

| Composant | Description |
|-----------|-------------|
| **Créneaux** | 6h30, 11h30, 18h00 |
| **Lumière soleil** | Calcul sunrise/sunset par mois à Paris |
| **Adaptation saison** | Hiver 6h30 = nuit → contenu cozy indoor |
| **Jour/Weekend** | Contenu différent samedi/dimanche |
| **Content templates** | Poses, expressions, tenues par contexte |

### Fichiers créés

- `app/src/config/calendar.ts` — Logique calendrier
- `app/src/config/locations.ts` — ACTIVE_LOCATIONS avec prompts
- `app/src/app/api/calendar/route.ts` — API test

### Test du calendrier (3 déc 2024, hiver)

```
📅 Date: 2024-12-03 (weekday, winter)
☀️ Sunrise: 8h30 | Sunset: 16h45
---
⏰ 06:30 MORNING → Lieu: gym | Lighting: NIGHT (il fait nuit!)
⏰ 11:30 MIDDAY  → Lieu: gym | Lighting: daylight
⏰ 18:00 EVENING → Lieu: salon | Lighting: NIGHT
```

---

## 🔄 PROCHAINES ÉTAPES

### ~~Phase 6 : Images de référence lieux~~ ✅ FAIT

### ~~Phase 7 : Construction prompt automatique~~ ✅ FAIT

### ~~Phase 8 : Perplexity + Caption~~ ✅ FAIT

### Phase 9 : Production

1. [ ] Flow complet de génération automatique
2. [ ] Déploiement Vercel + cron jobs

---

## 📊 Métriques Session (3 déc)

| Métrique | Valeur |
|----------|--------|
| **Documents modifiés** | 2 (03-PERSONNAGE.md, nanobanana.ts) |
| **Lignes ajoutées** | ~500 lignes total |
| **Photos générées** | 6/6 ✅ |
| **Prompts créés** | 6 prompts ultra-détaillés |
| **Itérations poitrine** | 3 (C/D → DD/E → E/F) |
| **Problèmes résolus** | 4 (nom modèle, params, output, URLs) |
| **Durée session** | ~4-5h |

---

---

# 📅 Session du 4 Décembre 2024 (soir) — Prompt Builder V2 & Perplexity

**Date** : 4 décembre 2024  
**Durée** : ~2h  
**Objectif** : Finaliser le système de génération intelligent + intégrer Perplexity

---

## ✅ PHASE 6 : URLs Références Lieux (TERMINÉ)

### 4 images de lieux uploadées sur Cloudinary

| # | Lieu | URL Cloudinary |
|---|------|----------------|
| 1 | Chambre Mila | `1._Chambre_Paris_u2lyut.png` |
| 2 | Salon Mila | `2._Salon_Paris_ltyd8r.png` |
| 3 | L'Usine Paris (Gym) | `3._Gym_eewa9s.png` |
| 4 | KB CaféShop | `4._KB_CaféShop_Paris_18_a06ebs.png` |

**Fichier modifié** : `app/src/config/locations.ts`
- Ajout du champ `referenceImageUrl` pour chaque lieu actif

---

## ✅ PHASE 7 : Prompt Builder Intelligent (TERMINÉ)

### 7.1 Character Prompt V2 Ultra-Détaillé

**Fichier** : `app/src/config/character.ts`

Enrichissements :
- Face details avec distinctive marks (3 grains de beauté + freckles)
- Body proportions détaillées
- Section [VIBE] : "Effortlessly sexy, alluring without being explicit"
- Negative prompts par type de contenu

### 7.2 Système de Génération Contextuel

**Fichier** : `app/src/lib/nanobanana.ts`

Nouvelles fonctions :
- `buildContextualPrompt()` — Combine character + location + brief
- `generateFromCalendar()` — Génération automatisée depuis calendrier
- Support de 7 références images (6 Mila + 1 lieu)

### 7.3 Cohérence Tenue/Lieu

**Fichier** : `app/src/config/calendar.ts`

Nouveau système `LOCATION_OUTFITS` :
```typescript
const LOCATION_OUTFITS = {
  nice_gym: [
    'matching sports bra and high-waisted leggings, form-fitting',
    'fitted sports bra and bike shorts, athletic but feminine',
    // ... 7 options par lieu
  ],
  home_bedroom: [...],
  home_living_room: [...],
  nice_old_town_cafe: [...],
};
```

**Règle** : Pas de couleurs spécifiques → l'IA varie les couleurs à chaque génération

### 7.4 Props Intelligents (Lieu + Heure)

**Fichier** : `app/src/config/calendar.ts`

Nouveau système `LOCATION_PROPS` :
```typescript
const LOCATION_PROPS = {
  home_bedroom: {
    morning: ['messy sheets', 'coffee cup on nightstand', ...],
    evening: ['soft lamp light', 'book', 'candle lit', ...],
    night: ['glass of wine on nightstand', 'candle', ...],
  },
  // ... par lieu et par heure
};
```

**Plus de café dans le lit le soir !** 🍷

### 7.5 Actions Dynamiques (pas juste poses)

**Fichier** : `app/src/config/calendar.ts`

Nouveau système `LOCATION_ACTIONS` :
```typescript
const LOCATION_ACTIONS = {
  nice_gym: [
    'mid-squat on smith machine, weights loaded, focused determination',
    'doing cable rows, pulling weight toward body, muscles engaged',
    'doing lunges across gym floor, dynamic movement, hair flowing',
    // 12 actions par lieu
  ],
  // ...
};
```

**Le prompt insiste maintenant** : "DYNAMIC ACTION shot - she is doing something, not just posing"

### 7.6 Fix Lighting Jour/Nuit

**Fichier** : `app/src/lib/nanobanana.ts`

Instructions de lighting explicites :
```typescript
if (brief.lighting === 'night') {
  lightingInstructions = `[LIGHTING - CRITICAL] 
- Interior: Artificial lighting only (lamps, spotlights)
- Exterior visible through windows: DARK NIGHT, no daylight
- No natural daylight coming through windows`;
}
```

---

## ✅ PHASE 8 : Perplexity Integration (TERMINÉ)

### 8.1 Lib Perplexity

**Fichier** : `app/src/lib/perplexity.ts`

Fonctions créées :
- `fetchDailyTrends()` — Recherche trends France du jour
- `generateCaption()` — Génère caption contextuelle avec trends
- `combineHashtags()` — Mix trending + evergreen hashtags
- `checkPerplexityStatus()` — Vérifie API status
- Fallback captions si API indisponible

### 8.2 API Route Daily Trends

**Fichier** : `app/src/app/api/daily-trends/route.ts`

Endpoints :
- `GET /api/daily-trends` — Récupère trends du jour (cachés 24h)
- `POST /api/daily-trends` — Génère caption pour contenu spécifique

**Exemple de réponse POST** :
```json
{
  "success": true,
  "caption": "Post-workout glow > makeup 💪",
  "hashtags": ["#fitgirl", "#motivation", "#gymlife", "#fitfrenchgirl", "#milaverne"],
  "mood": "energetic",
  "formattedPost": "Post-workout glow > makeup 💪\n\n#fitgirl #motivation #gymlife..."
}
```

### 8.3 Configuration Requise

**Variable d'environnement** : `PERPLEXITY_API_KEY`

Obtenir sur : https://www.perplexity.ai/settings/api

---

## 🆕 Page de Test Contextuel

**Fichier** : `app/src/app/test-contextual/page.tsx`

Interface de test pour :
- Mode Auto (calendrier choisit tout)
- Mode Slot (morning/midday/evening)
- Mode Lieu (choisir un lieu spécifique)

**URL** : http://localhost:3000/test-contextual

---

## 📊 Métriques Session (4 déc soir)

| Métrique | Valeur |
|----------|--------|
| **Fichiers créés** | 3 (perplexity.ts, daily-trends/route.ts, test-contextual/page.tsx) |
| **Fichiers modifiés** | 4 (character.ts, nanobanana.ts, calendar.ts, locations.ts) |
| **Lignes ajoutées** | ~800 lignes total |
| **Systèmes créés** | 5 (tenues, props, actions, lighting, perplexity) |
| **Tests génération** | 5+ images validées |

---

## 🔜 PROCHAINE SESSION : Phase 9 Production

1. [ ] Flow complet auto-post (génération → caption → Buffer → Instagram)
2. [ ] Déploiement Vercel
3. [ ] Configuration cron jobs (6h30, 11h30, 18h00)
4. [ ] Tests production pendant 48h

---

## 📚 Références Techniques

- **Modèle** : https://replicate.com/google/nano-banana-pro
- **Perplexity API** : https://docs.perplexity.ai/
- **Package** : `replicate` npm

---

*Session terminée — 4 décembre 2024, 22h45*

