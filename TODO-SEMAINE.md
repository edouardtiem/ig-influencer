# 📅 TODO — Cette Semaine

> Prochaines étapes prioritaires — Semaine du 2 décembre 2024

---

## 🎯 Objectifs de la Semaine

1. ✅ **Life Calendar System** — Documentation complète
2. ✅ **Stratégie Vidéo** — Documentation complète
3. 🚧 **Recherche Modèle Animation** — Tests & sélection
4. 📝 **Setup Supabase** — Base de données + données initiales
5. 📝 **Déploiement Vercel** — Production avec cron jobs

---

## 📍 PRIORITÉ 1 : Recherche Modèle Animation

### Objectif
Trouver le meilleur modèle d'animation d'images sur Replicate pour créer des micro-vidéos (2-4s) réalistes.

### Actions
- [ ] Lister tous les modèles d'animation disponibles sur Replicate
- [ ] Tester 3-5 modèles avec des images de Mila existantes
- [ ] Pour chaque modèle, évaluer :
  - **Qualité** : Réalisme, artefacts, uncanny valley
  - **Coût** : Prix par génération
  - **Temps** : Durée de traitement
  - **API** : Facilité d'intégration
- [ ] Créer tableau comparatif
- [ ] Sélectionner le modèle final
- [ ] Documenter la décision dans `docs/09-VIDEO-MODEL-SELECTION.md`

### Critères de Sélection
```
Must-have:
├─ Mouvements naturels (respiration, cheveux)
├─ Pas de déformations visage/corps
├─ Coût < $0.10/vidéo (target)
└─ API Replicate fonctionnelle

Nice-to-have:
├─ Contrôle motion strength
├─ Durée configurable (2-4s)
├─ Support 9:16 format
└─ Traitement < 2 minutes
```

### Modèle Prioritaire : Google Veo 3.1 🎯

**URL** : https://replicate.com/google/veo-3.1

**Pourquoi :**
- Image-to-video de haute qualité
- Support 1-3 reference images (consistance Mila)
- Audio natif synchronisé automatique
- 9:16 portrait (Reels ready)
- 4-8 secondes durée flexible
- État de l'art Google

**Tests à effectuer :**
- [ ] Portrait simple (respiration/cheveux)
- [ ] Avec reference images (consistance visage)
- [ ] Full body (mouvement marche)
- [ ] Fitness context (workout)
- [ ] Environment (beach/vagues)
- [ ] Mesurer coût/temps/qualité

**Alternatives (si besoin) :**
- [ ] `stability-ai/stable-video-diffusion`
- [ ] `lucataco/animate-diff`

**Deadline** : Jeudi 5 décembre

---

## 💾 PRIORITÉ 2 : Setup Supabase

### Objectif
Créer la base de données Supabase avec toutes les tables du Life Calendar System.

### Actions

#### 2.1 Configuration Initiale
- [ ] Créer projet Supabase (ou utiliser existant)
- [ ] Récupérer clés API (public + secret)
- [ ] Ajouter à `.env.local`
- [ ] Installer `@supabase/supabase-js` dans le projet

#### 2.2 Création des Tables
- [ ] `location_calendar` — 52 semaines de rotation géographique
- [ ] `contexts` — Contextes de vie (apartment, café, gym, beach, etc.)
- [ ] `context_prompts` — Templates de prompts par contexte
- [ ] `outfits` — Bibliothèque de tenues
- [ ] `generated_content` — Historique du contenu (étendre existante)
- [ ] `video_animations` — Tracking vidéos (si applicable)

Voir schémas SQL complets dans [docs/07-LIFE-CALENDAR.md](docs/07-LIFE-CALENDAR.md)

#### 2.3 Peuplement Données Initiales

**location_calendar (52 semaines)**
```sql
-- Semaines 1-3, 5-7, 9-11, etc. : Paris
-- Semaines 4, 8, 12, etc. : Nice (1x/mois)
-- Semaines 30-31 : Travel Bali
-- Semaine 8 : Ski Alpes
-- Semaine 39 : Fashion Week Paris
```

**contexts (15-20 contextes minimum)**
```
Paris:
├─ apartment_morning, apartment_evening
├─ cafe_morning, cafe_afternoon
├─ gym_evening, gym_morning
├─ street_walk, street_style
├─ balcony_golden_hour
├─ campus_library
└─ rooftop_bar

Nice:
├─ beach_afternoon
├─ promenade_walk
└─ old_town_terrace

Travel:
├─ resort_pool
├─ beach_sunset
└─ hotel_room
```

**context_prompts (15-20 templates)**
- Un template par contexte minimum
- Variables : {CLOTHING}, {MOOD}, {LIGHTING}

**outfits (20-30 tenues)**
```
Catégories:
├─ casual (8 tenues)
├─ athleisure (6 tenues)
├─ glam (4 tenues)
├─ swimwear (4 tenues)
└─ cosy (3 tenues)
```

Voir exemples dans [docs/03-PERSONNAGE.md](docs/03-PERSONNAGE.md)

**Deadline** : Vendredi 6 décembre

---

## 🔧 PRIORITÉ 3 : Implémentation Backend Life Calendar

### Objectif
Intégrer le Life Calendar System dans le pipeline de génération.

### Actions

#### 3.1 Service Supabase
- [ ] Créer `src/lib/supabase.ts`
- [ ] Client Supabase avec authentification
- [ ] Helper functions basiques (getClient, etc.)

#### 3.2 Service Life Calendar
- [ ] Créer `src/lib/life-calendar.ts`
- [ ] Function `getCurrentContext()` — Détermine lieu actuel
- [ ] Function `selectContext(location)` — Sélection contexte pondéré
- [ ] Function `buildPrompt(contextId)` — Construit prompt final
- [ ] Function `selectOutfit(category, contexts)` — Rotation tenues
- [ ] Function `generateContextualContent()` — Orchestration complète

#### 3.3 Intégration dans `/api/auto-post`
- [ ] Remplacer sélection template aléatoire par Life Calendar
- [ ] Sauvegarder métadonnées (location, context, outfit) dans Supabase
- [ ] Logger pour debugging
- [ ] Tests complets

#### 3.4 Tests
- [ ] Générer 10 contenus test
- [ ] Vérifier cohérence géographique
- [ ] Vérifier rotation tenues (pas 2x même tenue en 7 jours)
- [ ] Vérifier prompts construits correctement

**Deadline** : Samedi 7 décembre

---

## 🎬 PRIORITÉ 4 : Pipeline Vidéo (selon résultats recherche)

### Objectif
Implémenter la génération de vidéos animées à partir d'images statiques.

### Actions

#### 4.1 Backend Vidéo
- [ ] Créer `src/lib/video-animation.ts`
- [ ] Function `animateImage(imageUrl, params)` — Appel API modèle
- [ ] Function `checkVideoStatus(id)` — Polling statut
- [ ] Function `shouldGenerateVideo(context)` — Logique décision photo vs vidéo

#### 4.2 Endpoints API
- [ ] `/api/videos/animate` — Génère vidéo depuis image
- [ ] `/api/videos/status` — Check progression
- [ ] `/api/videos/post-process` — Audio + overlays (optionnel Phase 1)

#### 4.3 Intégration Auto-Post
- [ ] Déterminer si post du jour = photo ou vidéo
- [ ] Si vidéo : générer image → animer → publier
- [ ] Si photo : workflow actuel
- [ ] Tracking métriques vidéo dans Supabase

#### 4.4 Tests
- [ ] Animer 5 images test (différents contextes)
- [ ] Valider qualité (pas d'artefacts)
- [ ] Mesurer coûts réels
- [ ] Ajuster paramètres si nécessaire

**Deadline** : Dimanche 8 décembre (si modèle sélectionné)

---

## 🚀 PRIORITÉ 5 : Déploiement Production

### Objectif
Déployer l'app sur Vercel avec cron jobs automatiques.

### Actions

#### 5.1 Configuration Vercel
- [ ] Déployer sur Vercel (`vercel --prod`)
- [ ] Configurer toutes les variables d'environnement :
  - `REPLICATE_API_TOKEN`
  - `CLOUDINARY_*`
  - `MAKE_WEBHOOK_URL`
  - `MILA_BASE_FACE_URL` + `MILA_REFERENCE_URLS`
  - `SUPABASE_URL` + `SUPABASE_ANON_KEY`
  - `CRON_SECRET`
- [ ] Vérifier build réussi
- [ ] Test endpoint `/api/status`

#### 5.2 Cron Jobs
- [ ] Créer compte cron-job.org (si pas déjà fait)
- [ ] Configurer 3 cron jobs :
  - **10h00** : `POST https://[app].vercel.app/api/auto-post`
  - **14h00** : `POST https://[app].vercel.app/api/auto-post`
  - **19h00** : `POST https://[app].vercel.app/api/auto-post`
- [ ] Header : `Authorization: Bearer [CRON_SECRET]`
- [ ] Activer les crons

#### 5.3 Validation Production
- [ ] Déclencher manuellement 1 cron
- [ ] Vérifier logs Vercel
- [ ] Vérifier image générée
- [ ] Vérifier publication Instagram
- [ ] Monitoring pendant 48h

#### 5.4 Monitoring
- [ ] Dashboard Vercel (logs, analytics)
- [ ] Dashboard Supabase (données correctes)
- [ ] Instagram Insights (posts publiés)
- [ ] Replicate Dashboard (coûts)

**Deadline** : Lundi 9 décembre

---

## 📊 Métriques de Succès

### Cette Semaine

| Objectif | Métrique | Target |
|----------|----------|--------|
| Documentation | Documents créés | ✅ 2/2 (Life Calendar + Vidéo) |
| Recherche modèle | Modèles testés | 3-5 |
| Setup Supabase | Tables créées | 6/6 |
| Setup Supabase | Données peuplées | 100+ rows |
| Backend Life Calendar | Functions créées | 5/5 |
| Tests génération | Contenus générés | 10+ |
| Déploiement | App en production | ✅ Live |
| Automatisation | Cron jobs actifs | 3/3 |

---

## ⏭️ Semaine Prochaine (Semaine du 9 déc)

1. **Validation Production** — Monitoring 7 jours, ajustements
2. **A/B Testing** — Tester variations prompts, horaires
3. **Création Compte Instagram** — Setup @mila.verne (ou variante)
4. **Premiers Posts Manuels** — 5-10 posts pour amorcer
5. **Activation Crons** — Lancement automatisation complète
6. **Analytics Setup** — Tracking métriques Instagram

---

## 🔗 Ressources

- [docs/07-LIFE-CALENDAR.md](docs/07-LIFE-CALENDAR.md) — Life Calendar System complet
- [docs/08-VIDEO-STRATEGY.md](docs/08-VIDEO-STRATEGY.md) — Stratégie Vidéo
- [docs/03-PERSONNAGE.md](docs/03-PERSONNAGE.md) — Character sheet Mila
- [docs/04-IMPLEMENTATION.md](docs/04-IMPLEMENTATION.md) — Architecture technique
- [PANEL_EXPERTS.md](PANEL_EXPERTS.md) — Framework de décision

---

*Créé le 2 décembre 2024*
*Mettre à jour quotidiennement ✅*

