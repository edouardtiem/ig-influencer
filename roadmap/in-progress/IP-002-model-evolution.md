# IP-002 — Model Evolution Strategy

> Évolution stratégique de Mila et Elena pour maximiser la viralité

---

## 📋 Résumé

Faire évoluer nos deux AI models pour les différencier davantage et créer plus de potentiel viral, tout en respectant leur physique existant.

---

## 🎯 Objectifs

### 1. Mila — Évolutions

| Changement | Status |
|------------|--------|
| Cheveux **Tesla Cherry Wine Red** | ✅ Test validé + Cloudinary |
| Tatouage distinctif simple | 📋 À définir |
| Nouvelles photos de référence (5 images) | 📋 À générer |
| Prompts mis à jour | 📋 À faire |

**Couleur finale** : Tesla Cherry Wine Red
- Deep cherry red avec burgundy undertones
- Inspiré Tesla Ultra Red
- Glossy, saturé, luxueux

**Images test Cloudinary** :
- https://res.cloudinary.com/dily60mr0/image/upload/v1766362372/mila-tesla-red/mila-tesla-red-exact.jpg
- https://res.cloudinary.com/dily60mr0/image/upload/v1766362373/mila-tesla-red/mila-cherry-burgundy-gloss.jpg

### 2. Elena — Évolutions

| Changement | Status |
|------------|--------|
| Cheveux **blonde platine** | 📋 À tester |
| Nouvelles photos de référence | 📋 À générer |
| Prompts mis à jour | 📋 À faire |

### 3. Positionnement Relationnel

| Changement | Status |
|------------|--------|
| Bisexuelles (pas juste gay) | 📋 À annoncer |
| Open relationship | 📋 À annoncer |
| Power dynamic visible | 📋 À implémenter |

---

## 🔧 Découverte Technique

### Le Format Correct pour Nano Banana Pro

**❌ Ne fonctionne PAS :**
```javascript
reference_images: [url1, url2, url3]
```

**✅ Fonctionne :**
```javascript
// 1. Convertir en base64
const base64Images = await Promise.all(urls.map(url => urlToBase64(url)));

// 2. Passer dans image_input
image_input: base64Images
```

**Prompt gagnant :**
```
can you please try to reproduce the exact same woman provided in the 5 pictures. 
but you'll have one mission. change her hair colors to DEEP AUBURN RED. 
simply create a portrait as on photo provided 1. with the new color. 
don't change anything else
```

---

## ✅ Fait

- [x] Recherche AI influencers viraux (Lil Miquela, Aitana, Belle Delphine, etc.)
- [x] Analyse psychologie audience masculine
- [x] Décisions stratégiques (bi/open, power dynamic)
- [x] Décisions physiques Mila (red hair, tatouage)
- [x] Décisions physiques Elena (blonde platine)
- [x] Test Mila red hair avec Nano Banana Pro
- [x] Découverte format base64 + image_input
- [x] Validation résultat Mila red hair

---

## 📋 À Faire

### Phase 1 — Mila Red Hair (Priorité 1)
- [ ] Générer 5 nouvelles photos de référence (Photo_1 à Photo_5 version red)
- [ ] Uploader sur Cloudinary
- [ ] Mettre à jour constantes dans `carousel-post.mjs`
- [ ] Mettre à jour prompts ("deep auburn red")
- [ ] Tester carousel complet

### Phase 2 — Elena Blonde (Priorité 2)
- [ ] Créer script test Elena blonde
- [ ] Valider résultat
- [ ] Générer nouvelles références
- [ ] Mettre à jour prompts

### Phase 3 — Documentation (Priorité 3)
- [ ] Mettre à jour `docs/03-PERSONNAGE.md`
- [ ] Mettre à jour `docs/03-PERSONNAGE-ELENA.md`
- [ ] Mettre à jour `docs/21-REFERENCE-SYSTEM.md` avec découverte base64

### Phase 4 — Tatouage Mila (Priorité 4)
- [ ] Décider du design
- [ ] Tester génération
- [ ] Valider emplacement

### Phase 5 — Storyline (Priorité 5)
- [ ] Planifier annonce bi/open
- [ ] Post "nouveau look" Mila
- [ ] Préparer storyline fiançailles

---

## 📁 Fichiers Concernés

| Fichier | Modification |
|---------|--------------|
| `scripts/carousel-post.mjs` | Références + prompts Mila |
| `scripts/carousel-post-elena.mjs` | Références + prompts Elena |
| `docs/03-PERSONNAGE.md` | Description Mila |
| `docs/03-PERSONNAGE-ELENA.md` | Description Elena |
| `docs/21-REFERENCE-SYSTEM.md` | Format base64 |

---

## 📊 Scripts de Test Créés

| Script | Description |
|--------|-------------|
| `test-mila-red-hair.mjs` | Tests multi-modèles |
| `test-mila-red-nanobanana.mjs` | Test Nano Banana URLs |
| `test-mila-red-nanobanana-v2.mjs` | Test prompts structurés |
| `test-mila-red-nanobanana-v3.mjs` | Test prompts ultra-spécifiques |
| `test-mila-red-nanobanana-v4.mjs` | Test single reference |
| `test-mila-red-winning-prompt.mjs` | **✅ VERSION FINALE base64** |

---

## 🔗 Liens

- Session complète : [SESSION-22-DEC-2024-MODEL-EVOLUTION.md](../../docs/SESSION-22-DEC-2024-MODEL-EVOLUTION.md)
- Memory créée : ID 12474874 (Mila & Elena évolutions validées)

---

*Créé le 22 décembre 2024*

