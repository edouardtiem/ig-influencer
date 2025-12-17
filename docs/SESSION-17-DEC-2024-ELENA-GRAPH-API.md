# 📝 SESSION — 17 Décembre 2024 — Elena Graph API Connection

**Date** : 17 décembre 2024
**Durée** : ~2h30

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

- **Predictions "starting" impossibles à annuler** — Les prédictions bloquées en status "starting" retournent 404 quand on essaie de les cancel via API ou UI. Elles timeout éventuellement (~30min).

- **Compte Replicate frozen** — Peut arriver si trop de prédictions bloquées. Contacter support ou attendre.

---

## 💡 Idées notées :

- **Script unifié multi-comptes** — Modifier `get-permanent-token.mjs` pour supporter Mila ET Elena avec un argument
- **Dashboard multi-personnages** — Interface pour gérer les deux comptes Instagram
- **Crossover Mila x Elena NYC** — Prompt préparé pour photo duo jacuzzi rooftop Manhattan (à générer quand Replicate OK)
- **Alternative Gemini/Imagen 3** — Backup quand Replicate est surchargé (mais pas de reference images)

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

---

## 🎨 Prompt Crossover Mila x Elena (à utiliser plus tard)

```
Ultra realistic Instagram photo, two young women best friends relaxing in a rooftop jacuzzi in New York City, afternoon golden hour light, Manhattan skyline in background, steam rising from hot water,

BASED ON THE 4 PROVIDED REFERENCE IMAGES (2 per person), same faces and bodies as references:

PERSON 1 - MILA: Based on reference images 1-2, 23 year old French woman, oval face soft jawline, shoulder-length auburn hair type 5A loose curls natural volume, almond-shaped hazel-green eyes with golden flecks, straight nose slightly upturned tip, naturally full lips medium pink, healthy athletic curvy figure large natural D-cup breasts, narrow waist wide hips, wearing black string bikini,

PERSON 2 - ELENA: Based on reference images 3-4, 24 year old Italian woman, soft round pleasant face not angular, bronde hair dark roots with golden blonde balayage long beach waves wet from steam, honey brown warm eyes, naturally full lips nude-pink, small beauty mark on right cheekbone, curvy voluptuous figure very large natural F-cup breasts prominent, narrow waist wide hips, wearing cream string bikini, gold chunky chain bracelet on left wrist, layered gold necklaces,

SCENE: luxury rooftop jacuzzi hot tub, New York City Manhattan skyline visible behind them, late afternoon golden sunlight, steam rising, after-work relaxation vibes, champagne glasses on jacuzzi edge,

POSE: both women sitting in bubbling water chest-deep, Mila laughing naturally looking at Elena, Elena with confident relaxed smile looking at camera, intimate best friends moment,

STYLE: Instagram influencer aesthetic 2025, lifestyle photography, natural lighting, high resolution, realistic skin texture
```

**Settings:** Aspect Ratio 4:5, 4 reference images (2 Mila + 2 Elena)

---

*Session terminée avec succès — Elena 100% configurée, prête à poster quand Replicate est disponible ! 🇮🇹✨*


