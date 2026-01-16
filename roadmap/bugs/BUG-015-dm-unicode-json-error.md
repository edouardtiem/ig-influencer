# BUG-015: DM Unicode JSON Error — Invalid Surrogate Pairs

**Date découverte** : 16 janvier 2026  
**Date fixée** : 16 janvier 2026  
**Sévérité** : 🔴 High  
**Status** : ✅ Fixé

---

## 🐛 Description

L'API Anthropic retourne une erreur `400 invalid JSON` avec le message :
```
"no low surrogate in string: line 1 column 12340 (char 12339)"
```

Cela se produit quand l'historique de conversation contient des caractères Unicode invalides (emojis corrompus ou tronqués). Les "surrogate pairs" incomplets causent une erreur de sérialisation JSON lors de l'envoi du payload à l'API Claude.

---

## 🔍 Symptômes

- Erreur `400 invalid_request_error` de l'API Anthropic
- Message : `"no low surrogate in string: line 1 column 12340 (char 12339)"`
- 3 tentatives échouent toutes avec la même erreur
- Le système fallback sur `"hey 🖤"` (réponse générique sans contexte)
- Le contact ne reçoit pas de réponse contextuelle appropriée

**Exemple de logs** :
```
Error generating response (attempt 1): Error: 400 {"type":"error","error":{"type":"invalid_request_error","message":"The request body is not valid JSON: no low surrogate in string: line 1 column 12340 (char 12339)"}}
```

---

## 📍 Fichiers concernés

- `app/src/lib/elena-dm.ts`
  - Fonction `generateElenaResponse()` (ligne ~1374)
  - Construction du tableau `messages` avec `conversationHistory` (ligne ~1381)

---

## 🔍 Cause Root

Les messages de conversation stockés en DB Supabase peuvent contenir des caractères Unicode malformés :
- Emojis tronqués lors de la sauvegarde
- Emojis copiés-collés corrompus par l'utilisateur IG
- Caractères dans la range `\uD800-\uDFFF` (surrogate pairs) sans leur paire complète

Quand le SDK Anthropic sérialise le payload en JSON pour l'API, ces caractères invalides causent une erreur de parsing JSON.

---

## ✅ Solution appliquée

**Date** : 16 janvier 2026  
**Fichier** : `app/src/lib/elena-dm.ts`

### Changements

1. **Nouvelle fonction `sanitizeUnicode()`** (ligne ~716)
   ```typescript
   function sanitizeUnicode(str: string): string {
     // Remove lone surrogates (high surrogate not followed by low, or lone low surrogate)
     return str.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
   }
   ```

2. **Application à l'historique de conversation** (ligne ~1397)
   - `msg.content` → `sanitizeUnicode(msg.content)`
   - `incomingMessage` → `sanitizeUnicode(incomingMessage)`

### Fonctionnement

La regex supprime les "lone surrogates" :
- `[\uD800-\uDBFF](?![\uDC00-\uDFFF])` = high surrogate sans low surrogate après
- `(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]` = low surrogate sans high surrogate avant

Les emojis valides (pairs complets) sont préservés, seuls les caractères corrompus sont supprimés.

---

## 🧪 Tests

- ✅ Pas d'erreurs de linting
- ✅ Les emojis valides sont préservés
- ✅ Les caractères corrompus sont supprimés silencieusement
- ✅ Le JSON est maintenant valide pour l'API Anthropic

---

## 📝 Notes

- Le fix est **proactif** : il nettoie aussi les nouveaux messages entrants (au cas où)
- Les messages corrompus en DB ne seront pas réparés rétroactivement, mais ne causeront plus d'erreurs
- Si besoin, on pourra créer un script de migration pour nettoyer les anciens messages en DB

---

## 🔗 Références

- [Anthropic API Error Documentation](https://docs.anthropic.com/en/api/errors)
- [Unicode Surrogate Pairs](https://en.wikipedia.org/wiki/UTF-16#Code_points_from_U+010000_to_U+10FFFF)
