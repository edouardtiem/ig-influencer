# 📋 Documentation Migration — Dual Path Architecture (SFW/NSFW)

**Date:** December 11, 2024  
**Version:** 2.0  
**Status:** 🟡 Planning Phase

---

## ⚠️ Prerequisites

**Before starting this migration, ensure NSFW setup is complete:**

👉 **[SESSION-NSFW-SETUP.md](../SESSION-NSFW-SETUP.md)** - Complete NSFW generation setup first

**Required before migration:**
- [ ] NSFW LoRA training completed on CivitAI
- [ ] RunPod endpoint configured and tested
- [ ] NSFW generation API (`/api/generate-nsfw`) working
- [ ] LoRA `.safetensors` file downloaded and hosted
- [ ] Test generation successful with trigger word `IGMila1`

**This migration builds on top of the NSFW infrastructure.**

---

## 🎯 Objectif de la Migration

Refondre le projet pour supporter **deux chemins distincts** de génération et distribution :

1. **Path 1: SFW Content** → Instagram (via Nano Banana Pro)
2. **Path 2: NSFW Content** → Fanvue (via RunPod/SDXL)

Avec intégration d'un **système de conversion** où chaque post SFW débloque automatiquement du contenu NSFW gratuit pour amener les utilisateurs vers Fanvue.

---

## 🏗️ Nouvelle Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MILA CONTENT PLATFORM                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │   PATH 1: SFW     │         │   PATH 2: NSFW   │        │
│  │   Instagram       │         │   Fanvue          │        │
│  └──────────────────┘         └──────────────────┘        │
│         │                              │                    │
│         │                              │                    │
│  ┌──────▼──────────────────────────────▼──────┐            │
│  │         CONTENT GENERATION ENGINE          │            │
│  │  ┌──────────────┐    ┌──────────────┐    │            │
│  │  │ Nano Banana  │    │ RunPod/SDXL  │    │            │
│  │  │ (SFW)        │    │ (NSFW)       │    │            │
│  │  └──────────────┘    └──────────────┘    │            │
│  └───────────────────────────────────────────┘            │
│         │                              │                    │
│  ┌──────▼──────────────────────────────▼──────┐            │
│  │         DISTRIBUTION LAYER                │            │
│  │  ┌──────┐  ┌──────┐  ┌──────┐            │            │
│  │  │  IG  │  │  X   │  │Fanvue│            │            │
│  │  └──────┘  └──────┘  └──────┘            │            │
│  └───────────────────────────────────────────┘            │
│                                                              │
│  ┌───────────────────────────────────────────┐            │
│  │      CONVERSION FUNNEL (SFW → NSFW)       │            │
│  │  • Link in bio                             │            │
│  │  • Free NSFW unlock per SFW post          │            │
│  │  • CTA in captions                         │            │
│  └───────────────────────────────────────────┘            │
│                                                              │
│  ┌───────────────────────────────────────────┐            │
│  │      GENERATION INPUTS                     │            │
│  │  • Chat interface (conversational)         │            │
│  │  • Automation (cron/Vercel/RunPod)        │            │
│  └───────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Nouvelle Structure de Code

### Structure Proposée

```
app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── content/
│   │   │   │   ├── generate-sfw/          # Path 1: SFW generation
│   │   │   │   │   └── route.ts
│   │   │   │   ├── generate-nsfw/        # Path 2: NSFW generation
│   │   │   │   │   └── route.ts
│   │   │   │   └── generate-unlock/      # Free NSFW unlock system
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   ├── distribution/
│   │   │   │   ├── instagram/            # IG posting
│   │   │   │   │   └── route.ts
│   │   │   │   ├── twitter/              # X posting (NEW)
│   │   │   │   │   └── route.ts
│   │   │   │   └── fanvue/               # Fanvue posting (NEW)
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   ├── chat/                     # Chat-based generation (NEW)
│   │   │   │   ├── generate/            # Generate from chat
│   │   │   │   │   └── route.ts
│   │   │   │   └── conversation/         # Chat API
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   ├── automation/               # Automated generation
│   │   │   │   ├── auto-post-sfw/        # Cron for SFW
│   │   │   │   │   └── route.ts
│   │   │   │   └── auto-post-nsfw/       # Cron for NSFW
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   └── conversion/                # SFW → NSFW funnel
│   │   │       ├── unlock-tracking/       # Track unlocks
│   │   │       │   └── route.ts
│   │   │       └── link-generator/       # Generate unlock links
│   │   │           └── route.ts
│   │   │
│   │   ├── chat/                          # Chat UI (NEW)
│   │   │   └── page.tsx
│   │   │
│   │   └── dashboard/                     # Admin dashboard (NEW)
│   │       ├── sfw/
│   │       │   └── page.tsx
│   │       └── nsfw/
│   │           └── page.tsx
│   │
│   ├── lib/
│   │   ├── generators/
│   │   │   ├── sfw-generator.ts           # SFW generation logic
│   │   │   └── nsfw-generator.ts         # NSFW generation logic
│   │   │
│   │   ├── distributors/
│   │   │   ├── instagram.ts               # IG posting
│   │   │   ├── twitter.ts                 # X posting (NEW)
│   │   │   └── fanvue.ts                  # Fanvue posting (NEW)
│   │   │
│   │   ├── conversion/
│   │   │   ├── unlock-system.ts           # Free unlock logic
│   │   │   └── link-generator.ts          # Generate unlock links
│   │   │
│   │   └── chat/
│   │       ├── chat-handler.ts             # Chat conversation handler
│   │       └── prompt-parser.ts           # Parse chat → generation params
│   │
│   ├── config/
│   │   ├── content-paths.ts               # Path configs (SFW/NSFW)
│   │   ├── conversion.ts                  # Conversion funnel config
│   │   └── social-platforms.ts             # Platform configs (IG/X/Fanvue)
│   │
│   └── types/
│       ├── content-paths.ts                # Types for SFW/NSFW
│       ├── conversion.ts                   # Conversion types
│       └── chat.ts                         # Chat types
```

---

## 🔄 Migration des Fichiers Existants

### Fichiers à Déplacer/Renommer

| Fichier Actuel | Nouvelle Location | Action |
|----------------|-------------------|--------|
| `app/src/app/api/auto-post/route.ts` | `app/src/app/api/automation/auto-post-sfw/route.ts` | Déplacer + Modifier |
| `app/src/app/api/generate-nsfw/route.ts` | `app/src/app/api/content/generate-nsfw/route.ts` | Déplacer |
| `app/src/lib/nanobanana.ts` | `app/src/lib/generators/sfw-generator.ts` | Renommer + Wrapper |
| `app/src/lib/runpod.ts` | `app/src/lib/generators/nsfw-generator.ts` | Renommer + Wrapper |
| `app/src/lib/make.ts` | `app/src/lib/distributors/instagram.ts` | Renommer + Modifier |

### Fichiers à Garder (Pas de Changement)

- `app/src/config/character.ts` ✅
- `app/src/config/calendar.ts` ✅
- `app/src/config/locations.ts` ✅
- `app/src/config/prompts.ts` ✅ (mais modifier pour ajouter CTA conversion)
- `app/src/lib/cloudinary.ts` ✅
- `app/src/lib/perplexity.ts` ✅

### Nouveaux Fichiers à Créer

1. **Génération**
   - `app/src/lib/generators/sfw-generator.ts`
   - `app/src/lib/generators/nsfw-generator.ts`

2. **Distribution**
   - `app/src/lib/distributors/twitter.ts` ⭐ NEW
   - `app/src/lib/distributors/fanvue.ts` ⭐ NEW

3. **Conversion**
   - `app/src/lib/conversion/unlock-system.ts` ⭐ NEW
   - `app/src/lib/conversion/link-generator.ts` ⭐ NEW

4. **Chat**
   - `app/src/lib/chat/chat-handler.ts` ⭐ NEW
   - `app/src/lib/chat/prompt-parser.ts` ⭐ NEW

5. **Config**
   - `app/src/config/content-paths.ts` ⭐ NEW
   - `app/src/config/conversion.ts` ⭐ NEW
   - `app/src/config/social-platforms.ts` ⭐ NEW

6. **Types**
   - `app/src/types/content-paths.ts` ⭐ NEW
   - `app/src/types/conversion.ts` ⭐ NEW
   - `app/src/types/chat.ts` ⭐ NEW

7. **API Routes**
   - `app/src/app/api/content/generate-unlock/route.ts` ⭐ NEW
   - `app/src/app/api/distribution/twitter/route.ts` ⭐ NEW
   - `app/src/app/api/distribution/fanvue/route.ts` ⭐ NEW
   - `app/src/app/api/chat/generate/route.ts` ⭐ NEW
   - `app/src/app/api/chat/conversation/route.ts` ⭐ NEW
   - `app/src/app/api/conversion/unlock-tracking/route.ts` ⭐ NEW
   - `app/src/app/api/conversion/link-generator/route.ts` ⭐ NEW
   - `app/src/app/api/automation/auto-post-nsfw/route.ts` ⭐ NEW

8. **UI Pages**
   - `app/src/app/chat/page.tsx` ⭐ NEW
   - `app/src/app/dashboard/sfw/page.tsx` ⭐ NEW
   - `app/src/app/dashboard/nsfw/page.tsx` ⭐ NEW

---

## 📚 Nouvelle Structure de Documentation

### Fichiers à Créer

```
docs/
├── 14-CONTENT-PATHS.md                     # NEW: SFW vs NSFW strategy
├── 15-CONVERSION-FUNNEL.md                 # NEW: SFW → NSFW conversion
├── 16-X-INTEGRATION.md                     # NEW: Twitter/X strategy
├── 17-CHAT-GENERATION.md                   # NEW: Chat-based generation
└── ARCHITECTURE-V2.md                      # NEW: Complete architecture doc
```

### Fichiers à Mettre à Jour

- `docs/01-PRD.md` - Ajouter section dual-path
- `docs/02-MONETISATION.md` - Ajouter conversion funnel
- `docs/04-IMPLEMENTATION.md` - Mettre à jour architecture
- `README.md` - Mettre à jour avec nouvelle structure

---

## 🔧 Fonctionnalités à Implémenter

### 1. Système de Conversion SFW → NSFW

**Concept :** Chaque post SFW sur Instagram débloque automatiquement 1 image NSFW gratuite sur Fanvue.

**Workflow :**
```
1. Post SFW généré sur Instagram
2. Génération automatique d'une image NSFW correspondante (même contexte)
3. Création d'un code de déblocage unique
4. Ajout du CTA dans la caption IG : "🔓 Free exclusive content: [link in bio]"
5. Lien dans bio pointe vers page de déblocage
6. Utilisateur entre le code → Accès gratuit à l'image NSFW sur Fanvue
```

**Fichiers à créer :**
- `app/src/lib/conversion/unlock-system.ts`
- `app/src/app/api/conversion/unlock-tracking/route.ts`
- `app/src/app/api/conversion/link-generator/route.ts`

### 2. Intégration X (Twitter)

**Stratégie :**
- X est moins strict sur NSFW → utiliser différemment d'Instagram
- Post SFW sur IG → Cross-post sur X avec teaser NSFW
- Utiliser X pour promouvoir Fanvue (moins de restrictions)

**Fichiers à créer :**
- `app/src/lib/distributors/twitter.ts`
- `app/src/app/api/distribution/twitter/route.ts`

**Variables d'environnement à ajouter :**
```bash
# Twitter/X API
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
TWITTER_BEARER_TOKEN=your_bearer_token
```

### 3. Intégration Fanvue

**Fichiers à créer :**
- `app/src/lib/distributors/fanvue.ts`
- `app/src/app/api/distribution/fanvue/route.ts`

**Variables d'environnement à ajouter :**
```bash
# Fanvue API
FANVUE_API_KEY=your_api_key
FANVUE_API_SECRET=your_api_secret
FANVUE_USER_ID=your_user_id
```

### 4. Chat-Based Generation

**Concept :** Interface chat où tu peux demander "Génère une photo de Mila en bikini à la plage" et ça génère.

**Fichiers à créer :**
- `app/src/lib/chat/chat-handler.ts`
- `app/src/lib/chat/prompt-parser.ts`
- `app/src/app/api/chat/generate/route.ts`
- `app/src/app/api/chat/conversation/route.ts`
- `app/src/app/chat/page.tsx`

**Variables d'environnement à ajouter :**
```bash
# Chat LLM (pour parser les prompts)
ANTHROPIC_API_KEY=your_anthropic_key  # Claude API
# ou
OPENAI_API_KEY=your_openai_key        # GPT-4
```

---

## 📋 Plan d'Implémentation

### Phase 1 : Foundation (Semaine 1)

**Objectif :** Créer la nouvelle structure de base

- [ ] Créer structure de dossiers (`generators/`, `distributors/`, `conversion/`, `chat/`)
- [ ] Créer `app/src/config/content-paths.ts`
- [ ] Créer `app/src/config/conversion.ts`
- [ ] Créer `app/src/config/social-platforms.ts`
- [ ] Créer types de base (`content-paths.ts`, `conversion.ts`, `chat.ts`)
- [ ] Créer wrappers pour générateurs existants
  - [ ] `sfw-generator.ts` (wrapper autour de `nanobanana.ts`)
  - [ ] `nsfw-generator.ts` (wrapper autour de `runpod.ts`)

**Livrables :**
- Structure de code organisée
- Types définis
- Configs créées

---

### Phase 2 : Conversion System (Semaine 2)

**Objectif :** Implémenter le système de déblocage SFW → NSFW

- [ ] Implémenter `app/src/lib/conversion/unlock-system.ts`
  - [ ] Fonction `generateUnlockForSFWPost()`
  - [ ] Fonction `validateUnlockCode()`
  - [ ] Fonction `trackUnlockClaim()`
- [ ] Créer endpoint `/api/conversion/unlock-tracking`
- [ ] Créer endpoint `/api/conversion/link-generator`
- [ ] Modifier `auto-post-sfw` pour générer unlocks automatiquement
- [ ] Créer page de déblocage (frontend)
- [ ] Tester le flow complet SFW → Unlock → NSFW

**Livrables :**
- Système de conversion fonctionnel
- Tracking des unlocks
- Flow testé end-to-end

---

### Phase 3 : X Integration (Semaine 3)

**Objectif :** Intégrer Twitter/X pour cross-posting

- [ ] Setup Twitter API v2 credentials
- [ ] Créer `app/src/lib/distributors/twitter.ts`
  - [ ] Fonction `postToTwitter()`
  - [ ] Support SFW posts
  - [ ] Support NSFW teasers
  - [ ] Support unlock links
- [ ] Créer endpoint `/api/distribution/twitter`
- [ ] Modifier `auto-post-sfw` pour cross-post sur X
- [ ] Tester posting sur X
- [ ] Documenter stratégie X vs Instagram

**Livrables :**
- Intégration X complète
- Cross-posting automatique
- Documentation stratégie

---

### Phase 4 : Fanvue Integration (Semaine 4)

**Objectif :** Intégrer Fanvue pour distribution NSFW

- [ ] Setup Fanvue API credentials
- [ ] Créer `app/src/lib/distributors/fanvue.ts`
  - [ ] Fonction `uploadToFanvue()`
  - [ ] Fonction `createPost()`
  - [ ] Gestion des tiers (free unlock vs paid)
- [ ] Créer endpoint `/api/distribution/fanvue`
- [ ] Créer endpoint `/api/automation/auto-post-nsfw`
- [ ] Tester upload et posting sur Fanvue
- [ ] Intégrer avec système d'unlock

**Livrables :**
- Intégration Fanvue complète
- Automation NSFW posting
- Système de tiers fonctionnel

---

### Phase 5 : Chat Interface (Semaine 5)

**Objectif :** Créer interface de génération via chat

- [ ] Créer `app/src/lib/chat/prompt-parser.ts`
  - [ ] Parser messages naturels → paramètres génération
  - [ ] Utiliser LLM (Claude/GPT) pour parsing
- [ ] Créer `app/src/lib/chat/chat-handler.ts`
  - [ ] Gestion conversation
  - [ ] Génération via chat
- [ ] Créer endpoint `/api/chat/generate`
- [ ] Créer endpoint `/api/chat/conversation`
- [ ] Créer UI `/app/chat/page.tsx`
- [ ] Tester génération via chat (SFW et NSFW)

**Livrables :**
- Interface chat fonctionnelle
- Génération via conversation
- Documentation usage

---

### Phase 6 : Documentation (Semaine 6)

**Objectif :** Documenter toute la nouvelle architecture

- [ ] Créer `docs/14-CONTENT-PATHS.md`
- [ ] Créer `docs/15-CONVERSION-FUNNEL.md`
- [ ] Créer `docs/16-X-INTEGRATION.md`
- [ ] Créer `docs/17-CHAT-GENERATION.md`
- [ ] Créer `docs/ARCHITECTURE-V2.md`
- [ ] Mettre à jour `docs/01-PRD.md`
- [ ] Mettre à jour `docs/02-MONETISATION.md`
- [ ] Mettre à jour `docs/04-IMPLEMENTATION.md`
- [ ] Mettre à jour `README.md`
- [ ] Mettre à jour `DOCUMENTATION-INDEX.md`

**Livrables :**
- Documentation complète
- Guides d'utilisation
- Architecture documentée

---

## 🔐 Variables d'Environnement à Ajouter

### Fichier `.env.local` - Nouvelles Variables

```bash
# ===========================================
# EXISTING (Keep)
# ===========================================
REPLICATE_API_TOKEN=...
RUNPOD_API_KEY=...
RUNPOD_ENDPOINT_ID=...
MILA_LORA_URL=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
MAKE_WEBHOOK_URL=...
PERPLEXITY_API_KEY=...
CRON_SECRET=...

# ===========================================
# NEW - Twitter/X API
# ===========================================
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
TWITTER_BEARER_TOKEN=your_bearer_token

# ===========================================
# NEW - Fanvue API
# ===========================================
FANVUE_API_KEY=your_fanvue_api_key
FANVUE_API_SECRET=your_fanvue_api_secret
FANVUE_USER_ID=your_fanvue_user_id

# ===========================================
# NEW - Chat LLM (for prompt parsing)
# ===========================================
ANTHROPIC_API_KEY=your_anthropic_key  # Claude API
# OR
OPENAI_API_KEY=your_openai_key        # GPT-4

# ===========================================
# NEW - Conversion System
# ===========================================
UNLOCK_CODE_SECRET=your_secret_for_generating_unlock_codes
UNLOCK_EXPIRY_DAYS=7  # Days before unlock expires
```

---

## 📊 Métriques à Tracker

### Conversion Funnel Metrics

| Métrique | Description | Cible |
|----------|-------------|-------|
| **SFW Posts** | Nombre de posts SFW publiés | 2-3/jour |
| **Unlock Links Generated** | Codes générés par post SFW | 1/post |
| **Unlock Claims** | Codes utilisés | >30% |
| **Fanvue Signups** | Inscriptions via unlock | >10% des claims |
| **X Engagement** | Engagement sur X vs IG | Comparable |

### Content Generation Metrics

| Métrique | Description | Cible |
|----------|-------------|-------|
| **SFW Generation Time** | Temps génération Nano Banana | <90s |
| **NSFW Generation Time** | Temps génération RunPod | <120s |
| **Chat Success Rate** | % prompts parsés correctement | >80% |
| **Generation Success Rate** | % générations réussies | >95% |

---

## ⚠️ Points d'Attention

### 1. Migration Progressive

- **Ne pas tout casser d'un coup** : Migrer progressivement
- Garder l'ancien système fonctionnel pendant la migration
- Tester chaque phase avant de passer à la suivante

### 2. Backward Compatibility

- Les endpoints existants doivent continuer à fonctionner
- Créer des aliases/redirects si nécessaire
- Documenter les changements breaking

### 3. Tests

- Tester chaque nouveau composant isolément
- Tests d'intégration pour chaque phase
- Tests end-to-end avant production

### 4. Rollback Plan

- Garder backup de l'ancien code
- Plan de rollback pour chaque phase
- Monitoring des erreurs

---

## 🚀 Checklist de Migration

### Pré-Migration

- [ ] Backup complet du code actuel
- [ ] Backup de la base de données (si applicable)
- [ ] Documentation de l'état actuel
- [ ] Plan de rollback préparé

### Phase 1 - Foundation

- [ ] Structure de dossiers créée
- [ ] Configs créées
- [ ] Types définis
- [ ] Wrappers créés
- [ ] Tests unitaires passent

### Phase 2 - Conversion

- [ ] Système d'unlock implémenté
- [ ] Endpoints créés
- [ ] Flow testé
- [ ] Documentation créée

### Phase 3 - X Integration

- [ ] Twitter API configurée
- [ ] Distributor créé
- [ ] Cross-posting testé
- [ ] Documentation créée

### Phase 4 - Fanvue Integration

- [ ] Fanvue API configurée
- [ ] Distributor créé
- [ ] Upload testé
- [ ] Automation testée
- [ ] Documentation créée

### Phase 5 - Chat Interface

- [ ] Parser implémenté
- [ ] Handler créé
- [ ] UI créée
- [ ] Tests passent
- [ ] Documentation créée

### Phase 6 - Documentation

- [ ] Tous les docs créés
- [ ] Docs existants mis à jour
- [ ] Index mis à jour
- [ ] README mis à jour

### Post-Migration

- [ ] Ancien code archivé
- [ ] Monitoring en place
- [ ] Métriques trackées
- [ ] Documentation finale

---

## 📝 Notes de Migration

### Ordre de Priorité

1. **Foundation** (Phase 1) - Base nécessaire pour tout
2. **Conversion System** (Phase 2) - Core business logic
3. **X Integration** (Phase 3) - Distribution supplémentaire
4. **Fanvue Integration** (Phase 4) - Distribution NSFW principale
5. **Chat Interface** (Phase 5) - Nice to have
6. **Documentation** (Phase 6) - Toujours en dernier

### Dependencies

- Phase 2 dépend de Phase 1 ✅
- Phase 3 dépend de Phase 1 ✅
- Phase 4 dépend de Phase 1 + Phase 2 ✅
- Phase 5 dépend de Phase 1 ✅
- Phase 6 dépend de toutes les phases ✅

### Risques Identifiés

1. **Twitter API Rate Limits** - Gérer les limites de rate
2. **Fanvue API Changes** - API peut changer
3. **LLM Parsing Accuracy** - Parser peut mal comprendre
4. **Conversion Rate** - Peut être faible au début
5. **Code Complexity** - Architecture plus complexe

---

## 🎨 Prompt Engineering Guidelines

### ⚠️ CRITICAL: Instagram 2025 Aesthetic

**AI influencers exist for a while now. Don't aim for "perfect" results - aim for AUTHENTIC.**

#### ❌ DON'T USE (AI-looking)
```
- 8k, 4k
- ultra realistic
- hyper realistic  
- professional photography
- studio lighting
- perfect skin
- flawless
- high resolution
- sharp focus
```

#### ✅ DO USE (Instagram 2025 authentic)
```
- Amateur iPhone photo
- Heavy HDR glow
- Deeply crushed shadows
- Visible film grain
- Noise
- Slightly overexposed highlights
- Candid unposed moment
- Imperfect framing
- Natural harsh lighting
- Lo-fi quality
- Compression artifacts
```

#### Example Prompt Style
```
Amateur iPhone photo, heavy HDR glow, deeply crushed shadows, 
visible film grain, noise, Instagram 2025 aesthetic, 
candid unposed moment, imperfect framing, lo-fi quality
```

#### Why This Matters
- AI-generated "perfect" images are immediately recognizable
- Real Instagram influencers post imperfect, authentic content
- HDR glow + crushed shadows = typical iPhone processing
- Film grain + noise = feels like a real phone camera
- Imperfect framing = candid, not staged

---

## 🔗 Références

### Documentation Existante

- **[SESSION-NSFW-SETUP.md](../SESSION-NSFW-SETUP.md)** - ⚠️ **PREREQUISITE** - Setup NSFW generation (must complete first)
- `docs/04-IMPLEMENTATION.md` - Architecture actuelle
- `docs/02-MONETISATION.md` - Stratégie monétisation

### APIs à Intégrer

- [Twitter API v2](https://developer.twitter.com/en/docs/twitter-api)
- [Fanvue API](https://fanvue.com/api) - À vérifier
- [Anthropic Claude API](https://docs.anthropic.com/) - Pour parsing
- [OpenAI API](https://platform.openai.com/docs) - Alternative parsing

---

**Dernière mise à jour :** December 11, 2024  
**Prochaine révision :** Après Phase 1
