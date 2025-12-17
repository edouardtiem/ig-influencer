# 📝 SESSION — 17 Décembre 2024 — Elena Graph API Connection

**Date** : 17 décembre 2024
**Durée** : ~1h30

---

## ✅ Ce qui a été fait cette session :

1. **Connexion @elenav.paris au Graph API** — Token permanent configuré
2. **Création Page Facebook "Elena Visconti"** — Liée au compte Instagram
3. **Script `get-permanent-token-elena.mjs`** — Pour automatiser la génération de tokens Elena
4. **Debug permissions Facebook** — Résolu le problème `pages_show_list` qui disparaissait
5. **Configuration `.env.local`** — Variables Elena ajoutées

---

## 📁 Fichiers créés/modifiés :

| Fichier | Action |
|---------|--------|
| `scripts/get-permanent-token-elena.mjs` | 🆕 Créé |
| `.env.local` | ✏️ Ajouté variables Elena |
| `docs/SESSION-17-DEC-2024-ELENA-GRAPH-API.md` | 🆕 Créé |

---

## 🔧 Configuration Elena finale

```bash
# Dans .env.local
INSTAGRAM_ACCESS_TOKEN_ELENA=EAALxXaUI2SYBQ... (Page Token permanent)
INSTAGRAM_ACCOUNT_ID_ELENA=17841478189581833
FACEBOOK_PAGE_ID_ELENA=883026764900260
```

---

## 🚧 En cours (non terminé) :

- **Images de référence Elena** — À uploader sur Cloudinary
  - `ELENA_BASE_FACE_URL` — Photo principale
  - `ELENA_REFERENCE_URLS` — Photos additionnelles

---

## 📋 À faire prochaine session :

- [ ] Uploader images de référence Elena sur Cloudinary
- [ ] Ajouter `ELENA_BASE_FACE_URL` et `ELENA_REFERENCE_URLS` dans `.env.local`
- [ ] Tester génération d'image Elena avec Nano Banana Pro
- [ ] Premier post automatique sur @elenav.paris
- [ ] Créer un Reel pour Elena

---

## 🐛 Bugs découverts :

- **`pages_show_list` disparaît** — Quand on régénère un token dans Graph API Explorer, cette permission disparaît de la liste même si elle était sélectionnée. Workaround : interroger directement la Page par son ID (`{PAGE_ID}?fields=...`)

- **`me/accounts` retourne vide** — Même avec toutes les permissions, le token User ne liste pas les Pages. Solution : requêter directement `{PAGE_ID}?fields=id,name,access_token,instagram_business_account`

---

## 💡 Idées notées :

- **Script unifié multi-comptes** — Modifier `get-permanent-token.mjs` pour supporter Mila ET Elena avec un argument
- **Dashboard multi-personnages** — Interface pour gérer les deux comptes Instagram

---

## 📝 Notes importantes :

### Architecture multi-comptes

```
Compte Facebook (Edouard Doudou)
    │
    ├── Page "Mila Verne" ──────→ @mila_verne
    │   └── Token: INSTAGRAM_ACCESS_TOKEN
    │
    └── Page "Elena Visconti" ──→ @elenav.paris
        └── Token: INSTAGRAM_ACCESS_TOKEN_ELENA
```

### Workaround Graph API Explorer

Si `me/accounts` retourne `{"data":[]}` malgré les bonnes permissions :

```
# Au lieu de
me/accounts

# Utiliser directement l'ID de la Page
{PAGE_ID}?fields=id,name,access_token,instagram_business_account
```

IDs connus :
- **Elena Visconti** : `883026764900260`
- **Mila Verne** : `941108822414254`

---

## 📊 Status final

| Compte | Graph API | Token | Prêt pour post |
|--------|-----------|-------|----------------|
| @mila_verne | ✅ | ✅ Permanent | ✅ |
| @elenav.paris | ✅ | ✅ Permanent | ⚠️ Manque images ref |

---

*Session terminée avec succès — Elena connectée au Graph API ! 🇮🇹✨*


