# 🎬 REEL BATCH GENERATION PROCESS

> Process automatisé pour créer des Reels Elena en batch.
> Attache une image Cloudinary d'un carousel + ce doc → génération automatique.

---

## 🔄 Flow Overview

```
CAROUSEL PHOTO (qui a bien performé)
        ↓
   1. ANALYSER la scène → décider BACK ou FRONT view
        ↓
   2. RECHERCHE PERPLEXITY (hooks, caption, music)
        ↓
   3. GÉNÉRER IMAGE "KLING-READY" (Nano Banana Pro)
      → Soit BACK VIEW (corps entier de dos)
      → Soit FRONT VIEW (visage + haut du corps)
        ↓
   4. GÉNÉRER VIDÉO (Kling v2.5)
        ↓
   5. RETOURNER résultats
```

**Coût total** : ~$0.10 (Nano) + ~$1.00 (Kling) = **$1.10/reel**

---

## 🎯 Décision: BACK VIEW vs FRONT VIEW

| Critère | BACK VIEW 🍑 | FRONT VIEW 👀 |
|---------|-------------|---------------|
| **Quand ?** | Scène panoramique, environnement "star" | Moment intime, connexion directe |
| **Exemples** | Sunset yacht, infinity pool, plage, balcon vue | Café, lit, miroir, jacuzzi close-up |
| **Image générée** | FRONT (face visible) | FRONT (face visible) |
| **Action Kling** | Elle se RETOURNE → finit de DOS | Sourire, cheveux → reste de FACE |
| **Fin de vidéo** | DOS (fesses + décor) | FACE (expression) |

**⚠️ IMPORTANT** : On génère TOUJOURS une image FRONT (visage visible).
- Kling invente/déforme le visage s'il ne le voit pas au début
- Pour option BACK : elle se retourne et FINIT de dos (pas d'invention de visage)

**Règle simple** : Si le DÉCOR est impressionnant → BACK (finit de dos). Si c'est INTIME → FRONT (reste de face).

---

## 📋 Instructions pour l'Agent

Quand l'utilisateur envoie une **URL Cloudinary d'une image Elena**, exécute ce process :

---

### STEP 1 — Analyser la Photo Source + Décider BACK/FRONT

1. Ouvre l'URL dans le navigateur (`browser_navigate`)
2. Prends un screenshot (`browser_take_screenshot`)
3. Analyse et identifie :
   - **Lieu** : type de location (villa, spa, plage, appartement, etc.)
   - **Tenue** : vêtements, couleurs, style (bikini, lingerie, robe, etc.)
   - **Bijoux** : colliers, bracelets, boucles d'oreilles
   - **Pose** : position du corps, direction du regard
   - **Ambiance** : mood, lighting (golden hour, daylight, etc.)
   - **Props** : objets visibles (café, téléphone, etc.)
   - **Background** : éléments de décor identifiables
   - **Ce qui a marché** : pourquoi cette photo performe (sexy, aspirational, etc.)

4. **DÉCIDER : BACK VIEW ou FRONT VIEW ?**

   | Si la scène a... | → Choisir | Action Kling |
   |------------------|-----------|--------------|
   | Vue panoramique (sunset, mer, skyline) | **BACK** 🍑 | Elle se retourne → finit de DOS |
   | Infinity pool, plage, yacht deck | **BACK** 🍑 | Elle se retourne → finit de DOS |
   | Environnement "wow" à montrer | **BACK** 🍑 | Elle se retourne → finit de DOS |
   | Moment intime (café, lit, miroir) | **FRONT** 👀 | Sourire, cheveux → reste de FACE |
   | Close-up original dans le carousel | **FRONT** 👀 | Sourire, cheveux → reste de FACE |
   | Connexion directe / eye contact | **FRONT** 👀 | Sourire, cheveux → reste de FACE |

   **Note** : L'image générée est TOUJOURS de FACE (visage visible) pour éviter que Kling invente le visage.

---

### STEP 2 — Recherche Perplexity (Trends + Music)

Utilise la clé API `PERPLEXITY_API_KEY` depuis `.env.local` pour rechercher :

```javascript
// API Call Perplexity
const response = await fetch('https://api.perplexity.ai/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'sonar-pro',
    messages: [
      { 
        role: 'system', 
        content: 'You are an Instagram Reels trends expert specializing in viral content for female lifestyle influencers. You know what hooks, captions, and music are trending right now.' 
      },
      { 
        role: 'user', 
        content: `[SCENE_CONTEXT sera remplacé par l'analyse de la photo]` 
      },
    ],
    max_tokens: 1500,
    temperature: 0.5,
  }),
});
```

**Prompt Perplexity à utiliser** (adapter `[SCENE_CONTEXT]`) :

```
I'm creating an Instagram Reel for a female lifestyle/travel influencer (Elena, 24yo, jet-set aesthetic).

SCENE: [SCENE_CONTEXT - description de la photo analysée]

I need:

1. **5 HOOK OPTIONS** (text overlays for the reel):
   - Style: provocative, flirty, "don't tell your girlfriend" energy
   - Format: short, punchy, creates curiosity
   - Mix of: FOMO hooks, question hooks, provocative statements
   - Examples of style I like: "Don't tell your girlfriend you stayed till the end", "POV: The view she doesn't want you to see"

2. **CAPTION** (for the Instagram post):
   - Language: English (can sprinkle French words for charm)
   - Format: Micro-story style
     - [HOOK] - 1 atmospheric line
     - [MICRO-STORY] - 2-4 lines, one precise moment
     - [SOFT CTA] - Tease to private content (e.g., "The rest of this set is on my private. 🖤")
   - Tone: mysterious, confident, sensual but elegant
   - Include 15-20 hashtags (mix trending + evergreen)

3. **3 TRENDING SONGS** that would fit this vibe:
   - Currently trending on Instagram Reels
   - Match the mood (chill, sensual, confident)
   - Include artist + song name

Format response as JSON:
{
  "hooks": ["hook1", "hook2", "hook3", "hook4", "hook5"],
  "caption": {
    "hook": "...",
    "body": "...",
    "cta": "...",
    "hashtags": ["#tag1", "#tag2", ...]
  },
  "music": [
    {"song": "Song Name", "artist": "Artist", "vibe": "chill/sensual/upbeat"},
    ...
  ]
}
```

---

### STEP 3 — Générer l'Image "Kling-Ready" (Nano Banana Pro)

**Pourquoi cette étape ?**
- Les photos carousel sont optimisées pour vue statique
- Kling a besoin d'une image optimisée pour l'animation
- **TOUJOURS générer une image FRONT** (visage visible) pour éviter l'invention de visage par Kling

**Elena References** (à convertir en base64 array) :
```javascript
const ELENA_REFS = {
  face: 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png',
  body: 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png',
  back: 'https://res.cloudinary.com/dily60mr0/image/upload/v1767562505/replicate-prediction-bjnvs97bqxrmy0cvhbpa8cx5f8_daohqh.png',
};
```

**Génération avec Nano Banana Pro** :

```javascript
import Replicate from 'replicate';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

// Convertir refs en base64 array
async function urlToBase64(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
}

const base64Refs = await Promise.all([
  urlToBase64(ELENA_REFS.face),
  urlToBase64(ELENA_REFS.body),
  urlToBase64(ELENA_REFS.back), // optionnel pour back view
]);

const output = await replicate.run("google/nano-banana-pro", {
  input: {
    prompt: "[PROMPT BACK ou FRONT - voir templates ci-dessous]",
    image_input: base64Refs, // ARRAY de base64, pas string !
    aspect_ratio: "9:16",
    output_format: "jpg",
    safety_filter_level: "block_only_high"
  }
});
```

---

#### Template Image (TOUJOURS FRONT - visage visible)

```
Professional lifestyle photograph in/on [LIEU].

SCENE: [Description du lieu et ambiance - lighting, décor, etc.]

SUBJECT (FRONT facing, visage visible):
- Young woman matching reference images EXACTLY
- Same soft round face as Image 1
- Same shapely figure as Image 2
- FACING CAMERA, 3/4 angle or direct eye contact
- Full body from knees up (pour option BACK) ou waist up (pour option FRONT)
- Long bronde wavy hair with golden balayage
- Wearing [TENUE du carousel]
- [BIJOUX - colliers, bracelet]
- [PROPS si applicable - champagne, café, etc.]
- Soft confident expression

FRAMING: 9:16 vertical, subject centered with room to move.

STYLE: High-end Instagram content, [LIGHTING du carousel], luxury lifestyle aesthetic.

SINGLE IMAGE ONLY - no collages.
```

**Adapter selon l'option choisie** :
- **BACK** : Full body (elle va se retourner, besoin de voir le corps entier)
- **FRONT** : Waist up (focus visage + expression)

---

### STEP 4 — Générer la Vidéo (Kling v2.5)

Utilise l'image générée en Step 3 :

```javascript
const output = await replicate.run("kwaivgi/kling-v2.5-turbo-pro", {
  input: {
    prompt: "[PROMPT VIDÉO BACK ou FRONT - voir templates ci-dessous]",
    image: "[URL Cloudinary de l'image Kling-Ready]",
    duration: 10,
    aspect_ratio: "9:16"
  }
});
```

**Paramètres fixes** :
| Param | Valeur |
|-------|--------|
| Model | `kwaivgi/kling-v2.5-turbo-pro` |
| Duration | `10` |
| Aspect Ratio | `9:16` |
| Coût | ~$1.00 |

---

#### Prompt Kling BACK 🍑 (se retourne → finit de DOS)

```
SETTING: [Description du lieu]

ACTION (10 seconds) - REAL-TIME SPEED, NOT SLOW MOTION:
- She looks at camera briefly with soft smile (2 seconds)
- Turns her body AWAY from camera smoothly
- Rotates 180 degrees to face [la vue/fenêtre/horizon]
- Hair swings naturally with the turn
- Ends facing AWAY from camera
- Final pose: back to camera, contemplating the view

CRITICAL - SPEED:
- NORMAL HUMAN SPEED - NOT slow motion
- Real-time movement like iPhone video
- Natural quick turn, not cinematic slow

MOVEMENTS:
- Quick natural body rotation
- Hair flowing with movement
- Fabric/clothes shifting naturally
- Weight transfer between feet

CAMERA: Completely static, no movement

END STATE: She faces AWAY from camera, we see her back.
```

---

#### Prompt Kling FRONT 👀 (sourire + geste → reste de FACE)

```
SETTING: [Description du lieu]

ACTION (10 seconds) - REAL-TIME SPEED, NOT SLOW MOTION:
- She looks at camera with neutral expression
- A soft confident smile forms
- Tilts her head slightly
- Runs her hand through her hair OR plays with necklace
- Subtle laugh, looks down then back up
- Maintains warm eye contact

CRITICAL - SPEED:
- NORMAL HUMAN SPEED - NOT slow motion
- Real-time movement like iPhone video

MOVEMENTS:
- Gentle breathing in chest/shoulders
- Hair movement
- Soft facial expressions
- Natural blinks

CAMERA: Static, very subtle push-in toward face

END STATE: She stays FACING camera with warm expression.
```

---

### STEP 5 — Retourner les Résultats

Format de réponse attendu :

```markdown
## 🎬 REEL GÉNÉRÉ

### 🖼️ Image Kling-Ready
- **URL** : [lien Cloudinary de l'image générée]
- **Preview** : [screenshot]

### 📹 Vidéo
- **Replicate URL** : [lien vers la vidéo générée]
- **Status** : ✅ Completed / ⏳ Processing

### 🪝 Hooks (choisir 1)
1. "Hook option 1"
2. "Hook option 2"
3. "Hook option 3"
4. "Hook option 4"
5. "Hook option 5"

**Recommandé** : [Le hook le plus adapté avec justification]

### 📝 Caption
```
[Hook]

[Body - micro-story]

[Soft CTA]

[Hashtags]
```

### 🎵 Musique Suggérée
1. **[Song 1]** - [Artist] (vibe: chill)
2. **[Song 2]** - [Artist] (vibe: sensual)
3. **[Song 3]** - [Artist] (vibe: confident)

### 💰 Coûts
- Image Nano Banana Pro: ~$0.10
- Vidéo Kling: ~$1.00
- **Total**: ~$1.10
```

---

## 🔧 Configuration Requise

Dans `app/.env.local` :
```
REPLICATE_API_TOKEN=r8_xxxxx
PERPLEXITY_API_KEY=pplx-xxxxx
```

---

## 📌 Notes Importantes

### Pourquoi TOUJOURS générer une image FRONT ?

**Problème** : Kling invente/déforme le visage s'il ne le voit pas dans l'image de départ.

**Solution** : 
- Toujours commencer avec le visage visible
- Pour option BACK : elle se retourne et FINIT de dos (pas d'invention)
- Pour option FRONT : elle reste de face (visage toujours visible)

| Option | Image | Début vidéo | Fin vidéo |
|--------|-------|-------------|-----------|
| BACK 🍑 | FRONT (visage) | Face caméra | DOS (fesses) |
| FRONT 👀 | FRONT (visage) | Face caméra | FACE (sourire) |

### Mouvements Kling par Type

**BACK** (se retourne → finit de dos) :
- ✅ Rotation 180° du corps
- ✅ Cheveux qui swinguent
- ✅ Finit contemplant la vue
- ✅ Pas de visage à la fin = pas d'invention

**FRONT** (reste de face) :
- ✅ Sourire qui se forme
- ✅ Main dans les cheveux
- ✅ Jouer avec collier
- ✅ Tilter la tête

**CRITICAL - Vitesse** :
- ⚠️ Kling tend à faire du slowmo
- ✅ Insister : "REAL-TIME SPEED", "NORMAL HUMAN SPEED", "NOT slow motion"
- ✅ "Natural quick turn" pas "slowly turns"

**À éviter** :
- ❌ Marcher
- ❌ Commencer de DOS puis montrer le visage (invention)
- ❌ Changement d'angle caméra

### Style de Hooks qui Performent
- **Provocant** : "Don't tell your girlfriend..."
- **FOMO** : "POV: You weren't supposed to see this"
- **Question** : "Would you wake up to this?"
- **Challenge** : "I bet you can't watch without saving"
- **Soft flex** : "Just a regular Monday morning"

### Caption Elena (Content Brain V3)
- **Langue** : Anglais (peut saupoudrer du français)
- **Format** : Micro-story
- **Ton** : Mystérieux, confiant, sensuel mais élégant
- **CTA** : ~70% des posts ont un soft CTA vers le private

---

## 🚀 Usage

1. Ouvre un nouveau chat Cursor
2. Attache ce fichier `.md`
3. Envoie l'URL Cloudinary d'un carousel qui a bien performé
4. L'agent analyse, décide BACK/FRONT, et génère

**Exemple** :
```
[Ce doc attaché]
Génère un reel à partir de ce carousel : 
https://res.cloudinary.com/dily60mr0/image/upload/v1767899873/elena-scheduled/carousel-1-1767899873.jpg
```

**L'agent va** :
1. Analyser la scène (yacht sunset = vue panoramique)
2. Décider → **BACK VIEW** (environnement impressionnant)
3. Générer image Kling-Ready avec Nano Banana Pro
4. Générer vidéo Kling (elle se retourne vers caméra)

---

## 🔄 Batch Mode

Pour générer plusieurs reels en batch, envoie plusieurs URLs :

```
Génère des reels pour ces carousels :
1. https://res.cloudinary.com/xxx/carousel-1.jpg
2. https://res.cloudinary.com/xxx/carousel-2.jpg
3. https://res.cloudinary.com/xxx/carousel-3.jpg
```

L'agent traitera chaque image séquentiellement.

---

*Dernière mise à jour : 9 Janvier 2026 - V2: Image FRONT → Kling turn → finit BACK (évite invention visage)*
