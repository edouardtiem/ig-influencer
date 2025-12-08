# 08 - Stratégie Vidéo & Animation

> Extension du système de génération pour inclure du contenu vidéo animé

---

## 📋 Vue d'ensemble

L'ajout de contenu vidéo via l'animation d'images statiques permet de :

- **Augmenter le reach** : Les Reels/vidéos obtiennent 4x plus de portée qu'une photo statique
- **Améliorer l'engagement** : Vidéos retiennent mieux l'attention (+60% completion rate)
- **Contourner la complexité** : Animations subtiles d'images fixes = indétectable et moins coûteux que vidéo native
- **Maximiser ROI** : Réutiliser images générées + animation = 2 formats pour le prix de 1.1

**Objectif** : Passer de 3 photos/jour à **3 photos + 1 vidéo/jour** (+ mix Stories)

---

## 🎯 Mix de Contenu Cible

### Distribution Quotidienne

```
FEED POSTS (1/jour):
├─ Lundi, Mercredi, Vendredi : Photo statique haute qualité
│  • Format : 4:5 (1080x1350)
│  • Optimisé : Aesthetics, Saves
│  • But : Portfolio visuel, identité de marque
│
└─ Mardi, Jeudi, Samedi, Dimanche : Reel animé
   • Format : 9:16 (1080x1920)
   • Optimisé : Reach, Shares
   • But : Découvrabilité algorithmique

STORIES (5-10/jour):
├─ 70% Photos : BTS, moments rapides, polls, Q&A
└─ 30% Vidéos : Transitions, "day in my life", try-ons
```

### Répartition Hebdomadaire

```
┌──────────┬─────────┬──────────┬─────────────┐
│   Jour   │  Feed   │ Stories  │    Focus    │
├──────────┼─────────┼──────────┼─────────────┤
│  Lundi   │  Photo  │ 5 photos │ Inspiration │
│  Mardi   │  Reel   │ 3p + 2v  │ Engagement  │
│Mercredi  │  Photo  │ 5 photos │ Lifestyle   │
│  Jeudi   │  Reel   │ 3p + 2v  │ Fitness     │
│Vendredi  │  Photo  │ 5 photos │ OOTD        │
│ Samedi   │  Reel   │ 4p + 3v  │ Weekend     │
│Dimanche  │  Reel   │ 4p + 3v  │ Chill       │
└──────────┴─────────┴──────────┴─────────────┘

Total/semaine : 3 photos + 4 reels + 35-50 stories
```

---

## 🎬 Types de Mouvements par Contexte

### Portrait / Selfie

**Mouvements subtils organiques :**

- ✅ **Respiration** : Mouvement poitrine/épaules léger (2-3s loop)
- ✅ **Cheveux** : Ondulation naturelle comme si vent léger
- ✅ **Clignement yeux** : 1-2 fois sur 3 secondes
- ✅ **Micro-sourire** : Légère variation expression
- ❌ **À éviter** : Mouvements bouche (uncanny valley)

**Cas d'usage :**
- Selfie miroir appartement
- Portrait café
- Close-up maquillage/beauté

### Full Body / OOTD

**Mouvements dynamiques :**

- ✅ **Déplacement léger** : Marche sur place, shift de poids
- ✅ **Vêtements fluides** : Robe/jupe qui bouge avec vent
- ✅ **Rotation caméra 3D** : Parallax léger (2-3°)
- ✅ **Geste main** : Toucher cheveux, ajuster tenue
- ❌ **À éviter** : Mouvements bras/jambes complexes

**Cas d'usage :**
- OOTD devant miroir
- Street style
- Entrée/sortie de champ

### Fitness / Athleisure

**Mouvements sportifs :**

- ✅ **Pose dynamique freeze** : Mi-mouvement (squat, stretch)
- ✅ **Muscle flex subtil** : Légère tension visible
- ✅ **Équipement** : Yoga mat, poids qui bougent légèrement
- ✅ **Décor gym** : Reflets miroirs, autres personnes floues
- ❌ **À éviter** : Mouvements sportifs complets (difficile à rendre)

**Cas d'usage :**
- Post-workout
- Exercices
- Transformation physique

### Environment / Lifestyle

**Mouvements environnementaux :**

- ✅ **Parallax** : Arrière-plan bouge différemment du sujet
- ✅ **Éléments contexte** : Feuilles d'arbres, vagues, passants flous
- ✅ **Lumière** : Changement subtil d'intensité/angle
- ✅ **Reflets** : Eau, miroirs, vitres qui bougent
- ✅ **Caméra** : Zoom in/out très léger, pan horizontal

**Cas d'usage :**
- Plage/mer (vagues)
- Rue parisienne (passants)
- Café (ambiance)
- Balcon golden hour

---

## 🏗️ Pipeline Technique

### Architecture Proposée

```
┌────────────────────────────────────────────────────────────┐
│                   WORKFLOW GÉNÉRATION                       │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Génération Image Statique                              │
│     ↓                                                       │
│     Nano Banana Pro API                                    │
│     (Prompt contextualisé via Life Calendar)               │
│     Output : image.jpg (1080x1920)                         │
│                                                             │
│  2. Quality Check Automatique                              │
│     ↓                                                       │
│     • Détection déformations (mains, visage)              │
│     • Score qualité > 8/10                                │
│     • Cohérence personnage                                │
│     Si OK → Continue, sinon → Regenerate                  │
│                                                             │
│  3. Animation Image → Vidéo                                │
│     ↓                                                       │
│     Google Veo 3.1 API (Replicate)                        │
│     https://replicate.com/google/veo-3.1                  │
│     Paramètres :                                           │
│     • prompt: Description mouvement                       │
│     • image: URL image générée                            │
│     • reference_images: [Mila refs] (optionnel)          │
│     • duration: 4-6 secondes                              │
│     • aspect_ratio: "9:16" (Reels)                       │
│     • resolution: "1080p"                                 │
│     • audio: true (généré automatiquement)               │
│     Output : video.mp4 avec audio                         │
│                                                             │
│  4. Post-Processing Vidéo (Optionnel Phase 1)             │
│     ↓                                                       │
│     • Text overlay (hooks) si besoin                      │
│     • Remplacement audio si nécessaire                    │
│     Note : Veo 3.1 génère déjà audio de qualité          │
│                                                             │
│  5. Upload & Storage                                       │
│     ↓                                                       │
│     • Upload Cloudinary                                   │
│     • URL permanente vidéo                                │
│                                                             │
│  6. Publication Automatique                                │
│     ↓                                                       │
│     Buffer/Later via Make.com                             │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

**Note** : Veo 3.1 génère nativement de l'audio synchronisé, ce qui simplifie le pipeline (pas besoin d'ajouter de l'audio séparément).

### Endpoints API à Créer

```typescript
// Structure proposée

/api/
├── images/
│   ├── generate             // Existant (Nano Banana)
│   └── validate             // Nouveau : quality check automatique
│
├── videos/
│   ├── animate              // Nouveau : image → vidéo
│   ├── post-process         // Nouveau : audio + overlays
│   └── status               // Nouveau : check progression
│
├── content/
│   ├── generate-mixed       // Nouveau : décide photo vs vidéo
│   └── schedule-batch       // Nouveau : planifie mix hebdo
```

---

## 🎨 Sélection Photo vs Vidéo

### Logique de Décision Automatique

**Critères pour choisir le format :**

```typescript
function shouldGenerateVideo(context: Context): boolean {
  // 1. Type de contenu
  const videoFriendlyContexts = [
    'gym_workout',
    'beach_waves',
    'street_walking',
    'balcony_golden_hour',
    'mirror_full_body',
    'cafe_lifestyle'
  ];
  
  if (!videoFriendlyContexts.includes(context.key)) {
    return false; // Photo only
  }
  
  // 2. Jour de la semaine (Reels Mardi, Jeudi, Sam, Dim)
  const dayOfWeek = new Date().getDay();
  const reelDays = [2, 4, 6, 0]; // Tue, Thu, Sat, Sun
  
  if (!reelDays.includes(dayOfWeek)) {
    return false;
  }
  
  // 3. Quota vidéo/semaine (max 4 reels)
  const reelsThisWeek = await countReelsThisWeek();
  if (reelsThisWeek >= 4) {
    return false;
  }
  
  return true; // Generate video
}
```

### Rotation Intelligente

```yaml
Semaine Type (exemple):

Lundi:    Photo - Lifestyle (café)
Mardi:    Reel  - Fitness (gym workout)
Mercredi: Photo - OOTD (rue Paris)
Jeudi:    Reel  - Lifestyle (balcon golden hour)
Vendredi: Photo - Casual (appartement)
Samedi:   Reel  - Beach/Pool (si Nice weekend)
Dimanche: Reel  - Chill vibes (Sunday mood)
```

---

## 🔧 Implémentation Supabase

### Nouvelle Colonne `content_type`

```sql
-- Ajouter à la table generated_content
ALTER TABLE generated_content 
ADD COLUMN content_type TEXT DEFAULT 'photo'; -- 'photo' ou 'video'

ALTER TABLE generated_content
ADD COLUMN video_url TEXT; -- Si content_type = 'video'

ALTER TABLE generated_content
ADD COLUMN animation_params JSONB; -- Paramètres d'animation utilisés
```

### Table `video_animations`

Tracking spécifique aux vidéos générées

```sql
CREATE TABLE video_animations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES generated_content(id) ON DELETE CASCADE,
  source_image_url TEXT NOT NULL,
  animation_type TEXT, -- 'subtle', 'dynamic', 'environment'
  duration_seconds INT, -- 2, 3, 4
  motion_strength TEXT, -- 'low', 'medium', 'high'
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  processing_time_seconds INT,
  cost_usd DECIMAL(10, 4),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_video_animations_content ON video_animations(content_id);
CREATE INDEX idx_video_animations_status ON video_animations(status);
```

### Métriques Vidéo vs Photo

```sql
-- Comparer performance
SELECT 
  content_type,
  COUNT(*) as total_posts,
  AVG(likes) as avg_likes,
  AVG(comments) as avg_comments,
  AVG(saves) as avg_saves,
  AVG(reach) as avg_reach
FROM generated_content
LEFT JOIN analytics ON generated_content.id = analytics.content_id
WHERE published_at > NOW() - INTERVAL '30 days'
GROUP BY content_type;
```

---

## 📊 Métriques de Succès

### KPIs à Tracker

**Engagement :**

```
Photo statique (baseline):
├─ Engagement rate : 2-4%
├─ Reach : 1-2x followers
└─ Saves : 1-3%

Vidéo/Reel (target):
├─ Engagement rate : 4-8% (2x photo)
├─ Reach : 3-5x followers (3x photo)
└─ Shares : 1-2% (2x photo)
```

**Production :**

```
Coûts estimés:
├─ Photo : ~$0.03-0.05
├─ Animation : ~$[À DÉTERMINER selon modèle]
└─ Total/vidéo : ~$[À CALCULER]

Target : <$0.15/vidéo pour rester sous $20/mois total
```

**Qualité :**

```
Quality checks:
├─ Artefacts visuels : <5% des vidéos
├─ Uncanny valley détecté : <2%
├─ Déformations : 0%
└─ Human approval rate : >95%
```

---

## ⚠️ Risques & Mitigations

### Risque 1 : Uncanny Valley dans les Animations

**Symptômes :**
- Mouvements non naturels
- Déformations visage/corps
- Physique irréaliste

**Mitigation :**
- Limiter durée à 2-3s maximum
- Éviter gros plans extrêmes sur visage
- Privilégier mouvements environnement > personnage
- **Human review obligatoire** avant publication
- A/B test : vidéos vs photos (tracker engagement réel)

### Risque 2 : Coûts d'Animation Élevés

**Mitigation :**
- Tester plusieurs modèles (comparer coût/qualité)
- Limiter à 1 vidéo/jour (vs 3 photos)
- Réutiliser animations réussies (variations légères)
- Fallback : si budget dépassé, revenir 100% photo

### Risque 3 : Temps de Traitement Long

**Mitigation :**
- Génération en batch overnight (queue system)
- Async processing (Replicate webhook)
- Buffer 24-48h à l'avance
- Fallback : photo si vidéo pas prête

### Risque 4 : Détection "Deepfake" par Instagram

**Mitigation :**
- Animations subtiles (pas transformations extrêmes)
- Variation naturelle (pas tous les posts vidéo)
- Watermark SynthID (si disponible)
- Disclosure "Virtual Creator" dans bio

---

## 🚀 Plan de Déploiement

### Phase 1 : Recherche & Tests (Semaine en cours)

**🎯 Modèle Prioritaire : Google Veo 3.1**

- [ ] Tester Veo 3.1 avec images Mila existantes
  - [ ] Test 1 : Portrait simple (respiration, cheveux)
  - [ ] Test 2 : Avec reference images (consistance)
  - [ ] Test 3 : Full body (mouvement)
  - [ ] Test 4 : Fitness context (workout pose)
  - [ ] Test 5 : Beach/environment (éléments naturels)
- [ ] Mesurer métriques Veo 3.1 :
  - [ ] Coût par génération (4s, 6s, 8s)
  - [ ] Temps de traitement
  - [ ] Qualité visuelle (artefacts ?)
  - [ ] Qualité audio généré
  - [ ] Consistance visage/corps
- [ ] Si Veo 3.1 non satisfaisant : tester alternatives
- [ ] Documenter résultats dans `docs/09-VIDEO-MODEL-SELECTION.md`

### Phase 2 : Implémentation Technique (Semaine prochaine)

- [ ] Créer `/api/videos/animate`
- [ ] Intégrer modèle sélectionné
- [ ] Créer tables Supabase (`video_animations`)
- [ ] Quality check automatique
- [ ] Tests batch (générer 10 vidéos)

### Phase 3 : Post-Processing (Semaine 3)

- [ ] Intégration CapCut API ou FFmpeg
- [ ] Système d'ajout audio (trending sounds)
- [ ] Text overlays automatiques
- [ ] Multi-format export

### Phase 4 : Automatisation Complète (Semaine 4)

- [ ] Logique décision photo vs vidéo
- [ ] Intégration dans `/api/auto-post`
- [ ] Scheduling intelligent (Mix hebdo)
- [ ] Monitoring dashboard

### Phase 5 : Validation & Optimisation (Semaine 5+)

- [ ] Publier premiers Reels en production
- [ ] Tracker métriques vs photos
- [ ] A/B testing types mouvements
- [ ] Ajuster stratégie selon data

---

## 📚 Checklist Complète

### Recherche Modèle

- [ ] Lister modèles disponibles Replicate
- [ ] Tester avec images Mila existantes
- [ ] Benchmark coût/qualité/temps
- [ ] Valider aucun artefact visuel
- [ ] Sélectionner modèle final

### Base de Données

- [ ] Ajouter colonne `content_type` à `generated_content`
- [ ] Ajouter colonne `video_url`
- [ ] Créer table `video_animations`
- [ ] Créer indexes appropriés

### Code Backend

- [ ] Service `src/lib/video-animation.ts`
- [ ] Endpoint `/api/videos/animate`
- [ ] Endpoint `/api/videos/status`
- [ ] Logique décision photo/vidéo
- [ ] Quality check automatique
- [ ] Queue system (async processing)

### Post-Processing

- [ ] Service audio (trending sounds)
- [ ] Text overlays
- [ ] Export multi-format
- [ ] Upload Cloudinary

### Tests

- [ ] Test animation 10 images différentes
- [ ] Test différents contextes (portrait, full body, env)
- [ ] Test durées (2s, 3s, 4s)
- [ ] Test motion strength (low, medium)
- [ ] Validation humaine

### Production

- [ ] Intégration dans workflow auto-post
- [ ] Cron jobs adaptés (génération overnight)
- [ ] Monitoring coûts vidéo
- [ ] Dashboard analytics vidéo vs photo

---

## 💡 Idées d'Optimisation Future

### Court Terme

- **Réutilisation intelligente** : Même image animée différemment = 2 vidéos
- **Variations légères** : Changer audio/text = nouveau contenu
- **Best-of replay** : Re-poster meilleures vidéos après 3-6 mois

### Moyen Terme

- **Face expressions control** : Paramétrer sourire, regard
- **Camera movements** : Pan, tilt, zoom programmables
- **Multi-shot** : Séquences courtes (2-3 plans de 1s)

### Long Terme

- **Lip-sync** : Mila "parle" (voiceover IA)
- **Full body animation** : Marche, gestes complets
- **Interactivité** : Vidéos "reply" aux comments

---

## 📈 Impact Projeté

### Croissance Accélérée

```
Scénario Photo Only:
├─ Mois 1-2 : 0 → 2K followers
├─ Mois 2-4 : 2K → 10K followers
└─ Mois 4-6 : 10K → 25K followers

Scénario Photo + Vidéo (3x reach):
├─ Mois 1-2 : 0 → 3K followers (+50%)
├─ Mois 2-4 : 3K → 18K followers (+80%)
└─ Mois 4-6 : 18K → 45K followers (+80%)

Accélération : ~6-8 semaines gagnées sur 10K milestone
```

### ROI Vidéo

```
Investissement supplémentaire:
├─ Développement : ~8-12h (one-time)
├─ Coût génération : +$[TBD]/mois
└─ Temps review : +15min/jour

Retour:
├─ Reach : 3x multiplier
├─ Engagement : 2x multiplier
├─ Croissance : +50-80% faster
└─ Monétisation : -2 mois pour atteindre 10K
```

---

**Dernière mise à jour : 2 décembre 2024**

**Note** : Modèle prioritaire identifié : **Google Veo 3.1** ([replicate.com/google/veo-3.1](https://replicate.com/google/veo-3.1)). Tests à effectuer pour validation finale.

