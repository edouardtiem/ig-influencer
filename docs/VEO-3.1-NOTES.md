# 🎬 Google Veo 3.1 — Notes de Référence

> Modèle prioritaire pour la génération de vidéos Mila

**URL** : https://replicate.com/google/veo-3.1

---

## 📋 Vue d'ensemble

Google Veo 3.1 est le modèle de génération vidéo état de l'art de Google DeepMind, avec audio natif synchronisé et support d'images de référence.

### Pourquoi Veo 3.1 pour Mila ?

**✅ Image-to-Video**
- Transforme nos images Nano Banana en vidéos animées
- Cas d'usage exact : partir d'une photo statique haute qualité

**✅ Reference Images (1-3)**
- Support de 1 à 3 images de référence pour guider l'apparence
- **Parfait pour maintenir la consistance de Mila** à travers les vidéos
- Utilisation des mêmes 4 images de référence que Nano Banana

**✅ Audio Natif Synchronisé**
- Génère automatiquement de l'audio contextuel
- Sons naturels, musique d'ambiance, effets sonores
- **Simplifie le pipeline** (pas besoin d'ajouter audio séparément)

**✅ Formats Multiples**
- **9:16 portrait** — Parfait pour Instagram Reels
- 16:9 paysage — Pour autres plateformes si besoin
- 720p ou 1080p

**✅ Durées Flexibles**
- 4, 6 ou 8 secondes
- **4-6s idéal pour nos micro-vidéos** (évite uncanny valley)

**✅ Prompt Adherence**
- Comprend prompts complexes et nuancés
- Mouvements de caméra spécifiques
- Styles artistiques détaillés

**✅ Qualité Google**
- État de l'art en génération vidéo
- SynthID watermarking (identification contenu IA)
- Tests de sécurité et conformité

---

## 🔧 Paramètres API

### Structure de Base

```typescript
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const output = await replicate.run(
  "google/veo-3.1:latest",
  {
    input: {
      prompt: "Description du mouvement souhaité",
      image: "https://cloudinary.com/.../mila-portrait.jpg",
      reference_images: [
        "https://cloudinary.com/.../mila-ref-1.jpg",
        "https://cloudinary.com/.../mila-ref-2.jpg"
      ],
      duration: 4,
      aspect_ratio: "9:16",
      resolution: "1080p",
      audio: true
    }
  }
);
```

### Paramètres Détaillés

| Paramètre | Type | Valeurs | Recommandé Mila |
|-----------|------|---------|-----------------|
| `prompt` | string | Description détaillée | Mouvement + contexte audio |
| `image` | URL | Image de départ | Image générée par Nano Banana |
| `reference_images` | URL[] | 1-3 images | 2-3 images de Mila pour consistance |
| `duration` | int | 4, 6, 8 | **4-6s** (optimal) |
| `aspect_ratio` | string | "9:16", "16:9" | **"9:16"** (Reels) |
| `resolution` | string | "720p", "1080p" | **"1080p"** |
| `audio` | boolean | true, false | **true** |

---

## 📝 Stratégie de Prompts

### Structure de Prompt Recommandée

```
[MOUVEMENT] + [CONTEXTE VISUEL] + [CONTEXTE AUDIO] + [STYLE]
```

### Exemples par Type de Contenu

#### Portrait / Selfie

```typescript
prompt: "Subtle breathing motion, hair gently moving as if light breeze, 
soft natural lighting, with ambient room sounds and faint music in background, 
cinematic portrait style"
```

**Mouvements à demander :**
- Breathing motion
- Hair movement (light breeze)
- Subtle eye blink
- Micro-smile

**Audio suggéré :**
- Ambient sounds
- Soft background music
- Room atmosphere

#### Full Body / OOTD

```typescript
prompt: "Gentle body sway, fabric of clothes moving naturally, 
slight camera parallax effect, urban street sounds with footsteps, 
fashion photography style"
```

**Mouvements à demander :**
- Body sway / weight shift
- Clothes flowing
- Camera parallax
- Walking motion (if applicable)

**Audio suggéré :**
- Street ambiance
- Footsteps
- Urban background

#### Fitness / Workout

```typescript
prompt: "Mid-workout pose with controlled breathing visible, 
muscle definition clear, gym environment with mirror reflections, 
workout sounds with upbeat music, dynamic fitness video style"
```

**Mouvements à demander :**
- Breathing (workout intensity)
- Muscle tension visible
- Slight pose adjustment
- Mirror environment dynamic

**Audio suggéré :**
- Breathing sounds
- Gym ambiance
- Upbeat music

#### Beach / Environment

```typescript
prompt: "Standing on beach with wind moving hair and light clothing, 
ocean waves in background, seagulls and wave sounds with gentle breeze, 
golden hour natural light, vacation vibes"
```

**Mouvements à demander :**
- Hair + clothes wind movement
- Ocean waves (background)
- Natural body sway
- Environmental parallax

**Audio suggéré :**
- Ocean waves
- Wind sounds
- Seagulls
- Ambient beach

---

## 🧪 Tests à Effectuer

### Test Plan (5 tests prioritaires)

#### Test 1 : Portrait Simple
```typescript
{
  prompt: "Subtle breathing, hair gently moving, soft smile, ambient sounds",
  image: "[Mila portrait café]",
  reference_images: ["[Mila ref 1]", "[Mila ref 2]"],
  duration: 4,
  aspect_ratio: "9:16",
  resolution: "1080p",
  audio: true
}
```
**Mesurer** : Consistance visage, naturel mouvement, qualité audio

---

#### Test 2 : Full Body Movement
```typescript
{
  prompt: "Gentle body sway, clothes flowing, slight camera movement, urban sounds",
  image: "[Mila full body OOTD]",
  reference_images: ["[Mila ref 1]", "[Mila ref 2]"],
  duration: 6,
  aspect_ratio: "9:16",
  resolution: "1080p",
  audio: true
}
```
**Mesurer** : Cohérence corps, mouvement naturel, proportions

---

#### Test 3 : Fitness Context
```typescript
{
  prompt: "Workout pose with controlled breathing, gym ambiance, energetic music",
  image: "[Mila gym workout]",
  reference_images: ["[Mila ref 1]", "[Mila ref 2]"],
  duration: 4,
  aspect_ratio: "9:16",
  resolution: "1080p",
  audio: true
}
```
**Mesurer** : Contexte sportif, mouvement athlétique, audio workout

---

#### Test 4 : Beach Environment
```typescript
{
  prompt: "Beach scene with wind in hair, ocean waves background, seagull sounds",
  image: "[Mila plage]",
  reference_images: ["[Mila ref 1]", "[Mila ref 2]"],
  duration: 6,
  aspect_ratio: "9:16",
  resolution: "1080p",
  audio: true
}
```
**Mesurer** : Environnement naturel, mouvements organiques, audio contexte

---

#### Test 5 : Sans Reference Images
```typescript
{
  prompt: "Gentle portrait animation, natural movements, ambient sounds",
  image: "[Mila portrait]",
  reference_images: [], // Vide pour comparaison
  duration: 4,
  aspect_ratio: "9:16",
  resolution: "1080p",
  audio: true
}
```
**Mesurer** : Différence avec/sans refs, impact sur consistance

---

## 📊 Métriques à Tracker

### Par Génération

| Métrique | Comment Mesurer | Target |
|----------|-----------------|--------|
| **Coût** | Vérifier dashboard Replicate | <$0.50/vidéo |
| **Temps** | Début → Fin génération | <5 minutes |
| **Qualité visuelle** | Review manuelle 1-10 | >8/10 |
| **Consistance Mila** | Comparaison refs 1-10 | >9/10 |
| **Naturel mouvement** | Artefacts ? Uncanny ? 1-10 | >8/10 |
| **Qualité audio** | Contexte approprié ? 1-10 | >7/10 |

### Tableau Comparatif (après tests)

```
┌──────────┬──────┬───────┬─────────┬─────────────┬───────────┐
│   Test   │ Coût │ Temps │ Qualité │ Consistance │ Artefacts │
├──────────┼──────┼───────┼─────────┼─────────────┼───────────┤
│ Test 1   │  $?  │  ?min │   ?/10  │     ?/10    │    Oui/Non│
│ Test 2   │  $?  │  ?min │   ?/10  │     ?/10    │    Oui/Non│
│ Test 3   │  $?  │  ?min │   ?/10  │     ?/10    │    Oui/Non│
│ Test 4   │  $?  │  ?min │   ?/10  │     ?/10    │    Oui/Non│
│ Test 5   │  $?  │  ?min │   ?/10  │     ?/10    │    Oui/Non│
└──────────┴──────┴───────┴─────────┴─────────────┴───────────┘
```

---

## 💰 Estimation Coûts

### Coûts à Valider

**À déterminer lors des tests** (Replicate pricing varie selon modèle)

Estimation basée sur modèles similaires :
- **Génération 4s** : ~$0.30-0.50
- **Génération 6s** : ~$0.40-0.60
- **Génération 8s** : ~$0.50-0.80

### Budget Mensuel Estimé

```
Scénario : 4 reels/semaine (vidéos de 4-6s)

Mensuel :
├─ 16 vidéos × ~$0.40 = ~$6.40/mois
├─ + Tests/regenerations (20%) = +$1.30
└─ Total vidéo : ~$7.70/mois

Budget total (photos + vidéos) :
├─ Photos (Nano Banana) : ~$2-3/mois
├─ Vidéos (Veo 3.1) : ~$8/mois
└─ Total : ~$10-11/mois

✅ Reste sous target $20/mois
```

---

## ⚠️ Considérations Importantes

### Avantages

✅ **Audio intégré** — Pas besoin de post-processing audio
✅ **Reference images** — Maintien excellente consistance
✅ **Qualité Google** — État de l'art
✅ **Formats optimisés** — 9:16 natif pour Reels
✅ **Durées flexibles** — 4-8s couvre nos besoins

### Points d'Attention

⚠️ **Coût** — À valider (possiblement plus cher que alternatives)
⚠️ **Temps traitement** — Possiblement plus long (modèle avancé)
⚠️ **Audio généré** — Peut ne pas toujours correspondre à nos besoins (à tester)
⚠️ **Contrôle limité** — Moins de contrôle granulaire vs animation pure

### Mitigations

- **Si coût trop élevé** → Tester alternatives (Stable Video Diffusion)
- **Si temps long** → Générer overnight via queue system
- **Si audio inadapté** → Remplacer audio en post-processing
- **Si contrôle insuffisant** → Affiner prompts ou tester autre modèle

---

## 🚀 Prochaines Étapes

### Cette Semaine

1. **Jeudi 5 déc** : Effectuer les 5 tests prioritaires
2. **Vendredi 6 déc** : Analyser résultats, mesurer métriques
3. **Samedi 7 déc** : Décision Go/No-Go Veo 3.1
4. **Dimanche 8 déc** : Si Go → Implémenter service `lib/veo-3.1.ts`

### Si Veo 3.1 Validé

- ✅ Documenter résultats dans `docs/09-VIDEO-MODEL-SELECTION.md`
- ✅ Créer service backend `src/lib/veo-3.1.ts`
- ✅ Créer endpoints `/api/videos/animate`
- ✅ Intégrer dans workflow auto-post
- ✅ Tests production

### Si Veo 3.1 Non Satisfaisant

- Tester alternative #1 : `stability-ai/stable-video-diffusion`
- Tester alternative #2 : `lucataco/animate-diff`
- Re-évaluer stratégie vidéo

---

## 🔗 Ressources

- **Replicate** : https://replicate.com/google/veo-3.1
- **Documentation API** : Gemini API docs (Google)
- **Stratégie Vidéo** : [docs/08-VIDEO-STRATEGY.md](./08-VIDEO-STRATEGY.md)
- **Life Calendar** : [docs/07-LIFE-CALENDAR.md](./07-LIFE-CALENDAR.md)

---

*Créé le 2 décembre 2024*
*Modèle prioritaire identifié pour génération vidéo Mila*

