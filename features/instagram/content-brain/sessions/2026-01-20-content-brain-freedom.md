# Session 20/01/2026 — Content Brain V3 "Freedom Mode"

## 🎯 Objectif

Refactorer le Content Brain pour donner **liberté totale** à Claude au lieu de hardcoder des listes de locations, outfits et poses.

## 📊 Audit Initial — Ce qui était hardcodé

| Section | Lignes supprimées | Contenu |
|---------|-------------------|---------|
| `LOCATIONS` | ~90 lignes | 40 lieux Mila + 50 lieux Elena |
| `ACTIVE_TRIPS` | ~35 lignes | Tracking voyage hardcodé |
| `ELENA_SEXY_LOCATIONS` | ~50 lignes | 30 lieux "sexy" |
| `ELENA_SEXY_OUTFIT_CATEGORIES` | ~25 lignes | Bikini, lingerie, sport, spa |
| `ELENA_SEXY_POSES` | ~10 lignes | 6 poses hardcodées |
| `AB_EXPERIMENTS` | ~30 lignes | 4 tests A/B fixes |
| `getExplorationRequirements()` | ~145 lignes | Règles conditionnelles |
| `buildEnhancedPrompt()` | ~280 lignes | Prompt avec listes fermées |

**Total supprimé : ~665 lignes de code hardcodé**

## ✅ Solution Implémentée

### 1. Blocklist Centralisée (`nano-banana-blocklist.mjs`)

Nouveau fichier avec :
- `BLOCKED_TERMS` — Tous les mots interdits par Nano Banana Pro
- `SAFE_REPLACEMENTS` — Remplacements automatiques
- `sanitizePrompt(prompt, level)` — Fonction de nettoyage (normal/aggressive)
- `checkForBlockedTerms(prompt)` — Vérification avant génération
- `formatBlocklistForPrompt()` — Section pour le prompt Claude

### 2. Nouveau Prompt "Freedom" (`cron-scheduler.mjs`)

```javascript
function buildFreedomPrompt(...) {
  return `Tu es le Content Brain de Elena Visconti.
Tu as LIBERTÉ TOTALE pour créer du contenu.

## 📊 DONNÉES DYNAMIQUES
- Analytics, History, Context (Perplexity)
- Trending (Perplexity), Memories, Relationship

## 🚫 MOTS INTERDITS (blocklist)
${formatBlocklistForPrompt()}

## 🎨 TA LIBERTÉ CRÉATIVE
Tu décides librement:
- LOCATIONS — Invente le lieu parfait
- OUTFITS — Crée la tenue idéale
- POSES — Décide la pose
- CAPTIONS — Micro-story format

Ta seule contrainte: éviter les mots interdits.
`;
}
```

### 3. Filet de sécurité (`scheduled-post.mjs`)

- Import de `sanitizePrompt` et `checkForBlockedTerms`
- **Pré-sanitisation** : vérifie le prompt AVANT la première tentative
- **Retry intelligent** : si échec, essaie sanitisation normale puis aggressive

## 📁 Fichiers modifiés

| Fichier | Changement |
|---------|------------|
| `app/scripts/lib/nano-banana-blocklist.mjs` | ✨ NOUVEAU — Blocklist centralisée |
| `app/scripts/cron-scheduler.mjs` | ♻️ Suppression 600+ lignes hardcodées + nouveau prompt |
| `app/scripts/scheduled-post.mjs` | 🔧 Import blocklist + pré-sanitisation |

## 🧪 Test

```bash
node scripts/cron-scheduler.mjs elena
```

**Résultat** :
```
✅ Theme: "Cozy Parisian winter vibes"
📅 Planning généré:
14:00 │ CAROUSEL │ ✨ Intimate café in Le Marais, Paris (CONFIDENT)
21:00 │ CAROUSEL │ ✨ Elena's Parisian loft, golden hour (DREAMY)
💾 Saved to Supabase
```

Claude a décidé **librement** :
- Locations inventées (pas de liste fermée)
- Moods choisis selon le contexte
- Outfits adaptés à la météo (5°C → indoor)

## 📈 Bénéfices

| Avant | Après |
|-------|-------|
| Claude choisit parmi 30 lieux | Claude invente le lieu parfait |
| 6 poses hardcodées | Claude crée la pose idéale |
| Random pick outfit | Claude adapte au contexte + trending |
| Règles exploration rigides | Claude raisonne avec Extended Thinking |
| ~1200 lignes scheduler | ~600 lignes scheduler |

## 🔮 Architecture finale

```
Perplexity (trending) ─┐
                       ├─→ Claude (Extended Thinking) ─→ Blocklist (sécurité) ─→ Image
Analytics + History ───┘
```

## 📋 Prochaines étapes

1. Monitorer les 48h prochaines heures pour valider le taux de succès
2. Potentiellement affiner la blocklist si nouveaux termes bloqués découverts
3. Appliquer le même pattern à Mila quand réactivée

---

**Session** : ~2h
**Impact** : Refonte majeure du Content Brain
**Version** : v3 "Freedom Mode"
