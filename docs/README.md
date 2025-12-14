# 📚 Documentation — Mila Verne AI Influencer

> Documentation du projet d'automatisation d'une influenceuse virtuelle sur Instagram.

---

## 🗂 Structure de la Documentation

```
docs/
├── README.md                         ← Vous êtes ici (index)
├── QUICKSTART.md                     ← Guide de démarrage rapide ⚡
│
├── 📋 STRATÉGIE
│   ├── 01-PRD.md                     ← Product Requirements Document
│   ├── 02-MONETISATION.md            ← Stratégie de monétisation Phase 1
│   └── 13-MONETISATION-V2.md         ← Stratégie avancée (chatbot, univers)
│
├── 🎨 PERSONNAGE & CONTENU
│   ├── 03-PERSONNAGE.md              ← Character sheet Mila Verne
│   ├── 10-LIEUX-RECURRENTS.md        ← Bibliothèque des lieux
│   └── 11-LIEUX-ACTIFS.md            ← Lieux actifs en rotation
│
├── 🔧 TECHNIQUE
│   ├── 04-IMPLEMENTATION.md          ← Architecture technique complète
│   ├── 06-NANO-BANANA-PRO-MIGRATION.md ← Solution actuelle (Nano Banana Pro)
│   ├── 07-LIFE-CALENDAR.md           ← Système rotation géographique
│   ├── 12-DEPLOYMENT.md              ← Guide de déploiement Vercel
│   ├── 14-POST-NOW-WORKFLOW.md       ← Workflow "Copy & Adapt"
│   └── 15-SMART-COMMENTS.md          ← Commentaires IG via iOS Shortcut ⭐ NEW
│
├── 📊 PROJECTIONS
│   ├── 05-PROJECTIONS-CROISSANCE.md  ← Projections détaillées
│   └── 08-VIDEO-STRATEGY.md          ← Stratégie vidéo (future)
│
└── 📝 NOTES
    └── VEO-3.1-NOTES.md              ← Notes Google Veo (video future)
```

---

## 📄 Documents Principaux

### ✅ Actifs et à jour

| Document | Description | Dernière MàJ |
|----------|-------------|--------------|
| [QUICKSTART](./QUICKSTART.md) | Démarrage rapide | Déc 2024 |
| [01-PRD](./01-PRD.md) | Vision produit | Déc 2024 |
| [03-PERSONNAGE](./03-PERSONNAGE.md) | Character sheet Mila | Déc 2024 |
| [04-IMPLEMENTATION](./04-IMPLEMENTATION.md) | Architecture technique | Déc 2024 |
| [06-NANO-BANANA-PRO-MIGRATION](./06-NANO-BANANA-PRO-MIGRATION.md) | Solution génération actuelle | Déc 2024 |
| [11-LIEUX-ACTIFS](./11-LIEUX-ACTIFS.md) | Lieux en rotation | Déc 2024 |
| [12-DEPLOYMENT](./12-DEPLOYMENT.md) | Déploiement Vercel | Déc 2024 |
| [14-POST-NOW-WORKFLOW](./14-POST-NOW-WORKFLOW.md) | Workflow création rapide | Déc 2024 |
| [15-SMART-COMMENTS](./15-SMART-COMMENTS.md) | Commentaires IG via iOS Shortcut | Déc 2024 |

### 📝 Référence (moins fréquemment mis à jour)

| Document | Description |
|----------|-------------|
| [02-MONETISATION](./02-MONETISATION.md) | Stratégie revenus Phase 1 |
| [05-PROJECTIONS-CROISSANCE](./05-PROJECTIONS-CROISSANCE.md) | Projections croissance |
| [07-LIFE-CALENDAR](./07-LIFE-CALENDAR.md) | Système rotation (Supabase) |
| [08-VIDEO-STRATEGY](./08-VIDEO-STRATEGY.md) | Stratégie vidéo future |
| [10-LIEUX-RECURRENTS](./10-LIEUX-RECURRENTS.md) | Bibliothèque lieux |
| [13-MONETISATION-V2](./13-MONETISATION-V2.md) | Chatbot & univers (Phase 2+) |

---

## 🎯 Stack Technique Actuel

| Composant | Technologie |
|-----------|-------------|
| Backend | Next.js 14 + TypeScript |
| Génération images | 🍌 **Nano Banana Pro** (via Replicate) |
| Face consistency | 4 images de référence |
| Hébergement images | Cloudinary |
| Publication | **Instagram Graph API** (direct) |
| Hosting | Vercel |

---

## 🚀 Workflow Principal

```
Screenshots Influencer → Analyse IA → Prompts Mila → Nano Banana Pro → Post Instagram
```

Voir [14-POST-NOW-WORKFLOW.md](./14-POST-NOW-WORKFLOW.md) pour le détail.

---

## 📁 Archives

Les documents obsolètes sont dans `/archive/`:
- `archive/sessions/` — Notes de sessions passées
- `archive/old-docs/` — Documentation obsolète (LoRA, Flux Kontext, etc.)
- `archive/one-shot-scripts/` — Scripts de posts spécifiques

### Branche NSFW

Les expérimentations NSFW sont archivées dans la branche `archive/nsfw-experiments`:
- Scripts de génération NSFW (PuLID, Venice, face-swap, etc.)
- Documentation NSFW (RunPod, SeaArt, Z-Image)
- Code fal.ai et RunPod

Pour reprendre le développement NSFW:
```bash
git checkout archive/nsfw-experiments
# ou cherry-pick les fichiers nécessaires
```

---

## 💡 Par où commencer ?

1. **Nouveau sur le projet** → [QUICKSTART.md](./QUICKSTART.md)
2. **Comprendre Mila** → [03-PERSONNAGE.md](./03-PERSONNAGE.md)
3. **Architecture** → [04-IMPLEMENTATION.md](./04-IMPLEMENTATION.md)
4. **Créer un post** → [14-POST-NOW-WORKFLOW.md](./14-POST-NOW-WORKFLOW.md)

---

*Dernière mise à jour : 14 décembre 2024 (v2.5)*
