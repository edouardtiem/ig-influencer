# 📝 SESSION — 18 Décembre 2024

## Token Elena Fix + Guide Définitif

**Date** : 18 décembre 2024  
**Durée** : ~45min

---

### ✅ Ce qui a été fait cette session :

1. **Diagnostic token Elena expiré** — Token expirait le 17/12/2024
2. **Résolution des problèmes de permissions Pages** — `me/accounts` retournait `[]`
3. **Obtention d'un token PERMANENT** pour @elenav.paris (`expires_at: 0`)
4. **Post test réussi** sur @elenav.paris (Post ID: 18186203974350946)
5. **Documentation du process** pour éviter de perdre du temps à l'avenir

---

### 📁 Fichiers créés/modifiés :

- `app/scripts/check-token.mjs` — Script pour vérifier à quel compte un token est lié
- `docs/SESSION-18-DEC-2024-TOKEN-ELENA-FIX.md` — Cette session
- `docs/20-TOKEN-REFRESH-GUIDE.md` — **Guide définitif** pour refresh les tokens
- `.env.local` — Token Elena mis à jour (PERMANENT)

---

### 🚧 En cours (non terminé) :

- Aucun

---

### 📋 À faire prochaine session :

- [ ] Targeting Actif — 20 comments/jour sur niches cibles
- [ ] Intégration Supabase — historique posts + conversations
- [ ] Multi-shot Reels — carousel → video

---

### 🐛 Bugs découverts :

- **`me/accounts` retourne `[]`** même après avoir sélectionné les Pages dans la popup Facebook
  - **Cause** : Bug connu de Facebook — la sélection des Pages dans la popup ne suffit pas toujours
  - **Solution** : Accéder directement à la Page par son ID (voir guide)

---

### 💡 Idées notées :

- Créer un script de monitoring qui alerte X jours avant expiration d'un token
- Ajouter un health check au démarrage des scripts qui vérifie les tokens

---

### 📝 Notes importantes :

#### Problème récurrent : Token Graph API

On perd beaucoup de temps à chaque session sur les tokens. Voici les pièges :

1. **Token User vs Token Page** — Un User Token ne peut pas poster sur Instagram
2. **`me/accounts` vide** — Même après autorisation, peut retourner `[]`
3. **Token court vs long-lived vs permanent** :
   - Court : expire en 1h
   - Long-lived : expire en 60 jours
   - Permanent : `expires_at: 0` (n'expire jamais)

#### La solution définitive :

**Voir `docs/20-TOKEN-REFRESH-GUIDE.md`** pour le guide complet !

---

### 🔑 IDs importants (à garder) :

| Compte | Page ID | IG Account ID |
|--------|---------|---------------|
| Elena (@elenav.paris) | `883026764900260` | `17841478189581833` |
| Mila (@mila.verne) | `941108822414254` | (à vérifier) |

---

*Session réussie — Token Elena permanent obtenu !*

