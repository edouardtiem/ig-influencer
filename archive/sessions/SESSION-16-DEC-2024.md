# Session 16 Décembre 2024 — Analyse Multi-Personnages (Elena)

## 🎯 Objectif de la session

Analyser la faisabilité d'ajouter un deuxième personnage Instagram (Elena) qui serait l'amie de Mila, avec des posts en duo réguliers.

---

## 📝 FIN DE SESSION — À SAUVEGARDER

**Date** : 16 décembre 2024
**Durée** : ~1h

### ✅ Ce qui a été fait cette session :
1. Analyse complète du projet existant (structure, configs, scripts, workflows)
2. Étude de faisabilité pour un 2ème personnage (Elena)
3. Documentation détaillée de l'architecture multi-personnages proposée
4. Identification des défis techniques pour les photos en duo

### 📁 Fichiers créés/modifiés :
- `docs/SESSION-16-DEC-2024.md` — Cette session
- `roadmap/ideas/IDEA-001-multi-characters.md` — Documentation détaillée du concept multi-personnages
- `ROADMAP.md` — Mise à jour des entrées

### 🚧 En cours (non terminé) :
- Rien - session d'analyse uniquement, pas d'implémentation

### 📋 À faire prochaine session :
- [ ] Définir le character sheet complet d'Elena (physique, style, personnalité)
- [ ] Créer le dataset initial (4-6 photos cohérentes via Midjourney/SDXL)
- [ ] Créer le compte Instagram Elena + obtenir tokens API
- [ ] Créer `app/src/config/character-elena.ts`
- [ ] Créer `app/scripts/carousel-post-elena.mjs` (copier/adapter de Mila)
- [ ] Créer `.github/workflows/auto-post-elena.yml`
- [ ] Implémenter `app/scripts/duo-post.mjs` avec face-swap double
- [ ] Créer `.github/workflows/duo-post.yml`

### 🐛 Bugs découverts :
- Aucun

### 💡 Idées notées :
- **Elena** : Style luxe sensuel, habits moulants, italienne de Milan, 24 ans
- **Photos duo** : Utiliser face-swap double (générer 2 femmes → swap les 2 visages)
- **Modèle face-swap** : `lucataco/faceswap` sur Replicate
- **Calendrier duo** : 1 post duo tous les 2 jours (4/semaine)
- **Cross-tagging** : Chaque post duo tagge l'autre compte

### 📝 Notes importantes :
- Le projet actuel supporte déjà très bien un 2ème personnage (architecture modulaire)
- Le défi principal est la génération de photos à 2 personnes spécifiques
- Estimation temps d'implémentation : 10-15h
- Nécessite de nouveaux secrets GitHub pour le 2ème compte Instagram

---

## 📊 Analyse technique effectuée

### 1. Structure actuelle du projet

```
Fichiers clés pour les personnages :
├── docs/03-PERSONNAGE.md          # Character sheet Mila
├── app/src/config/character.ts    # Config code Mila
├── app/scripts/carousel-post.mjs  # Script post avec MILA_BASE hardcodé

Fichiers pour l'automatisation :
├── .github/workflows/auto-post.yml      # Cron 4x/jour Mila
├── .github/workflows/vacation-reel.yml  # Cron 1x/jour vacances
```

### 2. Comment Mila est générée

```javascript
// Dans carousel-post.mjs
const MILA_BASE = `Mila, 22 year old French woman, Mediterranean European features,
  copper auburn hair type 3A loose curls shoulder-length with natural volume,
  almond-shaped hazel-green eyes with golden flecks,
  // ... etc

const PRIMARY_FACE_URL = 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png';
const FACE_REFS = [
  'https://res.cloudinary.com/.../Photo_2_q8kxit.png',
  'https://res.cloudinary.com/.../Photo_3_nopedx.png',
];
```

### 3. Architecture proposée pour multi-personnages

```
Structure future :
├── docs/
│   ├── 03-PERSONNAGE.md           # Mila (existant)
│   └── 03-PERSONNAGE-ELENA.md     # Elena (nouveau)
├── app/src/config/
│   ├── character.ts               # Mila (existant)
│   └── character-elena.ts         # Elena (nouveau)
├── app/scripts/
│   ├── carousel-post.mjs          # Mila (existant)
│   ├── carousel-post-elena.mjs    # Elena (nouveau)
│   └── duo-post.mjs               # Les deux (nouveau)
├── .github/workflows/
│   ├── auto-post.yml              # Mila (renommer en auto-post-mila.yml)
│   ├── auto-post-elena.yml        # Elena (nouveau)
│   └── duo-post.yml               # Duo (nouveau)
```

### 4. Secrets GitHub nécessaires

```yaml
# Existants (Mila)
INSTAGRAM_ACCESS_TOKEN
INSTAGRAM_ACCOUNT_ID

# À ajouter (Elena)
INSTAGRAM_ACCESS_TOKEN_ELENA
INSTAGRAM_ACCOUNT_ID_ELENA
```

### 5. Solution technique pour photos duo

**Option recommandée : Face-Swap Double**

```
1. Générer image de base avec 2 femmes génériques
   ↓
2. Face-swap visage Mila sur personne de gauche
   ↓
3. Face-swap visage Elena sur personne de droite
   ↓
4. Publier sur les 2 comptes avec cross-tags
```

---

## 🗓️ Planning d'implémentation suggéré

| Phase | Tâches | Durée estimée |
|-------|--------|---------------|
| **Phase 1** | Character sheet + Dataset Elena | 3-4h |
| **Phase 2** | Config code + Script solo Elena | 2h |
| **Phase 3** | GitHub Action Elena | 30min |
| **Phase 4** | Script duo + face-swap | 3-4h |
| **Phase 5** | GitHub Action duo | 30min |
| **Phase 6** | Tests & debug | 2-3h |
| **TOTAL** | | **10-15h** |

---

## 💰 Impact budget mensuel

| Service | Mila seule (actuel) | Mila + Elena (futur) |
|---------|--------------------|--------------------|
| Nano Banana Pro | ~$3/mois | ~$6-8/mois |
| Kling Reels | ~$6/mois | ~$12/mois |
| Face-swap (duo) | $0 | ~$2-3/mois |
| **TOTAL** | **~$9/mois** | **~$20-25/mois** |

---

## 🔗 Références

- [Lucataco FaceSwap](https://replicate.com/lucataco/faceswap) - Modèle recommandé pour duo
- [docs/03-PERSONNAGE.md](./03-PERSONNAGE.md) - Character sheet Mila (template)
- [docs/06-NANO-BANANA-PRO-MIGRATION.md](./06-NANO-BANANA-PRO-MIGRATION.md) - Fonctionnement références images

---

**Status** : 📋 Analyse complète, prêt pour implémentation
*16 décembre 2024*


