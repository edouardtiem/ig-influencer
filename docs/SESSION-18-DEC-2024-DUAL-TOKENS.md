# 📝 SESSION — 18 Décembre 2024 — Dual Tokens Fix + Duo Post

**Date** : 18 décembre 2024
**Durée** : ~1h

---

## ✅ Ce qui a été fait cette session :

1. **Fix Token Graph API** — Créé `refresh-all-tokens.mjs` pour rafraîchir les deux tokens (Mila + Elena) en même temps
2. **Duo Post NYC Jacuzzi** — Généré et posté une photo Mila x Elena sur rooftop NYC
3. **Documentation Tokens** — Mis à jour la doc pour éviter les problèmes futurs

---

## 📁 Fichiers créés/modifiés :

| Fichier | Action |
|---------|--------|
| `scripts/refresh-all-tokens.mjs` | 🆕 Créé — Refresh les deux tokens en une session |
| `scripts/duo-nyc-jacuzzi.mjs` | 🆕 Créé — Génère et poste des photos duo |
| `scripts/post-duo-now.mjs` | 🆕 Créé — Poste une image existante |
| `docs/20-TOKEN-REFRESH-GUIDE.md` | ✏️ À mettre à jour |
| `docs/SESSION-18-DEC-2024-DUAL-TOKENS.md` | 🆕 Créé |

---

## 🔐 Le Problème des Tokens (IMPORTANT)

### Symptôme
Quand on génère un nouveau token pour Mila, celui d'Elena devient invalide (et vice-versa).

### Cause
Une seule app Facebook ("Mila") gère les deux comptes Instagram. Quand on génère un **nouveau User Token** dans Graph API Explorer, ça **invalide l'ancienne session**. Les Page Tokens dérivés de l'ancienne session deviennent invalides.

### Solution
Générer les **DEUX Page Tokens en même temps**, à partir du **même User Token** :

```bash
# 1. Génère UN User Token sur Graph API Explorer
#    ⚠️ COCHE LES DEUX PAGES (Mila Verne ET Elena Visconti)

# 2. Lance le script avec ce token
cd app && node scripts/refresh-all-tokens.mjs "USER_TOKEN_ICI"
```

Le script fait :
1. Convertit le User Token en Long-Lived Token (60 jours)
2. Récupère le Page Token de Mila (PERMANENT)
3. Récupère le Page Token d'Elena (PERMANENT)
4. Met à jour `.env.local` avec les deux

### Pourquoi ça marche ?
Les deux Page Tokens sont dérivés de la **même session** (même User Token), donc ils restent valides ensemble.

---

## 🔧 Workflow Token — À suivre TOUJOURS

### Quand un token expire :

1. **Va sur** : https://developers.facebook.com/tools/explorer/
2. **App** : `828334456494374` (Mila)
3. **Permissions** : `pages_show_list`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`
4. **Clique "Generate Access Token"**
5. **⚠️ COCHE LES DEUX PAGES** : Mila Verne ET Elena Visconti
6. **Copie le User Token**
7. **Lance** :
   ```bash
   cd app && node scripts/refresh-all-tokens.mjs "USER_TOKEN"
   ```

### Ne JAMAIS faire :
- ❌ Générer un token pour Mila seule
- ❌ Générer un token pour Elena seule
- ❌ Utiliser `get-permanent-token.mjs` ou `get-permanent-token-elena.mjs` séparément

### Toujours faire :
- ✅ Utiliser `refresh-all-tokens.mjs` qui fait les deux en même temps

---

## 🖼️ Duo Post NYC

**Image générée** : https://res.cloudinary.com/dily60mr0/image/upload/v1766054885/mila-duo/ubndjs4itjqce5v1nt3c.jpg

**Prompt utilisé** (de SESSION-17-DEC-2024-ELENA-GRAPH-API.md) :
```
Ultra realistic Instagram photo, two young women best friends relaxing in a rooftop jacuzzi in New York City...
```

**Posté sur** : @mila.verne
**Post ID** : 17869903947416976

---

## 🚧 En cours (non terminé) :

- Discussion sur la cohérence des photos de référence (visages)

---

## 📋 À faire prochaine session :

- [ ] Améliorer la cohérence des visages (références photos)
- [ ] Tester le duo post sur Elena aussi
- [ ] Vérifier que les GitHub Actions fonctionnent avec les nouveaux tokens

---

## 🐛 Bugs découverts :

- **Tokens qui s'invalident mutuellement** — Résolu avec `refresh-all-tokens.mjs`

---

## 💡 Idées notées :

- Ajouter plus de photos de référence pour améliorer la cohérence des visages
- Peut-être utiliser un modèle différent pour les visages (LoRA custom?)

---

## 📝 Notes importantes :

### Architecture des Tokens

```
App Facebook "Mila" (ID: 828334456494374)
    │
    ├── Page "Mila Verne" (ID: 941108822414254)
    │   └── Instagram: @mila.verne (ID: 17841479182450006)
    │   └── Token: INSTAGRAM_ACCESS_TOKEN
    │
    └── Page "Elena Visconti" (ID: 883026764900260)
        └── Instagram: @elenav.paris (ID: 17841478189581833)
        └── Token: INSTAGRAM_ACCESS_TOKEN_ELENA
```

### Comment fonctionne l'invalidation

```
Session 1 (User Token A)
    │
    ├── Page Token Mila (dérivé de A) ✅
    └── Page Token Elena (dérivé de A) ✅

Session 2 (User Token B) — Nouvelle session !
    │
    ├── Page Token Mila (dérivé de B) ✅
    └── Page Token Elena (dérivé de B) ✅
    
    ⚠️ Les tokens de Session 1 sont maintenant INVALIDES
```

C'est pourquoi il faut TOUJOURS refresh les deux tokens ensemble.

---

*Session réussie — Tokens permanents configurés pour les deux comptes ! 🎉*

