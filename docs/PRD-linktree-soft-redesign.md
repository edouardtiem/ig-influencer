# PRD: Elena Linktree Soft Redesign

## Objectif
Transformer la landing page Elena (elenav.link) d'une page "hardcore" qui fait peur vers une page plus soft/premium qui convertit mieux, tout en gardant l'aspect sexy/teasing.

## Contexte
- **Bounce rate actuel** : 91%
- **Visiteurs** : 43 sur 7 jours
- **Problème identifié** : Images trop explicites qui peuvent faire fuir les visiteurs + manque de réassurance sur Fanvue

---

## Tâches

### Phase 1 : Modifications Linktree (Réassurance Fanvue)
**Status** : `[x] TERMINÉ`

**Objectif** : Ajouter des éléments de réassurance pour expliquer ce qu'est Fanvue et rassurer les visiteurs.

**Éléments ajoutés** :
1. ✅ Section "What is Fanvue?" expandable avec explication complète
2. ✅ Badges de confiance inline (Private, Secure, Cancel anytime)
3. ✅ Détails sur :
   - Discreet billing (apparaît comme "FV*")
   - 100% anonymous subscription
   - Secure payments via Stripe
   - Cancel anytime

**Fichiers modifiés** :
- `app/src/app/elena/components/MainCTA.tsx` - Ajout des trust badges et section expandable

**Critères de validation** :
- [x] Les badges s'affichent correctement
- [x] Le design reste cohérent avec le style existant (couleurs #E8A0BF, fonts Cormorant/Inter)
- [x] Pas d'erreurs lint sur MainCTA.tsx
- [x] Page accessible sur http://localhost:3000/elena

---

### Phase 2 : Génération d'images soft via NanoBananaPro
**Status** : `[ ] En attente`

#### Phase 2.1 : Test avec 1 image
**Status** : `[ ] En attente`

**Objectif** : Générer 1 image test pour valider le prompt et la qualité.

**Spécifications images** :
- **API** : Replicate NanoBananaPro (google/nano-banana-pro)
- **Références** : Images de référence Elena existantes (face + body)
- **Style** : Sexy/lingerie, suggestif mais pas explicite
- **Contrainte critique** : Visage NON visible ou partiellement caché
- **Lieux variés** : Salle de bain, gym, appartement, plage
- **Tenues** : Lingerie, string bikini, etc.

**Prompt guidelines** :
- Toujours inclure "face not visible", "looking away", "back to camera", etc.
- Éviter les termes trop explicites pour que NanoBananaPro génère
- Mettre l'accent sur l'esthétique premium/luxe

**Critères de validation** :
- [ ] Image générée avec succès
- [ ] Visage non visible ou partiellement caché
- [ ] Style sexy mais pas vulgaire
- [ ] Qualité suffisante pour la landing page

#### Phase 2.2 : Génération des 7 images finales
**Status** : `[ ] En attente`

**Objectif** : Générer 7 images variées :
- 6 images pour la galerie rotative
- 1 image featured (l'utilisateur choisira)

**Variété des images** :
1. Lingerie noire - appartement luxueux
2. String bikini - plage sunset
3. Lingerie blanche - salle de bain
4. Tenue sport sexy - gym
5. Silk robe - matin chambre
6. Lingerie rouge - lit hôtel
7. Bikini - piscine/yacht

---

### Phase 3 : Intégration des images dans le Linktree
**Status** : `[ ] En attente`

**Objectif** : Remplacer les images actuelles par les nouvelles images soft.

**Fichiers à modifier** :
- `app/src/app/elena/components/PhotoGallery.tsx`
- `app/src/app/elena/components/MainCTA.tsx` (image teaser)
- Dossier `public/elena/`

---

## Log des décisions et actions

### [Date: 2026-01-20]

**Action** : Création du PRD
**Décision** : Structurer le travail en 3 phases avec validation à chaque étape
**Prochaine étape** : Phase 1 - Modifications Linktree

---

## Notes techniques

### Références Elena pour NanoBananaPro
```
ELENA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png'
ELENA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png'
```

### NanoBananaPro API
- Modèle : `google/nano-banana-pro`
- Supporte jusqu'à 14 images de référence
- `safety_filter_level: "block_only_high"` pour plus de permissivité
- Aspect ratio : `4:5` pour format portrait Instagram

---
