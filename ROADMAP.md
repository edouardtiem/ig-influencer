# 🗺️ ROADMAP — Mila Verne Project

> Suivi centralisé de toutes les features, bugs et idées

**Dernière mise à jour** : 4 janvier 2025 (Elena Profile + Back Refs ✅)

---

## 📂 Structure

```
roadmap/
├── done/           # ✅ Features terminées
├── in-progress/    # 🚧 En cours de développement
├── todo/           # 📋 Planifié, priorisé
├── bugs/           # 🐛 Bugs connus à fixer
└── ideas/          # 💡 Backlog, idées futures
```

---

## 🚧 EN COURS

| ID | Feature | Priorité | Branche | Lien |
|----|---------|----------|---------|------|
| IP-004 | **🔥 Elena Sexy Mode** — 1 post/jour à 21h, contenu suggestif (bikini/lingerie/sport) | 🔴 High | main | [→](./docs/sessions/2024-12-27-elena-sexy-mode.md) |
| IP-003 | **💰 Fanvue Monetization** — Packs photos Elena + ManyChat DM automation | 🔴 High | main | [→](./docs/sessions/2024-12-25-fanvue-pack-elena.md) |
| IP-002 | **🔴 Model Evolution** — Mila Tesla Red + Elena blonde + bi/open relationship | 🟡 Medium | main | [→](./roadmap/in-progress/IP-002-model-evolution.md) |

> **Elena Sexy Mode** : ✅ Actif — 1 post/jour à 21h (bikini/lingerie/sport moulant)  
> **Mila** : ⏸️ PAUSE temporaire (à réactiver après stabilisation Elena)  
> **Fanvue Pack 1** : ✅ 14 photos générées (2 shootings) dans `elena-fanvue-pack1`  
> **ManyChat** : ✅ 2 automations LIVE (Auto-DM comments + Welcome followers)  
> **DM System** : ✅ **ACTIVE** — Kill switch opérationnel sur `/calendar`  
> **AI Agent** : ✅ LIVE avec Response Validator + Sonnet + Story replies support + anti-hallucination renforcé (régénération auto, max 3 tentatives) + Language detection (EN/FR/IT/ES/PT/DE)  
> **Objectif** : 500€/mois via Fanvue  
> **Next** : Resume DM system après expiration ban Instagram

---

## 📋 À FAIRE (Priorisé)

| ID | Feature | Priorité | Estimation | Lien |
|----|---------|----------|------------|------|
| ~~TODO-016~~ | ~~Elena AI Agent~~ — ✅ DONE via DONE-037 | - | - | [→](./docs/sessions/2024-12-26-dm-automation.md) |
| ~~TODO-013~~ | ~~ManyChat Setup~~ — ✅ 2 automations LIVE | - | - | [→](./docs/sessions/2024-12-26-manychat-ai-agent.md) |
| TODO-017 | **💰 Funnel DM Routing A/B/C** — Implémenter routing ManyChat (B/BMAC, C/Fanvue, A/chat) + Tracking sources IG_BIO/IG_DM/IG_STORY | 🔴 High | 2-3h | [→](./docs/26-IG-FANVUE-BMAC-STRATEGY.md) |
| TODO-016 | **📊 Dashboard KPI Quotidiens** — Tracking DM entrants, conversions, clics Fanvue/BMAC, abonnements, tips | 🔴 High | 3-4h | [→](./docs/26-IG-FANVUE-BMAC-STRATEGY.md) |
| TODO-014 | **Fanvue Pack Final** — Sélection 10-12 photos + Upload Fanvue + Prix 3€ | 🔴 High | 30min | [→](./docs/sessions/2024-12-25-fanvue-pack-elena.md) |
| TODO-015 | **IG Teaser Post** — Photo pack + Caption CTA "Link in bio" / "DM PACK" | 🔴 High | 15min | - |
| TODO-010 | **Targeting Actif** — 20 comments/jour/compte sur niches cibles | 🟡 Medium | ongoing | - |
| TODO-012 | **Daily Account Insights** — Tracking vraies métriques journalières (reach, interactions par jour) | 🟡 Medium | 3-4h | [→](./roadmap/todo/TODO-012-daily-account-insights.md) |
| TODO-006 | Elena Stories Highlights (Travel, Home, BTS) | 🟡 Medium | 2h | - |
| ~~TODO-004~~ | ~~Intégration Supabase~~ — ✅ Fait via Content Brain | - | - | [→](./docs/SESSION-20-DEC-2024-CONTENT-BRAIN.md) |
| ~~TODO-001~~ | ~~Multi-shot Reels (carousel → video)~~ — ✅ Done via DONE-030 | - | - | [→](./roadmap/done/DONE-030-kling-video-reels.md) |
| ~~TODO-007~~ | ~~Premier Reel Elena~~ — Scripts existants | - | - | - |
| ~~TODO-008~~ | ~~Crossover Mila x Elena NYC~~ — ✅ Done | - | - | [→](./docs/SESSION-18-DEC-2024-DUAL-TOKENS.md) |
| ~~TODO-003~~ | ~~Dashboard analytics~~ — ✅ Done | - | - | [→](./docs/SESSION-22-DEC-2024-ANALYTICS-PAGE.md) |

---

## ✅ FAIT (Récent)

| ID | Feature | Date | Version | Lien |
|----|---------|------|---------|------|
| DONE-061 | **📸 Elena Profile + Back Refs** — Ajout refs profile (left) + back au Content Brain (4 angles total) pour meilleure consistance visage/body sur tous angles | 04/01/2025 | v2.46.0 | [→](./roadmap/done/DONE-061-elena-profile-back-refs.md) |
| DONE-060 | **🎭 DM Natural Exit Messages** — 6 variantes avec excuses naturelles (shooting, manager, etc.) + Message clair "je réponds sur Fanvue" + Random pour variété | 07/01/2025 | v2.45.0 | [→](./roadmap/done/DONE-060-dm-natural-exit-messages.md) |
| DONE-059 | **🔒 DM Race Condition + Anti-Loop Fix** — Lock en mémoire (webhooks simultanés) + Fix boucles répétitives (110 cas : fallback spam, AI repetition) + Instruction anti-repeat Claude | 07/01/2025 | v2.44.0 | [→](./roadmap/done/DONE-059-dm-race-condition-fix.md) |
| DONE-058 | **🎨 Content Brain Analytics Removal** — Suppression analytics "best" (bestLocation/bestMood/bestPostType) pour éviter biais convergence + Plus de créativité et variété dans posts générés | 07/01/2025 | v2.43.0 | [→](./roadmap/done/DONE-058-content-brain-analytics-removal.md) |
| DONE-057 | **🎭 Natural Face Variations** — Expressions naturelles : grimaces, regard ailleurs, moments candid (pas toujours posé) + 25 nouvelles expressions + Notes style dans prompt | 06/01/2025 | v2.42.0 | [→](./roadmap/done/DONE-057-natural-face-variations.md) |
| DONE-056 | **📖 Elena Micro-Story Captions + Soft CTA Private** — Format storytelling captions en anglais (Hook→Story→Reflection→CTA→Question) + Soft CTA direct vers private (~70%) + Tracking `has_private_cta` en DB | 04/01/2026 | v2.41.0 | [→](./docs/sessions/2026-01-04-elena-micro-story-captions.md) |
| DONE-055 | **🌍 DM Language Detection** — Détection intelligente langue (explicite OU 3+ messages) + Stockage BDD + Réponse dynamique dans langue détectée (EN/FR/IT/ES/PT/DE) | 05/01/2025 | v2.37.5 | [→](./roadmap/done/DONE-055-dm-language-detection.md) |
| DONE-054 | **🔧 DM Fixes Complets** — Story replies parsing + Fix webhook timeout (retrait délai) + Never ask "which one?" + Validator fonctionnel | 04/01/2025 | v2.37.4 | [→](./roadmap/done/DONE-054-dm-fixes-complete.md) |
| DONE-053 | **🔍 DM Response Validator + Sonnet** — Triple protection anti-hallucination : Validator avec régénération (max 3 tentatives) + Prompt ultra-explicite + Claude Sonnet (meilleure qualité) | 03/01/2025 | v2.37.3 | [→](./roadmap/done/DONE-053-dm-response-validator.md) |
| DONE-052 | **🎯 DM Close Lead Objective** — Objectif explicite "CLOSE THE LEAD" dans prompt AI + Funnel stages table (COLD→WARM→HOT→PITCHED) + Closing rules par stage + Pitch examples concrets | 03/01/2025 | v2.37.2 | [→](./roadmap/done/DONE-052-dm-close-lead-objective.md) |
| DONE-051 | **💬 DM Free Trial Link + Personalized Pitch** — Lien free trial (1 jour gratuit) + Pitch "j'ai créé un lien gratuit pour toi" (geste personnel) + Intent strategies mis à jour + Emojis plus flirty | 03/01/2025 | v2.37.1 | [→](./roadmap/done/DONE-051-dm-free-trial-pitch.md) |
| DONE-050 | **📸 Authentic IG Photo Style** — Style iPhone RAW sans filtres + Variations de cadrage carousel (medium/close-up/candid) + Environnement visible + Couleurs naturelles désaturées | 03/01/2026 | v2.40.0 | [→](./roadmap/done/DONE-050-authentic-ig-photo-style.md) |
| DONE-049 | **🔧 Fanvue Daily Post API Fix** — Correction endpoint `/v1/posts` → `/posts` + Field names (text→content, mediaUrls→media_urls, audience→is_premium) pour workflow GitHub Actions | 03/01/2025 | v2.39.0 | [→](./roadmap/done/DONE-049-fanvue-daily-post-fix.md) |
| DONE-048 | **🔒 API Robustness & Security Fixes** — Timeouts sur tous les appels API (Perplexity 30s, Instagram 60s, Claude 120s, Grok 60s, Fanvue 30s) + Protection GET `/api/daily-trends-fetch` + Cache trends Supabase (persistent) + Validation Zod sur endpoints | 03/01/2025 | v2.38.0 | [→](./docs/sessions/2025-01-03-api-robustness-fixes.md) |
| DONE-047 | **🛑 DM System Fixes Complet + Kill Switch** — Flag `is_stopped` pour stopper FINAL_MESSAGE loop + Kill switch toggle sur `/calendar` + 142 contacts spammés nettoyés + Réponses < 12 mots + Anti-hallucination renforcé | 02/01/2025 | v2.37.0 | [→](./roadmap/done/DONE-047-dm-system-fixes-complete.md) |
| DONE-046 | **🔍 DM Audit + Fix FINAL_MESSAGE Duplicates** — Script audit-recent.mjs + Fix cooldown check AVANT cap check pour éviter FINAL_MESSAGE dupliqué | 02/01/2025 | v2.36.1 | [→](./docs/sessions/2025-01-02-dm-audit-fixes.md) |
| DONE-045 | **🔧 DM Fixes — Duplicates, Hallucinations, Long Responses** — Cooldown 20s pour éviter duplicates + Règles anti-hallucination explicites + max_tokens 50 pour réponses < 15 mots | 02/01/2025 | v2.36.0 | [→](./docs/sessions/2025-01-02-dm-fixes-duplicates-hallucinations.md) |
| DONE-044 | **🎨 Grok Image Generation** — Test génération images avec Grok API + Script manuel + Découverte limitation images de référence (API ne supporte pas) | 01/01/2025 | v2.35.0 | [→](./docs/sessions/2025-01-01-grok-image-generation.md) |
| DONE-043 | **💬 Fanvue Chat Bot avec Grok** — Chat automatique avec Grok AI + génération images NSFW + Webhooks (message/subscriber/tip) + Fix API posts Fanvue | 01/01/2025 | v2.34.0 | [→](./roadmap/done/DONE-043-fanvue-chat-bot-grok.md) |
| DONE-042 | **🤖 DM Automation V2** — Caps par stage (15/25/35), closing pressure, personnalité warm/flirty, intent sexual→Fanvue, délai 15-35s, anti-hallucination | 30/12/2024 | v2.33.0 | [→](./docs/27-DM-AUTOMATION-V2.md) |
| DONE-041 | **📬 Fanvue Welcome DM** — Webhook auto pour nouveaux followers + DM teaser photo + Conversion free → paid | 29/12/2024 | v2.32.0 | [→](./roadmap/done/DONE-041-fanvue-welcome-dm.md) |
| DONE-040 | **📅 Fanvue Daily System** — 1 photo/jour à 17h Paris + Calendrier 14 jours safe-sexy + GitHub Action auto + Posts abonnés uniquement | 29/12/2024 | v2.31.0 | [→](./roadmap/done/DONE-040-fanvue-daily-system.md) |
| DONE-039 | **🎯 Intent-Driven DM System** — Adaptation personnalité par intent + Pitch Fanvue déclenché par wants_more (au lieu de 8 messages) + PersonalityMode dynamique | 29/12/2024 | v2.30.0 | [→](./roadmap/done/DONE-039-intent-driven-dm-system.md) |
| DONE-038 | **🔥 Elena Sexy Mode** — 1 post/jour 21h + Prompts suggestifs (bikini/lingerie/sport) + Locations filtrées + Mila PAUSE | 27/12/2024 | v2.29.0 | [→](./docs/sessions/2024-12-27-elena-sexy-mode.md) |
| DONE-037 | **🤖 DM Automation LIVE** — Claude AI + ManyChat + Lead scoring + English default + Fix double message + Shorter responses + Natural delay + Conversational auto-DM | 26/12/2024 | v2.28.4 | [→](./docs/sessions/2024-12-26-dm-automation.md) |
| DONE-036 | **🔗 Fanvue OAuth 2.0 + PKCE** — Intégration API Fanvue complète avec OAuth sécurisé | 26/12/2024 | v2.27.0 | [→](./docs/sessions/2024-12-26-fanvue-oauth.md) |
| DONE-035 | **🔧 BUG-010 Fix** — Gestion d'erreurs API Instagram dans tous les scripts + Audit posts | 26/12/2024 | v2.25.0 | [→](./docs/SESSION-26-DEC-2024-BUG-010-FIX.md) |
| DONE-034 | **🤖 ManyChat Setup + AI Agent Strategy** — Guide ManyChat complet + Architecture AI Agent avec auto-learning | 26/12/2024 | v2.26.0 | [→](./docs/sessions/2024-12-26-manychat-ai-agent.md) |
| DONE-033 | **📸 Fanvue Pack Elena** — Script génération + 14 photos 2 shootings + Prompts safe-sexy validés | 25/12/2024 | v2.25.0 | [→](./docs/sessions/2024-12-25-fanvue-pack-elena.md) |
| DONE-032 | **Carousel-Only Strategy 📸** — Migration complète vers carrousels uniquement + Fix tokens GitHub | 24/12/2024 | v2.24.0 | [→](./docs/SESSION-24-DEC-2024-CAROUSEL-ONLY.md) |
| DONE-031 | **Analytics Fix 📊** — Sync likes/comments + inclusion données jour actuel + correction snapshots | 23/12/2024 | v2.23.0 | [→](./docs/SESSION-23-DEC-2024-ANALYTICS-FIX.md) |
| DONE-030 | **Kling Video Reels 🎬** — Tous reels animés Kling v2.5 + style Instagram 2026 + format 9:16 + real-time speed | 23/12/2024 | v2.22.0 | [→](./docs/SESSION-23-DEC-2024-KLING-REELS.md) |
| DONE-029 | **Calendar Dashboard 📅** — Page /calendar avec vue semaine + status badges + auto-refresh 30s | 23/12/2024 | v2.21.0 | [→](./docs/SESSION-23-DEC-2024-STATUS-TRACKING.md) |
| DONE-028 | **Post Status Tracking 🔄** — Table scheduled_posts + 6 statuts + step-based executor + retry 3x | 23/12/2024 | v2.20.0 | [→](./docs/SESSION-23-DEC-2024-STATUS-TRACKING.md) |
| DONE-027 | **Prompt Improvements 📸** — 2026 style + safe sexy vocabulary + scene consistency + sexy enhancers Mila/Elena + format 4:5 | 22/12/2024 | v2.19.0 | [→](./docs/SESSION-22-DEC-2024-PROMPT-IMPROVEMENTS.md) |
| DONE-026 | **Analytics Page 📊** — Dashboard complet + Sync Instagram API v22 + Sauvegarde Supabase auto | 22/12/2024 | v2.18.0 | [→](./docs/SESSION-22-DEC-2024-ANALYTICS-PAGE.md) |
| DONE-025 | **Explicit Reference Prompts 🎯** — IMAGE 1=face, IMAGE 2=body mapping pour Nano Banana Pro | 22/12/2024 | v2.17.0 | [→](./docs/SESSION-22-DEC-2024-EXPLICIT-PROMPTS.md) |
| DONE-024 | **Relationship Layer 💕 + Extended Thinking** — The Secret + 6 layers + Claude thinking model | 21/12/2024 | v2.16.0 | [→](./docs/SESSION-21-DEC-2024-RELATIONSHIP-LAYER.md) |
| DONE-023 | **Reels Overhaul** — Photo vs Video reels + Minimum 2 reels/jour + Kling real-time speed | 21/12/2024 | v2.14.0 | [→](./docs/SESSION-21-DEC-2024-REELS-OVERHAUL.md) |
| DONE-022 | **Content Brain V2.1** — 5 Intelligence Layers + Dynamic Times + Exploration Budget + A/B Testing | 21/12/2024 | v2.13.0 | [→](./docs/SESSION-21-DEC-2024-CONTENT-BRAIN-V2.md) |
| DONE-021 | **Content Brain Full Auto** — Supabase + Claude AI planning + CRON scheduler/executor + GitHub Actions migration | 20/12/2024 | v2.12.0 | [→](./docs/SESSION-20-DEC-2024-CONTENT-BRAIN.md) |
| DONE-020 | **Content Brain Phase 1-2** — Supabase schema + Claude API planning + Timeline lore | 20/12/2024 | v2.11.0 | [→](./docs/SESSION-20-DEC-2024-CONTENT-BRAIN.md) |
| DONE-019 | **Growth Improvements** — Captions engageants + hashtags.ts + 7 lieux Elena + duo-post.mjs | 20/12/2024 | v2.10.0 | [→](./roadmap/done/TODO-011-growth-improvements.md) |
| DONE-018 | **AI Label Workaround** — Doc + solution caption/hashtags (API non supportée) | 18/12/2024 | v2.9.9 | [→](./docs/22-AI-LABEL-WORKAROUND.md) |
| DONE-017 | **Face Consistency Prompts** — Restructuration prompts avec REFERENCE_INSTRUCTION | 18/12/2024 | v2.9.8 | [→](./docs/SESSION-18-DEC-2024-DUAL-TOKENS.md) |
| DONE-016 | **Duo Post NYC** — Mila x Elena rooftop jacuzzi + script duo | 18/12/2024 | v2.9.7 | [→](./docs/SESSION-18-DEC-2024-DUAL-TOKENS.md) |
| DONE-015 | **Dual Tokens Fix** — Script refresh-all-tokens.mjs | 18/12/2024 | v2.9.6 | [→](./docs/SESSION-18-DEC-2024-DUAL-TOKENS.md) |
| DONE-014 | **Reference System** — Face + body + location refs pour consistance | 18/12/2024 | v2.9.5 | [→](./docs/21-REFERENCE-SYSTEM.md) |
| DONE-013 | **Reels Optimization** — Mila 4x/sem + Elena Reels créé (spa/city/yacht) | 18/12/2024 | v2.9.4 | [→](./docs/SESSION-18-DEC-2024-REELS-OPTIMIZATION.md) |
| DONE-012 | **Token Elena Permanent + Guide** — Token permanent obtenu + doc complète | 18/12/2024 | v2.9.3 | [→](./docs/20-TOKEN-REFRESH-GUIDE.md) |
| DONE-011 | **Elena Apartment Locations** — 3 refs lieux (salon, chambre, sdb) + config | 17/12/2024 | v2.9.2 | [→](./docs/SESSION-17-DEC-2024-ELENA-APARTMENT.md) |
| DONE-010 | **Reference Simplification** — 2 refs (face+body) pour Mila & Elena | 17/12/2024 | v2.9.1 | [→](./docs/SESSION-17-DEC-2024-REFERENCE-SIMPLIFICATION.md) |
| DONE-009 | **Smart Comments V2** — Extended Thinking + 8 stratégies + anti-repetition | 17/12/2024 | v2.9.0 | [→](./roadmap/done/DONE-009-smart-comments-v2.md) |
| DONE-009 | **Elena Reference Images** — 6 images Cloudinary + config | 17/12/2024 | v2.8.2 | [→](./docs/SESSION-17-DEC-2024-ELENA-GRAPH-API.md) |
| DONE-008 | **Elena Graph API** — Token permanent + auto-post ready | 17/12/2024 | v2.8.1 | [→](./docs/SESSION-17-DEC-2024-ELENA-GRAPH-API.md) |
| DONE-007 | **Elena Launch** — 9 posts @elenav.paris | 17/12/2024 | v2.8.0 | [→](./docs/SESSION-17-DEC-2024-ELENA-LAUNCH.md) |
| DONE-006 | Dual-Model Sexy Strategy (Nano + Minimax) | 16/12/2024 | v2.7.0 | [→](./roadmap/done/DONE-006-dual-model-strategy.md) |
| IP-001 | Pipeline Reels Kling v2.5 | 15/12/2024 | v2.6.0 | [→](./roadmap/done/IP-001-reels-pipeline.md) |
| DONE-001 | Smart Comments iOS | 14/12/2024 | v2.5.0 | [→](./roadmap/done/DONE-001-smart-comments.md) |
| DONE-002 | Nano Banana Pro Migration | 02/12/2024 | v2.2.0 | [→](./roadmap/done/DONE-002-nano-banana.md) |
| DONE-003 | Character Sheet V2 | 03/12/2024 | v2.3.0 | [→](./roadmap/done/DONE-003-character-v2.md) |
| DONE-004 | Video Strategy Doc | 02/12/2024 | v2.3.0 | [→](./roadmap/done/DONE-004-video-strategy.md) |
| DONE-005 | Benchmark I2V Models | 15/12/2024 | - | [→](./roadmap/done/DONE-005-benchmark-i2v.md) |

---

## 🐛 BUGS CONNUS

| ID | Bug | Sévérité | Status | Lien |
|----|-----|----------|--------|------|
| BUG-014 | **Message Loops** — 110 cas de messages répétitifs (fallback spam "Hey 🖤 Sorry..." jusqu'à 13x, AI repetition jusqu'à 30x) | 🔴 High | ✅ Fixé | [→](./roadmap/done/DONE-059-dm-race-condition-fix.md) |
| BUG-013 | **Race Condition DM Duplicates** — ManyChat envoie plusieurs webhooks simultanés → même message envoyé 2-3 fois sur Instagram | 🔴 High | ✅ Fixé | [→](./roadmap/done/DONE-059-dm-race-condition-fix.md) |
| BUG-012 | **Fanvue Daily Post 404** — Endpoint `/v1/posts` incorrect + field names mismatch (text→content, mediaUrls→media_urls, audience→is_premium) | 🔴 High | ✅ Fixé | [→](./roadmap/done/DONE-049-fanvue-daily-post-fix.md) |
| BUG-011 | **Table `posts` locations NULL** — History layer lisait mauvaise table → throwbacks répétitifs | 🟡 Medium | ✅ Fixé | [→](./roadmap/bugs/BUG-011-posts-table-null-locations.md) |
| BUG-010 | **Pas de gestion d'erreurs API** — Code marque "posted" même si `instagram_post_id` est null | 🔴 High | ✅ Fixé | [→](./roadmap/bugs/BUG-010-api-error-handling.md) |
| BUG-008 | **Sync ne met pas à jour likes/comments** — Seules impressions/reach mises à jour | 🔴 High | ✅ Fixed | [→](./docs/SESSION-23-DEC-2024-ANALYTICS-FIX.md) |
| BUG-009 | **Données du jour exclues du graphique** — API excluait aujourd'hui | 🟡 Medium | ✅ Fixed | [→](./docs/SESSION-23-DEC-2024-ANALYTICS-FIX.md) |
| BUG-007 | **Catchup 3h trop court** — Posts manqués quand GitHub Actions skip runs, augmenté à 18h | 🔴 High | ✅ Fixed | [→](./docs/SESSION-23-DEC-2024-STATUS-TRACKING.md) |
| BUG-006 | **subject_images vs image_input** — scheduled-post.mjs utilisait le mauvais param, références non envoyées | 🔴 High | ✅ Fixed | [→](./docs/SESSION-22-DEC-2024-PROMPT-IMPROVEMENTS.md) |
| BUG-005 | **TypeScript Strict Mode Errors** — Recharts formatter + Supabase callback types | 🟡 Medium | ✅ Fixed | [→](./docs/SESSION-22-DEC-2024-CLOUDINARY-FIX.md) |
| BUG-004 | **Cloudinary Unsigned Upload Blocked** — upload_preset: 'ml_default' rejeté, fix signed uploads | 🔴 High | ✅ Fixed | [→](./docs/SESSION-22-DEC-2024-CLOUDINARY-FIX.md) |
| BUG-003 | **Token Elena expiré** — Long-lived token expiré, nécessite refresh manuel | 🔴 High | ✅ Fixed | [→](./docs/20-TOKEN-REFRESH-GUIDE.md) |
| BUG-002 | ~~GitHub Actions génère images mais ne poste pas~~ | - | ✅ Fixed | Content Brain v2.0 |
| BUG-001 | Rate limit Replicate sur batch | 🟡 Medium | Open | [→](./roadmap/bugs/BUG-001-rate-limit.md) |

---

## 💡 IDÉES (Backlog)

| ID | Idée | Impact | Effort | Status | Lien |
|----|------|--------|--------|--------|------|
| **IDEA-011** | **🔥 Fanvue Bot Uncensored** — Bot conversationnel Fanvue avec Venice Uncensored (contenu explicite/sexy) + Prompt Elena "Hot Mode" prêt | 🔴 High | 🟡 Medium | 🚀 Ready | [→](./roadmap/ideas/IDEA-011-fanvue-bot-uncensored.md) |
| **IDEA-010** | **Stratégie X (Twitter)** — Compte X automatisé + posts + réponses commentaires + funnel DM Fanvue | 🔴 High | 🔴 High | 💡 Idea | [→](./roadmap/ideas/IDEA-010-x-twitter-strategy.md) |
| **IDEA-009** | **Elena AI Agent** — Agent conversationnel flirty + auto-learning + Supabase tracking | 🔴 High | 🔴 High | 💡 Idea | [→](./roadmap/ideas/IDEA-009-elena-ai-agent.md) |
| **IDEA-008** | **Long-form Captions + Character Voice** — Hooks FR + textes longs + annonce bi/open | 🔴 High | 🟡 Medium | 💡 Idea | [→](./roadmap/ideas/IDEA-008-longform-captions.md) |
| **IDEA-007** | **Trends Layer** — Perplexity daily search US→FR→EU pour viralité | 🔴 High | 🟡 Medium | 💡 Idea | [→](./roadmap/ideas/IDEA-007-trends-layer.md) |
| **IDEA-006** | **Ideas Backlog** — Inspirations curated → Content Brain auto-scheduling | 🟡 Medium | 🟡 Medium | 💡 Idea | [→](./roadmap/ideas/IDEA-006-ideas-backlog.md) |
| ~~IDEA-005~~ | ~~Content Brain~~ — Full auto + Timeline + Arcs narratifs | 🔴 High | 🔴 High | ✅ Done | [→](./roadmap/done/DONE-021-content-brain.md) |
| IDEA-001 | Univers multi-personnages (Elena) | 🔴 High | 🔴 High | ✅ Phase 1 Done | [→](./roadmap/ideas/IDEA-001-multi-characters.md) |
| IDEA-002 | Chatbot Mila payant | 🔴 High | 🟡 Medium | 💡 Idea | [→](./roadmap/ideas/IDEA-002-chatbot.md) |
| IDEA-003 | TikTok cross-post | 🟡 Medium | 🟢 Low | 💡 Idea | [→](./roadmap/ideas/IDEA-003-tiktok.md) |
| IDEA-004 | Stories automatiques | 🟡 Medium | 🟡 Medium | 💡 Idea | [→](./roadmap/ideas/IDEA-004-auto-stories.md) |

---

## 📊 Vue d'ensemble

```
Total Features:
├── ✅ Done        : 44
├── 🚧 In Progress : 3 (Elena Sexy Mode + Fanvue + Model Evolution)
├── 📋 Todo        : 6 
├── 🐛 Bugs        : 9 (9 fixed)
└── 💡 Ideas       : 10 (Fanvue Bot Uncensored prêt à implémenter 🔥)
```

---

## 📝 Sessions récentes

| Date | Focus | Lien |
|------|-------|------|
| 07/01/2025 | **🔒 DM Complete Fixes** — Race condition fix (lock) + Anti-loop (110 cas) + Natural exit messages (6 variantes avec "je réponds sur Fanvue") | [→](./docs/sessions/2025-01-07-dm-complete-fixes.md) |
| 07/01/2025 | **🎨 Content Brain Analytics Removal** — Suppression analytics "best" pour éviter biais convergence + Plus de créativité dans génération posts | [→](./roadmap/done/DONE-058-content-brain-analytics-removal.md) |
| 04/01/2025 | **📸 Elena Profile + Back Refs** — Ajout refs profile (left) + back au Content Brain pour meilleure consistance angles | [→](./docs/sessions/2025-01-04-elena-profile-back-refs.md) |
| 06/01/2025 | **🧪 Test Natural Expressions** — Test des nouvelles expressions faciales : 6 images générées (2 carousels) sans BDD/IG, review Cloudinary | [→](./docs/sessions/2025-01-06-test-natural-expressions.md) |
| 06/01/2025 | **🎭 Natural Face Variations** — Expressions naturelles : grimaces, regard ailleurs, moments candid + 25 nouvelles expressions + Notes style dans prompt | [→](./docs/sessions/2025-01-06-natural-face-variations.md) |
| 04/01/2025 | **🔧 DM Fixes Complets** — Story replies parsing + Fix webhook timeout + Never ask "which one?" + Validator fonctionnel | [→](./docs/sessions/2025-01-04-dm-fixes-complete.md) |
| 03/01/2025 | **🔍 DM Response Validator + Sonnet** — Triple protection anti-hallucination : Validator avec régénération + Prompt ultra-explicite + Claude Sonnet | [→](./docs/sessions/2025-01-03-dm-response-validator.md) |
| 03/01/2025 | **🎯 DM Close Lead Objective** — Objectif explicite "CLOSE THE LEAD" dans prompt AI + Funnel stages table + Closing rules + Pitch examples par stage | [→](./docs/sessions/2025-01-03-dm-close-lead-objective.md) |
| 03/01/2025 | **💬 DM Free Trial Link + Personalized Pitch** — Lien free trial (1 jour gratuit) + Pitch "j'ai créé un lien gratuit pour toi" (geste personnel) + Intent strategies mis à jour | [→](./docs/sessions/2025-01-03-dm-free-trial-pitch.md) |
| 03/01/2026 | **📸 Authentic IG Photo Style** — Style iPhone RAW + Variations cadrage carousel (medium/close-up/candid) + Environnement visible | [→](./roadmap/done/DONE-050-authentic-ig-photo-style.md) |
| 03/01/2025 | **🔧 Fanvue Daily Post API Fix** — Correction endpoint et field names pour workflow GitHub Actions (404 fix) | [→](./docs/sessions/2025-01-03-fanvue-daily-post-fix.md) |
| 03/01/2025 | **🔒 API Robustness & Security Fixes** — Timeouts sur tous les appels API + Protection endpoints + Cache Supabase trends + Validation Zod | [→](./docs/sessions/2025-01-03-api-robustness-fixes.md) |
| 31/12/2024 | **📊 Audit DM Cold/Warm** — Analyse conversations bloquées (114 cold, 69 warm) + Découverte fallback crédits Claude + Validation système DM Automation V2 | [→](./docs/sessions/2024-12-31-dm-audit-cold-warm.md) |
| 30/12/2024 | **🤖 DM Automation V2** — Caps par stage (15/25/35), closing pressure dynamique, personnalité warm/flirty (sans bratty), intent sexual→Fanvue, délai 15-35s, anti-hallucination | [→](./docs/27-DM-AUTOMATION-V2.md) |
| 30/12/2024 | **💰 Stratégie IG + Fanvue + BMAC** — Cadrage monétisation complète : bio IG, funnel DM <30 messages (routing A/B/C), compliance BMAC SFW, KPI quotidiens pour 100€/jour | [→](./docs/sessions/2024-12-30-ig-fanvue-bmac-strategy.md) |
| 29/12/2024 | **🔧 Fanvue API Fix & OAuth Tokens** — Fix endpoints API (retrait /v1/) + Callback OAuth affiche tokens + Vérification configuration complète | [→](./docs/sessions/2024-12-29-fanvue-api-fix.md) |
| 29/12/2024 | **🎯 Intent-Driven DM System** — Adaptation personnalité par intent + Pitch Fanvue déclenché par wants_more + PersonalityMode dynamique (warm/playful/curious/mysterious/confident) | [→](./docs/sessions/2024-12-29-intent-driven-dm-system.md) |
| 28/12/2024 | **🎭 Elena Personality Rebalance** — Audit DM (81% bratty → 35% warm target) + Refonte prompt persona + Nouveau mix 35/25/20/15/5 | [→](./docs/sessions/2024-12-28-elena-personality-rebalance.md) |
| 28/12/2024 | **🔧 Scheduler Fix + History Layer** — Fix cron scheduler (6:00→6:05 UTC) + History layer lit scheduled_posts + Fix throwbacks répétitifs | [→](./docs/sessions/SESSION-28-DEC-2024-SCHEDULER-FIX.md) |
| 28/12/2024 | **📊 DM Audit + Pitch Optimization** — Audit 122 convos DM + Validation perso bratty (81% progression) + Fix pitch en 2 temps (tease → lien si demandé) + Prompt Elena "Hot Mode" Fanvue | [→](./docs/sessions/2024-12-28-dm-audit-pitch-optimization.md) |
| 28/12/2024 | **🔥 Fanvue Bot Uncensored Research** — Recherche modèles uncensored (Replicate/OpenRouter/Venice) + Choix Venice Direct + Architecture bot Fanvue avec contenu explicite | [→](./docs/sessions/2024-12-28-fanvue-bot-uncensored-research.md) |
| 28/12/2024 | **🐦 Stratégie X (Twitter)** — Documentation complète automation compte X + posts + réponses commentaires + funnel DM Fanvue | [→](./docs/sessions/2024-12-28-x-twitter-strategy.md) |
| 27/12/2024 | **🔥 Elena Sexy Mode** — 1 post/jour 21h + Diagnostic ban Instagram + Prompts suggestifs + Mila PAUSE | [→](./docs/sessions/2024-12-27-elena-sexy-mode.md) |
| 26/12/2024 | **🤖 DM Automation LIVE** — Claude AI webhook + ManyChat intégré + Lead scoring + 100% DMs automatisés | [→](./docs/sessions/2024-12-26-dm-automation.md) |
| 26/12/2024 | **🔗 Fanvue OAuth 2.0** — Intégration API complète avec PKCE + client_secret_basic | [→](./docs/sessions/2024-12-26-fanvue-oauth.md) |
| 26/12/2024 | **🤖 ManyChat Setup + AI Agent** — Guide ManyChat + Architecture AI Agent conversationnel avec auto-learning | [→](./docs/sessions/2024-12-26-manychat-ai-agent.md) |
| 25/12/2024 | **💰 Fanvue Pack Elena + ManyChat** — 14 photos générées + Stratégie conversion DM→Fanvue | [→](./docs/sessions/2024-12-25-fanvue-pack-elena.md) |
| 23/12/2024 | **🎬 Kling Video Reels** — Tous reels animés Kling v2.5 + style Instagram 2026 + format 9:16 | [→](./docs/SESSION-23-DEC-2024-KLING-REELS.md) |
| 23/12/2024 | **📅 Status Tracking + Calendar** — Table scheduled_posts + 6 statuts + page /calendar + catchup 18h | [→](./docs/SESSION-23-DEC-2024-STATUS-TRACKING.md) |
| 22/12/2024 | **📸 Prompt Improvements** — 2026 style + safe sexy + scene consistency + sexy enhancers | [→](./docs/SESSION-22-DEC-2024-PROMPT-IMPROVEMENTS.md) |
| 22/12/2024 | **📊 Analytics Page** — Dashboard complet + Sync Instagram API v22 + Scripts → Supabase | [→](./docs/SESSION-22-DEC-2024-ANALYTICS-PAGE.md) |
| 22/12/2024 | **🔧 Cloudinary Fix + TypeScript** — Signed uploads + fix TS strict mode errors | [→](./docs/SESSION-22-DEC-2024-CLOUDINARY-FIX.md) |
| 22/12/2024 | **💡 Content Brain V3 Ideas** — Ideas Backlog + Trends Layer + Long-form Captions + Character Voice | [→](./docs/SESSION-22-DEC-2024-CONTENT-BRAIN-V3.md) |
| 22/12/2024 | **🔴 Model Evolution Strategy** — Mila Tesla Cherry Wine Red + Elena blonde + bi/open + découverte base64 | [→](./docs/SESSION-22-DEC-2024-MODEL-EVOLUTION.md) |
| 22/12/2024 | **🎯 Explicit Reference Prompts** — IMAGE 1=face, IMAGE 2=body pour meilleure ressemblance | [→](./docs/SESSION-22-DEC-2024-EXPLICIT-PROMPTS.md) |
| 21/12/2024 | **💕 Relationship Layer** — The Secret (Mila x Elena) + 6 layers Content Brain + hint system | [→](./docs/SESSION-21-DEC-2024-RELATIONSHIP-LAYER.md) |
| 21/12/2024 | **🎬 Reels Overhaul** — Photo vs Video reels + Minimum 2 reels/jour + Kling real-time | [→](./docs/SESSION-21-DEC-2024-REELS-OVERHAUL.md) |
| 21/12/2024 | **🧠 Content Brain V2.1** — 5 Intelligence Layers + Dynamic Times + Exploration Budget + A/B Testing | [→](./docs/SESSION-21-DEC-2024-CONTENT-BRAIN-V2.md) |
| 20/12/2024 | **🧠 Content Brain Full Auto** — Supabase + Claude AI + CRON + GitHub Actions migration | [→](./docs/SESSION-20-DEC-2024-CONTENT-BRAIN.md) |
| 20/12/2024 | **📊 Analytics & Growth + TODO-011** — Analyse comptes + implémentation captions, hashtags, lieux, duo-post | [→](./docs/SESSION-20-DEC-2024-ANALYTICS-GROWTH.md) |
| 18/12/2024 | **🤖 AI Label Workaround** — Recherche API + solution caption/hashtags | [→](./docs/SESSION-18-DEC-2024-AI-LABEL.md) |
| 18/12/2024 | **🔐 Dual Tokens Fix** — Refresh les deux tokens ensemble + Duo Post NYC | [→](./docs/SESSION-18-DEC-2024-DUAL-TOKENS.md) |
| 18/12/2024 | **🎬 Reels Optimization** — Mila 4x/sem optimisé + Elena Reels créé (spa/city/yacht) | [→](./docs/SESSION-18-DEC-2024-REELS-OPTIMIZATION.md) |
| 18/12/2024 | **🔐 Token Elena Permanent** — Token permanent + Guide définitif Graph API | [→](./docs/SESSION-18-DEC-2024-TOKEN-ELENA-FIX.md) |
| 17/12/2024 | **🔄 Token Refresh Elena** — Token expiré, scripts refresh créés | [→](./docs/SESSION-17-DEC-2024-TOKEN-REFRESH.md) |
| 17/12/2024 | **🏠 Elena Apartment Locations** — 3 refs lieux (salon, chambre, sdb) pour consistance | [→](./docs/SESSION-17-DEC-2024-ELENA-APARTMENT.md) |
| 17/12/2024 | **🖼️ Reference Simplification** — 2 refs (face+body) pour consistance Mila & Elena | [→](./docs/SESSION-17-DEC-2024-REFERENCE-SIMPLIFICATION.md) |
| 17/12/2024 | **🧠 Smart Comments V2** — Extended Thinking + 8 stratégies + anti-repetition | [→](./docs/SESSION-17-DEC-2024-SMART-COMMENTS-V2.md) |
| 17/12/2024 | **🔌 Elena Graph API** — Connexion @elenav.paris au Graph API | [→](./docs/SESSION-17-DEC-2024-ELENA-GRAPH-API.md) |
| 17/12/2024 | **🚀 Elena Launch** — 9 photos générées + publiées sur @elenav.paris | [→](./docs/SESSION-17-DEC-2024-ELENA-LAUNCH.md) |
| 16/12/2024 (PM) | **Elena V2** — Script carousel + Workflow GitHub Actions + Audience | [→](./docs/SESSION-16-DEC-2024-ELENA-V2.md) |
| 16/12/2024 (AM) | **Création Elena Visconti** — Character sheet + 6 photos ref + duo test | [→](./docs/SESSION-16-DEC-2024-ELENA.md) |
| 16/12/2024 | Planification intégration Supabase | [→](./roadmap/todo/TODO-004-supabase-integration.md) |
| 16/12/2024 | Analyse multi-personnages (Elena) | [→](./docs/SESSION-16-DEC-2024.md) |
| 15/12/2024 | Cron jobs + Carousel + Vacation Reels | [→](./docs/SESSION-15-DEC-2024.md) |

---

## 🏷️ Labels Priorité

| Label | Signification |
|-------|---------------|
| 🔴 High | Critique / Bloquant |
| 🟡 Medium | Important mais pas urgent |
| 🟢 Low | Nice to have |

---

## 📝 Comment ajouter une entrée

1. Créer un fichier dans le bon dossier : `roadmap/{type}/{ID}-nom.md`
2. Utiliser le template approprié (voir `roadmap/_templates/`)
3. Ajouter une ligne dans ce fichier ROADMAP.md
4. Commit avec message : `[ROADMAP] Add {ID}: {titre}`

---

*Mis à jour automatiquement ou manuellement après chaque session*
