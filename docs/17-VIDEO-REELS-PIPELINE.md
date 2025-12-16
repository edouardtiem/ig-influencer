# 17 - Pipeline Vidéo Reels (Kling 2.5)

> Documentation complète du système de génération de Reels automatisés

**Dernière mise à jour** : 15 décembre 2024  
**Status** : 📋 Documenté, prêt à implémenter

---

## 📋 Vue d'ensemble

Système de génération automatique de Reels Instagram à partir d'images Nano Banana Pro, utilisant **Kling v2.5 Turbo Pro** comme moteur d'animation.

### Pourquoi Kling v2.5 ?

Benchmark réalisé le 15/12/2024 sur 5 modèles Image-to-Video :

| Model | Qualité | Temps | Coût | Verdict |
|-------|---------|-------|------|---------|
| Google Veo 3.1 | ⭐⭐⭐⭐ | 60s | $0.70/8s | Bon, audio natif |
| MiniMax Hailuo 2.3 | ⭐⭐⭐⭐ | 78s | $0.90/6s | Mouvements réalistes |
| Wan 2.5 I2V | ⭐⭐⭐ | 91s | $0.30/~3s | Économique |
| **Kling v2.5 Turbo Pro** | ⭐⭐⭐⭐⭐ | 128s | $0.50/5s | **CHOISI** - Best quality/price |
| Luma Ray | ⭐⭐⭐ | 472s | $0.40/5s | Trop lent |

**Kling v2.5 Turbo Pro** sélectionné pour :
- ✅ Meilleur rendu mouvements humains
- ✅ Consistance visage excellente
- ✅ Ratio qualité/prix optimal
- ✅ Support portrait 9:16 natif

---

## 🎯 Stratégie Reels (3/semaine)

### Fréquence & Coûts

| Fréquence | Coût/mois | Budget OK |
|-----------|-----------|-----------|
| 3 reels/semaine | **~$6-8/mois** | ✅ |
| 1 reel/jour | ~$15/mois | ✅ |

### Types de Reels

| Type | % | Trigger psychologique | Exemple |
|------|---|----------------------|---------|
| **Body/Workout** | 40% | Désir + Aspiration | Gym mirror, yoga, post-workout |
| **Lifestyle** | 35% | Envie + Escapisme | Morning coffee, golden hour, Paris |
| **Getting Ready** | 25% | Identification | Mirror selfie, OOTD, confidence |

---

## 🏗️ Architecture Technique

### Pipeline Simple (1 clip = 1 reel)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Image Mila     │────▶│  Kling v2.5     │────▶│  Reel MP4       │
│  (Nano Banana)  │     │  Turbo Pro      │     │  (5-8s)         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Pipeline Multi-Shot (3 clips = 1 reel) ⭐ RECOMMANDÉ

```
CAROUSEL (3 photos)                    REEL FINAL (12-15s)
┌─────────┐                            ┌─────────────────────┐
│ Photo 1 │ ──► Kling 4s ──►          │ Clip 1 (4s)         │
├─────────┤                   FFmpeg   │ ↓ transition        │
│ Photo 2 │ ──► Kling 4s ──► ═══════► │ Clip 2 (4s)         │
├─────────┤                            │ ↓ transition        │
│ Photo 3 │ ──► Kling 4s ──►          │ Clip 3 (4s)         │
└─────────┘                            └─────────────────────┘
```

**Avantages Multi-Shot :**
- Consistance visuelle (même tenue, lieu, lighting)
- Plus dynamique (plusieurs angles)
- Storytelling naturel (intro → milieu → outro)
- Réutilise les carousels existants
- Look professionnel cinématique

---

## 🔧 Implémentation

### Dépendances

```bash
# Replicate SDK (déjà installé)
npm install replicate

# FFmpeg pour assemblage (à installer sur serveur)
brew install ffmpeg  # local
# Sur Vercel/Railway : déjà disponible
```

### Endpoint API

```typescript
// /api/reels/generate
POST /api/reels/generate
{
  "images": ["url1", "url2", "url3"],  // 1-3 images
  "prompts": ["prompt1", "prompt2", "prompt3"],  // optionnel
  "duration": 4,  // secondes par clip
  "assemble": true,  // assembler en 1 vidéo
  "transitions": "fade"  // fade, cut, dissolve
}

Response:
{
  "success": true,
  "clips": ["clip1.mp4", "clip2.mp4", "clip3.mp4"],
  "final_reel": "https://cloudinary.com/.../reel-final.mp4",
  "duration": 12,
  "cost": 1.20
}
```

### Service Principal

```typescript
// src/lib/kling.ts

import Replicate from 'replicate';

interface KlingOptions {
  image: string;  // URL ou base64
  prompt: string;
  duration?: number;  // 5 par défaut
  aspectRatio?: '9:16' | '16:9';
}

export async function generateKlingClip(options: KlingOptions): Promise<string> {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  const output = await replicate.run("kwaivgi/kling-v2.5-turbo-pro", {
    input: {
      prompt: options.prompt,
      image: options.image,
      duration: options.duration || 5,
      aspect_ratio: options.aspectRatio || '9:16'
    }
  });
  
  // Extract URL from output
  return extractVideoUrl(output);
}

export async function generateMultiShotReel(
  images: string[],
  prompts: string[],
  options?: { transition?: string }
): Promise<string> {
  // 1. Generate clips in parallel
  const clips = await Promise.all(
    images.map((img, i) => generateKlingClip({
      image: img,
      prompt: prompts[i] || generateAutoPrompt(i, images.length),
      duration: 4
    }))
  );
  
  // 2. Download clips locally
  const localPaths = await downloadClips(clips);
  
  // 3. Assemble with FFmpeg
  const finalReel = await ffmpegConcat(localPaths, {
    transition: options?.transition || 'fade',
    transitionDuration: 0.3
  });
  
  // 4. Upload to Cloudinary
  return await uploadToCloudinary(finalReel);
}
```

### FFmpeg Concatenation

```typescript
// src/lib/ffmpeg.ts

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ConcatOptions {
  transition?: 'cut' | 'fade' | 'dissolve';
  transitionDuration?: number;
  music?: string;
}

export async function ffmpegConcat(
  clips: string[],
  options: ConcatOptions = {}
): Promise<string> {
  const outputPath = `/tmp/reel-${Date.now()}.mp4`;
  
  if (options.transition === 'cut' || !options.transition) {
    // Simple concatenation
    const listFile = clips.map(c => `file '${c}'`).join('\n');
    await fs.writeFile('/tmp/concat-list.txt', listFile);
    
    await execAsync(`ffmpeg -f concat -safe 0 -i /tmp/concat-list.txt -c copy ${outputPath}`);
  } else {
    // With transitions (fade)
    const filterComplex = buildFadeFilter(clips.length, options.transitionDuration || 0.3);
    const inputs = clips.map(c => `-i "${c}"`).join(' ');
    
    await execAsync(`ffmpeg ${inputs} -filter_complex "${filterComplex}" ${outputPath}`);
  }
  
  // Add music if provided
  if (options.music) {
    const withMusic = outputPath.replace('.mp4', '-music.mp4');
    await execAsync(`ffmpeg -i ${outputPath} -i ${options.music} -c:v copy -c:a aac -shortest ${withMusic}`);
    return withMusic;
  }
  
  return outputPath;
}
```

---

## 📝 Prompts par Scénario

### Workout / Fitness

```typescript
const WORKOUT_PROMPTS = {
  intro: `Fitness motivation. The woman in athletic wear takes a deep breath, 
    preparing for her workout. Confident posture, focused expression. 
    Gym ambient lighting. Athletic energy.`,
    
  action: `Mid-workout intensity. Dynamic movement, muscle engagement visible. 
    Slight sweat glow, determined expression. Professional fitness aesthetic.`,
    
  outro: `Post-workout satisfaction. Confident stance, accomplished smile. 
    Checks herself in mirror approvingly. Empowering energy.`
};
```

### Morning / Lifestyle

```typescript
const MORNING_PROMPTS = {
  intro: `Peaceful morning awakening. Soft golden light through curtains. 
    Gentle stretch, eyes slowly opening. Dreamy cozy atmosphere.`,
    
  action: `Morning coffee ritual. Holds warm mug, steam rising. 
    Gazes peacefully at window. Sips slowly with satisfied expression.`,
    
  outro: `Ready for the day. Final look in mirror, confident smile. 
    French girl morning energy. Aspirational lifestyle moment.`
};
```

### Getting Ready / Confidence

```typescript
const READY_PROMPTS = {
  intro: `Getting ready moment. Bedroom mirror, outfit laid out. 
    Anticipation of the evening. Thoughtful expression.`,
    
  action: `Outfit check. Adjusts clothing, turns to check angles. 
    Hair flip, confident body language. Self-assured energy.`,
    
  outro: `Final look perfected. Direct eye contact with mirror reflection. 
    Satisfied confident smile. "Feeling myself" energy.`
};
```

---

## 📊 Métriques à Tracker

### Par Génération

| Métrique | Target | Comment mesurer |
|----------|--------|-----------------|
| Temps génération | < 3min/clip | Logs |
| Coût | < $0.50/clip | Replicate billing |
| Qualité face | > 8/10 | Review manuelle |
| Mouvement naturel | > 8/10 | Review manuelle |
| Artefacts | < 5% | Count defects |

### Performance Instagram

| Métrique | Target vs Photo | Comment mesurer |
|----------|-----------------|-----------------|
| Reach | 3-5x | IG Insights |
| Engagement | 2x | IG Insights |
| Saves | 1.5x | IG Insights |
| Shares | 3x | IG Insights |

---

## 🗓️ Planning Hebdomadaire Recommandé

| Jour | Type Reel | Concept |
|------|-----------|---------|
| **Lundi** | Workout | "Monday motivation" - gym energy |
| **Mercredi** | Lifestyle | "Midweek mood" - coffee/golden hour |
| **Vendredi** | Getting Ready | "Friday ready" - OOTD/confidence |

---

## 💰 Budget Mensuel

### Scénario 3 Reels/Semaine (Simple)

```
12 reels × $0.50 = $6/mois
```

### Scénario 3 Reels/Semaine (Multi-Shot)

```
12 reels × 3 clips × $0.40 = $14.40/mois
```

### Budget Total Recommandé

```
Images (Nano Banana) : ~$3/mois
Vidéos (Kling)       : ~$6-15/mois
─────────────────────────────────
Total                : $9-18/mois ✅
```

---

## 🚀 Checklist Implémentation

### Phase 1 : Setup (30min)

- [ ] Vérifier REPLICATE_API_TOKEN configuré
- [ ] Installer FFmpeg si nécessaire
- [ ] Créer dossier `generated/reels/`

### Phase 2 : Service Kling (2h)

- [ ] Créer `src/lib/kling.ts`
- [ ] Fonction `generateKlingClip()`
- [ ] Fonction `generateMultiShotReel()`
- [ ] Tests unitaires

### Phase 3 : FFmpeg Integration (1h)

- [ ] Créer `src/lib/ffmpeg.ts`
- [ ] Fonction `ffmpegConcat()`
- [ ] Support transitions (fade)
- [ ] Support ajout musique

### Phase 4 : API Endpoint (1h)

- [ ] Créer `/api/reels/generate`
- [ ] Validation inputs
- [ ] Error handling
- [ ] Upload Cloudinary

### Phase 5 : Automatisation (1h)

- [ ] Intégrer dans workflow auto-post
- [ ] Cron job pour génération overnight
- [ ] Logging et monitoring

---

## 🔗 Ressources

- **Kling v2.5 Turbo Pro** : https://replicate.com/kwaivgi/kling-v2.5-turbo-pro
- **FFmpeg Docs** : https://ffmpeg.org/documentation.html
- **Replicate Node.js** : https://github.com/replicate/replicate-javascript

---

## 📝 Notes de Test (15/12/2024)

### Benchmark I2V Models

Tous les modèles testés avec la même image (morning coffee):

```
✅ Veo 3.1      : 60s  - Bon, audio natif
✅ Hailuo 2.3   : 78s  - Mouvements réalistes  
✅ Wan 2.5 I2V  : 91s  - Économique mais basique
✅ Kling 2.5    : 128s - BEST quality
✅ Luma Ray     : 472s - Trop lent
```

### Test 3 Reels Kling

3 concepts testés avec succès :

| Reel | Image Source | Résultat |
|------|--------------|----------|
| Workout | gym-04-mirror-selfie | ✅ Mouvement naturel |
| Morning | morning-coffee-bodysuit | ✅ Ambiance réussie |
| Confidence | mirror-selfie-03-confident | ✅ Hair flip smooth |

**Conclusion** : Kling v2.5 Turbo Pro validé pour production.

---

*Documentation créée le 15 décembre 2024*

