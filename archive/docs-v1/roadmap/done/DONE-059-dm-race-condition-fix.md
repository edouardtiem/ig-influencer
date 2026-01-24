# DONE-059: 🔒 DM Race Condition Fix — Lock Implementation

**Date** : 07 janvier 2025  
**Version** : v2.44.0  
**Priorité** : 🔴 High

---

## 🎯 Objectif

Éliminer les **doublons de messages** causés par des webhooks ManyChat simultanés (race condition).

---

## 🐛 Problème

ManyChat envoie parfois **plusieurs webhooks simultanés** pour le même message (retries automatiques). Quand ces webhooks arrivent presque en même temps :

1. Tous vérifient la DB → **pas de doublon** (car les autres n'ont pas encore écrit)
2. Tous génèrent une réponse
3. Résultat : **2-3 messages identiques** envoyés sur Instagram

**Exemple réel** : @JonnieLevine383 a reçu **3 fois** "merci tu me fais rougir 😊 t'es trop mignon"

---

## ✅ Solution

**Lock en mémoire** dans `app/src/app/api/dm/webhook/route.ts` :

```typescript
// Lock format: "userId:messageHash" → timestamp
const processingLocks = new Map<string, number>();

// Premier webhook → acquiert lock → traite
// Webhooks suivants → lock existe → SKIP immédiatement
if (!tryAcquireLock(userId, messageHash)) {
  return { skip: true }; // Bloque les doublons
}
```

**Fonctionnement** :
- 🔒 Premier webhook acquiert le lock → traite → répond
- 🚫 Webhooks suivants (même user + même message) → **bloqués immédiatement**
- 🔓 Lock relâché après 30s ou après traitement
- 🧹 Nettoyage automatique des locks expirés

---

## 📊 Résultats

- ✅ **0 doublons** détectés dans la base de données (audit complet)
- ✅ Lock bloque les webhooks concurrents **avant** traitement
- ✅ Protection contre retries ManyChat simultanés

---

## 🛠️ Scripts d'audit créés

5 scripts pour analyser les DMs :
- `dm-audit.mjs` — Audit général depuis une date
- `dm-audit-jonnie.mjs` — Historique complet d'un user
- `dm-audit-final.mjs` — Recherche FINAL_MESSAGE duplicates
- `dm-audit-all-duplicates.mjs` — Patterns de doublons
- `dm-audit-deep.mjs` — Audit approfondi

---

## ⚠️ Limitation connue

- Lock fonctionne **par instance Vercel**
- Si webhooks arrivent sur **instances différentes**, le lock ne fonctionnera pas
- **Solution future** : Redis pour lock distribué si problème persiste

---

## 🔗 Liens

- Commit : `9b9e2a0`
- Session : [→](../../docs/sessions/2025-01-07-dm-race-condition-fix.md)
- Bug : BUG-013 (fixé)

