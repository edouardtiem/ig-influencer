# 📍 Session — Elena Apartment Locations

**Date** : 17 décembre 2024  
**Durée** : ~30min

---

## 🎯 Objectif

Créer des images de référence pour l'appartement d'Elena (sans Elena) afin d'assurer la cohérence visuelle des lieux dans les générations futures.

---

## ✅ Ce qui a été fait

### 1. Analyse des photos existantes
À partir de 3 photos d'Elena dans son appartement, identification des éléments clés :
- **Salon** : Canapé velours mauve, parquet chevron, vue toits Paris, plantes
- **Salle de bain** : Marbre Calacatta blanc/gris, robinetterie dorée, grande fenêtre
- **Chambre** : Vanity Hollywood, lit crème, tons beige/rose poudré

### 2. Génération des images de référence
3 images générées via Nano Banana Pro (empty room photography) :
- Salon : `replicate-prediction-aphj5sddfxrmc0cv5sf8eqe2pw`
- Chambre : `replicate-prediction-nnns47vwgdrme0cv5shbd0b224`
- Salle de bain : `replicate-prediction-cq10n9h3jsrma0cv5sgrn0x5mr`

### 3. Création de `locations-elena.ts`
Nouveau fichier de configuration avec :
- Interface `ElenaLocation`
- 5 locations définies (3 avec ref, 2 sans)
- Prompts détaillés pour chaque lieu
- Fonctions helper (`getElenaLocation`, `hasLocationReference`, etc.)

### 4. Mise à jour de `carousel-post-elena.mjs`
- Ajout de `LOCATION_REFS` avec les URLs Cloudinary
- Flag `hasLocationRef` sur chaque location
- Prompts mis à jour : "Based on the provided location reference image..."
- Logique de génération : ajoute la ref du lieu si disponible

---

## 📁 Fichiers créés/modifiés

| Fichier | Action | Description |
|---------|--------|-------------|
| `app/src/config/locations-elena.ts` | ✨ Créé | Config des lieux avec refs Cloudinary |
| `app/scripts/carousel-post-elena.mjs` | 📝 Modifié | Ajout refs lieux + prompts améliorés |

---

## 🖼️ URLs des références

```
SALON (loft_living):
https://res.cloudinary.com/dily60mr0/image/upload/v1766009920/replicate-prediction-aphj5sddfxrmc0cv5sf8eqe2pw_c0otnl.png

CHAMBRE (loft_bedroom):
https://res.cloudinary.com/dily60mr0/image/upload/v1766009918/replicate-prediction-nnns47vwgdrme0cv5shbd0b224_d0ghoj.png

SALLE DE BAIN (bathroom_luxe):
https://res.cloudinary.com/dily60mr0/image/upload/v1766009922/replicate-prediction-cq10n9h3jsrma0cv5sgrn0x5mr_swbswr.png
```

---

## 🏠 Éléments clés de l'appartement Elena

### Palette cohérente
| Élément | Couleurs |
|---------|----------|
| Murs | Blanc |
| Sol | Parquet chêne miel, chevron |
| Velours | Rose mauve poudré |
| Accents | Or/laiton, crème, beige |
| Plantes | Vert tropical |

### Style
- **Aesthetic** : Italian-Parisian luxury, Instagram-ready
- **Vibe** : Expensive but lived-in
- **Architecture** : Haussmannien 8e arrondissement
- **Vue** : Toits zinc Paris

---

## 📋 À faire prochaine session

- [ ] Générer photo de référence pour `cafe_paris`
- [ ] Générer photo de référence pour `spa_luxe`
- [ ] Tester génération avec refs lieux (carousel test)

---

## 💡 Notes

- Les prompts des lieux commencent par "Based on the provided location reference image" pour forcer la cohérence
- Le script utilise maintenant 3 références : face + body + location (quand dispo)
- Le café et spa n'ont pas encore de ref, génération normale

---

*Session terminée — Locations Elena configurées* ✅

