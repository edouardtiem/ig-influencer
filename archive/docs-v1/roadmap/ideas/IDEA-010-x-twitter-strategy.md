# IDEA-010 — Stratégie X (Twitter) pour Influenceuse AI

> Automatisation complète d'un compte X dédié avec posts automatisés, réponses commentaires, funnel DM Fanvue

**Status** : 💡 Idea  
**Impact** : 🔴 High  
**Effort** : 🔴 High  
**Proposé** : 28 décembre 2024

---

## 💡 Concept

Créer et automatiser un compte X (Twitter) dédié à l'influenceuse AI (Elena/Mila) pour :
- Diversifier les canaux de monétisation (complément Instagram)
- Profiter de la tolérance X pour contenu sexy/adulte
- Automatiser posts + réponses commentaires + funnel DM vers Fanvue
- Découverte via likes manuels sur commentaires comptes similaires

---

## 🎯 Problème résolu

- **Dépendance unique Instagram** : risque de ban, limitations contenu
- **Besoin de diversification** : X offre plus de liberté pour contenu suggestif
- **Monétisation** : nouveau canal pour pousser Fanvue avec moins de restrictions
- **Croissance** : stratégie de découverte via engagement manuel ciblé

---

## 📊 Impact potentiel

- **Revenus** : Nouveau canal de conversion Fanvue (objectif +200-500€/mois)
- **Audience** : Croissance parallèle indépendante d'Instagram
- **Résilience** : Réduction dépendance à un seul réseau social
- **Engagement** : X permet interactions plus directes (DM, commentaires)

---

## 🔧 Implémentation envisagée

### Phase 1 : Set-up compte (1-2h)
- Créer compte X avec pseudo cohérent Instagram
- Configurer bio + lien Fanvue (direct ou link-hub)
- Upload bannière + photo profil (style Instagram)
- Créer pinned tweet expliquant AI girl + lien Fanvue

### Phase 2 : Automatisation posts (3-4h)
- Intégrer X API dans l'app existante
- Script `x-post.mjs` similaire à `instagram-post.mjs`
- Utiliser API `create post` + upload media
- Captions GFE/fantasme + hashtags ciblés
- Fréquence : 3-5 posts/jour (à ajuster selon engagement)

### Phase 3 : Réponses commentaires auto (2-3h)
- Webhook X API pour détecter nouveaux commentaires sous tes posts
- Système de réponses variées (éviter répétition)
- Messages courts type : "Merci 🖤 si tu veux qu'on parle en privé, écris‑moi en DM."
- Limité uniquement à tes propres posts (conformité X)

### Phase 4 : Funnel DM automatisé (4-5h)
- Détecter premier message utilisateur (opt-in implicite)
- Séquence DM automatique :
  1. Message GFE pour chauffer
  2. Proposition contenu privé Fanvue + lien
- Système "STOP" pour désinscription
- Intégration avec ManyChat (si compatible) ou système custom

### Phase 5 : Workflow manuel découverte (ongoing)
- Processus manuel quotidien : liker commentaires comptes similaires
- Cibler : AI girls, modèles, créatrices sexy
- Objectif : 20-30 likes/jour pour générer visites profil

**Stack technique :**
- X API v2 (OAuth 2.0)
- Scripts Node.js similaires à Instagram automation
- Supabase pour tracking messages/conversions
- ManyChat ou système custom pour DM automation

---

## ⚠️ Risques / Contraintes

### Risques techniques :
- **Rate limits X API** : respecter limites (300 posts/jour, 1000 DM/jour)
- **Spam detection** : variété messages essentielle, volume raisonnable
- **Token management** : OAuth 2.0 refresh tokens (similaire Instagram)

### Risques conformité :
- **Règles X Automation** : respecter guidelines (pas de DM froids, pas de spam)
- **Content moderation** : X peut suspendre si contenu trop explicite (moins strict qu'Instagram mais limites existent)
- **DM automation** : uniquement après action explicite utilisateur

### Contraintes :
- **Effort initial** : ~10-15h développement (set-up + automation)
- **Maintenance** : monitoring quotidien engagement + ajustements captions
- **Temps manuel** : 15-20min/jour pour likes commentaires comptes similaires

---

## 📝 Notes

### Avantages X vs Instagram :
- ✅ Plus de liberté contenu sexy/adulte
- ✅ Bio peut mentionner Fanvue directement
- ✅ Posts peuvent teaser contenu privé plus ouvertement
- ✅ DM automation plus tolérée si conforme

### Stratégie découverte :
- **Manuel uniquement** : likes commentaires comptes similaires
- **Pas d'automation** : éviter spam flag, rester humain
- **Ciblage** : commentaires déjà faits par ta cible (mecs intéressés par AI girls)

### Funnel conversion :
1. Découverte → posts + likes commentaires
2. Engagement → commentaires sous tes tweets
3. Invitation → auto-reply commentaire → "écris-moi en DM"
4. Conversion → séquence DM auto → lien Fanvue

### A/B Testing potentiel :
- Types de captions selon heures posting
- Templates réponses commentaires (variété)
- Séquences DM (court vs long, direct vs progressif)

---

## 🔗 Références

- [Adult Affiliate Marketing on Twitter — The Real Guide for 2025](https://noumenalmarketing.stck.me/post/965901/Adult-Affiliate-Marketing-on-Twitter-The-Real-Guide-for-2025)
- [X Developer Portal](https://developer.x.com/en)
- [X API — Create Post](https://docs.x.com/x-api/posts/create-post)
- [X Automation Rules](https://help.x.com/en/rules-and-policies/x-automation)
- [X API — Direct Messages](https://docs.x.com/x-api/direct-messages/manage/integrate)
- [Ultimate Guide to X Twitter DM Automation](https://www.geelark.com/blog/the-ultimate-guide-to-x-twitter-dm-automation/)
- [Is Automated DM Safe? What You Must Know in 2025](https://xautodm.com/blog/is-automated-dm-safe-what-you-must-know-in-2025)
- [Twitter X Automation Complete Guide](https://socialrails.com/blog/twitter-x-automation-complete-guide)
- [Fanvue Community Guidelines](https://legal.fanvue.com/community-guidelines)

---

## 📋 Checklist implémentation

- [ ] Créer compte X avec pseudo cohérent
- [ ] Configurer bio + lien Fanvue + bannière + photo profil
- [ ] Créer pinned tweet AI girl + Fanvue
- [ ] Intégrer X API OAuth 2.0 dans l'app
- [ ] Développer script `x-post.mjs` (create post + upload media)
- [ ] Configurer webhook commentaires (réponses auto)
- [ ] Développer système réponses variées commentaires
- [ ] Implémenter détection premier message DM
- [ ] Créer séquence DM automatique (GFE → Fanvue)
- [ ] Ajouter système "STOP" désinscription
- [ ] Tester workflow complet (post → commentaire → DM → conversion)
- [ ] Documenter processus manuel (likes commentaires)
- [ ] Monitoring engagement + ajustements

---

**Lien session** : [→](../../docs/sessions/2024-12-28-x-twitter-strategy.md)

