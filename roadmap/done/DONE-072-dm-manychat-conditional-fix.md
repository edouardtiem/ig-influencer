# ✅ DONE-072 : DM ManyChat Conditional Flow Fix

**Date** : 19 janvier 2026  
**Version** : v2.58.0  
**Status** : ✅ Done

---

## 🎯 Objectif

Fixer le problème fondamental des boucles infinies de liens Fanvue et des réponses dans mauvaise langue en ajoutant une condition dans le flow ManyChat.

---

## 🔍 Problème identifié

**Symptôme** :
- Liens Fanvue envoyés en boucle (même après "stop")
- Réponses en anglais alors que l'utilisateur écrit en français
- Messages envoyés même quand le backend retourne `skip: true`

**Cause racine** :
- Le flow ManyChat n'avait **aucune condition** avant le Send Message
- Architecture : External Request → Smart Delay → Send Message (toujours envoyé)
- Le backend retournait `skip: true` mais ManyChat ignorait ce signal

---

## ✅ Solution implémentée

### 1. Backend : Ajout flag `should_send`

**Fichier** : `app/src/app/api/dm/webhook/route.ts`

**Changements** :
- Toutes les réponses webhook retournent maintenant `should_send: true` ou `should_send: false`
- `should_send: false` quand :
  - `skip: true` (deduplication, cooldown, stopped)
  - Système paused
  - Erreur webhook
  - Response vide
- `should_send: true` quand réponse valide générée

**Exemple** :
```json
{
  "success": true,
  "should_send": false,  // <-- NOUVEAU
  "skip": true,
  "response": "",
  "reason": "Contact is stopped"
}
```

### 2. ManyChat : Configuration flow conditionnel

**Custom Fields créés** :
- `elena_response` (Text) — Réponse générée par l'IA
- `elena_should_send` (Text) — Flag boolean pour condition

**Response Mapping** :
- `response` → `elena_response`
- `should_send` → `elena_should_send`

**Flow ManyChat** :
```
User sends DM 
      ↓
   External Request (webhook)
      ↓
   Response Mapping
      ↓
   Condition: elena_should_send is true
      ↓                    ↓
   ✅ YES               ❌ NO
      ↓                    ↓
Smart Delay (12s)       (fin - rien)
      ↓
Send Message (elena_response)
```

---

## 📊 Impact

### Avant
- ❌ Messages envoyés même quand `skip: true`
- ❌ Boucles infinies de liens Fanvue
- ❌ Réponses dans mauvaise langue

### Après
- ✅ ManyChat vérifie `should_send` avant d'envoyer
- ✅ Pas de message si `should_send: false`
- ✅ Flow s'arrête proprement quand contact stopped

---

## 🧪 Tests

### Scénarios testés

1. **Contact stopped** → `should_send: false` → Pas de message ✅
2. **Deduplication** → `should_send: false` → Pas de message ✅
3. **Réponse valide** → `should_send: true` → Message envoyé ✅
4. **Erreur webhook** → `should_send: false` → Pas de message ✅

---

## 📁 Fichiers modifiés

- ✅ `app/src/app/api/dm/webhook/route.ts` — Ajout `should_send` dans toutes les réponses

---

## 🔗 Références

- [Session Documentation](../docs/sessions/2026-01-19-dm-manychat-conditional-fix.md)
- [IP-007 Hard Fix](../in-progress/IP-007-dm-hard-fix.md)
- [ManyChat Dev Tools](https://help.manychat.com/hc/en-us/articles/14281252007580-Dev-Tools-Basics)

---

## 💡 Leçons apprises

1. **Architecture ManyChat** : Toujours ajouter une condition avant Send Message pour permettre au backend de contrôler l'envoi
2. **Signaux explicites** : Utiliser des flags boolean (`should_send`) plutôt que de vérifier `skip` ou `response` vide
3. **Flow visuel** : Le flow ManyChat doit être séquentiel avec conditions, pas juste "toujours envoyer"

---

**Commit** : `2a2429c`  
**Status** : ✅ Déployé, ManyChat configuré, monitoring en cours
