# 🔧 Fanvue Refresh Token Fix Guide

**Date** : 3 janvier 2026  
**Problème** : Refresh token invalide dans GitHub Secrets

---

## 🐛 Problème

Le workflow GitHub Actions échoue avec :
```
invalid_grant: The refresh token was already used.
```

**Cause** : Le refresh token dans les secrets GitHub a été utilisé et ne peut plus être réutilisé. Quand on utilise un refresh token OAuth, il génère un nouveau refresh token, mais les secrets GitHub ne sont pas mis à jour automatiquement.

---

## ✅ Solution : Obtenir un nouveau refresh token

### Étape 1 : Obtenir de nouveaux tokens via OAuth

1. **Visite l'URL d'autorisation** :
   ```
   https://ig-influencer.vercel.app/api/oauth/auth
   ```

2. **Autorise Fanvue** :
   - Connecte-toi avec ton compte Fanvue
   - Autorise l'application
   - Tu seras redirigé vers une page avec les tokens

3. **Copie les nouveaux tokens** :
   - `FANVUE_ACCESS_TOKEN`
   - `FANVUE_REFRESH_TOKEN`

### Étape 2 : Mettre à jour GitHub Secrets

1. **Va sur GitHub** → Repository → Settings → Secrets and variables → Actions

2. **Mets à jour les secrets** :
   - `FANVUE_ACCESS_TOKEN` → Nouveau access token
   - `FANVUE_REFRESH_TOKEN` → Nouveau refresh token

3. **Sauvegarde**

### Étape 3 : Tester le workflow

1. **Va sur Actions** → "Elena Daily Fanvue Post"
2. **Clique "Run workflow"** → "Run workflow"
3. **Vérifie que ça fonctionne**

---

## 🔄 Prévention future

Le script a été amélioré pour :
- ✅ Détecter les erreurs d'authentification (401) avant de refresh
- ✅ Gérer spécifiquement l'erreur "invalid_grant"
- ✅ Afficher des instructions claires si le refresh token est invalide
- ✅ Afficher le nouveau refresh token après un refresh réussi (pour mise à jour manuelle)

**Note** : Après chaque refresh réussi, le script affichera le nouveau refresh token dans les logs. Tu devras le copier et mettre à jour les secrets GitHub manuellement.

---

## 📝 Notes importantes

- **Les refresh tokens sont à usage unique** : Chaque fois qu'on utilise un refresh token, Fanvue génère un nouveau refresh token et invalide l'ancien
- **GitHub Secrets ne se mettent pas à jour automatiquement** : Il faut les mettre à jour manuellement après chaque refresh
- **Solution idéale** : Utiliser un système de stockage persistant (Supabase) pour les tokens au lieu de GitHub Secrets, mais c'est une amélioration future

---

## 🚀 Alternative : Script de refresh automatique

Pour éviter ce problème à l'avenir, on pourrait créer un script qui :
1. Refresh le token automatiquement
2. Met à jour les secrets GitHub via l'API GitHub
3. S'exécute avant chaque run du workflow

Mais pour l'instant, la solution manuelle fonctionne bien.

