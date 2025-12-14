# 🤖 IG Influencer — Mila Verne

> Influenceuse virtuelle automatisée sur Instagram, propulsée par l'IA

[![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)]()
[![Pipeline](https://img.shields.io/badge/pipeline-tested-blue)]()
[![French](https://img.shields.io/badge/langue-français-blue)]()

---

## 🎯 Le Projet

**Mila Verne** est une influenceuse virtuelle automatisée qui publie quotidiennement du contenu lifestyle/fitness sur Instagram, entièrement générée et gérée par IA.

### Objectifs

- 🤖 **100% automatisé** - Aucune intervention manuelle quotidienne
- 🎨 **Consistance visuelle** - Même personne reconnaissable sur tous les posts
- 💰 **Monétisation** - Produits digitaux, subscriptions, partenariats
- 📈 **Croissance organique** - 0 → 10K followers en 6 mois

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
| Génération images | 🍌 **Nano Banana Pro** (via Replicate) |
| Consistance faciale | 4 images de référence (95%+ natif) |
| Hébergement images | Cloudinary |
| Publication | **Instagram Graph API** (direct) |
| Hosting | Vercel |

> **📍 Workflow "Copy & Adapt"** : Reproduire rapidement un post influencer pour Mila. Voir [docs/14-POST-NOW-WORKFLOW.md](docs/14-POST-NOW-WORKFLOW.md)

**Coût estimé :** ~$2-5/mois (0-10K followers)

---

## 🎨 Le Personnage

**Mila Verne** — 22 ans, fitness French girl de Nice installée à Paris

- 🏋️‍♀️ **Style** : Athleisure chic (60% lifestyle, 40% fitness)
- 🇫🇷 **Contenu** : Posts en français, hashtags mixtes
- ⭐ **Signes distinctifs** : Cheveux cuivre, pendentif étoile
- 📸 **Format** : 2 posts/jour

→ Voir [docs/03-PERSONNAGE.md](docs/03-PERSONNAGE.md) pour le character sheet complet

---

## 📚 Documentation

### Guides essentiels

- **[⚡ Quick Start](docs/QUICKSTART.md)** — Démarrer en 5 minutes
- **[📖 Documentation complète](docs/README.md)** — Index de toute la doc
- **[🛠️ Implémentation](docs/04-IMPLEMENTATION.md)** — Architecture technique
- **[📸 Workflow "Copy & Adapt"](docs/14-POST-NOW-WORKFLOW.md)** — Créer un post rapidement

### Stratégie

- [PRD](docs/01-PRD.md) — Vision produit
- [Monétisation](docs/02-MONETISATION.md) — Stratégie revenus
- [Personnage](docs/03-PERSONNAGE.md) — Character design
- [📍 Life Calendar](docs/07-LIFE-CALENDAR.md) — Rotation géographique & contextes

---

## 🚀 Pipeline de Génération

```
┌─────────────────────────────────────────────────────┐
│  Workflow "Copy & Adapt"                            │
│  Screenshots post influencer → Analyse IA           │
└────────────────┬────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│  Replicate (Nano Banana Pro)                        │
│  • Génération image haute qualité                   │
│  • Consistance native avec 4 références             │
│  • Temps : ~40-60 secondes                          │
│  • Coût : ~$0.05/image                              │
└────────────────┬────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│  Cloudinary                                         │
│  • Hébergement permanent                            │
│  • URLs publiques                                   │
└────────────────┬────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│  Instagram Graph API                                │
│  • Publication directe                              │
│  • Carrousels supportés                             │
│  • Post live ! 📱                                   │
└─────────────────────────────────────────────────────┘
```

---

## ✅ Status Actuel

| Phase | Status |
|-------|--------|
| Configuration | ✅ Complété |
| Pipeline Génération | ✅ Complété |
| Publication Graph API | ✅ Complété |
| Workflow "Copy & Adapt" | ✅ Complété |
| Life Calendar System | 🚧 En cours |
| Scheduling automatique | 📝 Planifié (Vercel Cron) |

---

## 💰 Monétisation (Roadmap)

| Phase | Followers | Revenus estimés | Méthode |
|-------|-----------|-----------------|---------|
| Phase 1 | 0-2K | $0 | Croissance organique |
| Phase 2 | 2K-10K | $100-500/mois | Produits digitaux + affiliés |
| Phase 3 | 10K-25K | $500-2K/mois | Close Friends + Fanvue |
| Phase 4 | 25K+ | $2K-10K/mois | Partenariats marques |

→ Voir [docs/02-MONETISATION.md](docs/02-MONETISATION.md) pour la stratégie complète

---

## 🛠️ Commandes Utiles

```bash
# Démarrer le serveur
npm run dev

# Générer un carrousel
node scripts/generate-cafe-backshot-carousel.mjs

# Publier sur Instagram
node scripts/post-carousel-instagram.mjs

# Vérifier le status
curl http://localhost:3000/api/status

# Déployer sur Vercel
cd app && vercel --prod
```

---

## 📊 Métriques Cibles

| Métrique | Mois 1 | Mois 3 | Mois 6 |
|----------|--------|--------|--------|
| Followers | 500 | 5K | 10K |
| Engagement | 5-10% | 8-12% | 10-15% |
| Posts/jour | 2 | 2-3 | 3 |
| Revenus | $0 | $200 | $500 |

---

## 📝 Changelog

Voir [CHANGELOG.md](CHANGELOG.md) pour l'historique complet des versions.

**Version actuelle :** 3.0.0 (Graph API direct, nettoyage codebase)

---

## 📞 Support & Contact

Pour toute question sur le setup ou l'implémentation, consulter :
- [Documentation complète](docs/README.md)
- [Guide de démarrage](docs/QUICKSTART.md)
- [Guide technique](docs/04-IMPLEMENTATION.md)

---

## 📜 License

Private project — All rights reserved

---

<div align="center">

**Made with ❤️ and lots of AI**

*Propulsé par Replicate, Cloudinary & Vercel*

</div>
