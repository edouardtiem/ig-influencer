# 🤖 IG Influencer — Elena Visconti

> Influenceuse virtuelle automatisée sur Instagram & Fanvue, propulsée par l'IA

[![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)]()
[![Pipeline](https://img.shields.io/badge/pipeline-tested-blue)]()
[![Account](https://img.shields.io/badge/IG-@elenav.paris-E4405F)]()

---

## 🎯 Le Projet

**Elena Visconti** (@elenav.paris) est une influenceuse virtuelle automatisée qui publie quotidiennement du contenu lifestyle/sexy sur Instagram et Fanvue, entièrement générée et gérée par IA.

### Objectifs

- 🤖 **100% automatisé** - Posts IG, DMs, Fanvue
- 🎨 **Consistance visuelle** - LoRA training + références
- 💰 **Monétisation** - Fanvue subscriptions + DM funnel
- 📈 **Croissance organique** - Funnel IG → Fanvue

---

## ⚡ Quick Start

```bash
# Installation
cd app && npm install

# Configuration
cp env.example.txt .env.local
# Éditer .env.local avec vos clés API

# Démarrage
npm run dev
```

→ Voir [docs/QUICKSTART.md](docs/QUICKSTART.md) pour le guide complet

---

## 🏗️ Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Backend | Next.js 14 + TypeScript |
| Génération images | **Ideogram** + **ComfyUI** (LoRA) |
| Consistance faciale | LoRA custom + IPAdapter |
| Hébergement images | Cloudinary |
| Publication IG | **Instagram Graph API** |
| Publication Fanvue | **Fanvue API** (OAuth) |
| DM Automation | **ManyChat** + Claude AI |
| Hosting | Vercel |

**Coût estimé :** ~$15-25/mois

---

## 🎨 Le Personnage

**Elena Visconti** — 24 ans, modèle & créatrice de contenu parisienne

- 🔥 **Style** : Lifestyle sexy (lingerie, bikini, boudoir)
- 🌍 **Contenu** : Posts en anglais, audience internationale
- ⭐ **Signes distinctifs** : Blonde, yeux bleus, 172cm
- 📸 **Format** : 1 post IG/jour (21h) + 1 post Fanvue/jour (17h)

→ Voir [docs/characters/elena/PERSONNAGE.md](docs/characters/elena/PERSONNAGE.md) pour le character sheet complet

---

## 📚 Documentation

### Guides essentiels

- **[📖 Documentation](docs/README.md)** — Index complet
- **[🗺️ Roadmap](ROADMAP.md)** — Features, bugs, idées
- **[🎨 Elena](docs/characters/elena/PERSONNAGE.md)** — Character sheet

### Systèmes actifs

- **[💬 DM Automation](docs/27-DM-AUTOMATION-V2.md)** — Funnel IG → Fanvue
- **[🔥 Fanvue System](docs/fanvue/)** — Bot DM + Daily posts
- **[🧠 Content Brain](docs/sessions/2026-01-09-content-brain-trending-layer.md)** — Auto-génération

---

## 🚀 Architecture

```
┌─────────────────────────────────────────────────────┐
│  INSTAGRAM (@elenav.paris)                          │
│  • 1 post/jour à 21h (Content Brain)                │
│  • DM automation (ManyChat + Claude AI)             │
│  • Funnel: Comment → DM → Fanvue                    │
└────────────────┬────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│  FANVUE                                             │
│  • 1 post/jour à 17h (sexy content)                 │
│  • DM bot (Venice AI uncensored)                    │
│  • Subscriptions + PPV                              │
└────────────────┬────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│  GÉNÉRATION IMAGES                                  │
│  • Ideogram (safe IG content)                       │
│  • ComfyUI + LoRA (NSFW Fanvue)                    │
│  • Cloudinary (hosting)                             │
└─────────────────────────────────────────────────────┘
```

---

## ✅ Status Actuel

| Système | Status |
|---------|--------|
| Instagram Auto-Post | ✅ Actif (GitHub Actions) |
| DM Automation IG | ✅ Actif (ManyChat + Claude) |
| Fanvue Daily Post | ✅ Actif (GitHub Actions) |
| Fanvue DM Bot | ✅ Actif (Venice AI) |
| LoRA Training | 🚧 En cours (RunPod) |
| Mila (2ème personnage) | ⏸️ Pause |

---

## 💰 Monétisation

| Source | Méthode |
|--------|---------|
| **Fanvue Subs** | Free trial → Paid ($9.99/mois) |
| **DM Funnel** | IG comment → DM → Fanvue link |
| **PPV Content** | Messages payants sur Fanvue |

**Objectif** : 500€/mois via Fanvue

---

## 🛠️ Commandes Utiles

```bash
# Démarrer le serveur
cd app && npm run dev

# Test DM system
node scripts/test-dm-conversation.mjs

# Audit contacts DM
node scripts/audit-dm-contacts.mjs

# Déployer sur Vercel
cd app && vercel --prod
```

---

## 📂 Structure Documentation

```
docs/
├── characters/elena/     # Character sheet Elena
├── fanvue/               # Documentation Fanvue system
├── sessions/             # Notes de session (YYYY-MM-DD-*.md)
└── *.md                  # Docs techniques numérotées

roadmap/
├── done/                 # ✅ Features terminées (78)
├── in-progress/          # 🚧 En cours (7)
├── todo/                 # 📋 À faire
├── bugs/                 # 🐛 Bugs connus
└── ideas/                # 💡 Backlog

archive/
├── sessions/             # Anciennes sessions (< 2025)
└── old-docs/             # Documentation obsolète
```

---

## 📝 Changelog

Voir [CHANGELOG.md](CHANGELOG.md) pour l'historique complet.

**Version actuelle :** v2.63+ (DM System, Fanvue Integration, LoRA Training)

---

## 📜 License

Private project — All rights reserved

---

<div align="center">

**Made with AI**

*Ideogram • ComfyUI • Claude • Venice AI • Vercel*

</div>
