# DONE-078 — Organisation automatique outputs ComfyUI

> Script de réorganisation des images par catégories + Configuration workflows pour création automatique sous-dossiers

**Status** : ✅ Done  
**Priorité** : 🟡 Medium  
**Estimation** : 30min  
**Créé** : 20/01/2026  
**Terminé** : 20/01/2026  

---

## 📋 Description

Organisation automatique des 80+ images générées par ComfyUI dans des sous-dossiers par catégorie/projet, avec configuration des workflows pour créer automatiquement des sous-dossiers lors des futures générations.

---

## 🎯 Objectifs

- [x] Identifier le dossier ComfyUI outputs
- [x] Analyser les patterns de nommage existants
- [x] Créer un script de réorganisation automatique
- [x] Organiser les 80 images existantes en 9 catégories
- [x] Configurer le workflow pour création automatique sous-dossiers
- [x] Documenter les patterns et conventions

---

## 🔧 Implémentation

### Fichiers créés/modifiés (dans ComfyUI)

```
/Users/edouardtiem/ComfyUI/
├── organize-outputs.mjs                    (nouveau - script réorganisation)
├── GUIDE-ORGANISATION-OUTPUTS.md           (nouveau - documentation)
└── user/default/workflows/
    └── z_image_nsfw_v2.json                (modifié - filename_prefix avec sous-dossier)
```

### Structure résultante

```
/ComfyUI/output/
├── Batch_Poses/         (10 images)
├── Generic/             (12 images)
├── Lingerie/            (2 images)
├── Linktree/            (11 images)
├── Linktree_V2/         (10 images)
├── Masturbation/        (5 images)
├── Nude/                (6 images)
├── Shower_Paris/        (13 images)
└── Tests_Techniques/    (11 images)
```

### Script de réorganisation

- **Pattern matching** : Règles regex pour catégoriser automatiquement
- **Mode dry-run** : Prévisualisation avant exécution
- **Création automatique** : Sous-dossiers créés si inexistants
- **Déplacement** : Images déplacées (pas copiées) pour éviter doublons

### Configuration workflow

- **filename_prefix modifié** : `"ComfyUI"` → `"Tests/%date:yyyy-MM-dd%/Elena"`
- **Variables dynamiques** : Support `%date:yyyy-MM-dd%`, `%year%`, `%month%`, etc.
- **Création automatique** : ComfyUI crée les sous-dossiers si `/` présent dans prefix

---

## 📝 Notes

- Les fichiers sont dans `/Users/edouardtiem/ComfyUI/` (hors repo IG-influencer)
- Le script peut être réexécuté pour réorganiser de nouvelles images
- Les patterns peuvent être facilement étendus pour nouvelles catégories
- Documentation complète disponible dans `GUIDE-ORGANISATION-OUTPUTS.md`

---

## 🔗 Liens

- Session : [→](../../docs/sessions/2026-01-20-comfyui-output-organization.md)
- Guide ComfyUI : `/Users/edouardtiem/ComfyUI/GUIDE-ORGANISATION-OUTPUTS.md`
