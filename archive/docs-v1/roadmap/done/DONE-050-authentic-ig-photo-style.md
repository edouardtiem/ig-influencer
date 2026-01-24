# DONE-050: Authentic IG Photo Style

**Status**: ✅ Done  
**Date**: 3 janvier 2026  
**Version**: v2.40.0  
**Durée**: ~30min

---

## 📋 Objectif

Améliorer le style des photos générées pour qu'elles ressemblent davantage aux vraies photos Instagram d'influenceuses : plus de variété de cadrage, couleurs naturelles non filtrées, environnement visible, poses diverses.

---

## 🔧 Changements effectués

### 1. Section STYLE mise à jour (3 fichiers)

**Avant:**
```
STYLE: 2026 instagram style picture, ultra realistic Instagram photo...
professional photography, soft focus background
```

**Après:**
```
STYLE: Shot on iPhone 15 Pro, RAW unedited authentic look
- NO Instagram filters, NO heavy color grading, natural flat colors
- Real indoor lighting (warm lamps, cool window light, blue screen glow - mix naturally)
- Environment VISIBLE around subject - show the room, objects, messy details
- Subject takes 50-70% of frame, NOT perfectly centered, breathing room around
- Natural skin with texture and imperfections (not airbrushed smooth)
- Candid energy like friend took it without warning
AVOID: Professional studio, magazine editorial, stock photo, heavy retouching, perfect centering, saturated colors
```

### 2. Variations de cadrage ajoutées pour carousels

Chaque image d'un carousel a maintenant une instruction de cadrage différente :

| Image | Cadrage | Description |
|-------|---------|-------------|
| **1** | Medium shot | Sujet 60% du cadre, environnement visible, pas centré parfaitement |
| **2** | Close-up | Épaules et visage, 70% du cadre, profondeur de champ faible, portrait intime |
| **3** | Candid | Angle inattendu, détails environnement (lit défait, téléphone visible), cadrage imparfait |

---

## 📁 Fichiers modifiés

- `app/scripts/scheduled-post.mjs` - STYLE + actionVariations (2 endroits)
- `app/scripts/carousel-post.mjs` - STYLE + framingInstructions
- `app/scripts/carousel-post-elena.mjs` - STYLE + framingInstructions

---

## 🎯 Impact

- ✅ **Affecte les posts d'aujourd'hui** : Les images sont générées au moment du post (pas pré-générées)
- ✅ **Plus de variété** : Chaque carousel aura 3 compositions différentes
- ✅ **Style plus naturel** : Couleurs moins saturées, peau avec texture, environnement visible
- ✅ **Authenticité** : Plus proche des vraies photos IG d'influenceuses

---

## 📊 Inspirations (références analysées)

Posts Instagram analysés :
- @enidsullins (Nashville) - Robe blanche, poses variées
- @brittany__mills (Gold Coast) - Selfies miroir salle de bain, environnement visible
- @mayalanez__ (Germany) - Chambre désordonnée, poses naturelles, couleurs bleues TV
- @cami.evangelista - Ascenseur, balcon, poses diverses
- @fit_aitana (Barcelone) - Street style, cabine téléphone
- @itsmad.morgan (Los Angeles) - Intérieur voiture, différentes expressions

**Observations clés** :
- Environnement toujours visible (pas juste le sujet)
- Couleurs naturelles/désaturées
- Poses variées dans un même carousel
- Objets visibles (téléphone, volant, tasse, draps)
- Cadrage pas toujours centré

---

## 📝 Notes

- La stratégie du scheduler (actions, outfits) reste inchangée
- Les posts déjà schedulés bénéficient des changements car l'image est générée à l'exécution
- Pour des changements plus structurels (templates de carousel), il faudra modifier le scheduler pour les futurs posts

---

## 🔗 Liens

- Issue: N/A (amélioration continue)
- PR: Direct commit sur main

