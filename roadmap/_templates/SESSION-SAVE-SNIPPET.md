# 📋 Session Save Snippet

> Copie ce bloc à la fin de chaque session de chat pour sauvegarder le travail

---

## 🎯 SNIPPET À COPIER

```
---

## 📝 FIN DE SESSION — À SAUVEGARDER

**Date** : [DATE]
**Durée** : ~Xh

### ✅ Ce qui a été fait cette session :
1. [Description tâche 1]
2. [Description tâche 2]
3. [Description tâche 3]

### 📁 Fichiers créés/modifiés :
- `path/to/file1.ts` — Description
- `path/to/file2.md` — Description

### 🚧 En cours (non terminé) :
- [Ce qui reste à faire]

### 📋 À faire prochaine session :
- [ ] Tâche 1
- [ ] Tâche 2

### 🐛 Bugs découverts :
- [Bug si applicable]

### 💡 Idées notées :
- [Idée si applicable]

### 📝 Notes importantes :
- [Note 1]
- [Note 2]

---

**Action requise** : Mets à jour les fichiers suivants :
1. `ROADMAP.md` — Ajouter/déplacer les entrées
2. `CHANGELOG.md` — Si nouvelle version
3. `roadmap/{folder}/` — Créer les docs pour nouvelles features/bugs/idées

---
```

---

## 🔄 Workflow Recommandé

### À la fin de chaque session :

1. **Colle le snippet** dans le chat
2. **Remplis les sections** avec ce qui a été fait
3. **Demande à l'IA** : "Sauvegarde cette session et mets à jour ROADMAP.md"

### L'IA va :

1. Créer un fichier `archive/sessions/SESSION-{DATE}.md`
2. Mettre à jour `ROADMAP.md` avec les nouvelles entrées
3. Créer les docs individuels dans `roadmap/`
4. Optionnellement mettre à jour `CHANGELOG.md`

---

## 📁 Structure Archive Sessions

```
archive/sessions/
├── SESSION-02-DEC-2024.md
├── SESSION-03-DEC-2024.md
├── SESSION-14-DEC-2024.md
└── SESSION-15-DEC-2024.md  ← Nouvelle
```

---

## 💡 Tips

- **Sois spécifique** sur les fichiers modifiés
- **Note les décisions** importantes prises
- **Liste les tests** effectués et leurs résultats
- **Indique les coûts** si applicable (API calls, etc.)

