# 📝 SESSION — 17 Décembre 2024 — Elena Graph API Connection

**Date** : 17 décembre 2024
**Durée** : ~1h30

---

## ✅ Ce qui a été fait cette session :

1. **Connexion @elenav.paris au Graph API** — Token permanent configuré
2. **Création Page Facebook "Elena Visconti"** — Liée au compte Instagram
3. **Script `get-permanent-token-elena.mjs`** — Pour automatiser la génération de tokens Elena
4. **Debug permissions Facebook** — Résolu le problème `pages_show_list` qui disparaissait
5. **Configuration `.env.local`** — Variables Elena ajoutées (token, account ID, page ID)
6. **Images de référence Elena** — 6 images uploadées sur Cloudinary et configurées
7. **Mise à jour `carousel-post-elena.mjs`** — Script adapté pour lire les env vars Elena
8. **Test connexion Graph API** — Vérifié que @elenav.paris répond correctement

---

## 📁 Fichiers créés/modifiés :

| Fichier | Action |
|---------|--------|
| `scripts/get-permanent-token-elena.mjs` | 🆕 Créé |
| `scripts/carousel-post-elena.mjs` | ✏️ Modifié (env vars Elena) |
| `.env.local` | ✏️ Ajouté 6 variables Elena |
| `env.example.txt` | ✏️ Documenté variables Elena |
| `ROADMAP.md` | ✏️ Mis à jour |
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

- **Premier post Elena** — Annulé à cause de la queue Replicate (1h40+ de queue)
  - Script prêt, config OK, mais Replicate surchargé
  - À retenter quand la queue est plus courte (matin tôt ou nuit)

---

## 📋 À faire prochaine session :

- [ ] Premier post automatique sur @elenav.paris (quand queue Replicate < 5min)
- [ ] Créer un Reel pour Elena
- [ ] Elena Stories Highlights (Travel, Home, BTS)
- [ ] Crossover Mila x Elena

---

## 🐛 Bugs découverts :

- **`pages_show_list` disparaît** — Quand on régénère un token dans Graph API Explorer, cette permission disparaît de la liste même si elle était sélectionnée. Workaround : interroger directement la Page par son ID (`{PAGE_ID}?fields=...`)

- **`me/accounts` retourne vide** — Même avec toutes les permissions, le token User ne liste pas les Pages. Solution : requêter directement `{PAGE_ID}?fields=id,name,access_token,instagram_business_account`

- **Queue Replicate très longue** — Nano Banana Pro avait 1h40+ de queue le 17/12/2024 à 18h. Génération impossible dans un temps raisonnable. Conseil : vérifier la queue avant de lancer un batch.

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

| Compte | Graph API | Token | Images Ref | Prêt pour post |
|--------|-----------|-------|------------|----------------|
| @mila_verne | ✅ | ✅ Permanent | ✅ | ✅ |
| @elenav.paris | ✅ | ✅ Permanent | ✅ 6 images | ✅ (queue Replicate) |

---

## 📁 Configuration Elena complète

```bash
# .env.local
INSTAGRAM_ACCESS_TOKEN_ELENA=EAALxXaUI2SYBQ... (Page Token)
INSTAGRAM_ACCOUNT_ID_ELENA=17841478189581833
FACEBOOK_PAGE_ID_ELENA=883026764900260
ELENA_BASE_FACE_URL=https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/...
ELENA_REFERENCE_URLS=5 images comma-separated
```

---

*Session terminée avec succès — Elena 100% configurée, prête à poster quand Replicate est disponible ! 🇮🇹✨*


