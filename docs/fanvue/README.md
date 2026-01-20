# 📁 Documentation Fanvue

> Système de monétisation et DM automation Fanvue pour Elena

---

## 📄 Fichiers

| Fichier | Description |
|---------|-------------|
| [FANVUE_DM_FIX_SUMMARY.md](./FANVUE_DM_FIX_SUMMARY.md) | Résumé fix système DM (19/01/2026) |
| [FANVUE_DM_AUDIT_REPORT.md](./FANVUE_DM_AUDIT_REPORT.md) | Rapport d'audit complet |
| [FANVUE_LANGUAGE_CONSISTENCY.md](./FANVUE_LANGUAGE_CONSISTENCY.md) | Fix cohérence langues |
| [FANVUE_MEMORY_SYSTEM.md](./FANVUE_MEMORY_SYSTEM.md) | Système de mémoire conversations |
| [FANVUE_HARDCORE_MODE.md](./FANVUE_HARDCORE_MODE.md) | Configuration mode explicite |

---

## 🔧 Architecture

```
┌─────────────────────────────────────────┐
│  FANVUE SYSTEM                          │
├─────────────────────────────────────────┤
│                                         │
│  Webhook → Venice AI → Send Message     │
│            (uncensored)                 │
│                                         │
│  Daily Post (GitHub Actions 17h)        │
│  • ComfyUI + LoRA génération            │
│  • Upload via Fanvue API                │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📝 Dernières mises à jour

- **19/01/2026** : Fix tokens expirés + endpoint corrigé
- **19/01/2026** : Fix cohérence langues (FR/EN/IT/ES/PT/DE)
- **15/01/2025** : Venice AI intégré + Memory system
