# 🎭 Characters — Documentation

> Tous les personnages du projet et leur documentation

---

## 📂 Structure

```
characters/
├── _TEMPLATE-PERSONNAGE.md    # Template character sheet
├── _TEMPLATE-AUDIENCE.md      # Template audience target
├── README.md                  # Ce fichier
│
├── mila/                      # 👩‍🦰 Mila Verne
│   ├── PERSONNAGE.md          # Character sheet
│   └── AUDIENCE.md            # Audience target
│
└── elena/                     # 👱‍♀️ Elena Visconti
    ├── PERSONNAGE.md          # Character sheet
    └── AUDIENCE.md            # Audience target (à créer)
```

---

## 👥 Personnages actifs

| Personnage | Style | Status | Instagram |
|------------|-------|--------|-----------|
| **Mila Verne** | Athleisure punk rock | ✅ Actif | @mila_verne |
| **Elena Visconti** | Street-luxe Paris | 🚧 En création | @elena.visconti (TBD) |

---

## 🤝 Relations

```
Mila ←──── Best Friends ────→ Elena
       (rencontrées sur un shooting)
```

---

## ➕ Ajouter un personnage

1. **Créer le dossier** : `docs/characters/[prenom]/`
2. **Copier les templates** :
   - `_TEMPLATE-PERSONNAGE.md` → `[prenom]/PERSONNAGE.md`
   - `_TEMPLATE-AUDIENCE.md` → `[prenom]/AUDIENCE.md`
3. **Remplir les docs**
4. **Générer le dataset** (photos de référence)
5. **Créer la config** : `app/src/config/character-[prenom].ts`
6. **Mettre à jour ce README**

---

## 📋 Checklist nouveau personnage

- [ ] Character sheet complet
- [ ] Audience target définie
- [ ] 4-6 photos de référence générées
- [ ] Config TypeScript créée
- [ ] Compte Instagram créé
- [ ] Business Account configuré
- [ ] Tokens API obtenus
- [ ] Script carousel adapté
- [ ] GitHub Action créée
- [ ] Premiers posts manuels
- [ ] Go live !

---

*Dernière mise à jour : 16 décembre 2024*

