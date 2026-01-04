# 🔒 DM Race Condition Fix — Audit & Lock Implementation

**Date** : 07 janvier 2025  
**Durée** : ~1h30

---

## ✅ Ce qui a été fait cette session :

1. **📊 Audit complet des DMs** — Analyse de toutes les conversations depuis le dernier commit (2026-01-04)
   - 87 contacts analysés avec activité récente
   - 0 vrais doublons détectés dans la base de données
   - Mais problème identifié : **race condition** côté webhook

2. **🔍 Identification du problème** — Screenshot Instagram montrait clairement **3 messages identiques** pour @JonnieLevine383
   - "merci tu me fais rougir 😊 t'es trop mignon" envoyé 3 fois
   - Base de données ne montrait qu'**1 message** → problème côté ManyChat/webhook
   - **Cause** : ManyChat envoie plusieurs webhooks simultanés (retries automatiques)
   - Tous arrivent presque en même temps → déduplication DB ne fonctionne pas (messages pas encore sauvegardés)

3. **🔒 Fix Race Condition** — Implémentation d'un **lock en mémoire** dans `route.ts`
   - Lock format : `Map<userId:messageHash, timestamp>`
   - Premier webhook acquiert le lock → traite → répond
   - Webhooks suivants (même user + même message) → **bloqués immédiatement**
   - Lock auto-expire après 30s ou après traitement
   - Protection contre les retries ManyChat simultanés

4. **🛠️ Scripts d'audit créés** — 5 scripts pour analyser les DMs
   - `dm-audit.mjs` — Audit général depuis une date
   - `dm-audit-jonnie.mjs` — Historique complet d'un user spécifique
   - `dm-audit-final.mjs` — Recherche FINAL_MESSAGE duplicates
   - `dm-audit-all-duplicates.mjs` — Patterns de doublons complets
   - `dm-audit-deep.mjs` — Audit approfondi (vrais doublons + double responses)

---

## 📁 Fichiers créés/modifiés :

### Modifiés :
- `app/src/app/api/dm/webhook/route.ts` — Ajout système de lock en mémoire

### Créés :
- `app/scripts/dm-audit.mjs` — Audit général
- `app/scripts/dm-audit-jonnie.mjs` — Audit user spécifique
- `app/scripts/dm-audit-final.mjs` — Audit FINAL_MESSAGE
- `app/scripts/dm-audit-all-duplicates.mjs` — Patterns doublons
- `app/scripts/dm-audit-deep.mjs` — Audit approfondi

---

## 🚧 En cours (non terminé) :

- **Monitoring** — Vérifier que le fix fonctionne sur les prochains DMs

---

## 📋 À faire prochaine session :

- [ ] Surveiller les logs Vercel pour confirmer que les locks bloquent bien les doublons
- [ ] Si problème persiste, considérer un lock distribué (Redis) pour multi-instances Vercel

---

## 🐛 Bugs découverts :

- **BUG-013** : **Race Condition DM Duplicates** — ManyChat envoie plusieurs webhooks simultanés → même message envoyé 2-3 fois sur Instagram
  - **Sévérité** : 🔴 High
  - **Status** : ✅ Fixé (lock en mémoire)
  - **Solution** : Lock `Map<userId:messageHash, timestamp>` qui bloque les webhooks concurrents

---

## 💡 Idées notées :

- Si le lock en mémoire ne suffit pas (multi-instances Vercel), utiliser **Redis** pour un lock distribué
- Ajouter des **métriques** pour tracker les locks (combien bloqués vs traités)

---

## 📝 Notes importantes :

### Problème identifié :
```
ManyChat → 3 webhooks simultanés
         ↓
    Notre API (3 requêtes en parallèle)
         ↓
    Chaque requête vérifie DB → pas de doublon (car autres pas encore écrits !)
         ↓
    3 réponses générées → 3 messages identiques sur Instagram
```

### Solution implémentée :
```typescript
// Lock en mémoire
const processingLocks = new Map<string, number>();

// Premier webhook → acquiert lock → traite
// Webhooks suivants → lock existe → SKIP immédiatement
if (!tryAcquireLock(userId, messageHash)) {
  return { skip: true }; // Bloque les doublons
}
```

### Limitation :
- Lock fonctionne **par instance Vercel**
- Si webhooks arrivent sur **instances différentes**, le lock ne fonctionnera pas
- **Solution future** : Redis pour lock distribué si problème persiste

---

## 🔗 Liens :

- Commit : `9b9e2a0` — `fix(dm): add in-memory lock to prevent race condition duplicates`
- Issue : Race condition ManyChat webhooks simultanés

---

**Action** : ✅ ROADMAP.md mis à jour + DONE-059 créé

