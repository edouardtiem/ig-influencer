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
| Génération images | 🍌 **Nano Banana Pro** (Google DeepMind) |
| Consistance faciale | 4 images de référence (95%+ natif) |
| Base de données | Supabase (Life Calendar System) |
| Hébergement images | Cloudinary |
| Publication | Make.com → Buffer → Instagram |
| Hosting | Vercel |

> **🔴 MISE À JOUR MAJEURE (2 Déc 2024)** : Migration de Flux Kontext Pro vers Nano Banana Pro pour consistance native supérieure. Voir [docs/06-NANO-BANANA-PRO-MIGRATION.md](docs/06-NANO-BANANA-PRO-MIGRATION.md)

> **📍 NOUVEAUTÉ (2 Déc 2024)** : Life Calendar System avec Supabase pour rotation géographique cohérente. Voir [docs/07-LIFE-CALENDAR.md](docs/07-LIFE-CALENDAR.md)

**Coût estimé :** ~$2-5/mois (0-10K followers)

---

## 🎨 Le Personnage

**Mila Verne** — 22 ans, fitness French girl de Nice installée à Paris

- 🏋️‍♀️ **Style** : Athleisure chic (60% lifestyle, 40% fitness)
- 🇫🇷 **Contenu** : Posts en français, hashtags mixtes
- ⭐ **Signes distinctifs** : Cheveux cuivre, pendentif étoile, piercing langue
- 📸 **Format** : 2 posts/jour (10h, 18h)

→ Voir [docs/03-PERSONNAGE.md](docs/03-PERSONNAGE.md) pour le character sheet complet

---

## 📚 Documentation

### Guides essentiels

- **[⚡ Quick Start](docs/QUICKSTART.md)** — Démarrer en 5 minutes
- **[📖 Documentation complète](docs/README.md)** — Index de toute la doc
- **[🛠️ Implémentation](docs/04-IMPLEMENTATION.md)** — Architecture technique

### Stratégie

- [PRD](docs/01-PRD.md) — Vision produit
- [Monétisation](docs/02-MONETISATION.md) — Stratégie revenus
- [Personnage](docs/03-PERSONNAGE.md) — Character design
- **[📍 Life Calendar](docs/07-LIFE-CALENDAR.md)** — Rotation géographique & contextes ✨ NEW
- **[🎬 Vidéo Strategy](docs/08-VIDEO-STRATEGY.md)** — Contenu vidéo & animation ✨ NEW

### Plan d'Action

- **[📋 TODO Semaine](TODO-SEMAINE.md)** — Prochaines étapes prioritaires

---

## 🚀 Pipeline Automatique

```
┌─────────────────────────────────────────────────────┐
│  Cron Job (cron-job.org)                           │
│  Trigger : 10h & 18h                               │
└────────────────┬────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│  Next.js API (/api/auto-post)                      │
│  • Sélection template aléatoire                    │
│  • Génération prompt                               │
└────────────────┬────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│  Replicate (Nano Banana Pro)                       │
│  • Génération image haute qualité                  │
│  • Consistance native avec 4 références            │
│  • Temps : ~60-90 secondes                         │
│  • Coût : ~$0.05-0.06/image                        │
└────────────────┬────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│  Make.com (Webhook)                                │
│  • Réception image + caption                       │
│  • Routage vers Buffer                             │
└────────────────┬────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│  Buffer → Instagram                                │
│  • Publication automatique                         │
│  • Post live ! 📱                                  │
└─────────────────────────────────────────────────────┘
```

---

## ✅ Status Actuel

| Phase | Status |
|-------|--------|
| Configuration | ✅ Complété |
| Développement Pipeline Base | ✅ Complété |
| Life Calendar System | 🚧 Documentation complète, implémentation en cours |
| Stratégie Vidéo | 🚧 Documentation complète, recherche modèle en cours |
| Tests locaux | ✅ Validé |
| Déploiement | 📝 Planifié (cette semaine) |
| Production | 📝 Planifié (semaine prochaine) |

**Derniers développements (v2.3 - 2 Déc) :**
- ✅ Life Calendar System documenté (rotation géographique Paris/Nice/Travel)
- ✅ Stratégie vidéo complète (photos + reels animés)
- ✅ Architecture Supabase (6 tables)
- 🚧 Recherche modèle animation en cours
- 🚧 Setup Supabase à effectuer

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

# Tester génération d'image
curl http://localhost:3000/api/test-generate

# Publier un post Instagram
curl -X POST http://localhost:3000/api/auto-post \
  -H "Authorization: Bearer test-secret"

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

## 🤝 Contribution

Ce projet est actuellement en développement privé. La documentation est maintenue à jour avec chaque itération.

---

## 📝 Changelog

Voir [CHANGELOG.md](CHANGELOG.md) pour l'historique complet des versions.

**Version actuelle :** 2.3.0 (Life Calendar + Vidéo documentés)

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

*Propulsé par Replicate, Cloudinary, Make.com & Vercel*

</div>

