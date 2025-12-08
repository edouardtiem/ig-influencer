# PRD — Influenceuse IA Automatisée sur Instagram

## 📋 Vue d'ensemble

**Projet** : Automatisation de la création et publication de contenu d'une influenceuse virtuelle sur Instagram.

**Objectif** : Générer automatiquement des visuels d'une influenceuse IA et les publier 2-3 fois par jour sur Instagram, sans intervention manuelle.

---

## 🎯 Objectifs du produit

| Objectif | Métrique de succès |
|----------|-------------------|
| Automatisation complète | 0 intervention manuelle quotidienne |
| Fréquence de publication | 2-3 posts/jour |
| Cohérence visuelle | Même personnage reconnaissable |
| Coût maîtrisé | < 20$/mois |

---

## 🏗 Architecture technique

```
┌──────────────┐     ┌─────────────────────┐     ┌─────────────┐     ┌──────────┐
│ cron-job.org │────▶│  /api/auto-post     │────▶│ Nanobanana  │────▶│  Buffer  │
│  (3x/jour)   │     │  (Vercel)           │     │  Pro API    │     │   API    │
└──────────────┘     └─────────────────────┘     └─────────────┘     └──────────┘
       │                      │                        │                   │
       │                      │                        │                   │
   Déclencheur           Orchestrateur            Génération          Publication
   (gratuit)             (Next.js)                d'images            Instagram
```

### Stack technique

| Composant | Technologie | Rôle |
|-----------|-------------|------|
| Scheduler | cron-job.org | Déclenche le workflow 2-3x/jour |
| Backend | Next.js API Routes (Vercel) | Orchestre le flux |
| Génération images | Nanobanana Pro API | Crée les visuels de l'influenceuse |
| Publication | Buffer API | Publie sur Instagram |
| Hébergement | Vercel | Gratuit (plan Hobby) |

---

## 🔧 Composants détaillés

### 1. Endpoint `/api/auto-post`

**Responsabilités :**
- Recevoir l'appel de cron-job.org
- Appeler l'API Nanobanana pour générer une image
- Générer une caption appropriée
- Envoyer l'image + caption à Buffer pour publication
- Logger le résultat

**Sécurité :**
- Authentification via header secret (CRON_SECRET)
- Rate limiting implicite (via cron-job.org)

### 2. Génération d'images (Nanobanana Pro)

**Configuration du personnage :**
- Définir un "character ID" ou prompt cohérent
- Variations : poses, tenues, décors
- Résolution : optimisée pour Instagram (1080x1350 ou 1080x1080)

**Paramètres à stocker :**
- Style du personnage
- Palette de couleurs préférée
- Types de décors autorisés

### 3. Publication (Buffer)

**Fonctionnalités utilisées :**
- Upload d'image via API
- Programmation immédiate ou différée
- Récupération du statut de publication

---

## 💰 Coûts mensuels estimés

| Service | Plan | Coût/mois |
|---------|------|-----------|
| Nanobanana Pro | Basic (160 crédits) | 7,99$ |
| Buffer | Essentials | 6,00$ |
| Vercel | Hobby | Gratuit |
| cron-job.org | Free (3 jobs) | Gratuit |
| **Total** | | **~14$/mois** |

---

## 📅 Planning de publication

| Slot | Heure (Paris) | Raison |
|------|---------------|--------|
| Post 1 | 08:00 | Audience matinale |
| Post 2 | 12:30 | Pause déjeuner |
| Post 3 | 19:00 | Après le travail |

*Horaires ajustables selon analytics Instagram*

---

## 🔐 Variables d'environnement requises

```env
# Nanobanana Pro
NANOBANANA_API_KEY=xxx

# Buffer
BUFFER_ACCESS_TOKEN=xxx
BUFFER_PROFILE_ID=xxx

# Sécurité
CRON_SECRET=xxx
```

---

## ✅ Checklist de mise en place

### Phase 1 : Configuration des comptes
- [ ] Créer compte Instagram Creator/Business
- [ ] Créer compte Buffer (Essentials) et connecter Instagram
- [ ] Créer compte Nanobanana Pro (Basic)
- [ ] Récupérer les clés API

### Phase 2 : Développement
- [ ] Initialiser projet Next.js
- [ ] Créer endpoint `/api/auto-post`
- [ ] Intégrer API Nanobanana
- [ ] Intégrer API Buffer
- [ ] Tests en local

### Phase 3 : Déploiement
- [ ] Déployer sur Vercel
- [ ] Configurer variables d'environnement
- [ ] Créer les 3 cron jobs sur cron-job.org
- [ ] Test end-to-end

### Phase 4 : Monitoring
- [ ] Vérifier les logs Vercel
- [ ] Suivre les publications sur Instagram
- [ ] Ajuster horaires si nécessaire

---

## ⚠️ Risques et mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| API Nanobanana down | Pas de post | Retry logic + alerting |
| API Buffer down | Pas de publication | Retry logic + alerting |
| Quota Nanobanana épuisé | Pas d'image | Monitoring des crédits restants |
| Détection spam Instagram | Shadowban | Varier captions, horaires aléatoires |
| Incohérence visuelle | Perte followers | Affiner prompts Nanobanana |

---

## 🚀 Évolutions futures (V2)

- [ ] Stories automatiques
- [ ] Réponses aux commentaires (IA)
- [ ] Multi-comptes
- [ ] Dashboard de suivi
- [ ] Génération de captions via LLM (GPT/Claude)
- [ ] A/B testing des horaires
- [ ] Migration vers API Meta (économie Buffer)

---

## 📚 Ressources

- [Documentation Buffer API](https://buffer.com/developers/api)
- [Nanobanana Pro](https://nanobanana.info)
- [cron-job.org](https://cron-job.org)
- [Vercel Docs](https://vercel.com/docs)

---

*Dernière mise à jour : 2 décembre 2024*

