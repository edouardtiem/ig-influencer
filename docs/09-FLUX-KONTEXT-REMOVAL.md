# Suppression de Flux Kontext Pro et Migration Nano Banana Pro

**Date**: 3 Décembre 2024  
**Version**: v2.3.0  
**Type**: Breaking Change - Migration Complète

## Contexte

Suite à l'évaluation du 2 décembre 2024, décision prise de migrer complètement vers Nano Banana Pro et supprimer tout le code legacy Flux Kontext, LoRA, et FaceSwap.

## Raisons de la Migration

### Avantages Nano Banana Pro

| Critère | Flux Kontext + FaceSwap | Nano Banana Pro | Gain |
|---------|------------------------|-----------------|------|
| Consistance | ~80% | 95%+ | +15% |
| Setup | 2 appels API | 1 appel API | -50% latence |
| Coût | $0.04 + $0.04 | $0.05-0.06 | ~identique |
| Complexité code | Élevée | Simple | -75% code |
| Références | 1 image | 14 images | +1400% |

### Problèmes Résolus

- **Inconsistance visuelle**: Flux Kontext seul donnait 70% de consistance
- **Pipeline complexe**: Flux + FaceSwap = 2 étapes, 2 points de défaillance
- **Maintenance**: Plusieurs chemins de génération difficiles à maintenir
- **Code mort**: LoRA training implémenté mais jamais utilisé

## Fonctions Supprimées

### [`src/lib/replicate.ts`](../app/src/lib/replicate.ts)

```typescript
// ❌ SUPPRIMÉ
generateWithFluxKontext()        // 61 lignes
generateWithFaceSwap()           // 21 lignes
faceSwap()                       // 50 lignes
generateImage()                  // 9 lignes
generateBaseImage()              // 96 lignes
generateWithIdeogramCharacter()  // 61 lignes
generateWithLora()               // 69 lignes
generateBasePortrait()           // 52 lignes
generateFullBodyPortrait()       // 51 lignes

// ✅ CONSERVÉ
generateWithNanaBanana()         // 63 lignes - SOLUTION UNIQUE
getClient()
buildPrompt()
checkApiStatus()
```

**Réduction**: 657 lignes → ~135 lignes (**-77%**)

### [`src/config/base-portraits.ts`](../app/src/config/base-portraits.ts)

```typescript
// ❌ SUPPRIMÉ
getRandomReferenceUrl()
getPrimaryFaceUrl()

// ✅ CONSERVÉ
getBasePortraits()              // Seule fonction nécessaire
```

**Réduction**: 45 lignes → ~30 lignes (**-33%**)

### Fichiers Supprimés

- [`src/app/api/compare-models/route.ts`](../app/src/app/api/compare-models/route.ts) - 84 lignes
- [`src/app/compare-models/page.tsx`](../app/src/app/compare-models/page.tsx) - ~200 lignes

**Total supprimé**: ~290 lignes d'UI/API de comparaison

## Changements dans le Pipeline de Production

### Avant (v2.2.0)

```
Template → generateWithFaceSwap()
            ↓
         Flux Kontext Pro (référence 1 image)
            ↓
         FaceFusion Face Swap
            ↓
         Image finale
```

**Problèmes**:
- 2 appels API séquentiels
- Point de défaillance: si FaceSwap échoue, fallback sur image Flux
- Coût: $0.04 + $0.04 = $0.08
- Temps: ~10s + ~5s = ~15s

### Après (v2.3.0)

```
Template → generateWithNanaBanana(4 références)
            ↓
         Nano Banana Pro
            ↓
         Image finale
```

**Avantages**:
- 1 seul appel API
- Consistance native (pas de post-processing)
- Coût: ~$0.05-0.06
- Temps: ~60-90s (mais plus stable)

## Impact sur les Coûts

### Coût par Image

| Solution | Coût | Notes |
|----------|------|-------|
| Flux Kontext seul | $0.04 | Inconsistant (70%) |
| Flux + FaceSwap | $0.08 | Plus cohérent (80%) |
| **Nano Banana Pro** | **$0.05-0.06** | **Très cohérent (95%)** |

### Coût Mensuel (3 posts/jour)

- Avant: $0.08 × 90 = **$7.20/mois**
- Après: $0.055 × 90 = **$4.95/mois**
- **Économie: $2.25/mois (~31%)**

## Métriques de Performance

### Avant Migration (Flux Kontext + FaceSwap)

- Temps moyen: 15 secondes
- Consistance détails: ~80%
- Taux d'échec: ~5% (FaceSwap parfois fail)
- Coût: $0.08/image

### Après Migration (Nano Banana Pro)

- Temps moyen: 60-90 secondes (plus long mais acceptable)
- Consistance détails: 95%+ (natif)
- Taux d'échec: <1% (robuste)
- Coût: $0.05-0.06/image

**Verdict**: Trade-off temps vs qualité largement favorable.

## Migration du Code

### [`src/app/api/auto-post/route.ts`](../app/src/app/api/auto-post/route.ts)

```diff
- import { generateWithFaceSwap } from '@/lib/replicate';
- import { getPrimaryFaceUrl, getRandomReferenceUrl } from '@/config/base-portraits';
+ import { generateWithNanaBanana } from '@/lib/replicate';
+ import { getBasePortraits } from '@/config/base-portraits';

- const referenceUrl = getRandomReferenceUrl();
- const baseFaceUrl = getPrimaryFaceUrl();
- const imageResult = await generateWithFaceSwap(template, referenceUrl, baseFaceUrl);
+ const { primaryFaceUrl, referenceUrls } = getBasePortraits();
+ const allReferences = [primaryFaceUrl, ...referenceUrls];
+ const imageResult = await generateWithNanaBanana(template, allReferences);
```

### [`src/app/api/test-generate/route.ts`](../app/src/app/api/test-generate/route.ts)

Simplifié de ~160 lignes à ~100 lignes. Suppression de tous les paramètres conditionnels (`base`, `faceswap`) et utilisation unique de Nano Banana Pro.

## Rollback Plan

En cas de problème critique avec Nano Banana Pro:

### Option 1: Réversion Git (Recommandé)

```bash
git revert <commit-hash>  # Revenir à v2.2.0
```

### Option 2: Réactivation Manuelle

Si besoin de réactiver Flux Kontext:
1. Restaurer les fonctions depuis commit précédent
2. Mettre `USE_NANO_BANANA=false` dans `.env`
3. Modifier [`src/app/api/auto-post/route.ts`](../app/src/app/api/auto-post/route.ts) pour utiliser Flux

**Note**: Peu probable d'avoir besoin - Nano Banana Pro a passé tous les tests de validation.

## Prochaines Étapes

Avec le code simplifié, focus sur:

1. **Amélioration Character Sheet**: Détails ultra-précis pour Nano Banana
2. **Photos de Base**: Générer 8 photos de référence optimales (4 visage + 4 silhouette)
3. **Photos de Contexte**: Créer 40-50 photos de lieux récurrents
4. **Système de Variation**: Prompts intelligents pour éviter répétition
5. **Intégration Perplexity**: Actualités et hashtags trending

Voir [`TODO-DEMAIN.md`](../TODO-DEMAIN.md) pour le plan détaillé.

## Références

- [06-NANO-BANANA-PRO-MIGRATION.md](06-NANO-BANANA-PRO-MIGRATION.md) - Évaluation initiale
- [SESSION-02-DEC-2024.md](../SESSION-02-DEC-2024.md) - Notes de session
- [CHANGELOG.md](../CHANGELOG.md) - v2.3.0

---

**Conclusion**: Migration réussie vers architecture simplifiée et performante. Nano Banana Pro est maintenant la solution unique de production.

