# Google API Direct vs Nano Banana Pro — Sexy SFW Limits Exploration

**Date**: 23 janvier 2026  
**Status**: 🔬 Exploration / Tests  
**Objectif**: Trouver un workflow plus permissif pour du contenu sexy SFW

---

## Contexte

Nano Banana Pro (via Replicate) a des filtres stricts sur le contenu sexy. On explore l'API Google directe (`gemini-3-pro-image-preview`) pour voir si on a plus de liberté.

---

## Tests réalisés

### Configuration

- **Modèle**: `gemini-3-pro-image-preview` (via `@google/genai` SDK)
- **Safety**: `BLOCK_NONE` (le plus permissif disponible sur Gemini)
- **Prix**: ~$0.134/image en 2K

### Modèles disponibles sur Google API

| Modèle | Safety settings | Pour sexy |
|--------|-----------------|-----------|
| `gemini-3-pro-image-preview` | `BLOCK_NONE` ✅ | **Meilleur choix** |
| `imagen-4.0-ultra-generate-001` | `BLOCK_LOW_AND_ABOVE` seulement | ❌ Trop restrictif |

---

## Résultats des tests

### Sans image de référence

| Test | Prompt | Résultat |
|------|--------|----------|
| L1 Bikini neutral | Bikini + warm smile | ✅ PASS |
| L1 Bodysuit | Fitted bodysuit | ✅ PASS |
| L1 Evening dress cleavage | Dress + cleavage | ❌ BLOCKED (IMAGE_OTHER) |
| L2 Bikini + captivating gaze | Bikini + sexy expression | ❌ BLOCKED (IMAGE_SAFETY) |
| L2 Bikini sensual lying | Sensual + lying pose | ❌ BLOCKED (IMAGE_SAFETY) |
| L2 Lingerie | Lace lingerie | ❌ BLOCKED (IMAGE_OTHER) |
| **L2 Curves + bikini** | Bikini + "feminine curves" | ✅ **PASS** (bloqué sur NBP!) |
| L3 Silk slip bedroom | Silk slip + bedroom | ❌ BLOCKED |
| **L3 Towel after shower** | Towel + bathroom | ✅ **PASS** (bloqué sur NBP!) |
| L3 Bikini wet pool | Wet bikini + intense gaze | ❌ BLOCKED |
| L4 Bikini lying beach | Lying pose | ❌ BLOCKED |
| **L4 Silk robe open** | Robe partially open | ✅ **PASS** |

### Tests back view (fesses visibles)

| Test | Prompt | Résultat |
|------|--------|----------|
| **Thong bikini back (no face)** | Back view, thong, walking to ocean | ✅ **PASS** |
| **Thong bikini back + face (stool)** | 3/4 back, thong, looking over shoulder, neutral expression | ✅ **PASS** |

### Avec image de référence Elena

| Test | Prompt | Résultat |
|------|--------|----------|
| Thong bikini back + face | Avec ref Elena | ❌ BLOCKED |
| Lingerie back + face | Avec ref Elena | ❌ BLOCKED |
| Brazilian bikini back | Avec ref Elena | ❌ BLOCKED |
| String bikini stool | Avec ref Elena | ❌ BLOCKED |
| **Silk sleepwear back** | Avec ref Elena | ✅ **PASS** |

---

## Images générées (sauvegardées dans `app/`)

1. `google_gemini_L1_bikini_neutral_*.jpeg` - Bikini beach, warm smile
2. `google_gemini_L1_bodysuit_fitted_*.jpeg` - Bodysuit loft
3. `google_gemini_L2_curves_bikini_*.jpeg` - Bikini + curves (bloqué sur NBP!)
4. `google_gemini_L3_towel_after_shower_*.jpeg` - Towel bathroom (bloqué sur NBP!)
5. `google_gemini_L4_silk_robe_open_*.jpeg` - Silk robe open
6. `test_thong_back_*.jpeg` - Thong bikini back view (no face)
7. `test_thong_face_stool_*.jpeg` - Thong bikini 3/4 back + face visible
8. `elena_silk_sleepwear_back_*.jpeg` - Elena ref + silk sleepwear back

---

## Learnings clés

### Ce qui passe sur Google API (vs bloqué sur NBP)

| Contenu | NBP (Replicate) | Google API Direct |
|---------|-----------------|-------------------|
| Bikini + "curves" | ❌ BLOQUÉ | ✅ PASSE |
| Towel bathroom | ❌ BLOQUÉ/Timeout | ✅ PASSE |
| Looking over shoulder | ❌ BLOQUÉ | ✅ PASSE |
| Thong bikini back view | Non testé | ✅ PASSE |
| Silk robe "partially open" | Non testé | ✅ PASSE |

### Ce qui reste bloqué partout

- Bikini + expressions sexy (captivating gaze, lips parted, sensual)
- Lingerie explicite
- Poses allongées (lying on bed/beach)
- Bubble bath
- "Voluptuous" + "sultry"

### Règle découverte : Impact de la ref image

- **Sans ref** → Plus de liberté (thong bikini back OK)
- **Avec ref Elena** → Filtres plus stricts (bikini back bloqué, sleepwear OK)

### Règle d'or confirmée

```
Tenue révélatrice + expression neutre = OK
Tenue révélatrice + expression sexy = BLOCKED
```

---

## Pricing

| Service | Prix/image | Note |
|---------|-----------|------|
| Gemini 3 Pro (Google direct) | $0.134 (2K) | Plus permissif |
| Nano Banana Pro (Replicate) | ~$0.08-0.10 | Plus restrictif |

Batch API Google = 50% moins cher ($0.067/image)

---

## Scripts créés

- `app/scripts/test-google-api-sexy-limits.mjs` - Tests complets par niveau
- `app/scripts/test-google-api-extra-sexy.mjs` - Tests edge cases (non terminé)

---

## Questions ouvertes

1. Comment utiliser ref Elena tout en gardant la permissivité bikini?
2. Faut-il créer une nouvelle ref Elena plus "safe"?
3. Workflow hybride: NBP pour SFW, Google API pour sexy?
4. Tester sans ref mais avec description détaillée d'Elena?

---

## Prochaines étapes potentielles

- [ ] Tester sans ref mais avec description détaillée du personnage
- [ ] Créer une ref Elena plus neutre (portrait simple)
- [ ] Comparer qualité Google API vs NBP
- [ ] Tester les limites exactes avec variations de prompts
- [ ] Décider du workflow final

---

## Fichiers modifiés/créés

- `app/scripts/test-google-api-sexy-limits.mjs` — Script de test complet
- `app/scripts/test-google-api-extra-sexy.mjs` — Script tests supplémentaires
- Images test dans `app/` (google_gemini_*, test_thong_*, elena_*)
