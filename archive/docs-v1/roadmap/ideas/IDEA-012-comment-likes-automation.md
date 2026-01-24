# IDEA-012: Automatisation Likes Commentaires

**Date** : 09/01/2026  
**Priorité** : 🟡 Medium  
**Impact** : 🟡 Medium  
**Effort** : 🟡 Medium  
**Status** : 💡 Idea

---

## 📋 Description

Automatiser les likes de commentaires sur des posts similaires aux nôtres pour croissance organique et engagement.

**Workflow** :
1. Rechercher posts par hashtags cibles
2. Filtrer commentaires avec 0 likes
3. Liker les commentaires 1 par 1 avec délais aléatoires
4. Limite : 80 likes/jour (configurable)

---

## 🔍 Recherche & Analyse

### Approche Technique

**Option 1 : Script Custom (Recommandé)**
- Utilise `instagram-private-api` (déjà installé)
- Coût : 0$ (vs 830$/an Phantombuster)
- Flexibilité totale
- Risque : Détection Instagram possible

**Option 2 : Phantombuster**
- Plan Starter : 69$/mois (56$/mois annuel)
- 20h d'exécution/mois
- Gestion automatique 2FA et rate limits
- Moins flexible

### Risques & Limitations

- **Détection Instagram** : Peut limiter/bloquer temporairement (24-48h cooldown)
- **Rate Limits** : ~80-100 likes/jour pour compte "jeune"
- **2FA** : Nécessite gestion code Authenticator (première connexion)
- **Session** : Nécessite username/password (pas token Graph API)

### Stratégie Recommandée

- Délais aléatoires : 30-120 secondes entre chaque like
- Maximum : 60-80 likes/jour pour rester safe
- Varier les hashtags cibles
- Fenêtres horaires humaines (pas 24/7)
- Commencer doucement (20-30/jour) puis augmenter progressivement

---

## 📝 Détails Techniques

### Données Nécessaires

- **Compte** : Elena (@elenav.paris)
- **Credentials** : Username + password (à ajouter dans `.env.local`)
- **2FA** : À vérifier (code Authenticator nécessaire pour première connexion)
- **Hashtags** : À définir (ex: `#parisianlifestyle`, `#luxuryfashion`, etc.)

### Architecture Proposée

```
scripts/
└── comment-liker-elena.mjs
    ├── Recherche posts par hashtags
    ├── Fetch commentaires (0 likes)
    ├── Like avec délais aléatoires
    ├── Tracking Supabase (likes/jour)
    └── Limite quotidienne (80 likes)
```

### Intégration

- **Cron/GitHub Actions** : Automatisation sans connexion manuelle
- **Supabase** : Table `comment_likes_daily` pour tracking
- **Kill Switch** : Flag pour stopper si détection

---

## ✅ Prérequis

- [ ] Vérifier si compte Elena a 2FA activé
- [ ] Définir liste hashtags cibles
- [ ] Ajouter credentials dans `.env.local`
- [ ] Créer table Supabase pour tracking
- [ ] Tester avec 10-20 likes d'abord

---

## 📊 ROI Estimé

**Coût Phantombuster** : 69$/mois = 830$/an  
**Coût Script Custom** : 0$ (déjà infrastructure en place)

**Gain** : Engagement organique + visibilité sur posts similaires

---

## 🔗 Références

- Discussion : 09/01/2026
- Package installé : `instagram-private-api`
- Template session : `roadmap/_templates/SESSION-END-TEMPLATE.md`

---

## 📅 Timeline

**À faire plus tard** (pas prioritaire maintenant)
