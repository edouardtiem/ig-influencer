# ✅ DONE-073 : DM Auto-Reactivation After 7 Days

**Date** : 19 janvier 2026  
**Version** : v2.59.0  
**Status** : ✅ Done

---

## 🎯 Objectif

Permettre aux contacts "stopped" d'être automatiquement réactivés après 7 jours de cooldown, donnant une seconde chance aux conversations qui avaient été arrêtées.

---

## 🔍 Problème identifié

**Symptôme** :
- Contacts marqués `is_stopped: true` ne recevaient plus jamais de réponses
- Même si la personne réécrivait après plusieurs jours/semaines
- Pas de mécanisme de "seconde chance"

**Besoin** :
- Système de cooldown temporaire plutôt que stop permanent
- Réactivation automatique après période raisonnable
- Fresh start (stage = cold) mais garder l'historique

---

## ✅ Solution implémentée

### Fonctions ajoutées

**Fichier** : `app/src/lib/elena-dm.ts`

#### 1. `reactivateContact(contactId: string)`
Réactive un contact stopped :
- `is_stopped = false`
- `stopped_at = null`
- `stage = 'cold'` (fresh start)
- `message_count` préservé (historique gardé)

#### 2. `shouldReactivateContact(contact: DMContact): boolean`
Vérifie si un contact doit être réactivé :
- Retourne `true` si `is_stopped = true` ET `stopped_at + 7 jours < maintenant`
- Retourne `false` sinon

### Logique dans `processDM()`

**Avant le check `is_stopped`** :
```typescript
if (contact.is_stopped) {
  if (shouldReactivateContact(contact)) {
    // Réactivation automatique
    await reactivateContact(contact.id);
    contact.is_stopped = false;
    contact.stage = 'cold';
    // Continue processing normally
  } else {
    // Still in cooldown period
    const daysSinceStopped = Math.round(...);
    return { response: '', ... }; // Skip response
  }
}
```

---

## 📊 Comportement

### Pendant les 7 jours de cooldown

**Jour 1-7** :
- Contact écrit → Log : `🛑 CONTACT IS STOPPED (@username). Day X/7 — Not responding.`
- `should_send: false` → Pas de réponse
- Message dans `modeReason` : `"Contact is stopped - Y days until reactivation"`

### Après 7 jours

**Jour 8+** :
- Contact écrit → Log : `🔄 REACTIVATING CONTACT (@username) — Stopped for 7+ days, giving another chance`
- Réactivation automatique
- Stage remis à `cold`
- Répond normalement comme un nouveau contact

---

## ⚠️ Limitations Instagram

**Important** : Instagram/ManyChat limite les messages proactifs à 24h après le dernier message de l'utilisateur.

**Conséquence** :
- ❌ Impossible d'envoyer un message de relance proactif après 7 jours
- ✅ La réactivation se fait uniquement quand **l'utilisateur nous réécrit**

**Donc** : Pas besoin de cron job — la réactivation se fait automatiquement au moment où la personne nous contacte.

---

## 📊 Impact

### Avant
- ❌ Contacts stopped = arrêt permanent
- ❌ Pas de seconde chance
- ❌ Conversations perdues définitivement

### Après
- ✅ Cooldown de 7 jours (évite spam immédiat)
- ✅ Réactivation automatique après période raisonnable
- ✅ Fresh start (stage = cold) mais historique préservé
- ✅ Seconde chance pour les conversations

---

## 🧪 Tests

### Scénarios testés

1. **Contact stopped depuis 3 jours** → Écrit → Pas de réponse ✅
2. **Contact stopped depuis 8 jours** → Écrit → Réactivation + réponse ✅
3. **Stage reset** → Vérifier que stage = 'cold' après réactivation ✅
4. **Historique préservé** → Vérifier que message_count reste ✅

---

## 📁 Fichiers modifiés

- ✅ `app/src/lib/elena-dm.ts` — Ajout `reactivateContact()` et `shouldReactivateContact()`, modification `processDM()`

---

## 🔗 Références

- [Session Documentation](../docs/sessions/2026-01-19-dm-complete-fix-session.md)
- [DONE-072 ManyChat Conditional Fix](./DONE-072-dm-manychat-conditional-fix.md)

---

## 💡 Améliorations futures possibles

1. **Cooldown variable selon stage** :
   - Cold/Warm : 7 jours
   - Hot/Pitched : 14 jours (plus de pression = plus long cooldown)

2. **Message de bienvenue après réactivation** :
   - "Hey, ça fait longtemps 🖤" (mais seulement si < 24h depuis leur message)

---

**Commit** : `eb46083`  
**Status** : ✅ Déployé, actif, monitoring en cours
