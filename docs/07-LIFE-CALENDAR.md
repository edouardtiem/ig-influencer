# 07 - Life Calendar System

> Système de rotation géographique et contextes de vie pour Mila Verne

---

## 📋 Vue d'ensemble

Le **Life Calendar System** est un système de planification automatique qui gère les lieux, contextes et types de contenu de Mila selon un cycle réaliste d'étudiante parisienne.

**Objectif** : Maintenir une cohérence narrative et géographique crédible pour éviter les incohérences spatiales qui nuisent à l'authenticité du personnage.

---

## 🌍 Stratégie Géographique

### Distribution Annuelle

```
80% Paris (Quotidien)     → ~42 semaines/an
15% Nice (Weekends)       → ~6-8 weekends/an  
5% Travel (Vacances)      → ~2-3 trips/an
```

### Cycle de Rotation (4 semaines)

**Semaines 1-3 : Paris Lifestyle**
- Lieux quotidiens : Appartement Marais, cafés locaux, campus, salle de sport
- Contextes : Morning routine, study sessions, workout, sorties
- Ambiance : Vie étudiante urbaine parisienne

**Semaine 4 : Nice Weekend (1x/mois)**
- Retour aux origines : Promenade des Anglais, Vieux Nice, plages
- Contextes : Family time, beach, Mediterranean vibes
- Ambiance : Détente, soleil, mer

**Événements Spéciaux (2-3x/an)**
- Hiver : Weekend ski (Alpes)
- Printemps : City break Europe
- Été : Vacances (Bali, Grèce, Italie)
- Automne : Paris Fashion Week

---

## 📅 Planification Hebdomadaire Type

### Paris - Semaine Standard

#### Lundi - Vendredi (Routine Étudiante)

**Matin (7h-11h)**
```yaml
Lieux:
  - Appartement (chambre, cuisine, salon)
  - Café local (flat white routine)
  - Métro/rue (trajet campus)

Contenus:
  - Morning routine (lit, salle de bain)
  - Coffee moment
  - OOTD mirror selfie
  - Commute aesthetic
  
Style:
  - Casual chic
  - Athleisure
  - Mix élégant/confortable
```

**Après-midi (12h-18h)**
```yaml
Lieux:
  - Bibliothèque/Campus
  - Lunch spots (terrasses, cafés)
  - Parcs (Tuileries, Luxembourg)

Contenus:
  - Study session + laptop
  - Lunch break
  - Book/reading moment
  - Walk & talk vibes

Style:
  - Casual académique
  - Blazer + jeans
  - Robes midi
```

**Soir (19h-23h)**
```yaml
Lieux:
  - Appartement
  - Salle de sport/gym
  - Rooftop/terrasse/balcon

Contenus:
  - Workout (Pilates, musculation)
  - Cooking/dinner prep
  - Golden hour balcon
  - Self-care routine

Style:
  - Athleisure
  - Leggings + brassière
  - Tenue cosy (sweat oversize)
```

#### Weekend Paris (1 weekend/mois)

**Samedi**
```yaml
Matin:
  - Brunch trendy (Le Marais, Oberkampf)
  - Photos food + coffee art

Après-midi:
  - Shopping (Galeries, boutiques)
  - Balade (Champs-Élysées, Seine)
  - Musée/expo culture

Soir:
  - Rooftop bar
  - Restaurant glam
  - Tenue soirée
```

**Dimanche**
```yaml
Matin:
  - Slow morning (lit, café, lecture)
  - Self-care (masque, bain)

Après-midi:
  - Expo/galerie
  - Parc/balade
  - Préparation semaine

Soir:
  - Meal prep
  - Chill à l'appart
```

### Nice - Weekend Mensuel

**Vendredi Soir → Dimanche Soir**

```yaml
Vendredi:
  - Story TGV Paris-Nice (selfie train)
  - Arrivée coucher de soleil

Samedi:
  - Matin : Réveil face à la mer
  - Jour : Plage Promenade des Anglais
  - Déjeuner : Terrasse vue mer
  - Après-midi : Baignade, bikini content
  - Soir : Vieux Nice, apéro sunset

Dimanche:
  - Matin : Brunch (mention famille possible)
  - Après-midi : Piscine/derniers moments plage
  - Soir : Retour Paris (story train mélancolique)

Contenus spécifiques:
  - Bikini/maillot (Mediterranean aesthetic)
  - Architecture colorée niçoise
  - Mer turquoise + palmiers
  - Captions: "Back home ☀️", "Vitamin sea", "Recharge mode"
```

---

## 🗓 Événements Annuels

### Hiver (Janvier-Février)

**Weekend Ski - Alpes (3 jours)**
```yaml
Timing: Mi-février

Contenus:
  - Tenue ski (combinaison colorée)
  - Chalet vibes (feu de cheminée)
  - Chocolat chaud + vue montagne
  - Snow selfies
  
Style:
  - Sporty chic montagne
  - Après-ski cosy
  - Bonnets, doudounes stylées
```

### Printemps (Mars-Mai)

**City Break Europe (4 jours)**
```yaml
Destinations: Amsterdam, Barcelona, Lisbonne

Contenus:
  - Street style urbain
  - Architecture iconique
  - Food spots locaux
  - Golden hour city views
  
Captions:
  - "48h à [ville] ✈️"
  - "New city, new energy"
  - Mix français/anglais
```

### Été (Juin-Août)

**Vacances Destination (7-10 jours)**
```yaml
Destinations: Bali, Grèce, Amalfi, Mykonos

Contenus:
  - Beach content intense
  - Resort/villa lifestyle
  - Bikini variations
  - Sunset dinners
  - Infinity pool shots
  
Fréquence posts:
  - Augmentée (3-4/jour)
  - Mix Feed + Stories
```

### Automne (Septembre-Octobre)

**Paris Fashion Week (5-7 jours)**
```yaml
Timing: Fin septembre

Contenus:
  - Street style elevated
  - Défilés (extérieurs)
  - Looks haute couture inspirés
  - Backstage vibes
  
Style:
  - Avant-garde parisien
  - Statement pieces
  - Mode expérimentale
```

---

## 🏗️ Structure Base de Données (Supabase)

### Tables

#### `location_calendar`

Planification géographique sur 52 semaines

```sql
CREATE TABLE location_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INT NOT NULL,
  week_number INT NOT NULL,
  location TEXT NOT NULL, -- 'paris', 'nice', 'travel'
  specific_place TEXT, -- 'bali', 'barcelona', 'alps', null
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_week UNIQUE (year, week_number)
);

-- Index pour requêtes rapides
CREATE INDEX idx_location_calendar_week ON location_calendar(year, week_number);
CREATE INDEX idx_location_calendar_location ON location_calendar(location);
```

**Exemple de données :**
```sql
INSERT INTO location_calendar (year, week_number, location, specific_place) VALUES
  (2024, 1, 'paris', NULL),
  (2024, 2, 'paris', NULL),
  (2024, 3, 'paris', NULL),
  (2024, 4, 'nice', NULL),
  (2024, 5, 'paris', NULL),
  -- ... repeat pattern
  (2024, 30, 'travel', 'bali'),
  (2024, 31, 'travel', 'bali');
```

#### `contexts`

Contextes disponibles par lieu

```sql
CREATE TABLE contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_key TEXT UNIQUE NOT NULL, -- 'paris_apartment_morning'
  location TEXT NOT NULL, -- 'paris', 'nice', 'travel'
  sub_location TEXT, -- 'apartment', 'cafe', 'gym', 'beach'
  time_of_day TEXT, -- 'morning', 'afternoon', 'evening', 'night'
  display_name TEXT NOT NULL,
  description TEXT,
  frequency_weight INT DEFAULT 1, -- Pour pondération aléatoire
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_contexts_location ON contexts(location);
```

**Exemple de données :**
```sql
INSERT INTO contexts (context_key, location, sub_location, time_of_day, display_name, frequency_weight) VALUES
  ('paris_apartment_morning', 'paris', 'apartment', 'morning', 'Morning Routine Appart', 3),
  ('paris_cafe_morning', 'paris', 'cafe', 'morning', 'Café Parisien Matin', 4),
  ('paris_gym_evening', 'paris', 'gym', 'evening', 'Salle de Sport Soir', 3),
  ('nice_beach_afternoon', 'nice', 'beach', 'afternoon', 'Plage Après-midi', 5),
  ('travel_pool_afternoon', 'travel', 'pool', 'afternoon', 'Piscine Resort', 4);
```

#### `context_prompts`

Templates de prompts par contexte

```sql
CREATE TABLE context_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_id UUID REFERENCES contexts(id) ON DELETE CASCADE,
  prompt_template TEXT NOT NULL,
  outfit_category TEXT, -- 'casual', 'athleisure', 'glam', 'swimwear'
  props TEXT[], -- ['coffee_cup', 'laptop', 'yoga_mat']
  setting_details TEXT, -- Détails décor spécifiques
  lighting TEXT, -- 'golden_hour', 'soft_morning', 'bright_day'
  mood TEXT, -- 'relaxed', 'energetic', 'confident'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_context_prompts_context ON context_prompts(context_id);
```

**Exemple de données :**
```sql
INSERT INTO context_prompts (context_id, prompt_template, outfit_category, props, lighting, mood) VALUES
  (
    '[context_id_paris_cafe]',
    'Mila sitting at charming Parisian café terrace, rattan chair, holding coffee cup, morning golden hour light, Haussmann buildings in background, {CLOTHING}, relaxed confident pose',
    'casual',
    ARRAY['coffee_cup', 'croissant', 'rattan_chair'],
    'golden_hour',
    'relaxed'
  ),
  (
    '[context_id_nice_beach]',
    'Mila on Mediterranean beach, turquoise sea background, Promenade des Anglais, {CLOTHING}, standing with hand in hair, sunset golden light, carefree summer mood',
    'swimwear',
    ARRAY['beach', 'sea', 'palm_trees'],
    'golden_hour',
    'carefree'
  );
```

#### `outfits`

Bibliothèque de tenues par catégorie

```sql
CREATE TABLE outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_key TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL, -- 'casual', 'athleisure', 'glam', 'swimwear'
  description TEXT NOT NULL, -- Description pour prompt
  seasons TEXT[], -- ['spring', 'summer', 'fall', 'winter']
  appropriate_contexts TEXT[], -- Contextes compatibles
  last_used_at TIMESTAMP,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_outfits_category ON outfits(category);
```

**Exemple de données :**
```sql
INSERT INTO outfits (outfit_key, category, description, seasons, appropriate_contexts) VALUES
  (
    'casual_blazer_jeans',
    'casual',
    'beige linen blazer over white crop top, high waisted blue jeans',
    ARRAY['spring', 'fall'],
    ARRAY['paris_cafe', 'paris_street', 'paris_campus']
  ),
  (
    'athleisure_olive_set',
    'athleisure',
    'matching olive green sports bra and high waisted leggings, Alo Yoga style',
    ARRAY['all_seasons'],
    ARRAY['paris_gym', 'paris_apartment_workout']
  ),
  (
    'swimwear_terracotta_bikini',
    'swimwear',
    'terracotta color bikini, simple elegant cut',
    ARRAY['summer'],
    ARRAY['nice_beach', 'travel_beach', 'travel_pool']
  );
```

#### `generated_content`

Historique du contenu généré (lié à la table existante si déjà présente)

```sql
CREATE TABLE generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number INT,
  location TEXT,
  context_key TEXT,
  outfit_key TEXT,
  prompt TEXT,
  image_url TEXT,
  caption TEXT,
  scheduled_at TIMESTAMP,
  published_at TIMESTAMP,
  status TEXT, -- 'draft', 'scheduled', 'published', 'failed'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_generated_content_week ON generated_content(week_number);
CREATE INDEX idx_generated_content_location ON generated_content(location);
CREATE INDEX idx_generated_content_status ON generated_content(status);
```

---

## 🔧 Logique d'Implémentation

### 1. Détermination du Contexte Actuel

```typescript
// Pseudo-code
async function getCurrentContext() {
  const currentWeek = getCurrentWeekNumber();
  const currentYear = getCurrentYear();
  
  // Récupérer la localisation de la semaine
  const weekData = await supabase
    .from('location_calendar')
    .select('*')
    .eq('year', currentYear)
    .eq('week_number', currentWeek)
    .single();
  
  const location = weekData.location; // 'paris', 'nice', 'travel'
  const specificPlace = weekData.specific_place;
  
  return { location, specificPlace, weekNumber: currentWeek };
}
```

### 2. Sélection Contexte Pondéré

```typescript
async function selectContext(location: string) {
  // Récupérer les contextes disponibles pour ce lieu
  const contexts = await supabase
    .from('contexts')
    .select('*')
    .eq('location', location);
  
  // Sélection pondérée aléatoire
  const selectedContext = weightedRandom(contexts, 'frequency_weight');
  
  return selectedContext;
}
```

### 3. Construction du Prompt Final

```typescript
async function buildPrompt(contextId: string) {
  // Récupérer le template de prompt
  const promptData = await supabase
    .from('context_prompts')
    .select('*')
    .eq('context_id', contextId)
    .single();
  
  // Sélectionner une tenue appropriée
  const outfit = await supabase
    .from('outfits')
    .select('*')
    .eq('category', promptData.outfit_category)
    .contains('appropriate_contexts', [contextId])
    .order('last_used_at', { ascending: true, nullsFirst: true })
    .limit(1)
    .single();
  
  // Remplacer {CLOTHING} dans le template
  const finalPrompt = promptData.prompt_template.replace(
    '{CLOTHING}',
    `wearing ${outfit.description}`
  );
  
  // Mettre à jour last_used_at
  await supabase
    .from('outfits')
    .update({ 
      last_used_at: new Date(), 
      usage_count: outfit.usage_count + 1 
    })
    .eq('id', outfit.id);
  
  return {
    prompt: finalPrompt,
    context: promptData,
    outfit: outfit
  };
}
```

### 4. Workflow Complet

```typescript
async function generateContextualContent() {
  // 1. Où sommes-nous cette semaine ?
  const { location, specificPlace, weekNumber } = await getCurrentContext();
  
  // 2. Quel contexte choisir ?
  const context = await selectContext(location);
  
  // 3. Construire le prompt
  const { prompt, outfit } = await buildPrompt(context.id);
  
  // 4. Générer l'image (via Nano Banana Pro)
  const imageUrl = await generateImage(prompt);
  
  // 5. Générer caption contextualisée
  const caption = await generateCaption({
    location,
    specificPlace,
    context: context.display_name,
    outfit: outfit.outfit_key
  });
  
  // 6. Sauvegarder dans l'historique
  await supabase.from('generated_content').insert({
    week_number: weekNumber,
    location,
    context_key: context.context_key,
    outfit_key: outfit.outfit_key,
    prompt,
    image_url: imageUrl,
    caption,
    status: 'draft'
  });
  
  return { imageUrl, caption };
}
```

---

## 📊 Métriques de Cohérence

### KPIs à Tracker

```sql
-- Vérifier la distribution géographique
SELECT 
  location,
  COUNT(*) as posts_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM generated_content
WHERE published_at IS NOT NULL
GROUP BY location;

-- Target: Paris 80%, Nice 15%, Travel 5%
```

```sql
-- Vérifier la rotation des tenues
SELECT 
  outfit_key,
  usage_count,
  last_used_at,
  EXTRACT(day FROM NOW() - last_used_at) as days_since_last_use
FROM outfits
ORDER BY usage_count DESC;

-- Target: Pas de tenue utilisée 2x dans la même semaine
```

```sql
-- Contextes les plus utilisés
SELECT 
  context_key,
  COUNT(*) as usage_count
FROM generated_content
WHERE published_at > NOW() - INTERVAL '30 days'
GROUP BY context_key
ORDER BY usage_count DESC;

-- Target: Diversité (pas de contexte >30% du total)
```

---

## ✅ Checklist Setup

### Phase 1 : Configuration Supabase

- [ ] Créer projet Supabase
- [ ] Créer les 6 tables (calendar, contexts, prompts, outfits, content)
- [ ] Peupler `location_calendar` (52 semaines)
- [ ] Peupler `contexts` (15-20 contextes)
- [ ] Créer 10-15 templates `context_prompts`
- [ ] Créer bibliothèque `outfits` (20-30 tenues)

### Phase 2 : Intégration Code

- [ ] Installer `@supabase/supabase-js`
- [ ] Créer service `src/lib/supabase.ts`
- [ ] Créer service `src/lib/life-calendar.ts`
- [ ] Intégrer dans `/api/auto-post`
- [ ] Tests unitaires par fonction

### Phase 3 : Validation

- [ ] Générer 10 contenus test (vérifier cohérence)
- [ ] Vérifier distribution géographique
- [ ] Vérifier rotation tenues
- [ ] Audit manuel des prompts générés

---

## 🚀 Améliorations Futures

### Court terme

- [ ] Interface admin pour gérer calendrier
- [ ] Système de "blacklist" contextes (si mauvaise performance)
- [ ] Preview du planning 7 jours

### Moyen terme

- [ ] IA suggère nouveaux contextes basé sur trends Instagram
- [ ] Ajustement automatique poids contextes selon engagement
- [ ] Détection automatique incohérences (Paris un jour, Bali le lendemain)

### Long terme

- [ ] Multi-personnages (partager la même base de contextes)
- [ ] Storylines (séquences narratives sur plusieurs jours)
- [ ] Intégration météo réelle (adapter tenues)

---

**Dernière mise à jour : 2 décembre 2024**

