# 🗺️ ROADMAP — Mila Verne Project

> Suivi centralisé de toutes les features, bugs et idées

**Dernière mise à jour** : 17 décembre 2024 (Simplification références images Mila + Elena)

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
| - | *Aucun en cours* | - | - | - |

> **Elena Phase 1 terminée** — Compte lancé avec 9 posts le 17/12/2024  
> **Merge done** — `feature/elena-character` → `main` (28 files, +4919 lines)

---

## 📋 À FAIRE (Priorisé)

| ID | Feature | Priorité | Estimation | Lien |
|----|---------|----------|------------|------|
| TODO-011 | **Premier Post Elena** — Carousel (quand Replicate OK) | 🔴 High | 10min | - |
| TODO-010 | **Targeting Actif** — 20 comments/jour/compte sur niches cibles | 🔴 High | ongoing | - |
| TODO-006 | Elena Stories Highlights (Travel, Home, BTS) | 🟡 Medium | 2h | - |
| TODO-007 | Premier Reel Elena (Kling/Minimax) | 🟡 Medium | 2h | - |
| TODO-008 | Crossover Mila x Elena NYC — Prompt prêt 🎨 | 🟡 Medium | 20min | - |
| TODO-004 | Intégration Supabase (posts + conversations) | 🔴 High | 3h | [→](./roadmap/todo/TODO-004-supabase-integration.md) |
| TODO-001 | Multi-shot Reels (carousel → video) | 🔴 High | 4h | [→](./roadmap/todo/TODO-001-multi-shot-reels.md) |
| TODO-002 | Auto-post Reels via cron | 🟡 Medium | 2h | [→](./roadmap/todo/TODO-002-auto-post-reels.md) |
| TODO-003 | Dashboard analytics | 🟢 Low | 6h | [→](./roadmap/todo/TODO-003-dashboard.md) |

---

## ✅ FAIT (Récent)

| ID | Feature | Date | Version | Lien |
|----|---------|------|---------|------|
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
| BUG-002 | GitHub Actions génère images mais ne poste pas sur Instagram | 🔴 High | Open | - |
| BUG-001 | Rate limit Replicate sur batch | 🟡 Medium | Open | [→](./roadmap/bugs/BUG-001-rate-limit.md) |

---

## 💡 IDÉES (Backlog)

| ID | Idée | Impact | Effort | Status | Lien |
|----|------|--------|--------|--------|------|
| IDEA-005 | **Intelligent Content Engine** — Analytics + History → Auto-propose | 🔴 High | 🔴 High | 💡 Idea | [→](./roadmap/ideas/IDEA-005-intelligent-content-engine.md) |
| IDEA-001 | Univers multi-personnages (Elena) | 🔴 High | 🔴 High | ✅ Phase 1 Done | [→](./roadmap/ideas/IDEA-001-multi-characters.md) |
| IDEA-002 | Chatbot Mila payant | 🔴 High | 🟡 Medium | 💡 Idea | [→](./roadmap/ideas/IDEA-002-chatbot.md) |
| IDEA-003 | TikTok cross-post | 🟡 Medium | 🟢 Low | 💡 Idea | [→](./roadmap/ideas/IDEA-003-tiktok.md) |
| IDEA-004 | Stories automatiques | 🟡 Medium | 🟡 Medium | 💡 Idea | [→](./roadmap/ideas/IDEA-004-auto-stories.md) |

---

## 📊 Vue d'ensemble

```
Total Features:
├── ✅ Done        : 11 (+Reference Simplification)
├── 🚧 In Progress : 0
├── 📋 Todo        : 8
├── 🐛 Bugs        : 2 (+Instagram posting issue)
└── 💡 Ideas       : 5 (incl. Intelligent Content Engine)
```

---

## 📝 Sessions récentes

| Date | Focus | Lien |
|------|-------|------|
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
