# ✅ DONE-025 — Explicit Reference Prompts

**Date** : 22 décembre 2024  
**Version** : v2.17.0

---

## 📋 Résumé

Implémentation d'un système de prompts explicite pour Nano Banana Pro qui indique clairement quelle image de référence utiliser pour le visage (IMAGE 1) et pour le corps (IMAGE 2), améliorant significativement la cohérence des personnages générés.

---

## 🎯 Problème résolu

Les photos générées d'Elena avaient :
- Cheveux trop foncés (pas assez de balayage blond)
- Visage parfois trop "mannequin" (anguleux au lieu de doux)
- Bijoux signature pas toujours présents

**Cause** : Le prompt ne précisait pas quelle référence utilisée pour quoi.

---

## ✅ Solution

### Nouveau format de REFERENCE_INSTRUCTION

```javascript
`You are provided with reference images in order:

**IMAGE 1 (FACE REFERENCE)**: Copy this EXACTLY:
- [liste détaillée des caractéristiques faciales]

**IMAGE 2 (BODY REFERENCE)**: Match these proportions:
- [liste détaillée des proportions corporelles]

CRITICAL RULES:
- Face MUST be identical to Image 1
- Body MUST match Image 2
- [négatifs explicites]`
```

### FINAL_CHECK ajouté

Répétition des critères clés à la fin du prompt pour renforcement.

---

## 📁 Fichiers modifiés

- `app/scripts/scheduled-post.mjs` — Config CHARACTERS avec explicit refs
- `app/scripts/carousel-post.mjs` — Mila explicit prompts
- `app/scripts/carousel-post-elena.mjs` — Elena explicit prompts
- `app/scripts/photo-reel-post.mjs` — Mila explicit prompts
- `app/scripts/photo-reel-post-elena.mjs` — Elena explicit prompts
- `app/scripts/video-reel-post.mjs` — Mila explicit prompts
- `app/scripts/duo-post.mjs` — Both characters explicit mapping
- `app/scripts/sauna-reel-v2.mjs` — Mila explicit prompts

---

## 🧪 Résultats

Test Elena Suède : ✅ Amélioration visible
- Cheveux bronde avec balayage blond VISIBLE
- Bijoux gold signature présents
- Visage plus doux et harmonieux

---

## 🔗 Documentation

- [Session complète](../docs/SESSION-22-DEC-2024-EXPLICIT-PROMPTS.md)

