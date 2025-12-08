# ✅ TODO — Session Génération Photos & Système Intelligent

**Date prévue** : 3 décembre 2024

---

## 🎯 Objectifs de la session

1. 🎭 Améliorer le character sheet de Mila (prompts hyper-précis)
2. 📸 Générer 5-6 photos de base de Mila (références LoRA Nano Banana Pro)
3. 🏛️ Créer la liste complète des lieux récurrents à photographier
4. 🎨 Implémenter système de variation intelligent des prompts
5. 🔍 Intégrer recherche Perplexity quotidienne pour actualités/hashtags

---

## 📋 PARTIE 1 : Amélioration Character Sheet

### Fichier : `docs/03-PERSONNAGE.md`

#### ✅ Actions à faire

- [ ] **Améliorer section "Caractéristiques Physiques"** avec détails précis pour IA
  - Ajouter : forme du visage (ovale allongé, pommettes hautes)
  - Ajouter : forme des yeux (en amande, légèrement étirés)
  - Ajouter : forme des lèvres (pulpeuses naturelles, légèrement asymétrique)
  - Ajouter : forme du nez (droit, pointe légèrement relevée)
  - Ajouter : sourcils (fournis naturels, légèrement arqués)
  - Préciser : texture cheveux (ondulations type 2B/2C, volume naturel)
  - Préciser : longueur cheveux (mi-longs = juste en dessous des épaules)

- [ ] **Enrichir section "Personnalité & Voix"**
  - Ajouter 10 exemples de captions lifestyle supplémentaires
  - Ajouter 10 exemples de captions fitness supplémentaires
  - Ajouter 10 exemples de captions sexy-léger supplémentaires
  - Ajouter section "Réponses aux commentaires" (tone of voice)
  - Ajouter section "Stories captions" (différent des posts)
  - Ajouter "Topics à éviter" (politique, religion, controverses)

- [ ] **Améliorer section "Guide de Génération IA"**
  - Créer prompt de base VERSION 2 ultra-détaillé (inclure tous les nouveaux détails physiques)
  - Ajouter section "Negative prompts détaillés" par type de contenu
  - Ajouter exemples de prompts "mauvais" vs "bons" avec explications
  - Documenter les paramètres Nano Banana Pro spécifiques
  - Ajouter tableau "Troubleshooting génération" (problèmes fréquents + solutions)

- [ ] **Nouvelle section : "Variations Expressions & Émotions"**
  - Créer tableau avec 15-20 expressions différentes
  - Pour chaque expression : description textuelle + keywords prompt
  - Exemples : "confident smile", "playful smirk", "laughing candid", "pensive gaze", etc.

- [ ] **Nouvelle section : "Body Language & Poses"**
  - Documenter 20-25 poses naturelles pour Instagram
  - Catégoriser : Standing, Sitting, Lying, Action/Movement
  - Pour chaque pose : description + prompt keywords + contexte approprié

---

## 📸 PARTIE 2 : Génération Photos de Base

### Objectif : Créer 5-6 photos de référence parfaites pour Nano Banana Pro

#### ✅ Actions à faire

- [ ] **Décider du set de photos** (choisir une option)

#### **OPTION A : Variété de Contextes** (Recommandé)
```
Photo 1 : Portrait studio neutre
  - Fond uni gris/beige
  - Éclairage 3-points professionnel
  - Expression neutre/sourire léger
  - Plan poitrine
  - But : Référence visage parfaite

Photo 2 : Lifestyle café parisien
  - Terrasse café, chaise en rotin
  - Lumière naturelle dorée
  - Jeans + blazer beige + crop top blanc
  - Assise décontractée, café à la main
  - But : Référence style quotidien

Photo 3 : Fitness/Sport
  - Gym moderne, miroirs en fond
  - Tenue Alo Yoga (legging + brassière olive green)
  - Post-workout glow, légère transpiration
  - Pose confiante, flexing subtil
  - But : Référence sport/corps

Photo 4 : Glamour/Soirée
  - Intérieur chic, lumière douce
  - Robe noire moulante ou ensemble élégant
  - Maquillage léger mais présent
  - Pose élégante, regard intense
  - But : Référence glam

Photo 5 : Plage/Été Nice
  - Plage Méditerranée, mer bleue fond
  - Bikini terracotta
  - Golden hour, peau bronzée
  - Pose décontractée, main dans cheveux
  - But : Référence été/sensuel

Photo 6 : Selfie authentique
  - Miroir de salle de bain ou chambre
  - iPhone à la main visible
  - Tenue décontractée (sweat + cycliste)
  - Angle typique selfie (légèrement haut)
  - But : Référence selfie naturel
```

#### **OPTION B : Variété d'Angles** (Alternative)
```
Photo 1 : Face complète, regard caméra direct
Photo 2 : Profil 3/4 gauche, sourire naturel
Photo 3 : Profil 3/4 droit, regard ailleurs
Photo 4 : Corps entier, pose debout naturelle
Photo 5 : Plan rapproché visage/épaules
Photo 6 : En mouvement, cheveux qui bougent
```

- [ ] **Créer les 5-6 prompts ultra-détaillés** (utiliser le prompt de base V2 amélioré)

- [ ] **Générer les photos via Nano Banana Pro sur Replicate**
  - API endpoint : `nanobanana/nanobanana-pro`
  - Paramètres à utiliser :
    ```
    aspect_ratio: "4:5" (Instagram)
    num_outputs: 1 par photo
    guidance_scale: 7-8
    num_inference_steps: 30-40
    prompt: [utiliser prompts détaillés créés]
    negative_prompt: [utiliser negative prompts détaillés]
    ```

- [ ] **Télécharger et sauvegarder localement**
  - Nommer : `mila_base_01_portrait.png`, `mila_base_02_cafe.png`, etc.
  - Créer dossier : `/references/base-photos/`

- [ ] **Upload vers Cloudinary** avec tags
  - Tag : `reference`, `base`, `mila`, `[type]`
  - Organiser dans folder : `references/base`
  - Noter les URLs publiques

- [ ] **Alternative : Tester aussi Gemini** pour comparaison qualité
  - Générer les mêmes 5-6 photos avec Gemini
  - Comparer résultats
  - Décider quelle plateforme utiliser en production

---

## 🏛️ PARTIE 3 : Liste Lieux Récurrents + Génération

### Objectif : Créer 30-35 images de référence de tous les lieux fréquents

#### ✅ Actions à faire

- [ ] **Créer document détaillé** : `docs/LIEUX-REFERENCES.md`

#### Structure du document :

```markdown
# 📍 Lieux Récurrents — Références Photos

## 🏠 CATÉGORIE 1 : Appartement Paris (Intérieur Privé)

### 1. Chambre Mila
**Photos à générer : 4**
- Variation 1 : Matin (lumière douce fenêtre, lit défait, 7-9h)
- Variation 2 : Jour (lumière vive, lit fait, décor visible, 12-14h)
- Variation 3 : Golden hour (lumière dorée latérale, ambiance chaleureuse, 17-19h)
- Variation 4 : Soir/nuit (lumière chaude artificielle, lampe de chevet, 20-22h)

**Description style :**
- Minimaliste moderne parisien
- Couleurs : blanc cassé, beige, lin
- Décor : plantes, miroir rond, fairy lights discrètes
- Lit : draps blancs froissés naturels
- Sol : parquet clair

**Prompt de base :**
```
Modern Parisian bedroom, minimalist aesthetic, white linen bedding, beige walls,
wooden floor, round mirror, potted plants, soft natural light from window,
Instagram aesthetic, clean organized space, cozy atmosphere
```

### 2. Salon
**Photos à générer : 3**
- Variation 1 : Canapé (siège décontracté)
- Variation 2 : Coin lecture (fauteuil + book)
- Variation 3 : Vue d'ensemble (décor complet)

[... continuer pour chaque lieu ...]

---

## ☕ CATÉGORIE 2 : Cafés Paris

### 3. Café Terrasse Marais
**Photos à générer : 3**
- Variation 1 : Matin (8-10h, lumière douce)
- Variation 2 : Midi (11-13h, lumière vive)
- Variation 3 : Après-midi (15-17h, golden hour)

**Description style :**
- Terrasse parisienne typique
- Chaises en rotin
- Tables rondes marbre ou zinc
- Façade Haussmannienne en fond
- Passants flous en arrière-plan

**Prompt de base :**
```
Parisian café terrace, rattan bistro chairs, round marble table,
Haussmann building facade background, charming French café atmosphere,
natural daylight, people walking blurred background, authentic Paris vibe
```

[... etc pour tous les lieux ...]
```

- [ ] **Lister TOUS les lieux avec détails** :

#### Checklist des lieux à documenter :

**🏠 Intérieur Privé (12-15 photos)**
- [ ] Chambre (4 variations lumière)
- [ ] Salon (3 variations)
- [ ] Cuisine/Coin café (2 variations)
- [ ] Salle de bain/Miroir (2 variations)
- [ ] Balcon si applicable (2 variations)

**☕ Cafés Paris (5-6 photos)**
- [ ] Terrasse Marais (3 variations)
- [ ] Café cosy intérieur (2 variations)

**💪 Sport/Fitness (6-7 photos)**
- [ ] Gym moderne - zone tapis (2 variations)
- [ ] Gym - zone poids/miroirs (2 variations)
- [ ] Studio Pilates (2 variations)
- [ ] Vestiaire gym (1 variation)

**🌳 Extérieur Paris (5-6 photos)**
- [ ] Parc Luxembourg/Tuileries (2 variations)
- [ ] Rue Haussmannienne (2 variations)
- [ ] Pont Seine (2 variations)

**🌆 Lifestyle Paris (3-4 photos)**
- [ ] Rooftop (2 variations : jour/soirée)
- [ ] Boutique Marais (1 variation)
- [ ] Lieu branché (1 variation)

**🏖️ Nice/Côte d'Azur (8-10 photos)**
- [ ] Plage Nice (3 variations : matin/midi/sunset)
- [ ] Promenade des Anglais (2 variations)
- [ ] Vieille ville Nice (2 variations)
- [ ] Terrasse vue mer (2 variations)

---

- [ ] **Générer toutes les photos de lieux** (priorité par catégorie)
  - Utiliser API génération d'images (Replicate SDXL ou équivalent)
  - Pas besoin de Nano Banana Pro pour les lieux (juste décors)
  - Sauvegarder avec nomenclature : `lieu_[categorie]_[nom]_[variation].png`

- [ ] **Upload vers Supabase Storage** (ou Cloudinary)
  - Créer bucket : `location-references`
  - Structure folders :
    ```
    /appartement/chambre/
    /appartement/salon/
    /cafes/terrasse-marais/
    /gym/
    /paris-exterieur/
    /nice/
    ```
  - Créer table Supabase `locations` avec métadonnées :
    ```sql
    CREATE TABLE locations (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      variation TEXT,
      lighting TEXT, -- morning, day, golden_hour, evening, night
      time_range TEXT, -- "7-9h", "12-14h", etc.
      image_url TEXT NOT NULL,
      prompt_used TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    ```

- [ ] **Insérer toutes les métadonnées** dans la table

---

## 🎨 PARTIE 4 : Système de Variation Intelligent des Prompts

### Objectif : Éviter répétition, générer prompts uniques à chaque post

#### ✅ Actions à faire

- [ ] **Créer document** : `docs/PROMPT-VARIATION-SYSTEM.md`

#### Structure du document :

```markdown
# 🎨 Système de Variation Intelligente des Prompts

## 🎯 Objectif
Générer des prompts uniques pour chaque post afin d'éviter que les photos se ressemblent trop.

## 📊 Dimensions de Variation

### 1. Angle de Caméra (8 options)
```json
{
  "camera_angles": [
    {
      "id": "front",
      "name": "Front facing",
      "prompt": "straight on view, direct front angle",
      "usage": "portraits, selfies"
    },
    {
      "id": "3/4_left",
      "name": "Three-quarter left",
      "prompt": "3/4 profile from left side, slightly turned",
      "usage": "flattering, dynamic"
    },
    {
      "id": "3/4_right",
      "name": "Three-quarter right",
      "prompt": "3/4 profile from right side, slightly turned",
      "usage": "flattering, dynamic"
    },
    {
      "id": "side_profile",
      "name": "Side profile",
      "prompt": "full side profile view",
      "usage": "artistic, distinctive"
    },
    {
      "id": "low_angle",
      "name": "Slight low angle",
      "prompt": "camera slightly below eye level, empowering angle",
      "usage": "powerful, confident looks"
    },
    {
      "id": "high_angle",
      "name": "Slight high angle",
      "prompt": "camera slightly above eye level, soft approachable angle",
      "usage": "soft, cute, approachable"
    },
    {
      "id": "over_shoulder",
      "name": "Over the shoulder",
      "prompt": "shot from behind over shoulder",
      "usage": "candid, mysterious"
    },
    {
      "id": "dutch",
      "name": "Dutch angle",
      "prompt": "tilted camera angle, dynamic composition",
      "usage": "artistic, energy"
    }
  ]
}
```

### 2. Type de Shot (7 options)
```json
{
  "shot_types": [
    {
      "id": "closeup",
      "name": "Close-up portrait",
      "prompt": "close-up shot, head and shoulders visible",
      "crop": "tight framing"
    },
    {
      "id": "medium",
      "name": "Medium shot",
      "prompt": "medium shot, waist up visible",
      "crop": "standard portrait"
    },
    {
      "id": "full_body",
      "name": "Full body",
      "prompt": "full body shot, head to toe visible",
      "crop": "showing entire figure"
    },
    {
      "id": "selfie",
      "name": "Selfie style",
      "prompt": "selfie perspective, arm extended holding phone",
      "crop": "typical selfie framing"
    },
    {
      "id": "mirror_selfie",
      "name": "Mirror selfie",
      "prompt": "mirror selfie, phone visible in reflection",
      "crop": "mirror frame visible"
    },
    {
      "id": "candid",
      "name": "Candid",
      "prompt": "candid shot, natural unposed moment",
      "crop": "authentic framing"
    },
    {
      "id": "action",
      "name": "Action shot",
      "prompt": "action shot, captured mid-movement",
      "crop": "dynamic framing"
    }
  ]
}
```

### 3. Expressions & Mood (12 options)
```json
{
  "expressions": [
    {
      "id": "confident_smile",
      "prompt": "confident warm smile, direct eye contact",
      "mood": "empowering, approachable"
    },
    {
      "id": "soft_smile",
      "prompt": "soft gentle smile, relaxed expression",
      "mood": "calm, peaceful"
    },
    {
      "id": "laugh",
      "prompt": "genuine laugh, eyes crinkled, joyful",
      "mood": "happy, authentic"
    },
    {
      "id": "serious",
      "prompt": "serious intense gaze, slight smolder",
      "mood": "powerful, sexy"
    },
    {
      "id": "playful_smirk",
      "prompt": "playful smirk, mischievous expression",
      "mood": "fun, flirty"
    },
    {
      "id": "pensive",
      "prompt": "thoughtful pensive look, gazing elsewhere",
      "mood": "reflective, artistic"
    },
    {
      "id": "mid_conversation",
      "prompt": "mid-conversation expression, talking naturally",
      "mood": "authentic, relatable"
    },
    {
      "id": "surprise_delight",
      "prompt": "surprised delighted expression, eyes wide",
      "mood": "joyful, spontaneous"
    },
    {
      "id": "relaxed_neutral",
      "prompt": "relaxed neutral expression, at ease",
      "mood": "calm, natural"
    },
    {
      "id": "confident_gaze",
      "prompt": "confident direct gaze, no smile",
      "mood": "strong, alluring"
    },
    {
      "id": "looking_away",
      "prompt": "looking away from camera, natural moment",
      "mood": "candid, genuine"
    },
    {
      "id": "over_shoulder_look",
      "prompt": "looking back over shoulder, inviting glance",
      "mood": "playful, flirty"
    }
  ]
}
```

### 4. Poses (20+ options par catégorie)
```json
{
  "poses": {
    "standing": [
      "standing relaxed, natural posture, arms at sides",
      "standing confident, hand on hip, weight on one leg",
      "standing leaning against wall, casual pose",
      "standing with arms crossed, confident stance",
      "standing walking towards camera, natural gait",
      "standing stretching arms up, relaxed stretch"
    ],
    "sitting": [
      "sitting on chair, legs crossed, relaxed",
      "sitting on edge of bed, leaning back on hands",
      "sitting on floor, legs to side, casual",
      "sitting cross-legged, comfortable pose",
      "sitting with knees up, arms around legs"
    ],
    "action": [
      "hand running through hair, natural gesture",
      "adjusting sunglasses, casual movement",
      "holding coffee cup, mid-sip",
      "laughing, hand near face",
      "walking, hair flowing, mid-stride",
      "stretching, fitness pose, arms extended"
    ],
    "intimate": [
      "lying on bed, propped on elbow, relaxed",
      "sitting on bed edge, looking at camera",
      "standing by window, natural light, pensive"
    ]
  }
}
```

### 5. Lighting / Time of Day (6 options)
```json
{
  "lighting": [
    {
      "id": "golden_morning",
      "time": "7-9h",
      "prompt": "soft golden morning light, warm sunrise glow",
      "mood": "fresh, energetic"
    },
    {
      "id": "bright_day",
      "time": "10-16h",
      "prompt": "bright natural daylight, clear illumination",
      "mood": "vibrant, clear"
    },
    {
      "id": "golden_evening",
      "time": "17-19h",
      "prompt": "golden hour sunset light, warm amber glow",
      "mood": "romantic, dreamy"
    },
    {
      "id": "blue_hour",
      "time": "19-20h",
      "prompt": "blue hour twilight, soft diffused light",
      "mood": "atmospheric, elegant"
    },
    {
      "id": "interior_warm",
      "time": "evening",
      "prompt": "warm interior lighting, cozy ambient light",
      "mood": "intimate, comfortable"
    },
    {
      "id": "window_soft",
      "time": "any",
      "prompt": "soft natural window light, gentle indirect illumination",
      "mood": "soft, flattering"
    }
  ]
}
```

---

## 🤖 Algorithme de Sélection

### Logique de rotation intelligente :

```javascript
// Pseudo-code

function generateUniquePrompt(postHistory, calendar, datetime) {
  // 1. Récupérer contexte du jour (Life Calendar)
  const context = getCalendarContext(datetime);
  const location = context.location; // Paris, Nice, etc.
  const activity = context.activity; // gym, cafe, home, etc.
  
  // 2. Récupérer historique des 20 derniers posts
  const recentPosts = postHistory.slice(-20);
  const usedCombinations = recentPosts.map(p => ({
    angle: p.camera_angle,
    shot: p.shot_type,
    expression: p.expression,
    pose: p.pose
  }));
  
  // 3. Sélectionner variations NON utilisées récemment
  const availableAngles = CAMERA_ANGLES.filter(angle => 
    !usedCombinations.slice(-5).some(c => c.angle === angle.id)
  );
  
  const availableShots = SHOT_TYPES.filter(shot =>
    !usedCombinations.slice(-5).some(c => c.shot === shot.id)
  );
  
  const availableExpressions = EXPRESSIONS.filter(exp =>
    !usedCombinations.slice(-3).some(c => c.expression === exp.id)
  );
  
  // 4. Sélectionner aléatoirement parmi les disponibles
  const selectedAngle = randomChoice(availableAngles);
  const selectedShot = randomChoice(availableShots);
  const selectedExpression = randomChoice(availableExpressions);
  
  // 5. Choisir pose appropriée au contexte
  const poseCategory = getPoseCategoryForActivity(activity);
  const selectedPose = randomChoice(POSES[poseCategory]);
  
  // 6. Déterminer lighting selon l'heure
  const selectedLighting = getLightingForTime(datetime);
  
  // 7. Sélectionner image(s) de lieu en référence
  const locationImages = getLocationImages(location, activity, selectedLighting.time);
  
  // 8. Construire le prompt final
  const finalPrompt = buildPrompt({
    baseCharacter: MILA_BASE_PROMPT,
    angle: selectedAngle.prompt,
    shot: selectedShot.prompt,
    expression: selectedExpression.prompt,
    pose: selectedPose,
    lighting: selectedLighting.prompt,
    location: location,
    activity: activity,
    outfit: getOutfitForContext(context)
  });
  
  // 9. Sauvegarder la combinaison utilisée
  savePromptVariation({
    datetime,
    angle: selectedAngle.id,
    shot: selectedShot.id,
    expression: selectedExpression.id,
    pose: selectedPose,
    lighting: selectedLighting.id,
    prompt: finalPrompt
  });
  
  return {
    prompt: finalPrompt,
    referenceImages: locationImages,
    metadata: { angle, shot, expression, pose, lighting }
  };
}
```

---

## 📝 Règles de Variation

### Fréquences de rotation :

| Élément | Rotation | Raison |
|---------|----------|--------|
| Angle caméra | Tous les 5 posts | Éviter monotonie visuelle |
| Type de shot | Tous les 5 posts | Varier composition |
| Expression | Tous les 3 posts | Garder authenticité |
| Pose | À chaque post | Maximum de variété |
| Lighting | Selon heure réelle | Cohérence temporelle |

### Combinaisons à éviter :

- ❌ Selfie + Low angle (pas naturel)
- ❌ Action shot + Serious expression (incohérent)
- ❌ Dutch angle + Close-up (trop intense)
- ❌ Full body + Close-up portrait (contradiction)

### Combinaisons recommandées :

- ✅ 3/4 angle + Medium shot + Confident smile
- ✅ Front + Selfie + Playful smirk
- ✅ High angle + Close-up + Soft smile
- ✅ Full body + Action + Laugh
```

- [ ] **Implémenter dans le code** :
  - Créer fichier `/src/lib/prompt-variations.ts`
  - Exporter constantes JSON (angles, shots, expressions, poses, lighting)
  - Créer fonction `generateUniquePrompt()`
  - Intégrer avec système Life Calendar existant
  - Créer table Supabase `prompt_history` pour tracking

---

## 🔍 PARTIE 5 : Recherche Perplexity Quotidienne

### Objectif : Intégrer actualités & hashtags trending pour contexte

#### ✅ Actions à faire

- [ ] **Créer document** : `docs/PERPLEXITY-INTEGRATION.md`

#### Structure du document :

```markdown
# 🔍 Intégration Perplexity — Actualités & Hashtags

## 🎯 Objectif
Chaque matin avant génération, rechercher les tendances du jour pour adapter le contenu et les hashtags.

## 📊 Workflow Quotidien

```
6h00 : Cron déclenche recherche Perplexity
  ↓
6h05 : Parser et analyser résultats
  ↓
6h10 : Sélectionner 1-2 sujets pertinents
  ↓
6h15 : Générer caption avec référence subtile
  ↓
6h20 : Sauvegarder hashtags trending
  ↓
8h00 : Utiliser dans la génération du post
```

## 🔧 Configuration API Perplexity

### Endpoint :
```
POST https://api.perplexity.ai/chat/completions
```

### Query quotidienne :
```json
{
  "model": "sonar-pro",
  "messages": [
    {
      "role": "system",
      "content": "You are a social media trends analyst specializing in French lifestyle, fashion, and fitness content."
    },
    {
      "role": "user",
      "content": "What are the top 5 trending topics in France today (DATE) relevant to: lifestyle, fashion, fitness, wellness, Paris culture? Also provide the top 10 trending Instagram hashtags in France for lifestyle content today. Format: JSON with topics array and hashtags array."
    }
  ],
  "max_tokens": 500,
  "temperature": 0.3
}
```

### Réponse attendue :
```json
{
  "topics": [
    {
      "topic": "Paris Fashion Week",
      "relevance": "high",
      "context": "PFW currently happening, shows at Grand Palais",
      "caption_angle": "Fashion week energy"
    },
    {
      "topic": "Pilates boom in France",
      "relevance": "medium",
      "context": "New Pilates studios opening across Paris",
      "caption_angle": "Everyone's talking about Pilates lately"
    }
  ],
  "hashtags": [
    "#parisienne",
    "#lifestylecontent",
    "#frenchgirl",
    "#parisvibes",
    "#fitnessmotivation",
    "#parisianstyle"
  ]
}
```

## 📝 Règles de Sélection des Sujets

### ✅ Pertinents pour Mila :
- Mode/Fashion (Paris Fashion Week, new trends)
- Fitness/Wellness (new studios, fitness trends, nutrition)
- Culture Paris (expositions, événements)
- Lifestyle (cafés, hotspots, tendances déco)
- Météo exceptionnelle (neige, canicule, etc.)

### ❌ À éviter :
- Politique
- Faits divers négatifs
- Controverses
- Religion
- Actualité trop sérieuse/dramatique

## 🎨 Intégration dans les Captions

### Subtilité (Recommandé) :
```
Actualité : Canicule à Paris
Caption : "35°C à Paris aujourd'hui 🥵 Who else is living at the gym for the AC?"
Hashtags : #parisheatwave #summerparis #gymlife
```

### Directe (Occasionnel) :
```
Actualité : Fashion Week Paris
Caption : "Fashion Week energy in the air ✨ Anyone else obsessed with the street style?"
Hashtags : #pfw #parisfashionweek #streetstyle
```

### Aucune (Par défaut) :
```
Pas de sujet pertinent trouvé
Caption : Utiliser bank de captions standards
Hashtags : Hashtags standards lifestyle
```

## 🏷️ Stratégie Hashtags

### Structure :
- 3-5 hashtags trending du jour (de Perplexity)
- 5-7 hashtags evergreen Mila
- 2-3 hashtags niche selon le post

### Exemples :

**Post Fitness :**
```
#pilates #parisfitness #fitnessmotivation (trending)
#gymmotivation #fitnessjourney #strongwomen (evergreen Mila)
#athleisure #aloyoga (niche)
```

**Post Lifestyle :**
```
#parisienne #frenchgirl #parisvibes (trending)
#lifestylecontent #parisian #parislife (evergreen Mila)
#coffeelover #parisianstyle (niche)
```

## 🤖 Implémentation Technique

### Fichier : `/src/lib/perplexity.ts`

```typescript
export async function getDailyTrends(date: Date) {
  // Appel API Perplexity
  // Parser résultats
  // Retourner topics + hashtags
}

export function selectRelevantTopic(topics: Topic[], context: CalendarContext) {
  // Logique de sélection selon contexte du post
  // Retourner topic le plus pertinent ou null
}

export function generateCaptionWithTrend(topic: Topic | null, baseCaption: string) {
  // Si topic pertinent : injecter référence subtile
  // Sinon : retourner baseCaption standard
}

export function selectHashtags(trendingHashtags: string[], postType: string) {
  // Combiner trending + evergreen + niche
  // Retourner array de 10-15 hashtags
}
```

### Cron Job : 6h00 quotidien
```bash
# cron-job.org configuration
URL: https://[app-url]/api/daily-trends-fetch
Method: POST
Schedule: 0 6 * * * (6h00 UTC+1)
Header: Authorization: Bearer ${CRON_SECRET}
```

### Table Supabase : `daily_trends`
```sql
CREATE TABLE daily_trends (
  id UUID PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  topics JSONB,
  trending_hashtags TEXT[],
  selected_topic_id TEXT,
  fetched_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📊 Métriques à Tracker

| Métrique | But |
|----------|-----|
| Posts avec trend vs sans | Comparer engagement |
| Hashtags trending vs evergreen | Voir lesquels performent |
| Topics sélectionnés | Identifier les plus engageants |

---

## 🎯 Quick Wins

- Commencer avec recherche manuelle Perplexity pendant 1 semaine
- Observer quels types de trends fonctionnent le mieux
- Automatiser uniquement après validation manuelle
```

- [ ] **Créer compte Perplexity API** (si pas déjà fait)

- [ ] **Implémenter dans le code** :
  - Créer `/src/lib/perplexity.ts`
  - Créer route `/api/daily-trends-fetch`
  - Intégrer avec `/api/auto-post`
  - Créer table Supabase
  - Configurer cron job 6h00

---

## 🧪 PARTIE 6 : Tests & Validation

### ✅ Actions après implémentation

- [ ] **Tester génération photos de base**
  - Générer les 5-6 photos
  - Valider cohérence visuelle
  - Ajuster prompts si nécessaire

- [ ] **Tester système de variation**
  - Générer 10 posts d'affilée
  - Vérifier qu'aucune combinaison ne se répète
  - Valider qualité/cohérence

- [ ] **Tester recherche Perplexity**
  - Lancer recherche manuelle
  - Analyser pertinence des résultats
  - Valider sélection de topics

- [ ] **Tester pipeline complet**
  - Morning 8h : génération avec toutes les variations
  - Midi 12h30 : génération avec autres variations
  - Soir 19h : génération avec autres variations

---

## 📂 Fichiers à Créer/Modifier

### Nouveaux Documents
- [ ] `docs/LIEUX-REFERENCES.md`
- [ ] `docs/PROMPT-VARIATION-SYSTEM.md`
- [ ] `docs/PERPLEXITY-INTEGRATION.md`

### Documents à Modifier
- [ ] `docs/03-PERSONNAGE.md` (améliorer détails physiques + personnalité)

### Nouveaux Dossiers
- [ ] `/references/base-photos/` (photos de base Mila)
- [ ] `/references/locations/` (photos des lieux)

### Nouveau Code (si automatisation immédiate)
- [ ] `/src/lib/prompt-variations.ts`
- [ ] `/src/lib/perplexity.ts`
- [ ] `/src/lib/location-selector.ts`
- [ ] `/src/api/daily-trends-fetch/route.ts`

### Tables Supabase à Créer
- [ ] `locations` (métadonnées lieux)
- [ ] `prompt_history` (historique variations)
- [ ] `daily_trends` (actualités quotidiennes)

---

## 📊 Structure Supabase Complète

### Bucket Storage : `location-references`
```
/appartement/chambre/
/appartement/salon/
/appartement/cuisine/
/appartement/sdb/
/cafes/terrasse/
/cafes/interieur/
/gym/tapis/
/gym/poids/
/gym/miroirs/
/pilates/
/paris/rues/
/paris/parcs/
/paris/ponts/
/nice/plage/
/nice/promenade/
```

### Table `locations`
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'appartement', 'cafe', 'gym', 'paris', 'nice'
  subcategory TEXT, -- 'chambre', 'terrasse', etc.
  variation TEXT, -- 'morning', 'day', 'golden_hour', 'evening'
  lighting TEXT NOT NULL,
  time_range TEXT, -- '7-9h', '12-14h', etc.
  image_url TEXT NOT NULL,
  prompt_used TEXT,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_locations_category ON locations(category);
CREATE INDEX idx_locations_lighting ON locations(lighting);
CREATE INDEX idx_locations_time ON locations(time_range);
```

### Table `prompt_history`
```sql
CREATE TABLE prompt_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_date TIMESTAMP NOT NULL,
  camera_angle TEXT NOT NULL,
  shot_type TEXT NOT NULL,
  expression TEXT NOT NULL,
  pose TEXT,
  lighting TEXT NOT NULL,
  location_used UUID REFERENCES locations(id),
  full_prompt TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_prompt_history_date ON prompt_history(post_date DESC);
```

### Table `daily_trends`
```sql
CREATE TABLE daily_trends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trend_date DATE UNIQUE NOT NULL,
  topics JSONB NOT NULL,
  trending_hashtags TEXT[] NOT NULL,
  selected_topic TEXT,
  used_in_posts UUID[],
  fetched_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_daily_trends_date ON daily_trends(trend_date DESC);
```

---

## ⏱️ Estimation Temps

| Tâche | Temps estimé |
|-------|--------------|
| Améliorer docs 03-PERSONNAGE.md | 30-45 min |
| Créer LIEUX-REFERENCES.md | 45-60 min |
| Créer PROMPT-VARIATION-SYSTEM.md | 30-45 min |
| Créer PERPLEXITY-INTEGRATION.md | 30 min |
| Générer 5-6 photos base Mila | 20-30 min |
| Générer 30-35 photos lieux | 2-3h (batch) |
| Setup Supabase (tables + storage) | 30 min |
| Upload toutes photos + métadonnées | 45 min |
| Implémenter code variations | 1-2h |
| Implémenter Perplexity | 1h |
| Tests complets | 1h |

**TOTAL : ~8-11h de travail**

---

## 🎯 Priorisation Recommandée

### Phase 1 : Documentation (2-3h) ✅ FAIRE EN PRIORITÉ
1. Améliorer 03-PERSONNAGE.md
2. Créer LIEUX-REFERENCES.md
3. Créer PROMPT-VARIATION-SYSTEM.md
4. Créer PERPLEXITY-INTEGRATION.md

### Phase 2 : Génération Photos (3-4h)
5. Générer 5-6 photos base Mila
6. Valider cohérence
7. Générer photos lieux (peut être fait progressivement)

### Phase 3 : Infrastructure (1-2h)
8. Setup Supabase complet
9. Upload photos + métadonnées

### Phase 4 : Code (2-3h)
10. Implémenter système variations
11. Implémenter Perplexity
12. Intégrer avec auto-post existant

### Phase 5 : Tests (1h)
13. Tests end-to-end
14. Ajustements finaux

---

## ✅ Critères de Succès

- [ ] Character sheet Mila ultra-détaillé et prêt pour génération
- [ ] 5-6 photos de base générées et validées
- [ ] Liste complète des 30-35 lieux documentée
- [ ] Système de variation documenté et implémenté
- [ ] Intégration Perplexity documentée (implémentation optionnelle)
- [ ] Toutes photos uploadées avec métadonnées
- [ ] Tests confirmant variété des générations

---

*Let's make Mila come to life! 🌟*
