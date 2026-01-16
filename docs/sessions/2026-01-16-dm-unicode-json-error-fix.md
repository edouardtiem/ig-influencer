# Session 16 janvier 2026 — DM Unicode JSON Error Fix

**Durée** : ~30min  
**Focus** : Investigation et fix erreur 400 Anthropic API

---

## 🐛 Problème identifié

Erreur récurrente dans les logs DM Instagram :
```
Error: 400 {"type":"error","error":{"type":"invalid_request_error","message":"The request body is not valid JSON: no low surrogate in string: line 1 column 12340 (char 12339)"}}
```

**Symptômes** :
- 3 tentatives échouent toutes avec la même erreur
- Le système fallback sur `"hey 🖤"` (réponse générique sans contexte)
- Le contact ne reçoit pas de réponse contextuelle appropriée

**Exemple** : Contact `@v3a.nil` avec 13 messages d'historique

---

## 🔍 Investigation

### Cause Root

L'erreur `"no low surrogate in string"` indique un problème d'encodage Unicode dans le JSON envoyé à l'API Anthropic.

**Analyse** :
1. Le DM arrive normalement de ManyChat
2. Le système charge l'historique de conversation (13 messages)
3. **Quelque part dans cet historique**, il y a un caractère Unicode invalide (emoji corrompu ou tronqué)
4. Quand le SDK Anthropic sérialise le payload en JSON, ça crash
5. Après 3 tentatives échouées, le système fallback sur "hey 🖤"

### Pourquoi ça arrive ?

Les "surrogate pairs" sont utilisés en Unicode pour encoder les emojis et caractères spéciaux. Si un emoji a été :
- Tronqué lors de la sauvegarde en DB
- Copié-collé de manière corrompue
- Mal encodé quelque part

...alors le JSON devient invalide.

---

## ✅ Solution implémentée

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

## 📝 Documentation créée

- `roadmap/bugs/BUG-015-dm-unicode-json-error.md` — Bug report détaillé
- `roadmap/done/DONE-067-dm-unicode-json-error-fix.md` — Documentation du fix
- `ROADMAP.md` — Mis à jour avec le nouveau bug fix

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

## 🚀 Déploiement

- ✅ Commit : `6d9f7d5`
- ✅ Push : `origin/main`
- ✅ Version : v2.53.0

---

## 📝 Notes importantes

- Le fix est **proactif** : il nettoie aussi les nouveaux messages entrants (au cas où)
- Les messages corrompus en DB ne seront pas réparés rétroactivement, mais ne causeront plus d'erreurs
- Si besoin, on pourra créer un script de migration pour nettoyer les anciens messages en DB

---

## 🔗 Références

- [Bug Report](../roadmap/bugs/BUG-015-dm-unicode-json-error.md)
- [Done Documentation](../roadmap/done/DONE-067-dm-unicode-json-error-fix.md)
- [Anthropic API Error Documentation](https://docs.anthropic.com/en/api/errors)
- [Unicode Surrogate Pairs](https://en.wikipedia.org/wiki/UTF-16#Code_points_from_U+010000_to_U+10FFFF)
