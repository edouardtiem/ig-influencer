# 🗺️ ROADMAP — Mila Verne Project

> Suivi centralisé de toutes les features, bugs et idées

**Dernière mise à jour** : 16 décembre 2024 (session Elena)

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
| IDEA-001 | Univers multi-personnages (Elena) | 🔴 High | `feature/elena-character` | [→](./roadmap/ideas/IDEA-001-multi-characters.md) |

---

## 📋 À FAIRE (Priorisé)

| ID | Feature | Priorité | Estimation | Lien |
|----|---------|----------|------------|------|
| TODO-004 | Intégration Supabase (posts + conversations) | 🔴 High | 3h | [→](./roadmap/todo/TODO-004-supabase-integration.md) |
| TODO-001 | Multi-shot Reels (carousel → video) | 🔴 High | 4h | [→](./roadmap/todo/TODO-001-multi-shot-reels.md) |
| TODO-002 | Auto-post Reels via cron | 🟡 Medium | 2h | [→](./roadmap/todo/TODO-002-auto-post-reels.md) |
| TODO-003 | Dashboard analytics | 🟢 Low | 6h | [→](./roadmap/todo/TODO-003-dashboard.md) |

---

## ✅ FAIT (Récent)

| ID | Feature | Date | Version | Lien |
|----|---------|------|---------|------|
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
| BUG-001 | Rate limit Replicate sur batch | 🟡 Medium | Open | [→](./roadmap/bugs/BUG-001-rate-limit.md) |

---

## 💡 IDÉES (Backlog)

| ID | Idée | Impact | Effort | Status | Lien |
|----|------|--------|--------|--------|------|
| IDEA-001 | Univers multi-personnages (Elena) | 🔴 High | 🔴 High | 🚧 In Progress | [→](./roadmap/ideas/IDEA-001-multi-characters.md) |
| IDEA-002 | Chatbot Mila payant | 🔴 High | 🟡 Medium | 💡 Idea | [→](./roadmap/ideas/IDEA-002-chatbot.md) |
| IDEA-003 | TikTok cross-post | 🟡 Medium | 🟢 Low | 💡 Idea | [→](./roadmap/ideas/IDEA-003-tiktok.md) |
| IDEA-004 | Stories automatiques | 🟡 Medium | 🟡 Medium | 💡 Idea | [→](./roadmap/ideas/IDEA-004-auto-stories.md) |

---

## 📊 Vue d'ensemble

```
Total Features:
├── ✅ Done        : 7
├── 🚧 In Progress : 1 (Elena)
├── 📋 Todo        : 4
├── 🐛 Bugs        : 1
└── 💡 Ideas       : 4 (1 in progress)
```

---

## 📝 Sessions récentes

| Date | Focus | Lien |
|------|-------|------|
| 16/12/2024 | **Création Elena Visconti** — Character sheet + 6 photos ref + duo test | [→](./docs/SESSION-16-DEC-2024-ELENA.md) |
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
