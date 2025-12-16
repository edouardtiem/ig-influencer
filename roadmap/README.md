# 🗺️ Roadmap — Guide d'utilisation

> Système de tracking des features, bugs et idées du projet Mila

---

## 📂 Structure

```
roadmap/
├── _templates/           # Templates pour créer de nouvelles entrées
│   ├── TEMPLATE-feature.md
│   ├── TEMPLATE-bug.md
│   ├── TEMPLATE-idea.md
│   └── SESSION-SAVE-SNIPPET.md
│
├── done/                 # ✅ Features terminées
├── in-progress/          # 🚧 En cours de développement
├── todo/                 # 📋 Planifié, priorisé
├── bugs/                 # 🐛 Bugs connus
├── ideas/                # 💡 Backlog, idées futures
│
└── README.md             # Ce fichier
```

---

## 🏷️ Convention de nommage

| Type | Préfixe | Exemple |
|------|---------|---------|
| Done | `DONE-XXX` | `DONE-001-smart-comments.md` |
| In Progress | `IP-XXX` | `IP-001-reels-pipeline.md` |
| Todo | `TODO-XXX` | `TODO-001-multi-shot.md` |
| Bug | `BUG-XXX` | `BUG-001-rate-limit.md` |
| Idea | `IDEA-XXX` | `IDEA-001-chatbot.md` |

---

## ➕ Créer une nouvelle entrée

### 1. Choisir le bon template

```bash
# Copier le template approprié
cp roadmap/_templates/TEMPLATE-feature.md roadmap/todo/TODO-XXX-nom.md
```

### 2. Remplir le template

- Remplacer `{ID}`, `{Titre}`, `{date}`, etc.
- Remplir les sections pertinentes

### 3. Mettre à jour ROADMAP.md

Ajouter une ligne dans la table correspondante :

```markdown
| TODO-XXX | Ma feature | 🟡 Medium | 2h | [→](./roadmap/todo/TODO-XXX-nom.md) |
```

---

## 🔄 Déplacer une entrée

Quand une feature passe de "Todo" à "In Progress" :

1. **Déplacer le fichier** :
```bash
mv roadmap/todo/TODO-001-xxx.md roadmap/in-progress/IP-001-xxx.md
```

2. **Renommer l'ID** dans le fichier (TODO → IP)

3. **Mettre à jour ROADMAP.md** :
   - Supprimer de la table "À FAIRE"
   - Ajouter dans "EN COURS"

---

## ✅ Terminer une feature

1. **Déplacer** vers `done/`
2. **Renommer** l'ID (IP → DONE)
3. **Mettre à jour** le status et la date de fin
4. **Ajouter** dans CHANGELOG.md si applicable

---

## 📝 Session Save

Voir le snippet dans `_templates/SESSION-SAVE-SNIPPET.md` pour sauvegarder proprement chaque session de travail.

---

## 🔗 Lien avec CHANGELOG.md

- **ROADMAP** = ce qu'on fait (planning)
- **CHANGELOG** = ce qu'on a fait (historique versions)

Chaque feature DONE majeure devrait avoir une entrée CHANGELOG correspondante.

