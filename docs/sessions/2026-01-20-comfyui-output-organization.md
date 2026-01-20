# 📁 Organisation des outputs ComfyUI — Organisation automatique par catégories

**Date** : 20 janvier 2026  
**Durée** : ~30min

---

## 🎯 Objectif

Organiser automatiquement les 80+ images générées par ComfyUI dans des sous-dossiers par catégorie/projet, et configurer les workflows pour créer automatiquement des sous-dossiers lors des futures générations.

---

## ✅ Ce qui a été fait

### 1. **Analyse et catégorisation des images existantes**
- Identification du dossier : `/Users/edouardtiem/ComfyUI/output/`
- Analyse de 80 images PNG avec patterns de nommage
- Création de 9 catégories logiques :
  - `Batch_Poses/` (10 images - Elena_01 à Elena_10)
  - `Generic/` (12 images - ComfyUI_*, API_Test_*)
  - `Lingerie/` (2 images)
  - `Linktree/` (11 images)
  - `Linktree_V2/` (10 images)
  - `Masturbation/` (5 images)
  - `Nude/` (6 images)
  - `Shower_Paris/` (13 images)
  - `Tests_Techniques/` (11 images - LoRA, IPAdapter, ControlNet...)

### 2. **Script de réorganisation automatique**
- Création de `organize-outputs.mjs` dans `/Users/edouardtiem/ComfyUI/`
- Script Node.js avec règles de catégorisation par pattern regex
- Mode dry-run pour prévisualiser avant exécution
- Exécution réussie : **80 fichiers organisés dans 9 dossiers**

### 3. **Configuration workflow ComfyUI**
- Modification du workflow `z_image_nsfw_v2.json`
- Changement du `filename_prefix` de `"ComfyUI"` → `"Tests/%date:yyyy-MM-dd%/Elena"`
- Les futures images seront automatiquement organisées par date :
  ```
  /ComfyUI/output/Tests/2026-01-20/Elena_00001_.png
  ```

### 4. **Documentation créée**
- Guide complet dans `/Users/edouardtiem/ComfyUI/GUIDE-ORGANISATION-OUTPUTS.md`
- Exemples de patterns avec variables dynamiques
- Conventions de nommage recommandées

---

## 📁 Fichiers créés/modifiés

### Dans ComfyUI (hors repo IG-influencer)
- `/Users/edouardtiem/ComfyUI/organize-outputs.mjs` (nouveau)
- `/Users/edouardtiem/ComfyUI/user/default/workflows/z_image_nsfw_v2.json` (modifié)
- `/Users/edouardtiem/ComfyUI/GUIDE-ORGANISATION-OUTPUTS.md` (nouveau)

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

---

## 🎨 Patterns disponibles pour futures générations

### Variables dynamiques ComfyUI
| Variable | Description | Exemple |
|----------|-------------|---------|
| `%date:yyyy-MM-dd%` | Date formatée | `2026-01-20` |
| `%year%`, `%month%`, `%day%` | Composants date | `2026`, `01`, `20` |
| `%hour%`, `%minute%`, `%second%` | Composants heure | `14`, `30`, `45` |

### Exemples de patterns recommandés
- **Nouveau projet** : `Linktree_V3/Elena_Pose`
- **Test technique** : `Tests/%date:yyyy-MM-dd%/Elena_LoRA`
- **Shooting spécifique** : `Shooting_Paris/Elena_Scene`
- **Session quotidienne** : `%date:yyyy-MM-dd%/Elena_Description`

---

## 📋 Utilisation

### Réorganiser les images existantes
```bash
cd /Users/edouardtiem/ComfyUI

# Simulation (voir ce qui sera fait)
node organize-outputs.mjs

# Exécution réelle
node organize-outputs.mjs --execute
```

### Ajouter une nouvelle catégorie
Éditer `organize-outputs.mjs` et ajouter dans `CATEGORIES` :
```javascript
{ pattern: /^Elena_NouvelleCategorie_/, folder: 'NouvelleCategorie' },
```

### Modifier le pattern de sauvegarde
Dans ComfyUI, modifier le champ `filename_prefix` du nœud **Save Image** :
- Actuel : `Tests/%date:yyyy-MM-dd%/Elena`
- Pour un nouveau projet : `NomProjet/Elena_Description`

---

## 💡 Notes importantes

- **ComfyUI crée automatiquement les sous-dossiers** si le `filename_prefix` contient un `/`
- Le script `organize-outputs.mjs` peut être réexécuté pour réorganiser de nouvelles images
- Les images sont **déplacées** (pas copiées) pour éviter les doublons
- Le workflow modifié créera un nouveau dossier par jour dans `Tests/`

---

## 🔄 Prochaines étapes possibles

- [ ] Créer des patterns spécifiques par type de génération (Linktree, Fanvue, etc.)
- [ ] Automatiser le rangement périodique (cron job)
- [ ] Ajouter un système de tags/metadata pour meilleure recherche
- [ ] Intégrer avec le système de génération pour nommer automatiquement selon le contexte

---

**Résultat** : Organisation complète des 80 images existantes + configuration automatique pour futures générations ✅
