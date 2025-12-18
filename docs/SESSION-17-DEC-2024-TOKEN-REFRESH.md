# 📝 SESSION — 17 Décembre 2024 (Soir)

## Token Refresh Elena

**Date** : 17 décembre 2024  
**Durée** : ~15min

---

### ✅ Ce qui a été fait cette session :

1. **Script post-single-elena.mjs** — Créé pour poster une image unique sur @elenav.paris
2. **Script refresh-token-elena.mjs** — Créé pour tenter de refresh le token automatiquement
3. **Diagnostic token expiré** — Le token Elena a expiré (était valide jusqu'au 17/12/2024 04:00 PST)

---

### 📁 Fichiers créés/modifiés :

- `app/scripts/post-single-elena.mjs` — Script pour poster une image unique sur Elena
- `app/scripts/refresh-token-elena.mjs` — Script de refresh automatique du token (60 jours)

---

### 🚧 En cours (non terminé) :

- **Post image Elena** — Bloqué par token expiré
  - Image à poster : `https://res.cloudinary.com/dily60mr0/image/upload/v1765967074/replicate-prediction-1202s2ejr5rma0cv533b9k1ctr_fzrons.png`
  - Caption préparée : "Cette lumière ✨ Parfois les meilleurs moments arrivent quand on s'y attend le moins"

---

### 📋 À faire prochaine session :

- [ ] **Renouveler token Elena** via Facebook Graph API Explorer
  1. Aller sur https://developers.facebook.com/tools/explorer/
  2. Sélectionner l'app
  3. Générer un Access Token avec permissions :
     - `pages_show_list`
     - `pages_read_engagement`
     - `instagram_basic`
     - `instagram_content_publish`
  4. Copier le token dans `.env.local` → `INSTAGRAM_ACCESS_TOKEN_ELENA`
  5. Lancer : `node scripts/get-permanent-token-elena.mjs`
- [ ] **Poster l'image Elena** avec `node scripts/post-single-elena.mjs`

---

### 🐛 Bugs découverts :

- **Token Elena expiré** — Le token long-lived (60 jours) a expiré. Le Page Token devrait être permanent mais celui stocké ne l'était pas.

---

### 💡 Idées notées :

- Ajouter un check automatique de l'expiration des tokens au démarrage des scripts
- Mettre en place un reminder/cron pour alerter avant expiration

---

### 📝 Notes importantes :

- **Token Mila** : Vérifier s'il est permanent ou s'il va aussi expirer
- **Page Token** : Quand on utilise `me/accounts` avec un long-lived user token, le page token retourné est censé être permanent (expires_at = 0). À vérifier lors du prochain refresh.

---

### 🔧 Scripts utiles :

```bash
# Vérifier status du token Elena
node scripts/refresh-token-elena.mjs

# Convertir un nouveau token en permanent
node scripts/get-permanent-token-elena.mjs

# Poster une image sur Elena
node scripts/post-single-elena.mjs
```

---

*Session courte - bloquée par expiration token*

