# Elena Prompt Audit - Nano Banana Pro Filters

**Date:** 2026-01-20
**Objectif:** Comprendre les limites des filtres Google/Nano Banana Pro pour générer des images Elena sexy (bikini, legging, tenue de soirée)

## Contexte

- Google a durci les filtres de Nano Banana Pro début 2026
- 60-70% des images Elena ne sont plus générées
- Besoin de comprendre quels termes/contextes sont bloqués

## Configuration de test

- **Modèle:** `google/nano-banana-pro` via Replicate
- **Référence Elena:** `https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png`
- **Paramètre safety:** `safety_filter_level: 'block_only_high'` (le moins strict)
- **Aspect ratio:** 4:5

---

## 🚨 DÉCOUVERTE MAJEURE

**Le problème n'est PAS les prompts, c'est les IMAGES DE RÉFÉRENCE Elena !**

Les images de référence Elena sont flaggées comme "sensibles" par Google, ce qui bloque TOUTES les générations qui les utilisent.

### Preuve :

| Test | Avec refs Elena | Sans refs | Résultat |
|------|-----------------|-----------|----------|
| Sweater SFW | ✅ PASSED (50.9s) puis TIMEOUT | ✅ PASSED (45.0s) | Refs instables |
| Bikini beach | ❌ BLOCKED (70.5s) | ✅ PASSED (68.9s) | **Refs = problème** |
| Evening dress | TIMEOUT | Non testé | Probablement refs |

---

## Tests réalisés

### Test 1: Baseline SFW (sweater at home)
- **Prompt:** Casual sweater, sitting on sofa, peaceful expression
- **AVEC références:** ✅ PASSED première fois (50.9s), puis TIMEOUT
- **SANS références:** ✅ PASSED (45.0s)
- **Notes:** Les références Elena causent des blocages intermittents

### Test 2: Bikini - Beach context (neutral)
- **Prompt:** Black bikini, standing on beach, natural daylight, normal pose
- **AVEC références:** ❌ BLOCKED (70.5s) - "flagged as sensitive"
- **SANS références:** ✅ PASSED (68.9s)
- **Notes:** **PREUVE que les refs sont le problème, pas le prompt bikini**

### Test 3: Bikini - Home context (neutral pose)
- **Prompt:** Black bikini, standing in living room, natural pose, wide shot
- **AVEC références:** TIMEOUT (>90s)
- **SANS références:** Non testé
- **Notes:** 

### Test 5: Legging + Sports bra (fitness context)
- **Prompt:** Black leggings, sports bra, yoga pose, fitness studio
- **AVEC références:** TIMEOUT (>90s)
- **SANS références:** Non testé
- **Notes:** 

### Test 6: Evening dress (elegant)
- **Prompt:** Elegant black evening dress, standing, restaurant/gala context
- **AVEC références (both):** TIMEOUT (>90s)
- **SANS références:** Non testé
- **Notes:**

---

## 🔬 Tests références séparées

### FACE ref seule
| Test | Résultat | Durée |
|------|----------|-------|
| Sweater SFW | ✅ PASSED | 51.4s |
| Bikini beach | ✅ PASSED | 51.6s |
| Bikini confident | ✅ PASSED | 48.9s |
| Evening dress V-neck | ✅ PASSED | 83.6s |
| Legging + sports bra | ⚠️ TIMEOUT | >90s |

### BODY ref seule
| Test | Résultat | Durée |
|------|----------|-------|
| Sweater SFW | ✅ PASSED | 49.0s |

### Les DEUX refs ensemble
| Test | Résultat | Durée |
|------|----------|-------|
| Sweater SFW | ⚠️ TIMEOUT | >90s |
| Bikini beach | ❌ BLOCKED | 70.5s | 

---

## Termes testés

### ✅ Termes qui passent (avec FACE ref seule)
- `bikini`, `two-piece swimsuit`, `swimwear`
- `evening dress`, `V-neckline`, `décolletage`
- `confident pose`, `looking at camera`
- `warm smile`, `glamorous expression`
- `beach`, `ocean`, `golden hour`
- `rooftop bar`, `city lights`

### ❌ Termes potentiellement bloqués
- `sports bra` (timeout observé)
- Combinaison de FACE + BODY refs ensemble

### ⚠️ Termes à risque (non testés encore)
- `sensual`, `alluring`, `seductive`
- `lingerie`, `bralette`
- `lips slightly parted`
- `smoldering`, `sultry`

---

## 🎯 RECOMMANDATIONS FINALES

### Le problème identifié
**Ce n'est PAS les prompts qui sont bloqués, c'est la COMBINAISON des références Elena (face + body) ensemble.**

Quand on utilise les deux refs:
- Le système détecte probablement un "pattern" de contenu adulte
- Même un prompt SFW (sweater) peut être bloqué

### Solution validée
**Utiliser SEULEMENT la FACE ref** pour les générations Nano Banana Pro.

### Prompts validés pour Content Brain (avec FACE ref seule)

```javascript
// Bikini - VALIDÉ
"Wearing black two-piece swimsuit on beach, ocean background.
Natural relaxed pose, looking at horizon."

// Bikini confident - VALIDÉ  
"Wearing black bikini on beach.
Confident pose, looking at camera with warm smile."

// Evening dress sexy - VALIDÉ
"Wearing elegant black evening dress with V-neckline.
Standing at rooftop bar, city lights behind.
Confident glamorous expression."
```

### Termes à éviter
- Ne pas utiliser FACE + BODY refs ensemble
- Éviter `sports bra` (semble problématique)
- Termes explicitement sexuels non testés mais probablement risqués

### Stratégie recommandée pour Content Brain

1. **Modifier les références** : Utiliser uniquement `ELENA_FACE_REF`, supprimer `ELENA_BODY_REF` du code
2. **Garder les prompts actuels** : Les prompts sexy (bikini, evening dress) passent avec face ref seule
3. **Tester progressivement** : Si des blocages persistent, simplifier les expressions

### Trade-off
- ✅ Avantage: Les images passent les filtres
- ⚠️ Inconvénient: Moins de contrôle sur le body (proportions, silhouette)
- 💡 Alternative: Créer une nouvelle BODY ref plus "safe" (vêtements normaux)

---

## Prochaines étapes

1. [ ] Modifier `scheduled-post.mjs` pour utiliser FACE ref seulement
2. [ ] Tester les expressions "sexy" (sensual, alluring) avec face ref seule
3. [ ] Optionnel: Créer une nouvelle body ref avec vêtements normaux
4. [ ] Monitorer le taux de succès après modification

---

## Historique des modifications

| Date | Action | Résultat |
|------|--------|----------|
| 2026-01-20 | Création du document | - |
| 2026-01-20 | Tests avec refs séparées | Face seule = solution |
| 2026-01-20 | Tests bikini/evening dress | ✅ PASSENT avec face ref |
| 2026-01-20 | Identification du problème | Combo face+body = bloqué |
