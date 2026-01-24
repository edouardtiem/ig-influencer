# 🔧 DM Automation Bug Fixes — 9 Janvier 2026

**Date** : 9 janvier 2026  
**Statut** : ✅ Fixed

---

## 🐛 Bugs Identifiés

### Bug 1: Fanvue Link Spam Infini

**Symptôme** : Après avoir atteint la limite de messages, le système envoyait l'exit message avec le lien Fanvue **à chaque nouveau message reçu**, sans fin.

**Exemple** : @raffaelemarcotti a reçu **30 fois** le même message "je suis pas toujours dispo ici 🖤 mais sur fanvue on peut vr..."

**Cause racine** : Race condition. Quand l'utilisateur envoie plusieurs messages rapidement :
1. Plusieurs webhooks ManyChat arrivent simultanément
2. Tous voient `is_stopped: false` car le `markAsStopped()` n'a pas encore terminé
3. Tous envoient l'exit message avec le lien Fanvue

**Contacts affectés** (>10 Fanvue links) :
- @raffaelemarcotti: 30 liens
- @williamrouse88: 30 liens
- @ettore.cavalieri.52: 21 liens
- @edisondacunda: 15 liens
- @mo.unir5572: 14 liens
- @alejandrooggi: 13 liens
- @sharipzianov_damir: 13 liens

### Bug 2: Doublons sur Messages Rapides

**Symptôme** : Quand un utilisateur envoie plusieurs messages d'affilée (avant qu'on réponde), le système pouvait répondre à chaque message individuellement.

**Cause racine** : Le cooldown de 20s ne suffisait pas car il checkait uniquement les messages OUTGOING récents, pas les INCOMING rapides.

---

## ✅ Fixes Implémentés

### Fix 1: Exit Message Spam Prevention

Ajout d'un check **CHECK 3** dans `processDM()` :

```typescript
// CHECK 3: EXIT MESSAGE SPAM PREVENTION — BUG FIX 2026-01-09
// Si on a déjà envoyé un exit message dans les 5 dernières minutes,
// ne pas en envoyer un autre.
const { data: recentExitMessage } = await supabase
  .from('elena_dm_messages')
  .select('id, created_at')
  .eq('contact_id', contact.id)
  .eq('direction', 'outgoing')
  .ilike('content', '%fanvue on peut vr%') // Match exit message pattern
  .gte('created_at', new Date(Date.now() - 300000).toISOString()) // Last 5 minutes
  .limit(1)
  .single();

if (recentExitMessage) {
  console.log(`⚠️ EXIT MESSAGE ALREADY SENT. Skipping to prevent Fanvue spam.`);
  return { response: '', ... };
}
```

### Fix 2: Fresh is_stopped Check Before Exit

Dans la section MESSAGE LIMIT CHECK, ajout d'un re-check **FRESH** de `is_stopped` depuis la DB :

```typescript
if (hasReachedLimit(contact.stage, contact.message_count)) {
  // BUG FIX 2026-01-09: Re-check is_stopped FRESH from DB
  const { data: freshContact } = await supabase
    .from('elena_dm_contacts')
    .select('is_stopped')
    .eq('id', contact.id)
    .single();
  
  if (freshContact?.is_stopped) {
    console.log(`🛑 Contact already stopped (fresh check). Skipping exit message.`);
    return { response: '', ... };
  }
  
  // CRITICAL: Mark as stopped FIRST, BEFORE sending exit message
  await markAsStopped(contact.id);
  
  // Then send exit message...
}
```

### Fix 3: Rapid-Fire Incoming Detection

Ajout d'un check **CHECK 4** pour détecter les messages entrants rapides :

```typescript
// CHECK 4: RAPID-FIRE INCOMING — BUG FIX 2026-01-09
// Si on a reçu un AUTRE message de ce contact dans les 30 dernières secondes,
// skip pour éviter les doublons.
const { data: recentIncoming } = await supabase
  .from('elena_dm_messages')
  .select('id, created_at')
  .eq('contact_id', contact.id)
  .eq('direction', 'incoming')
  .neq('content', incomingMessage) // Different message than current
  .gte('created_at', new Date(Date.now() - 30000).toISOString())
  .limit(1)
  .single();

if (recentIncoming) {
  console.log(`⚠️ RAPID-FIRE DETECTED. Cooldown active.`);
  return { response: '', ... };
}
```

---

## 📊 Ordre des Checks dans processDM()

1. **IS_STOPPED** — Contact déjà stoppé ? → Skip
2. **CHECK 1** — Même message dans les 30s ? (webhook retry) → Skip
3. **CHECK 2** — Cooldown 20s sur OUTGOING → Skip
4. **CHECK 3** — Exit message déjà envoyé dans les 5min ? → Skip *(NEW)*
5. **CHECK 4** — Rapid-fire incoming (autre message dans les 30s) → Skip *(NEW)*
6. **MESSAGE LIMIT** — Fresh is_stopped check + markAsStopped AVANT exit message *(IMPROVED)*

---

## 📝 Note Importante

**Tu n'es plus ban dans tes DM IG !** 🎉

Le système de DM automation peut maintenant fonctionner normalement.

---

## 🔍 Scripts d'Audit

Script créé pour ce debug : `app/scripts/dm-audit-bugs-2026-01-09.mjs`

```bash
cd app && node scripts/dm-audit-bugs-2026-01-09.mjs
```

Résultats de l'audit :
- Stopped contacts: 232
- Contacts avec >2 Fanvue links: 26
- True duplicates: 0 (après les fixes précédents)
- Double responses: 0

---

## 📁 Fichiers Modifiés

| Fichier | Changement |
|---------|------------|
| `app/src/lib/elena-dm.ts` | 3 nouveaux checks anti-spam + fresh is_stopped check |
| `app/scripts/dm-audit-bugs-2026-01-09.mjs` | Script d'audit créé |

---

**Statut** : ✅ Fixes déployés
