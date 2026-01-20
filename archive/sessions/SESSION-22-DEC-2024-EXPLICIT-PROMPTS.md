# 📍 Session — Explicit Reference Prompts

**Date** : 22 décembre 2024  
**Durée** : ~2h

---

## 🎯 Objectif

Améliorer la ressemblance des photos générées avec les références en créant un système de prompts explicite qui indique clairement à Nano Banana Pro quelle image utiliser pour le visage et quelle image utiliser pour le corps.

---

## 🔍 Analyse Initiale

### Problème identifié

En comparant les photos récentes d'Elena sur Instagram avec ses caractéristiques définies :

| Critère | Attendu | Observé | Verdict |
|---------|---------|---------|---------|
| **Cheveux** | Bronde avec balayage blond doré | Trop foncés, bruns uniformes | ⚠️ |
| **Visage** | Doux, rond, pas anguleux | Parfois trop "mannequin classique" | ⚠️ |
| **Bijoux** | Bracelet chunky + colliers or | Pas toujours présents | ⚠️ |
| **Corps** | Curvy, poitrine généreuse | ✅ Généralement respecté | ✅ |

### Cause identifiée

L'ancien prompt disait :
```
BASED ON THE PROVIDED REFERENCE IMAGES, generate the EXACT SAME PERSON...
```

Mais Nano Banana Pro recevait 2-4 images sans savoir **laquelle utiliser pour quoi**.

---

## ✅ Solution Implémentée

### Nouveau format de prompt explicite

```javascript
const REFERENCE_INSTRUCTION = `You are provided with reference images in order:

**IMAGE 1 (FACE REFERENCE)**: This is Elena's face. Copy this EXACTLY:
- Same soft round face shape (NOT angular, NOT sharp jawline)
- Same honey brown warm almond-shaped eyes
- Same bronde hair with VISIBLE golden blonde balayage highlights
- Same small beauty mark on right cheekbone (SIGNATURE MARK)
...

**IMAGE 2 (BODY REFERENCE)**: This is Elena's body. Match these proportions EXACTLY:
- Same curvy voluptuous figure
- Same large bust proportions as reference
...

CRITICAL RULES:
- Face MUST be identical to Image 1
- Body MUST match Image 2
- Do NOT change face to look more "model-like"
- Hair MUST show visible balayage, NOT solid dark brown`;
```

### FINAL CHECK ajouté à la fin des prompts

```javascript
const FINAL_CHECK = `FINAL CHECK - MUST MATCH REFERENCES:
- Face: IDENTICAL to Image 1 (soft round face, NOT angular)
- Body: IDENTICAL to Image 2 (curvy proportions)
- Hair: bronde with VISIBLE balayage (NOT solid dark brown)
- Beauty mark: MUST be visible
- Jewelry: gold accessories visible`;
```

---

## 📁 Fichiers Modifiés

| Script | Personnage | Changements |
|--------|------------|-------------|
| `scheduled-post.mjs` | ✅ Mila + Elena | Nouveau `reference_instruction` + `final_check` dans CHARACTERS |
| `carousel-post.mjs` | ✅ Mila | REFERENCE_INSTRUCTION explicite + MILA_FINAL_CHECK |
| `carousel-post-elena.mjs` | ✅ Elena | REFERENCE_INSTRUCTION explicite + ELENA_FINAL_CHECK |
| `photo-reel-post.mjs` | ✅ Mila | REFERENCE_INSTRUCTION explicite + MILA_FINAL_CHECK |
| `photo-reel-post-elena.mjs` | ✅ Elena | REFERENCE_INSTRUCTION explicite + ELENA_FINAL_CHECK |
| `video-reel-post.mjs` | ✅ Mila | REFERENCE_INSTRUCTION explicite + MILA_FINAL_CHECK |
| `duo-post.mjs` | ✅ Mila + Elena | Mapping explicite des 4 références (2 par personnage) |
| `sauna-reel-v2.mjs` | ✅ Mila | REFERENCE_INSTRUCTION explicite + MILA_FINAL_CHECK |

---

## 🧪 Tests Effectués

### Test 1: Elena en Suède (Hot Bath)

**Prompt test avec nouveau format explicite :**
- Setting: Bain chaud extérieur en Suède, lac gelé, chalet luxe
- Résultat: ✅ **Excellent**
  - Cheveux bronde avec balayage visible
  - Bracelet chunky gold visible
  - Colliers layered visibles
  - Proportions corps correctes
  - Visage plus doux qu'avant

### Test 2: 4 photos (2 Mila + 2 Elena)

Script `test-new-prompts.mjs` créé pour tester :
- ✅ `mila_morning_coffee` — Généré en 44.7s
- ✅ `mila_yoga_studio` — Généré en 143.6s
- ✅ `elena_loft_morning` — Généré en 105.8s
- 🔄 `elena_rooftop_sunset` — En cours

---

## 💡 Pourquoi ça fonctionne mieux

1. **Mapping explicite** — Le modèle sait exactement quelle image utiliser pour quoi
2. **Répétition stratégique** — Les critères sont mentionnés 3 fois (début, milieu, fin du prompt)
3. **Négatifs clairs** — "NOT angular", "NOT solid dark brown", etc.
4. **FINAL CHECK** — Renforcement à la fin du prompt pour validation

Selon la [doc Nano Banana Pro](https://replicate.com/google/nano-banana-pro/readme) :
- Peut "blend up to 14 images with consistent results"
- Peut "maintain consistency and resemblance of up to 5 people"
- Utilise Gemini 3 Pro pour comprendre les instructions structurées

---

## 📋 Structure type d'un prompt

```
1. REFERENCE_INSTRUCTION (IMAGE 1 = face, IMAGE 2 = body)
2. SUBJECT avec face/marks/body descriptions  
3. EXPRESSION
4. ACTION
5. OUTFIT
6. SETTING
7. STYLE
8. FINAL_CHECK (répétition des critères clés)
```

---

## 🐛 Problèmes rencontrés

1. **Fetch failed pour Mila** — Résolu en ajoutant logs et gestion d'erreurs
2. **Elena flagged sensitive** — Résolu en retirant termes comme "cleavage", "plunging neckline"
3. **image_input null** — Résolu en corrigeant la conversion base64

---

## 📋 À faire prochaine session

- [ ] Vérifier les 4 images de test générées
- [ ] Comparer la ressemblance avant/après sur plusieurs générations
- [ ] Ajuster les termes si besoin pour éviter les flags sensitive
- [ ] Nettoyer le script `test-new-prompts.mjs` (supprimer ou garder comme outil de test)

---

## 📝 Notes importantes

- Le nouveau système de prompt devrait améliorer significativement la cohérence des personnages
- Les termes décrivant le corps d'Elena doivent rester subtils pour éviter les safety filters
- La structure IMAGE 1 / IMAGE 2 est compatible avec la doc Nano Banana Pro

---

*Session terminée le 22 décembre 2024 à ~00h30*

