# 📊 IG DM Funnel — Progression & État Actuel

**Dernière mise à jour** : 18 janvier 2026  
**Status** : 🚧 En cours d'amélioration

---

## 🎯 Objectif

**Convertir les DMs Instagram en abonnés Fanvue payants** via un funnel conversationnel automatisé avec Elena (IA).

### Métriques cibles

| Métrique | Actuel | Objectif |
|----------|--------|----------|
| Taux de pitch (Cold → Pitched) | 27.5% | 50%+ |
| Messages avant pitch | 35 avg | 12 max |
| Conversion Pitched → Free | 0% | 10%+ |
| Conversion Free → Paid | 0% | 20%+ |
| Conversion globale (Cold → Paid) | 0% | 2-5% |

---

## ✅ Ce qui a été fait

### Phase 1 : Infrastructure de base (Décembre 2024)

- ✅ **DM Automation V1** — Intégration ManyChat + Claude AI
- ✅ **Lead Scoring** — Système de stages (Cold → Warm → Hot → Pitched)
- ✅ **Personnalité Elena** — Warm/flirty/curious (45/25/20/10)
- ✅ **Intent Detection** — Détection intentions (greeting, compliment, sexual, etc.)
- ✅ **Language Detection** — Support EN/FR/IT/ES/PT/DE

### Phase 2 : Optimisation Funnel (Janvier 2025)

- ✅ **Free Trial Link** — Lien 7 jours gratuit (a873adf0-4d08-4f84-aa48-a8861df6669f)
- ✅ **Close Lead Objective** — Prompt AI optimisé pour conversion
- ✅ **Response Validator** — Anti-hallucination avec régénération (max 3 tentatives)
- ✅ **Natural Exit Messages** — 6 variantes avec "je réponds sur Fanvue"
- ✅ **Anti-Loop & Spam Prevention** — Max 2 liens Fanvue/conversation
- ✅ **Race Condition Fix** — Lock en mémoire pour webhooks simultanés
- ✅ **Story Replies Support** — Ne jamais demander "which one?"

### Phase 3 : Tracking & Attribution (Janvier 2026)

- ✅ **Fanvue Webhook Integration** — Réception `follower.created` et `subscriber.created`
- ✅ **Fuzzy Matching** — Attribution automatique IG → Fanvue par username
- ✅ **Attribution Logic** — 3 niveaux : exact match → fuzzy match → timing match
- ✅ **Database Updates** — Marque contacts comme `converted` ou `paid`

---

## 📊 État actuel du Funnel

### Statistiques (925 contacts total)

| Stage | Contacts | % | Messages Moyens |
|-------|-----------|---|-----------------|
| Cold | 229 | 24.8% | 1.7 |
| Warm | 109 | 11.8% | 5.3 |
| Hot | 333 | 36.0% | 31.3 |
| Pitched | 254 | 27.5% | 35.2 |
| **Converted** | **0** | **0%** | - |
| **Paid** | **0** | **0%** | - |

### Taux de conversion

```
Cold → Warm:     75.2%
Warm → Hot:      84.3%
Hot → Pitched:   43.3%
Pitched → Converted: 0.0% ⚠️ PROBLÈME CRITIQUE
Converted → Paid:    0%
```

### Activité récente (7 jours)

- **174 nouveaux contacts**
- **54 pitched** (31% pitch rate)
- **315 contacts stopped** (34.1% du total)

---

## 🔴 Problèmes identifiés

### 1. **0% conversion Pitched → Converted** ⚠️ CRITIQUE

**Symptôme** : 254 personnes ont reçu le lien Fanvue, **aucune** n'a créé de compte trackable.

**Causes possibles** :
- Le tracking d'attribution ne fonctionne pas encore (webhook pas configuré côté Fanvue)
- Les users ne cliquent pas sur le lien
- Le lien free trial ne fonctionne pas comme prévu
- Timing : attribution par fuzzy matching pas assez précis

**Actions** :
- ✅ Webhook Fanvue implémenté
- ✅ Fuzzy matching implémenté
- ⏳ **À faire** : Configurer webhook dans Fanvue Developer Portal
- ⏳ **À faire** : Vérifier que le free trial link fonctionne

### 2. **Conversations trop longues sans pitch**

**Symptôme** : 5 contacts HOT avec **200+ messages** n'ont jamais reçu de pitch :
- @gillan5931 : 307 msgs (HOT, no pitch!)
- @doblemaltainsis : 291 msgs
- @john.s.heid : 235 msgs

**Cause** : Le système attend trop pour pitcher (message 35+)

**Action** : ⏳ Pitcher plus tôt (avant message 15)

### 3. **Exit messages répétitifs**

**Symptôme** : Mêmes messages de fin envoyés en boucle :
- "je vois qu'on accroche..." : 27 fois
- "mon manager m'appelle..." : 35 fois

**Cause** : Pas assez de variantes

**Action** : ✅ 6 variantes créées, mais peut être amélioré

### 4. **Pitch mal timing**

**Symptôme** : Pitch arrive souvent trop tôt (msg 10-18) ou trop tard (msg 100+)

**Action** : ⏳ Optimiser timing selon engagement

### 5. **Pas de tracking de clic**

**Symptôme** : Impossible de savoir si les users cliquent sur le lien

**Action** : ⏳ Implémenter UTM tracking ou utiliser Fanvue tracking links

### 6. **Conversations post-pitch = gaspillage**

**Symptôme** : En moyenne **34.8 messages** échangés APRÈS le pitch

**Action** : ⏳ Limiter à 5 messages max après pitch

---

## 🐛 Bugs restants

### BUG-016 : Attribution non fonctionnelle

**Description** : Le fuzzy matching est implémenté mais les conversions ne sont pas trackées car :
1. Webhook Fanvue pas configuré dans Developer Portal
2. Pas de test réel avec vraie conversion

**Priorité** : 🔴 High  
**Status** : ⏳ À tester après configuration webhook

### BUG-017 : Free trial link non vérifié

**Description** : Le lien `?free_trial=a873adf0-4d08-4f84-aa48-a8861df6669f` n'a pas été testé pour vérifier qu'il donne bien 7 jours gratuits.

**Priorité** : 🔴 High  
**Status** : ⏳ À tester manuellement

---

## 📋 À faire (Priorisé)

### 🔴 URGENT

- [ ] **Configurer webhook Fanvue** — Ajouter endpoint dans Fanvue Developer Portal
- [ ] **Tester free trial link** — Vérifier que le lien donne bien 7 jours gratuits
- [ ] **Pitcher plus tôt** — Réduire à 15 messages max avant pitch
- [ ] **Limiter messages post-pitch** — Max 5 messages après pitch puis stop

### 🟠 IMPORTANT

- [ ] **Améliorer wording du pitch** — Moins transactionnel, plus émotionnel
- [ ] **Varier exit messages** — Créer 15+ variations au lieu de 6
- [ ] **Détecter time-wasters** — Bloquer users qui chattent 50+ msgs sans cliquer
- [ ] **Dashboard KPI** — Afficher taux de conversion en temps réel

### 🟡 NICE TO HAVE

- [ ] **A/B testing pitch messages** — Tester différentes formulations
- [ ] **Relance automatique** — Relancer contacts HOT sans pitch après 24h
- [ ] **Analytics détaillées** — Graphiques conversion par stage
- [ ] **Export données** — CSV pour analyse externe

---

## 📈 Progrès sur les objectifs

| Objectif | Progrès | Status |
|----------|---------|--------|
| Infrastructure DM | ✅ 100% | Terminé |
| Optimisation Funnel | ✅ 80% | En cours |
| Tracking Conversions | ✅ 50% | Webhook implémenté, config à faire |
| Attribution Automatique | ✅ 70% | Fuzzy matching fait, tests à faire |
| Conversion Rate | ❌ 0% | **BLOQUANT** |

---

## 💡 Idées d'amélioration

### 1. **Pitch plus naturel et émotionnel**

**Actuel** :
```
"j'ai créé un lien gratuit pour toi 🖤 https://..."
```

**Proposition** :
```
"tu veux voir ce que je cache? 👀 
y'a des trucs que je peux pas montrer ici...
c'est gratuit de me suivre, même pas besoin de CB 🖤"
```

### 2. **Simplifier objection "c'est quoi Fanvue"**

Ajouter réponse automatique :
```
"c'est comme insta mais sans censure 😏 
tu me suis gratuitement et tu vois tout ce que je peux pas poster ici
pas besoin de carte bancaire pour t'abonner 🖤"
```

### 3. **UTM Tracking**

Ajouter `?utm_source=ig_dm&utm_campaign={username}` au lien pour tracking précis.

### 4. **Détection time-wasters**

Users qui chattent 50+ messages sans jamais cliquer = bloquer après pitch.

---

## 📝 Notes techniques

### Architecture actuelle

```
ManyChat (DM) → Webhook → /api/dm/webhook → Claude AI
                                              ↓
                                         Supabase
                                         - elena_dm_contacts
                                         - elena_dm_messages
                                              ↓
                                         Fanvue Webhook
                                         - new.follower
                                         - new.subscriber
                                              ↓
                                         Attribution (fuzzy match)
                                         - IG username → Fanvue handle
```

### Fichiers clés

- `app/src/lib/elena-dm.ts` — Logique principale DM automation
- `app/src/lib/fanvue-attribution.ts` — Fuzzy matching & attribution
- `app/src/app/api/fanvue/webhook/route.ts` — Webhook Fanvue
- `app/src/app/api/dm/webhook/route.ts` — Webhook ManyChat

### Scripts d'audit

- `app/scripts/dm-funnel-stats.mjs` — Statistiques funnel
- `app/scripts/audit-dm-conversations.mjs` — Audit conversations

---

## 🔗 Liens utiles

- [Documentation DM Automation V2](./docs/27-DM-AUTOMATION-V2.md)
- [Stratégie IG + Fanvue + BMAC](./docs/26-IG-FANVUE-BMAC-STRATEGY.md)
- [Session Audit DM](./docs/sessions/2026-01-18-dm-funnel-audit.md)

---

**Prochaine session** : Configurer webhook Fanvue + Tester attribution + Optimiser timing pitch
