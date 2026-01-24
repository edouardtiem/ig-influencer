# 🗺️ ROADMAP — Mila Verne Project

> Suivi centralisé de toutes les features, bugs et idées

**Dernière mise à jour** : 19 janvier 2026 (TODO-018 Workflow BigLust → Fanvue Design ✅)

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
| IP-008 | **🎨 Elena LoRA Cloud Training** — Training v3 complété mais NaN loss → à relancer avec bf16 et LR plus bas. Voir [session 20/01](./docs/sessions/2026-01-20-elena-lora-cloud-training.md) | 🔴 High | main | [→](./roadmap/in-progress/IP-008-elena-lora-cloud-training.md) |
| IP-007 | **🔧 Hard Fix DM Bugs** — Investigation systématique + Fix 105 contacts > cap non STOPPED + Fix Elena demande anglais (multilingue) + Script diagnostic complet | 🔴 High | main | [→](./roadmap/in-progress/IP-007-dm-hard-fix.md) |
| IP-006 | **📊 DM Funnel Progress** — Audit complet funnel DM + Tracking Fanvue attribution (fuzzy matching) + 0% conversion identifié comme problème critique | 🔴 High | main | [→](./roadmap/in-progress/IP-006-dm-funnel-progress.md) |
| IP-005 | **💬 Auto-Reply Comments** — Backend API créé + ManyChat AI configuré pour réponses auto commentaires IG | 🔴 High | main | [→](./roadmap/in-progress/IP-005-auto-reply-comments.md) |
| IP-004 | **🔥 Elena Sexy Mode** — 1 post/jour à 21h, contenu suggestif (bikini/lingerie/sport) | 🔴 High | main | [→](./docs/sessions/2024-12-27-elena-sexy-mode.md) |
| IP-003 | **💰 Fanvue Monetization** — Packs photos Elena + ManyChat DM automation | 🔴 High | main | [→](./docs/sessions/2024-12-25-fanvue-pack-elena.md) |
| IP-002 | **🔴 Model Evolution** — Mila Tesla Red + Elena blonde + bi/open relationship | 🟡 Medium | main | [→](./roadmap/in-progress/IP-002-model-evolution.md) |

> **Elena Sexy Mode** : ✅ Actif — 1 post/jour à 21h (bikini/lingerie/sport moulant)  
> **Mila** : ⏸️ PAUSE temporaire (à réactiver après stabilisation Elena)  
> **Fanvue Pack 1** : ✅ 14 photos générées (2 shootings) dans `elena-fanvue-pack1`  
> **ManyChat** : ✅ 2 automations LIVE (Auto-DM comments + Welcome followers)  
> **DM System** : ✅ **ACTIVE** — Kill switch opérationnel sur `/calendar`  
> **DM Fanvue** : ✅ **ACTIVE** — Venice AI configuré + OAuth valide (audit 16/01/2025)  
> **AI Agent** : ✅ LIVE avec Response Validator + Sonnet + Story replies support + anti-hallucination renforcé (régénération auto, max 3 tentatives) + Language detection multilingue (mirror user's language)  
> **Objectif** : 500€/mois via Fanvue  
> **Next** : Resume DM system après expiration ban Instagram

---

## 📋 À FAIRE (Priorisé)

| ID | Feature | Priorité | Estimation | Lien |
|----|---------|----------|------------|------|
| ~~TODO-016~~ | ~~Elena AI Agent~~ — ✅ DONE via DONE-037 | - | - | [→](./docs/sessions/2024-12-26-dm-automation.md) |
| ~~TODO-013~~ | ~~ManyChat Setup~~ — ✅ 2 automations LIVE | - | - | [→](./docs/sessions/2024-12-26-manychat-ai-agent.md) |
| TODO-018 | **🎨 Workflow Automatisé BigLust → Fanvue** — Crop automatique MediaPipe + Validation humaine + Upload Fanvue avec vaults + Tracking Supabase | 🔴 High | 8-10h | [→](./roadmap/todo/TODO-018-biglust-fanvue-pipeline.md) |
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

## ✅ FAIT (Janvier 2026)

| ID | Feature | Date | Lien |
|----|---------|------|------|
| DONE-084 | **🎨 Content Brain V3 "Freedom Mode"** — Refonte majeure: suppression ~665 lignes hardcodées (locations, outfits, poses) → Claude décide librement avec blocklist Nano Banana Pro | 20/01/2026 | [→](./roadmap/done/DONE-084-content-brain-freedom-mode.md) |
| DONE-083 | **🤖 AI Response Generation** — Remplace ~33 réponses hardcodées par génération AI contextuelle (Claude Haiku) + Templates avec exemples/guidelines + Fallback automatique | 20/01/2026 | [→](./roadmap/done/DONE-083-ai-response-generation.md) |
| DONE-082 | **🔍 DM Prompt Audit & Fix** — Audit conversations 6h + Fix limite 12 mots → concise + Utilisation historique + Profil utilisateur + Détection langue temps réel + Limite 3 liens max | 20/01/2026 | [→](./roadmap/done/DONE-082-dm-prompt-audit-fix.md) |
| DONE-081 | **🔄 Haiku Model Migration** — Migration claude-3-5-haiku-20241022 (deprecated) → claude-haiku-4-5-20251001 | 20/01/2026 | [→](./roadmap/done/DONE-081-haiku-model-migration.md) |
| DONE-080 | **🔗 DM Linktree UTM Tracking** — Router DMs vers Linktree (meilleure conversion) + URLs propres /bio et /dm avec UTM cachés + OG image pour previews | 20/01/2026 | [→](./roadmap/done/DONE-080-dm-linktree-utm-tracking.md) |
| DONE-079 | **🔧 Nano Banana Pro Audit & Fix** — Audit filtres Google + Fix Content Brain Elena (face ref only, expressions nettoyées) → 30%→90% success rate | 20/01/2026 | [→](./roadmap/done/DONE-079-nano-banana-pro-audit-fix.md) |
| DONE-078 | **📁 ComfyUI Output Organization** — Script réorganisation 80 images | 20/01/2026 | [→](./roadmap/done/DONE-078-comfyui-output-organization.md) |
| DONE-077 | **📱 DM Sticker/Reaction Handling** — Gestion tokens + anti-duplication | 19/01/2026 | [→](./roadmap/done/DONE-077-dm-sticker-reaction-handling.md) |
| DONE-076 | **🔗 Elena Linktree Domain** — elenav.link + Vercel Analytics | 19/01/2026 | [→](./roadmap/done/DONE-076-elena-linktree-domain-analytics.md) |
| DONE-075 | **📈 Extension Funnel DM** — Stages CLOSING/FOLLOWUP + anti-répétition | 19/01/2026 | [→](./roadmap/done/DONE-075-dm-funnel-extension-closing-followup.md) |
| DONE-074 | **🔧 DM Condition Fix** — ManyChat should_send flag | 19/01/2026 | [→](./roadmap/done/DONE-074-dm-condition-fix.md) |
| DONE-073 | **🔄 DM Auto-Reactivation** — Cooldown 7 jours | 19/01/2026 | [→](./roadmap/done/DONE-073-dm-auto-reactivation.md) |
| DONE-072 | **🔧 ManyChat Conditional Flow** — Fix boucles infinies | 19/01/2026 | [→](./roadmap/done/DONE-072-dm-manychat-conditional-fix.md) |
| DONE-071 | **🔗 Elena Custom Linktree** — Design Soft Boudoir | 19/01/2026 | [→](./roadmap/done/DONE-071-elena-custom-linktree.md) |
| DONE-070 | **🌍 Fanvue Language Consistency** — Fix langues DM | 19/01/2026 | [→](./roadmap/done/DONE-070-fanvue-language-consistency.md) |
| DONE-069 | **🔧 Hard Fix DM Bugs** — 105 contacts corrigés | 19/01/2026 | [→](./docs/sessions/2026-01-19-dm-hard-fix-session.md) |
| DONE-068 | **🔍 Audit DM Fanvue** — Venice AI + OAuth fix | 16/01/2026 | [→](./roadmap/done/DONE-068-fanvue-dm-audit-fix.md) |
| DONE-067 | **🔧 Unicode JSON Error Fix** — sanitizeUnicode() | 16/01/2026 | [→](./roadmap/done/DONE-067-dm-unicode-json-error-fix.md) |
| DONE-066 | **🔥 Fanvue Sexy Prompts** — 14 poses + body description | 16/01/2026 | [→](./roadmap/done/DONE-066-fanvue-sexy-prompts-upgrade.md) |
| DONE-065 | **🔧 Fanvue Daily Post Fix** — API multipart migration | 15/01/2026 | [→](./roadmap/done/DONE-065-fanvue-daily-post-content-filter-fix.md) |
| DONE-064 | **🔧 DM Spam Fix** — Race condition + cooldown | 09/01/2026 | [→](./roadmap/done/DONE-064-dm-fanvue-spam-rapid-fire-fix.md) |
| DONE-063 | **🔥 Content Brain V2.4** — Trending Layer + Perplexity | 09/01/2026 | [→](./roadmap/done/DONE-063-content-brain-trending-layer.md) |

→ **Archive complète** : [archive/ROADMAP-ARCHIVE-2024.md](./archive/ROADMAP-ARCHIVE-2024.md) (78 features)

---

## 🐛 BUGS CONNUS

| ID | Bug | Sévérité | Status | Lien |
|----|-----|----------|--------|------|
| BUG-017 | **Free Trial Link Non Vérifié** — Le lien free trial 7 jours n'a pas été testé pour vérifier qu'il fonctionne correctement | 🔴 High | ⏳ À tester | [→](./roadmap/in-progress/IP-006-dm-funnel-progress.md#bug-017-free-trial-link-non-vérifié) |
| BUG-016 | **Attribution Non Fonctionnelle** — Fuzzy matching implémenté mais webhook Fanvue pas configuré dans Developer Portal → conversions non trackées | 🔴 High | ⏳ Config à faire | [→](./roadmap/in-progress/IP-006-dm-funnel-progress.md#bug-016-attribution-non-fonctionnelle) |
| BUG-015 | **DM Unicode JSON Error** — Erreur 400 Anthropic API causée par caractères Unicode invalides (surrogate pairs incomplets) dans historique conversation → Fallback sur "hey 🖤" sans contexte | 🔴 High | ✅ Fixé | [→](./roadmap/bugs/BUG-015-dm-unicode-json-error.md) |
| BUG-014 | **Message Loops** — 110 cas de messages répétitifs (fallback spam "Hey 🖤 Sorry..." jusqu'à 13x, AI repetition jusqu'à 30x) | 🔴 High | ✅ Fixé | [→](./roadmap/done/DONE-059-dm-race-condition-fix.md) |
| BUG-013 | **Race Condition DM Duplicates** — ManyChat envoie plusieurs webhooks simultanés → même message envoyé 2-3 fois sur Instagram | 🔴 High | ✅ Fixé | [→](./roadmap/done/DONE-059-dm-race-condition-fix.md) |
| BUG-012 | **Fanvue Daily Post 404** — Endpoint `/v1/posts` incorrect + field names mismatch (text→content, mediaUrls→media_urls, audience→is_premium) | 🔴 High | ✅ Fixé | [→](./roadmap/done/DONE-049-fanvue-daily-post-fix.md) |
| BUG-011 | **Table `posts` locations NULL** — History layer lisait mauvaise table → throwbacks répétitifs | 🟡 Medium | ✅ Fixé | [→](./roadmap/bugs/BUG-011-posts-table-null-locations.md) |
| BUG-010 | **Pas de gestion d'erreurs API** — Code marque "posted" même si `instagram_post_id` est null | 🔴 High | ✅ Fixé | [→](./roadmap/bugs/BUG-010-api-error-handling.md) |
| BUG-008 | **Sync ne met pas à jour likes/comments** | 🔴 High | ✅ Fixed | [→](./archive/sessions/SESSION-23-DEC-2024-ANALYTICS-FIX.md) |
| BUG-009 | **Données du jour exclues du graphique** | 🟡 Medium | ✅ Fixed | [→](./archive/sessions/SESSION-23-DEC-2024-ANALYTICS-FIX.md) |
| BUG-007 | **Catchup 3h trop court** | 🔴 High | ✅ Fixed | [→](./archive/sessions/SESSION-23-DEC-2024-STATUS-TRACKING.md) |
| BUG-006 | **subject_images vs image_input** | 🔴 High | ✅ Fixed | [→](./archive/sessions/SESSION-22-DEC-2024-PROMPT-IMPROVEMENTS.md) |
| BUG-005 | **TypeScript Strict Mode Errors** | 🟡 Medium | ✅ Fixed | [→](./archive/sessions/SESSION-22-DEC-2024-CLOUDINARY-FIX.md) |
| BUG-004 | **Cloudinary Unsigned Upload Blocked** | 🔴 High | ✅ Fixed | [→](./archive/sessions/SESSION-22-DEC-2024-CLOUDINARY-FIX.md) |
| BUG-003 | **Token Elena expiré** — Long-lived token expiré, nécessite refresh manuel | 🔴 High | ✅ Fixed | [→](./docs/20-TOKEN-REFRESH-GUIDE.md) |
| BUG-002 | ~~GitHub Actions génère images mais ne poste pas~~ | - | ✅ Fixed | Content Brain v2.0 |
| BUG-001 | Rate limit Replicate sur batch | 🟡 Medium | Open | [→](./roadmap/bugs/BUG-001-rate-limit.md) |

---

## 💡 IDÉES (Backlog)

| ID | Idée | Impact | Effort | Status | Lien |
|----|------|--------|--------|--------|------|
| ~~IDEA-013~~ | ~~Auto-Reply Comments~~ — Moved to IP-005 | - | - | 🚧 Dev | [→](./roadmap/in-progress/IP-005-auto-reply-comments.md) |
| **IDEA-012** | **👍 Automatisation Likes Commentaires** — Script auto pour liker commentaires (0 likes) sur posts similaires + 80 likes/jour max + Délais aléatoires + Tracking Supabase | 🟡 Medium | 🟡 Medium | 💡 Idea | [→](./roadmap/ideas/IDEA-012-comment-likes-automation.md) |
| ~~IDEA-011~~ | ~~Fanvue Bot Uncensored~~ — ✅ DONE via DONE-045 | - | - | ✅ Done | [→](./roadmap/done/DONE-045-fanvue-dm-v2-memory.md) |
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
├── ✅ Done        : 82 (20 en janvier 2026)
├── 🚧 In Progress : 8
├── 📋 Todo        : 6 
├── 🐛 Bugs        : 2 actifs + 15 fixés
└── 💡 Ideas       : 10
```

→ Archive : [archive/ROADMAP-ARCHIVE-2024.md](./archive/ROADMAP-ARCHIVE-2024.md)

---

## 📝 Sessions récentes (Janvier 2026)

| Date | Focus | Lien |
|------|-------|------|
| 19/01/2026 | **🎨 Workflow BigLust → Fanvue Design** — Design complet pipeline automatisé avec crop MediaPipe, validation, upload Fanvue, tracking Supabase | [→](./docs/sessions/2026-01-19-biglust-fanvue-workflow-design.md) |
| 20/01/2026 | **🎨 Content Brain V3 "Freedom Mode"** — Suppression 665 lignes hardcodées → Claude décide librement | [→](./docs/sessions/2026-01-20-content-brain-freedom.md) |
| 20/01/2026 | **🔍 DM Prompt Audit & Fix** — Audit complet + Corrections majeures prompts (limite mots, historique, langue, liens) | [→](./docs/sessions/2026-01-20-dm-prompt-audit-fix.md) |
| 20/01/2026 | **🔄 Haiku Model Migration** — Migration deprecated Haiku → Haiku 4.5 | [→](./docs/sessions/2026-01-20-haiku-model-migration.md) |
| 20/01/2026 | **🔧 Nano Banana Pro Audit** — Audit filtres Google + Fix Content Brain Elena (30%→90%) | [→](./docs/sessions/2026-01-20-nano-banana-pro-audit.md) |
| 20/01/2026 | **📚 Documentation Cleanup** — Nettoyage complet doc (root, sessions, roadmap) + README mis à jour Elena | [→](./docs/sessions/2026-01-20-documentation-cleanup.md) |
| 20/01/2026 | **📁 ComfyUI Output Organization** | [→](./docs/sessions/2026-01-20-comfyui-output-organization.md) |
| 20/01/2026 | **🎨 Elena LoRA RunPod Setup** | [→](./docs/sessions/2026-01-20-elena-lora-runpod-setup.md) |
| 19/01/2026 | **🔗 Elena Linktree Domain** | [→](./docs/sessions/2026-01-19-elena-linktree-domain-analytics.md) |
| 19/01/2026 | **🔧 DM Complete Fix** | [→](./docs/sessions/2026-01-19-dm-complete-fix-session.md) |
| 19/01/2026 | **🌍 Fanvue Language Fix** | [→](./docs/sessions/2026-01-19-fanvue-language-consistency.md) |
| 18/01/2026 | **📊 Audit Funnel DM** | [→](./docs/sessions/2026-01-18-dm-funnel-audit.md) |
| 16/01/2026 | **🔧 Unicode JSON Error Fix** | [→](./docs/sessions/2026-01-16-dm-unicode-json-error-fix.md) |
| 09/01/2026 | **🔥 Content Brain V2.4** | [→](./docs/sessions/2026-01-09-content-brain-trending-layer.md) |

→ **Toutes les sessions** : [docs/sessions/](./docs/sessions/)  
→ **Archive décembre 2024** : [archive/sessions/](./archive/sessions/)

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
