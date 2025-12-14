# 📸 Workflow "Copy & Adapt" — Reproduire un Post Influencer

> **🎯 OBJECTIF** : Partager des screenshots d'un post influencer que tu aimes,  
> l'IA analyse et génère la même chose pour Mila dans son style.

---

## 🔄 Vue d'ensemble

```
Screenshots Influencer → Analyse IA → Prompts Mila → Nano Banana Pro → Post Manuel
```

**Temps estimé** : 10-15 minutes (selon nombre de photos)

---

## 📋 Comment Utiliser ce Workflow

### Étape 1 : Partager les Screenshots

1. Trouver un post Instagram que tu veux reproduire
2. Faire des screenshots de chaque photo du carrousel
3. Partager les images dans le chat

**Exemples de ce qu'on peut reproduire :**
- Carrousel mirror selfie
- Série outfit du jour
- Beach/vacation photos
- Gym/fitness content
- Street style
- Home/cozy vibes

---

### Étape 2 : Analyse Automatique

L'IA va analyser chaque photo et extraire :

| Élément | Ce qu'on analyse |
|---------|------------------|
| **Pose** | Position du corps, angle, expression faciale |
| **Tenue** | Vêtements, couleurs, style |
| **Setting** | Lieu, décor, lumière |
| **Mood** | Ambiance générale, vibe |
| **Composition** | Cadrage, angle caméra |
| **Consistance Scène** | Est-ce la même scène entre les photos ? |

**🔍 Détection Automatique du Niveau de Consistance :**

```
Si même pièce/décor dans toutes les photos → CONSISTANCE FORTE requise
Si lieux différents → CONSISTANCE FAIBLE (pas de ref scène)
```

---

### Étape 3 : Adaptation pour Mila

L'IA adapte automatiquement :
- ✅ La tenue → style Mila (French girl, sportive)
- ✅ Le lieu → appartement Paris / lieux de Mila
- ✅ Les traits physiques → caractéristiques Mila
- ✅ L'ambiance → son vibe (confident, warm, naturelle)

---

### Étape 4 : Génération avec Consistance

**Références utilisées automatiquement :**
1. **Face references** (4 photos) → consistance visage
2. **Location reference** → consistance décor (appartement Mila si home)
3. **Best generated photo** → consistance scène pour le reste du carrousel

**Process carrousel :**
```
Photo 1 → générée avec refs face + location
Photo 2+ → générée avec refs face + location + MEILLEURE photo précédente
```

---

### Étape 4b : Logique de Sélection de Référence Scène

> **🎯 CRITIQUE** : Pour les carrousels où la scène doit rester identique (même pièce, même décor),
> l'IA doit choisir quelle photo générée utiliser comme référence scène.

#### Quand Forcer la Consistance Scène ?

| Type de Carrousel | Consistance Scène | Référence à Utiliser |
|-------------------|-------------------|----------------------|
| Mirror selfie (même miroir) | **FORTE** | Meilleure photo comme ref principale |
| Même pièce, poses différentes | **FORTE** | Doubler la ref scène (2x) |
| Lieux différents (voyage) | Faible | Pas de ref scène nécessaire |
| Outfit change même lieu | **FORTE** | Photo avec meilleur décor |

#### Algorithme de Sélection

```
1. Générer Photo 1
2. Vérifier qualité Photo 1 :
   - ✅ Pas d'artefacts
   - ✅ Décor correct
   - ✅ Lumière cohérente
   
3. Si Photo 1 OK → utiliser comme ref pour Photo 2+
4. Si Photo 1 KO → générer Photo 2 sans ref scène
   
5. Après génération complète :
   - Identifier la MEILLEURE photo (décor + qualité)
   - Regénérer les photos problématiques avec cette ref
```

#### Technique de Renforcement Scène

Pour forcer une scène identique, **doubler la référence** :

```javascript
// Normal (consistance moyenne)
const references = [photo2Ref, ...faceRefs];

// Renforcé (consistance forte)  
const references = [photo2Ref, photo2Ref, ...faceRefs];
```

**Dans le prompt, ajouter :**
```
CRITICAL: Use EXACT SAME ROOM and BACKGROUND as reference image.
Same mirror, same door, same floor, same walls, same lighting.
Only the pose changes.
```

---

### Étape 5 : Publication Manuelle

Une fois les images générées :
1. Les URLs Cloudinary sont fournies
2. Tu télécharges et postes toi-même sur Instagram
3. Caption suggéré fourni (à adapter)

---

## 🎨 Template Prompt (utilisé automatiquement)

```
[STYLE] 2025 instagram style, photorealistic Instagram photo, natural lighting, authentic candid feel, amateur photo feel,

[CHARACTER - BASE] Mila, 22 year old French woman, Mediterranean European features, personal trainer physique,

[FACE DETAILS] 
- oval elongated face shape with high defined cheekbones
- copper auburn hair type 3A loose curls, shoulder-length, natural volume, slightly messy texture
- almond-shaped hazel-green eyes with golden flecks
- straight nose with slightly upturned tip
- naturally full lips medium thickness, subtle asymmetry
- natural full eyebrows slightly arched
- light tan Mediterranean skin tone, healthy glow, natural skin texture with subtle pores visible

[DISTINCTIVE MARKS - CRITICAL]
- small dark brown beauty mark (2mm) exactly 2mm above left lip corner
- medium brown beauty mark (2.5mm) center of right cheekbone
- thin gold necklace with minimalist star pendant (always visible)

[BODY - PROPORTIONS] 
- slim athletic physique, 168cm tall
- natural curves, toned body
- defined waist with subtle visible abs
- toned shoulders (Pilates-sculpted, feminine)
- long lean legs with definition

[CLOTHING] {{ADAPTÉ DE L'ORIGINAL}},

[POSE & EXPRESSION] {{REVERSE-ENGINEERED}},

[SETTING] {{ADAPTÉ POUR MILA}},

[LIGHTING] {{SELON SCÈNE}},

[MOOD] confident, warm, naturally sensual, authentic, effortless French girl vibe,

[QUALITY] high resolution, sharp focus on face, natural skin texture, Instagram-ready, no text on image,
```

---

## 🚫 Negative Prompt (toujours inclus)

```
cartoon, anime, illustration, 3D render, CGI, deformed face, deformed body, blurry, bad anatomy, extra limbs, watermark, text, logo, oversaturated, plastic skin, wrong hair color, straight hair, tattoos, glasses, heavy makeup, floating objects, artifacts
```

---

## 📍 Références Lieux Disponibles

| Lieu | ID | Pour |
|------|-----|------|
| Chambre Mila | `home_bedroom` | Morning routines, bed content |
| Salon Mila | `home_living_room` | Mirror selfies, cozy vibes |
| KB Café | `cafe_kb` | Coffee content |
| Gym | `gym_paris` | Fitness content |

---

## ✅ Checklist Qualité

Avant de valider une image générée :

- [ ] Pas d'objets flottants / artefacts IA
- [ ] Décor consistant entre les photos
- [ ] Cheveux copper auburn bouclés ✓
- [ ] Collier étoile doré visible ✓
- [ ] Pas de texte/watermark sur l'image ✓
- [ ] Pose naturelle, pas rigide ✓

---

## 🔧 Si Bug de Génération

**Problèmes courants :**

| Problème | Cause | Solution |
|----------|-------|----------|
| Objet flottant | Artefact IA | Regénérer avec meilleure photo en ref |
| Décor différent | Ref scène absente/faible | Doubler la ref scène (2x) |
| Visage différent | Face refs manquantes | Vérifier 4 face refs utilisées |
| Scène incohérente | Mauvaise photo de ref | Choisir meilleure photo comme ref |

**Process de Correction :**

```
1. Identifier la meilleure photo du lot (décor + qualité)
2. L'utiliser comme référence PRINCIPALE (avant les face refs)
3. Optionnel : doubler cette ref pour renforcer
4. Ajouter "EXACT SAME ROOM" dans le prompt
5. Regénérer uniquement les photos problématiques
```

**Exemple de références pour correction :**
```javascript
// Photo 2 est la meilleure → on corrige photo 3
const references = [
  photo2Ref,      // Ref scène principale
  photo2Ref,      // Doublée pour renforcement
  ...faceRefs     // 4 refs visage
];
```

---

## 📚 Références

- **Personnage Mila** → [03-PERSONNAGE.md](./03-PERSONNAGE.md)
- **Lieux actifs** → [11-LIEUX-ACTIFS.md](./11-LIEUX-ACTIFS.md)
- **Script génération** → `app/scripts/generate-mirror-selfie-carousel.mjs`

---

*Dernière mise à jour : Décembre 2024*
