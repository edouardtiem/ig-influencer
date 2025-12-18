# 🔐 Guide Définitif — Tokens Instagram Graph API

> **Objectif** : Obtenir un token PERMANENT pour poster sur Instagram via Graph API.  
> **Temps estimé** : 5-10 minutes (refresh) | 30 minutes (nouveau compte)

---

## 📑 Table des matières

1. [TL;DR — Refresh token existant](#-tldr--commandes-rapides)
2. [Créer un token pour un NOUVEAU compte](#-créer-un-token-pour-un-nouveau-compte)
3. [Guide complet refresh](#-guide-complet)
4. [Pièges courants](#️-pièges-courants)
5. [IDs de référence](#-ids-de-référence)

---

## 📋 TL;DR — Commandes Rapides

Si le token est expiré, voici les étapes :

```bash
# 1. Génère un User Token sur Graph API Explorer (voir Étape 1)

# 2. Lance cette commande avec ton nouveau User Token :
cd app && node scripts/get-permanent-token-elena.mjs

# 3. Vérifie que c'est permanent :
node scripts/check-token.mjs
```

---

## 🆕 Créer un Token pour un NOUVEAU Compte

### Prérequis

Avant de commencer, tu dois avoir :

1. ✅ Un **compte Instagram Business ou Creator** (pas un compte personnel)
2. ✅ Une **Page Facebook** liée à ce compte Instagram
3. ✅ L'app Facebook configurée (déjà fait : App ID `828334456494374`)

### Étape 1 : Créer le compte Instagram

1. Crée un nouveau compte Instagram
2. Va dans **Paramètres > Compte > Passer à un compte professionnel**
3. Choisis **Creator** ou **Business**
4. Complète le profil (bio, photo, etc.)

### Étape 2 : Créer une Page Facebook

1. Va sur https://www.facebook.com/pages/create
2. Crée une Page avec le **même nom** que le personnage
3. Complète les infos de base

### Étape 3 : Lier Instagram à la Page Facebook

1. Sur la Page Facebook, va dans **Paramètres > Instagram**
2. Clique **Connecter un compte**
3. Connecte-toi avec le compte Instagram créé
4. Confirme la liaison

### Étape 4 : Obtenir le Page ID

1. Va sur ta Page Facebook
2. L'URL ressemble à : `facebook.com/NomDeLaPage` ou `facebook.com/profile.php?id=XXXXXX`
3. Pour trouver l'ID numérique :
   - Va dans **Paramètres de la Page > Transparence de la Page**
   - Ou utilise : https://findmyfbid.in/

### Étape 5 : Générer le token

1. Va sur https://developers.facebook.com/tools/explorer/
2. Sélectionne l'app `828334456494374`
3. Clique **Generate Access Token**
4. **IMPORTANT** : Coche la nouvelle Page quand Facebook demande
5. Ajoute les permissions :
   - `pages_show_list`
   - `pages_read_engagement`
   - `instagram_basic`
   - `instagram_content_publish`

### Étape 6 : Convertir en token permanent

```bash
# Remplace les valeurs
USER_TOKEN="EAALxXa..."           # Token du Graph API Explorer
PAGE_ID="123456789"               # ID de la nouvelle Page
APP_ID="828334456494374"
APP_SECRET="XXXXXXX"              # Dans .env.local

# 1. Convertir en Long-Lived
LONG_LIVED=$(curl -s "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=$APP_ID&client_secret=$APP_SECRET&fb_exchange_token=$USER_TOKEN" | jq -r '.access_token')

# 2. Obtenir Page Token Permanent
PAGE_TOKEN=$(curl -s "https://graph.facebook.com/v21.0/$PAGE_ID?fields=access_token&access_token=$LONG_LIVED" | jq -r '.access_token')

# 3. Vérifier que c'est permanent
curl -s "https://graph.facebook.com/v21.0/debug_token?input_token=$PAGE_TOKEN&access_token=$APP_ID|$APP_SECRET" | jq '.data | {is_valid, expires_at}'
# expires_at: 0 = PERMANENT ✅

# 4. Récupérer l'Instagram Account ID
curl -s "https://graph.facebook.com/v21.0/$PAGE_ID?fields=instagram_business_account&access_token=$PAGE_TOKEN" | jq '.instagram_business_account.id'

echo "Page Token: $PAGE_TOKEN"
```

### Étape 7 : Ajouter dans .env.local

```bash
# Pour un nouveau personnage (ex: Sofia)
INSTAGRAM_ACCESS_TOKEN_SOFIA=EAALxXa...
FACEBOOK_PAGE_ID_SOFIA=123456789
INSTAGRAM_ACCOUNT_ID_SOFIA=17841...
```

### Étape 8 : Créer le script de post

Duplique `scripts/post-single-elena.mjs` et adapte les variables d'environnement.

---

## 🚨 Symptômes d'un Token Expiré

```
❌ Error validating access token: Session has expired on...
❌ Invalid OAuth access token
❌ (#190) Access token has expired
```

---

## 📖 Guide Complet

### Étape 1 : Générer un User Token

1. **Va sur** : https://developers.facebook.com/tools/explorer/
2. **Connecte-toi** avec ton compte Facebook
3. **Sélectionne ton App** (dropdown "Meta App")
4. **Clique "Generate Access Token"**
5. **IMPORTANT** — Quand Facebook demande les Pages, **COCHE TOUTES LES PAGES**

#### Permissions nécessaires :
- `pages_show_list`
- `pages_read_engagement`
- `instagram_basic`
- `instagram_content_publish`

---

### Étape 2 : Le Piège — `me/accounts` retourne `[]`

❌ **Problème fréquent** : Après avoir généré le token, tu fais :
```
GET me/accounts?fields=name,access_token,instagram_business_account{username}
```
Et tu obtiens :
```json
{ "data": [] }
```

✅ **Solution** : Accède directement à la Page par son **Page ID** :

```bash
# Pour Elena
curl "https://graph.facebook.com/v21.0/883026764900260?fields=name,access_token&access_token=TON_USER_TOKEN"

# Pour Mila
curl "https://graph.facebook.com/v21.0/941108822414254?fields=name,access_token&access_token=TON_USER_TOKEN"
```

Ça retourne le Page Token !

---

### Étape 3 : Convertir en Token PERMANENT

Le token obtenu à l'étape 2 expire dans ~1h. Pour le rendre permanent :

```bash
# 1. D'abord, convertir le User Token en Long-Lived (60 jours)
curl "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=USER_TOKEN"

# 2. Avec ce Long-Lived Token, récupérer le Page Token
curl "https://graph.facebook.com/v21.0/PAGE_ID?fields=access_token&access_token=LONG_LIVED_TOKEN"
```

**Le Page Token obtenu depuis un Long-Lived User Token est PERMANENT !**

---

### Étape 4 : Vérifier que c'est Permanent

```bash
curl "https://graph.facebook.com/v21.0/debug_token?input_token=PAGE_TOKEN&access_token=APP_ID|APP_SECRET"
```

✅ Si `expires_at: 0` → **PERMANENT** (n'expire jamais)  
⚠️ Si `expires_at: 1234567890` → Expire à cette date Unix

---

## 🛠️ Scripts Disponibles

| Script | Usage |
|--------|-------|
| `scripts/check-token.mjs` | Vérifie le token actuel (validité, expiration, compte lié) |
| `scripts/get-permanent-token-elena.mjs` | Convertit un User Token en Page Token permanent pour Elena |
| `scripts/refresh-token-elena.mjs` | Tente de refresh un token existant |

---

## 🔑 IDs de Référence

### Elena (@elenav.paris)
| Clé | Valeur |
|-----|--------|
| Facebook Page ID | `883026764900260` |
| Instagram Account ID | `17841478189581833` |
| Env Variable | `INSTAGRAM_ACCESS_TOKEN_ELENA` |

### Mila (@mila.verne)
| Clé | Valeur |
|-----|--------|
| Facebook Page ID | `941108822414254` |
| Instagram Account ID | (dans .env.local) |
| Env Variable | `INSTAGRAM_ACCESS_TOKEN` |

---

## ⚠️ Pièges Courants

### 1. Token User vs Token Page
- **User Token** : Lié à ton compte Facebook personnel
- **Page Token** : Lié à une Page Facebook → **C'est celui qu'il faut pour Instagram**

### 2. me/accounts vide
- Facebook bug : même après autorisation, `me/accounts` peut retourner `[]`
- **Solution** : Utiliser directement le Page ID (voir Étape 2)

### 3. Token "long-lived" ≠ permanent
- Long-lived = 60 jours
- Permanent = `expires_at: 0` (jamais)
- **Seul un Page Token obtenu depuis un Long-Lived User Token est permanent**

### 4. Oublier de sélectionner les Pages
- Quand Facebook demande "Quelles Pages autoriser ?", **coche-les toutes**
- Si tu cliques "Skip" ou ne sélectionnes rien, `me/accounts` sera vide

---

## 🔄 Workflow Complet (Copier-Coller)

```bash
# Variables (à remplacer)
USER_TOKEN="EAALxXa..."  # Token du Graph API Explorer
APP_ID="828334456494374"
APP_SECRET="92d4e3de..."  # Dans .env.local
PAGE_ID_ELENA="883026764900260"

# 1. Convertir en Long-Lived
LONG_LIVED=$(curl -s "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=$APP_ID&client_secret=$APP_SECRET&fb_exchange_token=$USER_TOKEN" | jq -r '.access_token')
echo "Long-lived: $LONG_LIVED"

# 2. Obtenir Page Token Permanent
PAGE_TOKEN=$(curl -s "https://graph.facebook.com/v21.0/$PAGE_ID_ELENA?fields=access_token&access_token=$LONG_LIVED" | jq -r '.access_token')
echo "Page Token: $PAGE_TOKEN"

# 3. Vérifier
curl -s "https://graph.facebook.com/v21.0/debug_token?input_token=$PAGE_TOKEN&access_token=$APP_ID|$APP_SECRET" | jq '.data | {is_valid, expires_at}'
# expires_at: 0 = PERMANENT ✅

# 4. Mettre à jour .env.local
echo "INSTAGRAM_ACCESS_TOKEN_ELENA=$PAGE_TOKEN"
```

---

## 📅 Maintenance

- **Tokens Page** : Permanents, pas de maintenance nécessaire
- **Tokens User** : Expirent en 60 jours si long-lived, 1h sinon
- **Vérification** : `node scripts/check-token.mjs` pour voir l'état actuel

---

## ✅ Checklists Rapides

### Checklist — Nouveau Compte

- [ ] Compte Instagram créé (Business/Creator)
- [ ] Page Facebook créée
- [ ] Instagram lié à la Page Facebook
- [ ] Page ID récupéré
- [ ] Token généré sur Graph API Explorer (avec Pages cochées)
- [ ] Token converti en permanent (`expires_at: 0`)
- [ ] Variables ajoutées dans `.env.local`
- [ ] Script de post créé/adapté
- [ ] Test post réussi

### Checklist — Refresh Token Expiré

- [ ] Générer User Token sur Graph API Explorer
- [ ] Cocher les Pages lors de l'autorisation
- [ ] Convertir en Long-Lived Token
- [ ] Récupérer Page Token via Page ID
- [ ] Vérifier `expires_at: 0`
- [ ] Mettre à jour `.env.local`
- [ ] Tester avec `node scripts/check-token.mjs`

---

## 🔗 Liens Utiles

| Ressource | URL |
|-----------|-----|
| Graph API Explorer | https://developers.facebook.com/tools/explorer/ |
| Créer une Page Facebook | https://www.facebook.com/pages/create |
| Token Debugger | https://developers.facebook.com/tools/debug/accesstoken/ |
| Find Facebook ID | https://findmyfbid.in/ |
| Instagram Graph API Docs | https://developers.facebook.com/docs/instagram-api |

---

*Dernière mise à jour : 18 décembre 2024*

