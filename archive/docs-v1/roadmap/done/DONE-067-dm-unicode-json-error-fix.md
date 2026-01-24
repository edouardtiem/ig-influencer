# DONE-067: DM Unicode JSON Error Fix

**Date** : 16 janvier 2026  
**Version** : v2.53.0  
**Type** : 🐛 Bug Fix

---

## 🎯 Objectif

Fixer l'erreur `400 invalid JSON` de l'API Anthropic causée par des caractères Unicode invalides (surrogate pairs incomplets) dans l'historique de conversation.

---

## 🐛 Problème

L'API Anthropic retournait une erreur :
```
Error: 400 {"type":"error","error":{"type":"invalid_request_error","message":"The request body is not valid JSON: no low surrogate in string: line 1 column 12340 (char 12339)"}}
```

**Cause** : Des messages de conversation stockés en DB contenaient des emojis corrompus ou tronqués (surrogate pairs incomplets). Quand le SDK Anthropic sérialisait le payload en JSON, ces caractères invalides causaient une erreur de parsing.

**Impact** :
- 3 tentatives échouaient toutes avec la même erreur
- Le système fallback sur `"hey 🖤"` (réponse générique sans contexte)
- Le contact ne recevait pas de réponse contextuelle appropriée

---

## ✅ Solution

### 1. Fonction `sanitizeUnicode()`

Ajout d'une fonction pour supprimer les "lone surrogates" (caractères Unicode dans la range `\uD800-\uDFFF` sans leur paire complète) :

```typescript
function sanitizeUnicode(str: string): string {
  // Remove lone surrogates (high surrogate not followed by low, or lone low surrogate)
  return str.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
}
```

**Regex expliquée** :
- `[\uD800-\uDBFF](?![\uDC00-\uDFFF])` = high surrogate sans low surrogate après
- `(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]` = low surrogate sans high surrogate avant

### 2. Application à l'historique de conversation

Modification de `generateElenaResponse()` pour sanitizer tous les messages avant envoi à l'API :

```typescript
// Build conversation context (sanitize to prevent invalid Unicode errors)
const messages = conversationHistory.map(msg => ({
  role: msg.direction === 'incoming' ? 'user' as const : 'assistant' as const,
  content: sanitizeUnicode(msg.content),
}));

// Add current message
messages.push({
  role: 'user' as const,
  content: sanitizeUnicode(incomingMessage),
});
```

---

## 📁 Fichiers modifiés

- `app/src/lib/elena-dm.ts`
  - Ajout fonction `sanitizeUnicode()` (ligne ~716)
  - Application à `conversationHistory` et `incomingMessage` (ligne ~1397)

---

## 🧪 Tests

- ✅ Pas d'erreurs de linting
- ✅ Les emojis valides sont préservés
- ✅ Les caractères corrompus sont supprimés silencieusement
- ✅ Le JSON est maintenant valide pour l'API Anthropic

---

## 📊 Impact

**Avant** :
- Erreur 400 sur conversations avec emojis corrompus
- Fallback sur réponse générique sans contexte
- Perte de qualité de réponse

**Après** :
- ✅ Pas d'erreur JSON
- ✅ Réponses contextuelles générées correctement
- ✅ Emojis valides préservés, caractères corrompus supprimés

---

## 📝 Notes

- Le fix est **proactif** : il nettoie aussi les nouveaux messages entrants
- Les messages corrompus en DB ne seront pas réparés rétroactivement, mais ne causeront plus d'erreurs
- Si besoin, on pourra créer un script de migration pour nettoyer les anciens messages en DB

---

## 🔗 Références

- [Bug Report](./bugs/BUG-015-dm-unicode-json-error.md)
- [Anthropic API Error Documentation](https://docs.anthropic.com/en/api/errors)
- [Unicode Surrogate Pairs](https://en.wikipedia.org/wiki/UTF-16#Code_points_from_U+010000_to_U+10FFFF)
