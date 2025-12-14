# 📝 Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

---

## [2.5.0] - 2024-12-14

### 💬 Smart Comments — Commentaires IG automatisés via iOS Shortcut

Nouveau système de génération de commentaires Instagram personnalisés "Mila-style" depuis un screenshot.

### Added

**Nouveau document : `docs/15-SMART-COMMENTS.md`**

- **Workflow iOS Shortcut complet**
  - Screenshot → Partager → Raccourci → Commentaire copié
  - Temps total : 3-5 secondes
  - Intégration Claude Vision API (claude-3-haiku)

- **API Endpoint `/api/smart-comment`**
  - POST : Reçoit image base64, retourne commentaire + alternatives
  - GET : Health check
  - Support JSON et multipart/form-data

- **Prompt Mila optimisé pour commentaires**
  - Règle langue : EN par défaut, FR si post FR
  - Style : 1 phrase max 12 mots, jamais générique
  - Formules punchy : "X > Y", "This is what...", "Proof that..."
  - Angle unique : photographe (lumière) + PT (mindset)

- **Interface test web**
  - `/smart-comment` : Upload/paste screenshot pour tester

**Fichiers créés :**
- `app/src/lib/smart-comments.ts` — Logique Claude Vision + prompt
- `app/src/app/api/smart-comment/route.ts` — API endpoint
- `app/src/app/smart-comment/page.tsx` — Interface test

### Fixed

- **Base64 invalide depuis iOS** : Fonction `cleanBase64()` pour strip prefixes/whitespace
- **Modèle Claude introuvable** : Migration vers `claude-3-haiku-20240307`
- **Erreurs build** : Création `lib/make.ts` stub, fix imports `perplexity.ts`
- **Vulnérabilité Next.js** : Upgrade vers 16.0.10 (CVE-2025-66478)
- **Cron jobs Vercel** : Suppression (limite Hobby plan)

### Changed

- `docs/README.md` — Ajout entrée 15-SMART-COMMENTS.md
- `app/src/app/page.tsx` — Liens vers /smart-comment et /api/smart-comment

### Notes

- Requiert `Claude_key` dans les variables d'environnement
- iOS Shortcut à créer manuellement (voir doc)

---

## [2.4.0] - 2024-12-04

### 💎 Stratégie Monétisation V2 — Chatbot & Univers d'Influenceurs

Documentation des stratégies de monétisation avancées pour les phases post-10K followers.

### Added

**Nouveau document : `docs/13-MONETISATION-V2.md`**

- **Chatbot Mila payant**
  - Modèle freemium : 3€/mois accès chat + 1€/photo générée
  - Génération photos à la demande via stack existante (Nanobanana/Replicate)
  - Persona chat intégré basé sur character sheet Mila
  - Architecture technique documentée (Claude API + Stripe + Next.js)

- **Univers d'influenceurs IA**
  - Concept multi-personnages : Mila, Léa (BFF), Jade (contenu osé), Tom (fitness)
  - Stratégie cross-promotion entre comptes
  - Différenciation niveaux de contenu osé par personnage
  - Protection du compte principal Mila (mainstream)

- **Projections revenus consolidées**
  - Scénario réaliste : ~12K€/mois à 12 mois avec 4 personnages
  - Breakdown par source : chatbot, Fanvue, produits, UGC

### Changed

- `DOCUMENTATION-INDEX.md` — Ajout section monétisation V2
- `docs/README.md` — Ajout entrée 13-MONETISATION-V2.md, notes de version v2.4

### Notes

- Stratégie planifiée pour Phase 2+ (post-10K followers Mila)
- Focus actuel reste sur croissance Mila seule
- Character sheets des autres personnages à créer quand pertinent

---

## [2.3.0] - 2024-12-03

### 🔴 BREAKING CHANGES - Migration Complète vers Nano Banana Pro

**Nettoyage complet de l'architecture : Suppression de Flux Kontext Pro et LoRA**

Cette version finalise la migration vers Nano Banana Pro en supprimant tout le code legacy de génération d'images. L'architecture est maintenant 75% plus simple avec une seule solution de production.

### Removed

**Fonctions supprimées de `src/lib/replicate.ts` :**
- `generateWithFluxKontext()` - remplacé par Nano Banana Pro
- `generateWithFaceSwap()` - FaceSwap plus nécessaire avec Nano
- `faceSwap()` - supprimé
- `generateImage()` - wrapper obsolète
- `generateBaseImage()` - supprimé
- `generateWithIdeogramCharacter()` - jamais utilisé
- `generateWithLora()` - LoRA training supprimé
- `generateBasePortrait()` - génération manuelle via playground
- `generateFullBodyPortrait()` - génération manuelle via playground

**Fonctions supprimées de `src/config/base-portraits.ts` :**
- `getRandomReferenceUrl()` - simplifié
- `getPrimaryFaceUrl()` - simplifié

**Fichiers supprimés :**
- `src/app/api/compare-models/route.ts` - API de comparaison (84 lignes)
- `src/app/compare-models/page.tsx` - Interface de comparaison (~200 lignes)

**Total code supprimé : ~800 lignes**

### Changed

**APIs migrées vers Nano Banana Pro :**
- `/api/auto-post` utilise maintenant `generateWithNanaBanana()` avec 4 références
- `/api/test-generate` simplifié pour utiliser uniquement Nano Banana Pro
- Suppression des paramètres `base` et `faceswap` de test-generate

**Configuration simplifiée :**
- `base-portraits.ts` réduit à une seule fonction `getBasePortraits()`
- `replicate.ts` réduit de 657 lignes à ~135 lignes (-77%)

### Performance

| Métrique | Avant (Flux + FaceSwap) | Après (Nano) | Amélioration |
|----------|------------------------|--------------|--------------|
| Consistance | ~80% | 95%+ | +15% |
| Temps génération | ~15s | ~60-90s | Plus stable |
| Coût par image | $0.08 | $0.05-0.06 | -31% |
| Coût mensuel (90 posts) | $7.20 | $4.95 | -$2.25 |
| Complexité code | Élevée | Simple | -75% |
| Appels API | 2 séquentiels | 1 unique | -50% latence |

### Documentation

**Mise à jour complète :**
- README.md : Architecture simplifiée, diagramme mis à jour
- docs/README.md : Checkboxes mises à jour
- docs/04-IMPLEMENTATION.md : Toutes références Flux remplacées par Nano
- docs/QUICKSTART.md : Coût mis à jour
- docs/09-FLUX-KONTEXT-REMOVAL.md : Documentation complète de la migration

### Migration Notes

**Rollback possible :** En cas de problème, `git revert` vers v2.2.0

**Prochaines étapes :**
1. Amélioration character sheet avec détails ultra-précis
2. Génération de 8 photos de base optimales (4 visage + 4 silhouette)
3. Création de 40-50 photos de lieux récurrents
4. Système de variation intelligente des prompts

---

## [2.2.0] - 2024-12-02

### 📍🎬 Life Calendar System & Stratégie Vidéo

**Expansion stratégique : Cohérence narrative + Contenu vidéo**

Cette version pose les fondations pour deux évolutions majeures du système :
1. **Life Calendar System** — Rotation géographique cohérente et contextes de vie
2. **Stratégie Vidéo** — Animation d'images pour créer du contenu vidéo

**Contexte de décision**

Suite à la validation de Nano Banana Pro comme solution de génération, identification de deux besoins critiques :
- **Cohérence narrative** : Éviter incohérences géographiques (Paris un jour, Bali le lendemain)
- **Reach algorithmique** : Les Reels obtiennent 4x plus de portée que les photos statiques

**Life Calendar System**

Architecture complète de rotation géographique basée sur Supabase :

```
Distribution annuelle:
├─ 80% Paris (quotidien étudiant)
├─ 15% Nice (weekends mensuels)
└─ 5% Travel (vacances exceptionnelles)

Cycle 4 semaines:
├─ Semaines 1-3 : Paris lifestyle
└─ Semaine 4 : Nice weekend
```

**Tables Supabase (6 tables)**
- ✅ `location_calendar` — 52 semaines de planification
- ✅ `contexts` — Contextes de vie (apartment, café, gym, beach)
- ✅ `context_prompts` — Templates de prompts par contexte
- ✅ `outfits` — Bibliothèque de tenues avec rotation intelligente
- ✅ `generated_content` — Historique avec métadonnées géographiques
- ✅ `video_animations` — Tracking vidéos (si applicable)

**Logique implémentée (documentation)**

```typescript
// Workflow automatique
getCurrentContext() 
  → selectContext(location) 
  → buildPrompt(contextId) 
  → selectOutfit(category) 
  → generateContextualContent()
```

**Stratégie Vidéo**

Plan complet pour ajouter du contenu vidéo via animation d'images :

```
Mix quotidien cible:
├─ Lun/Mer/Ven : Photos statiques (4:5)
└─ Mar/Jeu/Sam/Dim : Reels animés (9:16)

Total : 3 photos + 4 vidéos/semaine
```

**Types de mouvements documentés**
- Portrait : Respiration, cheveux, clignements
- Full body : Marche, vêtements fluides, rotation caméra
- Fitness : Poses dynamiques, muscle flex
- Environment : Parallax, éléments contexte, lumière

**Pipeline technique proposé**

```
Image statique (Nano Banana)
  → Animation (modèle à sélectionner)
  → Post-processing (audio + overlays)
  → Export multi-format (9:16, 4:5)
  → Publication Buffer
```

**Documentation créée**

- ✅ `docs/07-LIFE-CALENDAR.md` — Documentation complète Life Calendar (40+ pages)
  - Stratégie géographique détaillée
  - Schémas SQL complets Supabase
  - Logique d'implémentation TypeScript
  - Exemples de données à peupler
  - Métriques de cohérence

- ✅ `docs/08-VIDEO-STRATEGY.md` — Documentation stratégie vidéo (35+ pages)
  - Mix de contenu photo/vidéo
  - Types de mouvements par contexte
  - Pipeline technique complet (intégrant Veo 3.1)
  - Risques & mitigations
  - Plan de déploiement 5 phases

- ✅ `docs/VEO-3.1-NOTES.md` — Notes de référence Google Veo 3.1
  - Avantages pour cas d'usage Mila
  - Paramètres API détaillés
  - Stratégie de prompts par contexte
  - Plan de tests (5 tests prioritaires)
  - Métriques à tracker
  - Estimation coûts

- ✅ `TODO-SEMAINE.md` — Plan d'action semaine en cours
  - 5 priorités détaillées
  - Deadlines par tâche
  - Critères de succès
  - Métriques tracking

**Mises à jour documentation existante**

- ✅ `docs/README.md` — Ajout v2.3 + liens nouveaux documents
- ✅ `docs/03-PERSONNAGE.md` — Référence Life Calendar
- ✅ `docs/04-IMPLEMENTATION.md` — Référence systèmes futurs

**Impact projeté**

```
Cohérence narrative:
├─ Zero incohérence géographique (vs risque actuel)
├─ Rotation intelligente tenues (évite répétitions)
└─ Crédibilité personnage +80%

Vidéo (si implémenté):
├─ Reach : 3-5x vs photo only
├─ Engagement : 2x vs photo only
└─ Croissance : +50-80% faster (10K en 6-8 semaines vs 12-16)
```

**Statut**

🚧 **En planification** : 
- Recherche modèle animation vidéo en cours (Phase 1)
- Setup Supabase à effectuer (Phase 2)
- Implémentation backend Life Calendar (Phase 3)

📝 **Prochaines étapes immédiates** :
1. ✅ Modèle vidéo identifié : **Google Veo 3.1** (image-to-video + audio natif + reference images)
2. Tester Veo 3.1 avec 5 cas d'usage Mila (portrait, full body, fitness, beach, sans refs)
3. Documenter résultats dans `docs/09-VIDEO-MODEL-SELECTION.md`
4. Créer projet Supabase + tables
5. Peupler données initiales (52 semaines + 15-20 contextes)
6. Implémenter services backend Life Calendar

---

## [2.2.0] - 2024-12-02

### 🍌 Migration vers Nano Banana Pro (DÉCISION MAJEURE)

**Pivot stratégique : Abandon du LoRA au profit de Nano Banana Pro**

Cette version documente une décision architecturale majeure prise après analyse comparative et tests approfondis.

**Contexte de la décision**

Suite à l'analyse de la conversation Perplexity et du challenge avec le Panel d'Experts, identification du problème critique : inconsistance visuelle (70% consistance actuelle vs 95%+ requis).

Plan initial : LoRA training sur Flux → Blocage rate limit Replicate → Découverte Nano Banana Pro → Tests bluffants → Pivot stratégique.

**Nano Banana Pro intégré**

- ✅ Fonction `generateWithNanaBanana()` dans `lib/replicate.ts`
- ✅ Support paramètre `image_input` : Jusqu'à 14 images de référence
- ✅ Page `/test-nanobanana` avec toggle références ON/OFF
- ✅ Page `/compare-models` pour benchmark Flux vs Nano
- ✅ API `/api/test-nanobanana` pour tests individuels
- ✅ API `/api/compare-models` pour comparaisons parallèles
- ✅ Historique des générations avec lightbox et navigation clavier (← → ESC)
- ✅ Sauvegarde localStorage pour persistance

**Paramètres optimisés**

```typescript
{
  prompt: buildPrompt(template),
  image_input: [4 base portraits],  // ← Clé de la consistance
  aspect_ratio: "4:5",
  resolution: "2K",
  output_format: "jpg",
  safety_filter_level: "block_only_high"
}
```

**Avantages vs LoRA Flux**

| Métrique | Flux + LoRA | Nano + Références | Gain |
|----------|-------------|-------------------|------|
| Consistance | 95% (après setup) | 95% (natif) | Immédiat |
| Setup time | 70 min | 0 min | +70 min |
| Setup cost | $4-6 | $0 | +$5 |
| Résolution | Standard | Jusqu'à 4K | Meilleur |
| Features | Base | Avancées (blend, edit) | Bonus |

**Système LoRA conservé**

Tout le code LoRA développé est **conservé comme backup** :
- Pages : `/training-prep`, `/select-training`, `/training-status`, `/test-lora`
- APIs : Character sheet, training, status check
- Documentation : `LORA-TRAINING-GUIDE.md`, `LORA-QUICKSTART.md`

**Raison** : Plan B solide si Nano ne convient pas en production.

**Documentation complète**

- ✅ `docs/06-NANO-BANANA-PRO-MIGRATION.md` - Documentation complète de la session
- ✅ Analyse comparative Perplexity vs Panel d'Experts
- ✅ Workflow LoRA exploré et documenté
- ✅ Découverte et validation Nano Banana Pro
- ✅ Architecture finale avec références
- ✅ Prochaines étapes détaillées

**Statut**

🚧 **En validation** : Tests finaux en cours pour confirmer consistance détails (grain de beauté, taches de rousseur, proportions) avec mode références.

---

## [2.1.0] - 2024-12-02

### 🎨 Système LoRA Training Complet

**Feature Majeure: Consistance Faciale 95%+**

Cette mise à jour implémente un système complet de training LoRA pour atteindre une consistance faciale quasi-parfaite (95%+) sur toutes les générations de Mila.

**Pages UI créées**

- ✅ `/training-prep` - Sélection image de base et lancement Character Sheet
- ✅ `/select-training` - Interface visuelle de sélection des 20-30 images
- ✅ `/training-status` - Dashboard temps réel du training avec logs
- ✅ `/test-lora` - Page de test du LoRA avec différents scénarios

**Endpoints API créés**

- ✅ `POST /api/generate-character-sheet` - Génération de 30 variations (angles, poses, expressions)
- ✅ `POST /api/create-training-zip` - Création du dataset d'images pour training
- ✅ `POST /api/train-lora` - Lancement du training LoRA sur Replicate
- ✅ `GET /api/train-lora?id=X` - Vérification statut du training
- ✅ `POST /api/test-lora` - Test de génération avec LoRA

**Services mis à jour**

- ✅ `lib/replicate.ts` - Ajout fonction `generateWithLora()` avec contrôle du scale
- ✅ Support LoRA version ID ou weights URL
- ✅ Trigger word "MILA" intégré automatiquement

**Configuration**

- ✅ `REPLICATE_USERNAME` ajouté aux variables d'environnement
- ✅ Support LoRA URL optionnel pour usage en production

**Workflow complet**

1. Sélection d'une image de base parmi 4 portraits
2. Génération automatique de 30 variations (8 angles + 6 expressions + 8 poses + 8 contextes)
3. Sélection manuelle visuelle de 20-30 meilleures images
4. Création automatique du ZIP et upload Cloudinary
5. Lancement training LoRA sur Replicate (20-30 min)
6. Suivi temps réel avec logs et métriques
7. Test du LoRA avec scénarios variés
8. Intégration en production via `generateWithLora()`

**Améliorations de consistance**

| Méthode | Consistance | Coût/image | Setup |
|---------|-------------|------------|-------|
| Flux Kontext (avant) | 70% | $0.04 | $0 |
| LoRA (après) | 95%+ | $0.03 | $3-5 (one-time) |

**Documentation**

- ✅ `docs/LORA-TRAINING-GUIDE.md` - Guide complet avec troubleshooting
- ✅ Workflow détaillé étape par étape
- ✅ Comparaisons coûts/bénéfices
- ✅ Section troubleshooting complète

**Coûts estimés**

- Character Sheet (30 images): ~$1.20 USD
- Training LoRA: ~$3-5 USD
- Génération avec LoRA: ~$0.03/image
- **Total setup one-time**: ~$4-6 USD
- **ROI**: Rentabilisé dès le 2ème mois

---

## [2.0.0] - 2024-12-02

### 🎉 Implémentation complète du pipeline

**Ajouts majeurs**

- ✅ Application Next.js 14 avec TypeScript initialisée
- ✅ Intégration Replicate API (Flux Kontext Pro + FaceFusion)
- ✅ Intégration Cloudinary pour hébergement permanent
- ✅ Intégration Make.com → Buffer → Instagram
- ✅ UI de gestion des portraits de référence (`/select-base`)
- ✅ 12 content templates en français avec hashtags mixtes
- ✅ Character sheet Mila Verne affiné (fit, 180cm)
- ✅ System de face swap pour consistance faciale

**Endpoints API créés**

- `POST /api/auto-post` - Génération et publication automatique
- `POST /api/generate-base` - Génération portraits de référence
- `GET /api/upload-cloudinary` - Upload image vers Cloudinary
- `GET /api/current-references` - État des références configurées
- `GET /api/test-generate` - Tests de génération
- `GET /api/status` - Health check

**Services implémentés**

- `lib/replicate.ts` - Service Replicate (génération + face swap)
- `lib/cloudinary.ts` - Service Cloudinary (upload + check)
- `lib/make.ts` - Service Make.com (publication webhook)

**Configuration**

- Variables d'environnement structurées
- Support portraits de référence multiples
- Prompts optimisés pour consistance physique

**Documentation**

- ✅ `docs/04-IMPLEMENTATION.md` - Guide technique complet
- ✅ `docs/QUICKSTART.md` - Guide de démarrage rapide
- ✅ `docs/README.md` - Index mis à jour

**Tests**

- ✅ Pipeline complet testé et validé
- ✅ Posts Instagram publiés avec succès
- ✅ Face swap maintient la consistance faciale
- ✅ Captions en français générées correctement

---

## [1.1.0] - 2024-12-02

### 🎨 Character Design & Content Strategy

**Ajouts**

- ✅ Character sheet complet pour Mila Verne
- ✅ 12 content templates (lifestyle, fitness, summer, sexy light/medium)
- ✅ Prompts AI pour génération d'images
- ✅ Style guide et identité visuelle
- ✅ Stratégie de contenu détaillée

**Documentation**

- ✅ `docs/03-PERSONNAGE.md` créé

---

## [1.0.0] - 2024-12-02

### 🚀 Version initiale

**Ajouts**

- ✅ Structure de documentation initiale
- ✅ PRD (Product Requirements Document)
- ✅ Stratégie de monétisation par phase
- ✅ Panel d'experts pour décisions stratégiques
- ✅ Vision produit et objectifs

**Documentation**

- ✅ `docs/README.md` - Index de la documentation
- ✅ `docs/01-PRD.md` - Product Requirements
- ✅ `docs/02-MONETISATION.md` - Stratégie revenus
- ✅ `PANEL_EXPERTS.md` - Framework décisionnel

---

## Légende

- ✅ Complété
- 🚧 En cours
- 📝 Planifié
- ❌ Annulé/Déprécié

---

## Roadmap

### Version 2.4 (En cours - Semaine du 2 déc)

**Life Calendar & Vidéo - Implémentation**
- [ ] Recherche & sélection modèle animation
- [ ] Documentation `docs/09-VIDEO-MODEL-SELECTION.md`
- [ ] Setup Supabase (6 tables)
- [ ] Peuplement données initiales (52 semaines, 20 contextes, 30 tenues)
- [ ] Implémentation backend Life Calendar (`lib/life-calendar.ts`)
- [ ] Intégration dans `/api/auto-post`
- [ ] Tests génération contextuelle (10+ contenus)
- [ ] Pipeline vidéo (si modèle sélectionné)

### Version 2.5 (Planifiée - Semaine du 9 déc)

**Déploiement Production**
- [ ] Deploy sur Vercel avec nouvelles features
- [ ] Configuration variables Supabase en production
- [ ] Setup cron jobs automatiques (cron-job.org)
- [ ] Monitoring et alertes
- [ ] Création compte Instagram @mila.verne
- [ ] Premiers posts manuels (5-10)
- [ ] Activation automatisation complète

### Version 3.0 (Future)

**Optimisations & Analytics**
- [ ] A/B testing prompts automatique
- [ ] Dashboard analytics complet
- [ ] Génération automatique Stories Instagram
- [ ] Post-processing vidéo avancé (audio trending)
- [ ] Réponses automatiques DMs
- [ ] Multi-plateformes (TikTok, YouTube Shorts)

---

*Dernière mise à jour : 14 décembre 2024 (v2.5)*

