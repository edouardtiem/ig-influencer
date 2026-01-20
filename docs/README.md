# 📚 Documentation — Elena Visconti

> Index de la documentation technique et stratégique du projet

**Dernière mise à jour** : 20 janvier 2026

---

## 🎨 PERSONNAGE

| Doc | Description |
|-----|-------------|
| [characters/elena/PERSONNAGE.md](./characters/elena/PERSONNAGE.md) | Character sheet Elena |
| [characters/elena/AUDIENCE.md](./characters/elena/AUDIENCE.md) | Persona audience cible |
| [characters/mila/](./characters/mila/) | Character Mila (en pause) |

---

## 💰 MONÉTISATION & DM

| Doc | Description |
|-----|-------------|
| [27-DM-AUTOMATION-V2.md](./27-DM-AUTOMATION-V2.md) | Système DM Instagram (Claude AI) |
| [24-DM-AUTOMATION-SYSTEM.md](./24-DM-AUTOMATION-SYSTEM.md) | Architecture DM complète |
| [23-MANYCHAT-ELENA-SUMMARY.md](./23-MANYCHAT-ELENA-SUMMARY.md) | Config ManyChat |
| [fanvue/](./fanvue/) | Documentation Fanvue (DM bot, API, fixes) |

---

## 🔧 TECHNIQUE

| Doc | Description |
|-----|-------------|
| [04-IMPLEMENTATION.md](./04-IMPLEMENTATION.md) | Architecture technique |
| [12-DEPLOYMENT.md](./12-DEPLOYMENT.md) | Guide déploiement Vercel |
| [20-TOKEN-REFRESH-GUIDE.md](./20-TOKEN-REFRESH-GUIDE.md) | Gestion tokens IG/Fanvue |
| [28-FANVUE-REFRESH-TOKEN-FIX.md](./28-FANVUE-REFRESH-TOKEN-FIX.md) | Fix tokens Fanvue |

---

## 📁 ORGANISATION

```
docs/
├── characters/
│   ├── elena/          # Character sheet Elena (actif)
│   └── mila/           # Character sheet Mila (pause)
├── fanvue/             # Documentation Fanvue system
├── sessions/           # Notes de session (YYYY-MM-DD-*.md)
└── *.md                # Docs techniques numérotées (01-28)
```

---

## 📝 SESSIONS RÉCENTES

Les notes de session sont dans `sessions/` avec le format `YYYY-MM-DD-description.md`.

| Date | Session |
|------|---------|
| 20/01/2026 | [elena-lora-runpod-setup](./sessions/2026-01-20-elena-lora-runpod-setup.md) |
| 20/01/2026 | [comfyui-output-organization](./sessions/2026-01-20-comfyui-output-organization.md) |
| 19/01/2026 | [dm-funnel-complete](./sessions/2026-01-19-dm-funnel-complete.md) |
| 19/01/2026 | [fanvue-language-consistency](./sessions/2026-01-19-fanvue-language-consistency.md) |

→ Voir [ROADMAP.md](../ROADMAP.md) pour l'historique complet

---

## 🗺️ LEGACY DOCS

Documents de la phase initiale (Mila, décembre 2024) :

| Doc | Description |
|-----|-------------|
| [01-PRD.md](./01-PRD.md) | Product Requirements (original) |
| [02-MONETISATION.md](./02-MONETISATION.md) | Stratégie monétisation v1 |
| [03-PERSONNAGE.md](./03-PERSONNAGE.md) | Character Mila (legacy) |

---

## 📊 Stack Actuelle

| Composant | Technologie |
|-----------|-------------|
| **Images IG** | Ideogram API |
| **Images Fanvue** | ComfyUI + LoRA custom |
| **DM IG** | ManyChat + Claude AI |
| **DM Fanvue** | Venice AI (uncensored) |
| **Backend** | Next.js 14 + TypeScript |
| **Hosting** | Vercel |
| **Storage** | Cloudinary |
| **Scheduler** | GitHub Actions |

---

*Projet initié le 2 décembre 2024 — Focus Elena depuis janvier 2026*
