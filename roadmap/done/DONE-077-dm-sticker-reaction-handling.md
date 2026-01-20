# DONE-077: DM Sticker/Reaction Handling + Anti-Duplication + Funnel Fix

**Date**: 19 janvier 2026  
**Statut**: ✅ TERMINÉ  
**Version**: v2.63.0

---

## 📋 Contexte

Audit de 4 conversations DM révélant plusieurs problèmes critiques:
1. **Stickers/réactions ignorés** - Les utilisateurs envoyant des stickers coeur ou réactions story ne recevaient aucune réponse
2. **Messages dupliqués** - Le bot envoyait des messages quasi-identiques successifs
3. **Liens Fanvue trop tôt** - Pitch Fanvue dès la première interaction (réaction story)
4. **Messages exagérés** - Réponses avec ALL CAPS et vocabulaire over-the-top

---

## ✅ Changements Implémentés

### 1. Gestion Stickers/Réactions (`route.ts`)

Conversion des attachments non-texte en tokens significatifs:

```typescript
// Nouveaux tokens gérés:
[STICKER_REACTION] - stickers et likes
[STORY_REACTION] - réactions story sans texte  
[IMAGE_SENT] - images envoyées
[VOICE_MESSAGE] - messages vocaux
[ATTACHMENT] - autres attachments
```

Le bot répond maintenant avec engagement chaleureux au lieu d'ignorer.

### 2. Détection Sémantique des Duplications (`elena-dm.ts`)

Remplacement du check exact par comparaison sémantique:
- Normalisation (lowercase, sans emojis)
- Calcul de similarité par overlap de mots
- Blocage si >70% similaire aux 5 derniers messages

### 3. Règle Minimum Messages (`elena-dm.ts`)

```typescript
const MIN_MESSAGES_BEFORE_PITCH = 4;
```

- Aucun pitch Fanvue avant 4 échanges
- Les tokens spéciaux ne déclenchent JAMAIS de pitch
- Log explicite quand pitch bloqué pour early stage

### 4. Anti-Exagération (`elena-dm.ts`)

Nouveaux mots interdits:
- `absoluto`, `supremo`, `olimpo`, `cosmos`, `eterno`, `divino`, `sagrado`, `perfecto`, `maestro`
- `the best`, `of all time`, `in history`

Nouvelles validations:
- ALL CAPS (3+ lettres) → rejeté
- Multiple `!!` → rejeté
- Ellipsis excessif `....` → rejeté

### 5. Sauvegarde Messages Contacts Stoppés

Même quand un contact est `is_stopped`, ses messages entrants sont sauvegardés:
- Utile pour contexte lors de réactivation (après 7 jours)
- Analytics sur comportement post-stop
- Tag `note: 'saved_while_stopped'` dans metadata

---

## 📁 Fichiers Modifiés

| Fichier | Changements |
|---------|-------------|
| `app/src/app/api/dm/webhook/route.ts` | +40 lignes - Détection stickers/réactions + conversion en tokens |
| `app/src/lib/elena-dm.ts` | +80 lignes - Similarité sémantique + min messages + anti-exagération + save stopped |

---

## 🧪 Tests Couverts

| Cas | Avant | Après |
|-----|-------|-------|
| Sticker coeur envoyé | Ignoré (skip) | "aww cute 🖤 where are you from?" |
| Message 70% similaire | Envoyé | Bloqué (SEMANTIC DUPLICATE) |
| Réaction story 🔥 (msg 1) | Lien Fanvue direct | "merci 🖤 tu viens d'où?" |
| Message avec ALL CAPS | Envoyé | Rejeté + régénéré |
| Message contact stopped | Non sauvegardé | Sauvegardé pour contexte |

---

## 📊 Impact Attendu

- **Taux de réponse**: ↑ (moins de conversations mortes)
- **Qualité messages**: ↑ (pas de duplications, pas d'exagération)
- **Funnel conversion**: ↑ (rapport building avant pitch)
- **Données analytics**: ↑ (messages stopped contacts préservés)

---

## 🔗 Commits

```
5ec448b fix: Save incoming messages from stopped contacts for reactivation context
```

(Autres commits inclus dans DONE-074, DONE-075)
