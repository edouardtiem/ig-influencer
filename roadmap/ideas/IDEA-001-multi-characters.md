# IDEA-001 — Univers Multi-Personnages (Mila + Elena)

> Ajouter un deuxième personnage Instagram (Elena) best friend de Mila, avec des posts en duo réguliers

**Status** : 🚧 In Progress — Branche `feature/elena-character`  
**Impact** : 🔴 High — Double l'audience potentielle + effet réseau  
**Effort** : 🔴 High — ~10-15h de développement  
**Proposé** : 16 décembre 2024  

---

## 💡 Concept

Créer **Elena**, un personnage complémentaire à Mila :
- Style luxe/sensuel (vs Mila athleisure/artistique)
- Best friend de Mila
- Posts réguliers ensemble (1x tous les 2 jours)
- Chaque personnage a son propre compte Instagram
- Cross-tagging systématique sur les posts duo

### Elena - Profil Proposé

| Élément | Valeur |
|---------|--------|
| **Nom** | Elena (nom de famille TBD) |
| **Âge** | 24 ans |
| **Origine** | Milan, Italie (vit à Paris) |
| **Occupation** | Model / Fashion Stylist |
| **Style** | Luxe sensuel, habits moulants, classe italienne |
| **Physique** | Plus grande (175cm), brune lisse, traits sharp, lèvres pulpeuses, poitrine généreuse (F-cup) |
| **Signature** | Bracelet en or massif, rouge à lèvres nude, regard intense |

### Différenciation Mila vs Elena

| Aspect | Mila | Elena |
|--------|------|-------|
| **Vibe** | Girl next door sexy | Luxe inaccessible sexy |
| **Style** | Athleisure + Artistique | High fashion + Glamour |
| **Cheveux** | Copper auburn bouclés | Brun foncé lisse long |
| **Physique** | Athlétique curvy (168cm) | Grande élancée (175cm) |
| **Énergie** | Warm, approachable | Confident, mysterious |
| **Hobbies** | Fitness, photo, guitare | Mode, voyages, restaurants |

---

## 🎯 Problème résolu

1. **Croissance plafonnée** : Un seul personnage = croissance linéaire limitée
2. **Engagement plateau** : Les followers s'habituent au même contenu
3. **Effet réseau nul** : Pas de cross-promotion possible
4. **Monotonie** : Toujours le même visage devient ennuyeux

---

## 📊 Impact potentiel

### Métriques estimées

| KPI | Avant (Mila seule) | Après (Mila + Elena) |
|-----|-------------------|---------------------|
| Posts/jour | 5 | 10-11 |
| Followers total | X | 2X à 3X |
| Engagement moyen | Y% | Y+20% (duo boost) |
| Revenue potentiel | Z | 2.5Z |

### Avantages stratégiques

- **Cross-promotion** : Chaque compte fait grandir l'autre
- **Contenu varié** : 3 types de posts (Mila solo, Elena solo, duo)
- **Storytelling** : "Best friends" = narrative engageante
- **A/B testing** : Comparer ce qui marche pour chaque style
- **Réseau d'influence** : Base pour ajouter d'autres personnages plus tard

---

## 🔧 Implémentation envisagée

### Phase 1 : Character Setup (3-4h)

1. **Character Sheet Elena** (`docs/03-PERSONNAGE-ELENA.md`)
   - Copier le format de Mila
   - Définir physique, style, personnalité, backstory
   - Créer les prompts de génération

2. **Dataset Initial** (4-6 photos)
   - Générer via Midjourney/SDXL pour consistance
   - Uploader sur Cloudinary
   - Définir PRIMARY_FACE_URL et FACE_REFS

3. **Config Code** (`app/src/config/character-elena.ts`)
   - Copier/adapter character.ts

### Phase 2 : Solo Posts Elena (2.5h)

1. **Script** (`app/scripts/carousel-post-elena.mjs`)
   - Copier carousel-post.mjs
   - Remplacer MILA_BASE par ELENA_BASE
   - Remplacer face refs
   - Adapter captions

2. **GitHub Action** (`auto-post-elena.yml`)
   - Copier auto-post.yml
   - Utiliser secrets ELENA
   - Décaler horaires (alternance avec Mila)

### Phase 3 : Duo Posts (4h)

1. **Script** (`app/scripts/duo-post.mjs`)
   ```javascript
   // Pseudo-code
   
   // 1. Générer image de base avec 2 femmes
   const basePrompt = `Two beautiful women friends...`;
   const baseImage = await generateWithNanoBanana(basePrompt);
   
   // 2. Face-swap Mila
   const withMila = await faceSwap(baseImage, MILA_PRIMARY_FACE, 'left');
   
   // 3. Face-swap Elena
   const finalImage = await faceSwap(withMila, ELENA_PRIMARY_FACE, 'right');
   
   // 4. Uploader
   const cloudinaryUrl = await uploadToCloudinary(finalImage);
   
   // 5. Publier sur les 2 comptes
   await publishDuo(cloudinaryUrl, captionMila, captionElena);
   ```

2. **Face-Swap Service** (`app/src/lib/faceswap.ts`)
   - Utiliser `lucataco/faceswap` sur Replicate
   - Support multi-face (position left/right)

3. **GitHub Action** (`duo-post.yml`)
   - Cron 1x/jour ou 1x/2 jours
   - Besoin des secrets des 2 comptes

### Phase 4 : Instagram Setup

1. **Créer compte Instagram** @elena.xxx
2. **Configurer Business Account**
3. **Obtenir tokens API** (même process que Mila)
4. **Ajouter secrets GitHub**

---

## 📁 Structure fichiers finale

```
/app
├── scripts/
│   ├── carousel-post.mjs          # Mila (existant)
│   ├── carousel-post-elena.mjs    # Elena (nouveau)
│   └── duo-post.mjs               # Duo (nouveau)
├── src/
│   ├── config/
│   │   ├── character.ts           # Mila (existant)
│   │   └── character-elena.ts     # Elena (nouveau)
│   └── lib/
│       └── faceswap.ts            # Service face-swap (nouveau)

/.github/workflows/
├── auto-post-mila.yml             # Mila (renommer)
├── auto-post-elena.yml            # Elena (nouveau)
└── duo-post.yml                   # Duo (nouveau)

/docs/
├── 03-PERSONNAGE.md               # Mila (existant)
└── 03-PERSONNAGE-ELENA.md         # Elena (nouveau)
```

---

## 🔐 Secrets GitHub nécessaires

```yaml
# Existants (Mila)
REPLICATE_API_TOKEN
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
INSTAGRAM_ACCESS_TOKEN
INSTAGRAM_ACCOUNT_ID

# À ajouter (Elena)
INSTAGRAM_ACCESS_TOKEN_ELENA
INSTAGRAM_ACCOUNT_ID_ELENA
```

---

## 📅 Calendrier de posting suggéré

### Option A : Alternance complète

| Heure | Lundi | Mardi | Mercredi | Jeudi | Vendredi | Samedi | Dimanche |
|-------|-------|-------|----------|-------|----------|--------|----------|
| 8h30 | Mila | Elena | Mila | Elena | Mila | Elena | Mila |
| 11h | Elena | Mila | Elena | Mila | Elena | Mila | Elena |
| **13h** | **DUO** | - | **DUO** | - | **DUO** | - | **DUO** |
| 17h | Mila | Elena | Mila | Elena | Mila | Elena | Mila |
| 21h | Elena | Mila | Elena | Mila | Elena | Mila | Elena |

**Total/semaine** : ~17 posts Mila, ~17 posts Elena, 4 posts duo

### Option B : Duo quotidien

| Heure | Posts |
|-------|-------|
| 8h30 | Mila |
| 10h | Elena |
| **13h** | **DUO** |
| 17h | Mila |
| 19h | Elena |
| 21h | Mila ou Elena (alterné) |

**Total/jour** : 3 Mila, 3 Elena, 1 duo = 7 posts

---

## 💰 Budget mensuel estimé

| Service | Coût actuel | Coût futur | Delta |
|---------|-------------|------------|-------|
| Nano Banana Pro | ~$3/mois | ~$7/mois | +$4 |
| Kling Reels | ~$6/mois | ~$12/mois | +$6 |
| Face-swap (duo) | $0 | ~$3/mois | +$3 |
| **TOTAL** | **~$9/mois** | **~$22/mois** | **+$13** |

ROI attendu : Audience 2-3x → Revenue 2.5x pour +$13/mois

---

## ⚠️ Risques / Contraintes

### Risques techniques

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Face-swap incohérent | Moyen | High | Tester plusieurs modèles |
| 2 visages mal positionnés | Moyen | Medium | Prompts précis + retry |
| Rate limit Replicate | Low | Medium | Espacement des calls |
| Token Instagram expire | Low | High | Monitoring + refresh auto |

### Risques business

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Confusion followers | Low | Medium | Personnalités très différentes |
| Cannibalisation | Low | Low | Cross-promo systématique |
| Coûts trop élevés | Low | Medium | Monitoring budget strict |

---

## 📝 Notes

### Pourquoi Elena et pas un autre nom ?

- Elena = prénom italien classique
- Sonne bien avec "Mila & Elena"
- Facile à prononcer en français et anglais
- Assez différent de Mila pour éviter confusion

### Alternatives de noms envisagées

- **Chiara** (trop similaire à "Mila" phonétiquement)
- **Sofia** (trop commun)
- **Valentina** (trop long)
- **Giulia** (prononciation française difficile)

### Backstory (validé)

> Elena et Mila se sont rencontrées sur un shooting à Paris. Elena, mannequin pour une marque luxe, semblait inaccessible avec son blazer Bottega et son regard glacial. Jusqu'à ce que Mila (la photographe) remarque son t-shirt Blondie vintage caché dessous. "T'écoutes Blondie ?!" — elles ont fini la soirée dans un bar rock du 11e arrondissement. Depuis, inséparables.

### Concept clé : "Opposées en surface, similaires au fond"

| | **Elena** | **Mila** |
|---|-----------|----------|
| **Apparence** | Luxe, chic, inaccessible | Athleisure, punk rock, accessible |
| **Au fond** | Punk rock, rebelle cachée | Peut être ultra glam quand elle veut |
| **Ce qu'on voit** | La fashionista froide | La sportive cool |
| **Ce qu'on découvre** | Elle écoute du Nirvana en secret | Elle sort en soirée Tour Eiffel |

---

## 🔗 Références

- [Lucataco FaceSwap](https://replicate.com/lucataco/faceswap) — Modèle face-swap recommandé
- [docs/03-PERSONNAGE.md](../../docs/03-PERSONNAGE.md) — Character sheet Mila
- [docs/03-PERSONNAGE-ELENA.md](../../docs/03-PERSONNAGE-ELENA.md) — Character sheet Elena ✨ NEW
- [docs/06-NANO-BANANA-PRO-MIGRATION.md](../../docs/06-NANO-BANANA-PRO-MIGRATION.md) — Fonctionnement références

---

## ✅ Prochaines étapes

1. [x] Valider le concept Elena (nom, style, personnalité) ✅
2. [x] Character sheet créé (`docs/03-PERSONNAGE-ELENA.md`) ✅ — VERSION 3
3. [x] Config code créée (`app/src/config/character-elena.ts`) ✅
4. [x] Dataset initial généré (6 photos de référence) ✅
5. [x] Premier post duo Mila + Elena testé (Café de Flore) ✅
6. [x] Audience target Elena créée (`docs/characters/elena/AUDIENCE.md`) ✅
7. [x] Script `carousel-post-elena.mjs` créé ✅
8. [x] Workflow `auto-post-elena.yml` créé ✅
9. [x] Créer le compte Instagram @elenav.paris ✅
10. [ ] Configurer Business Account + tokens API
11. [ ] Upload face refs sur Cloudinary + secrets GitHub
12. [ ] Premiers posts manuels Elena
13. [ ] Go live !

---

*Créé le 16 décembre 2024*
*Mis à jour le 16 décembre 2024*


