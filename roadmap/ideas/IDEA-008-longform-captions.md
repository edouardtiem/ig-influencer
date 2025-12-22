# 💡 IDEA-008 — Long-form Captions + Character Voice

> Évolution du format de contenu avec hooks accrocheurs, textes longs en français, et voix distinctes pour Mila & Elena

**Créé** : 22 décembre 2024  
**Status** : 💡 Idea  
**Impact** : 🔴 High  
**Effort** : 🟡 Medium  

---

## 🎯 Objectif

1. Passer d'un format "photo + caption courte" à "photo + hook + long texte FR"
2. Développer des voix distinctes pour Mila et Elena
3. Préparer l'annonce de leur relation (bi + open relationship)
4. Créer du contenu qui génère des réactions et discussions

---

## 📝 Format Caption V2

```
[HOOK — 1 ligne choc en français, caps ou emoji]

[DÉVELOPPEMENT — 3-5 phrases, ton personnel, opinion/réflexion]

[QUESTION/CTA — invitation à interagir]

.
.
.

[HASHTAGS — 15-20, français + anglais]
```

### Exemple Mila

```
On m'a dit que les filles musclées c'était pas féminin 🙄

Genre, il y aurait une checklist officielle de la féminité quelque part? 
J'ai raté le memo apparemment.

Je préfère me sentir forte que "féminine selon les standards de qui au juste?"

Et vous, c'est quoi votre "pas assez X pour être Y" préféré? 👇

.
.
.

#bodypositive #strongwomen #fitnessmotivation #musculation #girlswholift
```

### Exemple Elena

```
Ce que personne ne sait derrière les photos de yacht... ✨

C'est qu'il m'arrive de commander des pizzas en room service à 2h du mat.
Seule. En peignoir. Devant des vidéos de chats.

Le glamour c'est aussi savoir quand enlever le masque.

Votre guilty pleasure secret? 🍕

.
.
.

#luxurylifestyle #reallife #behindthescenes #modellife #authenticity
```

---

## 🎭 Character Voices

### Mila — La Punk Authentique

**Ton** : Direct, sincère, un peu rebelle, questionnant

**Thèmes** :
- Body positivity, anti-perfectionnisme
- Authenticité vs standards sociaux
- Fitness sans obsession
- Créativité, liberté
- L'amour sous toutes ses formes

**Hooks style** :
- "On m'a dit que..."
- "Je pensais que... jusqu'à..."
- "Confession:"
- "Pourquoi on devrait..."
- "Est-ce que c'est vraiment normal de..."
- "Plot twist:"

**Opinions clivantes possibles** :
- Sur les standards de beauté
- Sur le couple "traditionnel"
- Sur le fitness toxic
- Sur les attentes genrées

---

### Elena — La Femme Fatale Mystérieuse

**Ton** : Mystérieux, sensuel, confiant, tease

**Thèmes** :
- Luxe vs authenticité (le vrai derrière le glamour)
- Apparences vs réalité
- Secrets, mystère
- Sensualité assumée
- Relations non-conventionnelles

**Hooks style** :
- "Ce que personne ne sait..."
- "Derrière les photos..."
- "Le secret c'est..."
- "On me demande souvent si..."
- "Certains pensent que..."
- "Entre nous..."

**Opinions clivantes possibles** :
- Sur les relations ouvertes
- Sur la beauté et le pouvoir
- Sur le luxe et le bonheur
- Sur la sexualité féminine

---

## 💕 Stratégie Reveal Relationship

### Phase 1 (Actuelle - Décembre)
- Hints visuels subtils (two cups, même location, looks coordonnés)
- Captions tendres sans expliciter

### Phase 2 (Janvier)
- Commentaires des followers augmentent ("vous êtes ensemble?")
- Stories qui teasent
- Photos plus affectueuses

### Phase 3 (Février - Valentine's Day)
- Annonce officielle : **Bisexuelles + Open Relationship**
- Post conjoint ou coordonné
- Caption qui explique leur vision de l'amour

### Phase 4 (Mars+)
- Posts sur leur mode de vie
- Opinions sur le dating moderne
- Discussions ouvertes avec la communauté
- Possible 3ème personnage (flirt, date, etc.)

---

## 📊 Schema Caption Templates V2

```sql
CREATE TABLE IF NOT EXISTS caption_templates_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  character VARCHAR(50),                     -- 'mila' | 'elena' | NULL (both)
  
  -- Style
  voice_type VARCHAR(50) NOT NULL,           -- 'punk_authentic' | 'femme_fatale' | 'duo'
  mood VARCHAR(50),                          -- 'questioning' | 'teasing' | 'confessing' | 'opinionated'
  
  -- Templates
  hook_templates TEXT[],                     -- ["On m'a dit que...", "Confession:"]
  body_guidelines TEXT,                      -- Instructions pour le développement
  cta_templates TEXT[],                      -- ["Et vous?", "Votre avis?"]
  
  -- Examples
  example_caption TEXT,
  
  -- Performance tracking
  usage_count INTEGER DEFAULT 0,
  avg_engagement DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📁 Fichiers à créer/modifier

```
app/scripts/lib/
└── voice-layer.mjs           # Nouveau layer pour character voice

app/src/config/
└── caption-voices.ts         # Templates et guidelines par personnage

# Modifier:
app/scripts/cron-scheduler.mjs  # Intégration long-form
```

---

## 🔧 Intégration Content Brain

```javascript
// Dans buildEnhancedPrompt():

## ✍️ VOICE & CAPTION STYLE

### Format obligatoire pour TOUTES les captions:

1. **HOOK** (première ligne) — Accrocheur, intrigue ou statement
2. **BODY** (3-5 phrases) — Développement personnel, opinion, réflexion
3. **CTA** — Question ouverte pour engagement
4. **HASHTAGS** — 15-20 (FR + EN)

### Voice de ${character}:
${getCharacterVoice(character)}

### Règle IMPORTANTE:
- Caption MINIMUM 50 mots (pas de one-liners)
- Langue FRANÇAISE (sauf hashtags)
- Ton PERSONNEL (comme un journal intime public)
- JAMAIS de caption générique style "Enjoying the moment ✨"
```

---

## 🎯 Critères de succès

- [ ] Templates voice créés pour Mila et Elena
- [ ] Captions générées en format long (50+ mots)
- [ ] Voix distinctes respectées par Claude
- [ ] Engagement augmenté sur posts avec long captions
- [ ] Reveal relationship exécuté selon timeline

---

## 📝 Notes

- Les captions longues = plus de temps passé sur le post = meilleur algo
- Le français authentique touche plus que l'anglais générique
- Les opinions clivantes génèrent des réactions (bien pour l'algo)
- Éviter le controversial pour le controversial — rester authentique
- Mila = questions, Elena = mystère (deux approches différentes)

