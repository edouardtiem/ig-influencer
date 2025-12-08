# ⚠️ OBSOLÈTE - TODO Prochaine Session

> **Ce document est obsolète.** La validation de Nano Banana Pro est terminée et la migration complète a été effectuée le 3 décembre 2024.
> 
> **Nano Banana Pro est maintenant la solution unique de production.**
> 
> Pour les prochaines étapes, voir [`TODO-DEMAIN.md`](TODO-DEMAIN.md) (amélioration character sheet, photos de base, lieux récurrents, etc.)

---

**Contexte original** : Validation et mise en production Nano Banana Pro  
**Date prévue** : 3 Décembre 2024  
**Durée estimée** : 2-3 heures  
**Statut final** : ✅ Nano Banana Pro validé et en production (v2.3.0)

---

## 🔴 PRIORITÉ CRITIQUE - Validation Nano

### ✅ TODO 1 : Tests Consistance Détails (30 min)

**Objectif** : Valider que Nano + références maintient les détails constants

**Actions** :
- [ ] Aller sur `http://localhost:3000/test-nanobanana`
- [ ] S'assurer que le toggle "Références" est **ON**
- [ ] Générer 5 images avec scénarios variés :
  - [ ] Gym (closeup visage)
  - [ ] Café (mid-shot)
  - [ ] Plage (full body)
  - [ ] Bedroom (intime)
  - [ ] Evening (glam)

**Validation** :
- [ ] Naviguer entre les 5 images avec ← →
- [ ] Vérifier : Grain de beauté **au même endroit** sur 5/5 images
- [ ] Vérifier : Taches de rousseur **cohérentes** sur 4/5 minimum
- [ ] Vérifier : Proportions corporelles **identiques** sur 5/5
- [ ] Vérifier : Couleur cheveux **copper auburn** sur 5/5

**Critère Go** : ≥4/5 sur tous les critères

**Si Go** : ✅ Procéder TODO 2-3-4  
**Si No-Go** : ⚠️ Activer Plan B (LoRA training avec les 11 images Flux)

---

### ✅ TODO 2 : Mesurer Performance Réelle (10 min)

**Objectif** : Collecter métriques coût et temps

**Actions** :
- [ ] Générer 3 images supplémentaires
- [ ] Noter pour chaque :
  - Temps de génération (affiché sur la page)
  - Aller sur Replicate dashboard → noter coût exact
- [ ] Calculer moyenne :
  - Temps moyen : ___ secondes
  - Coût moyen : $___

**Validation** :
- [ ] Temps < 90 secondes → ✅ Acceptable
- [ ] Coût < $0.06 → ✅ Acceptable
- [ ] Si coût > $0.08 → ⚠️ Réévaluer vs Flux

---

### ✅ TODO 3 : Comparaison Directe Flux vs Nano (15 min)

**Objectif** : Benchmark côte-à-côte sur même prompt

**Actions** :
- [ ] Aller sur `http://localhost:3000/compare-models`
- [ ] Cliquer "🚀 Lancer la Comparaison" **3 fois**
- [ ] Pour chaque paire, évaluer :
  - [ ] Quelle image a le meilleur réalisme ?
  - [ ] Quelle image respecte mieux le prompt ?
  - [ ] Laquelle préfères-tu pour Instagram ?

**Résultat attendu** : Nano gagne sur 2/3 des critères minimum

---

## 🟡 PRIORITÉ HAUTE - Optimisation Prompts

### ✅ TODO 4 : Enrichir Character.ts (20 min)

**Objectif** : Prompts ultra-détaillés pour Nano Banana Pro

**Actions** :

**Fichier** : `app/src/config/character.ts`

**Sections à enrichir** :

#### A. Features (Détails faciaux)

Remplacer :
```typescript
features: 'small beauty mark near left lip'
```

Par :
```typescript
features: `
  DISTINCTIVE PERMANENT MARKS (never change):
  - Small round beauty mark (2mm diameter, dark brown) 
    positioned EXACTLY 2mm above left lip corner
  - Natural freckles (18-22 total) scattered across nose 
    bridge, more concentrated on nose tip
  - 3 freckles cluster on left upper cheekbone
  - Light freckles on shoulders (sun exposure marks)
  
  NEVER: tattoos, additional piercings, scars
`
```

#### B. Body (Proportions exactes)

Remplacer :
```typescript
body: 'tall fit athletic body, toned slim waist, natural bust, long legs'
```

Par :
```typescript
body: `
  180cm tall, 58kg athletic build,
  natural C-cup bust (proportionate, not enhanced),
  slim toned waist (65cm) with subtle visible abs,
  hip measurement 88cm (subtle hourglass),
  long legs (inseam 90cm), defined quads and calves,
  shoulder width 38cm (athletic but feminine),
  arms toned from pilates (not bulky)
`
```

#### C. Hair (Détails précis)

Ajouter :
```typescript
hair_details: `
  copper auburn color with natural highlights,
  wavy texture (2B-2C pattern),
  mid-length (shoulder length, ~40cm),
  natural shine, healthy appearance,
  slightly frizzy texture (authentic, not perfect),
  side part on left
`
```

**Test** :
- [ ] Sauvegarder modifications
- [ ] Générer 2 images avec nouveau prompt
- [ ] Comparer avec images précédentes
- [ ] Valider amélioration de précision

---

## 🟢 PRIORITÉ MOYENNE - Migration & Setup

### ✅ TODO 5 : Migration Cloudinary (30 min)

**Objectif** : URLs permanentes pour les 4 photos de base

**Actions** :
- [ ] Télécharger localement les 4 images de base depuis Replicate
- [ ] Uploader sur Cloudinary dans folder `mila-base-portraits/`
- [ ] Noter les 4 nouvelles URLs Cloudinary
- [ ] Mettre à jour `.env.local` :
  ```bash
  MILA_BASE_FACE_URL=https://res.cloudinary.com/...
  MILA_REFERENCE_URLS=https://res.cloudinary.com/...,https://...
  ```
- [ ] Tester génération avec nouvelles URLs
- [ ] Valider : Aucune différence de qualité

**Backup** : Garder anciennes URLs en commentaire dans `.env.local`

---

### ✅ TODO 6 : Intégration Production Auto-Post (45 min)

**Objectif** : Remplacer Flux par Nano dans le workflow automatique

**Actions** :

#### A. Modifier auto-post (15 min)

**Fichier** : `app/src/app/api/auto-post/route.ts`

**Changement** :
```typescript
// AVANT
const result = await generateWithFluxKontext(template, referenceImageUrl);

// APRÈS
import { generateWithNanaBanana } from '@/lib/replicate';
import { getBasePortraits } from '@/config/base-portraits';

const { primaryFaceUrl, referenceUrls } = getBasePortraits();
const references = [primaryFaceUrl, ...referenceUrls];
const result = await generateWithNanaBanana(template, references);
```

#### B. Ajouter variable de contrôle (5 min)

**Fichier** : `.env.local`

```bash
# Generation model control
USE_NANO_BANANA=true  # Set to false to rollback to Flux
```

**Fichier** : `app/src/app/api/auto-post/route.ts`

```typescript
const useNano = process.env.USE_NANO_BANANA === 'true';

if (useNano) {
  result = await generateWithNanaBanana(template, references);
} else {
  result = await generateWithFluxKontext(template, referenceImageUrl);
}
```

#### C. Tests workflow complet (25 min)

- [ ] Test 1 : Appeler `/api/auto-post` localement
- [ ] Vérifier : Image générée avec Nano + références
- [ ] Vérifier : Upload Cloudinary réussi
- [ ] Test 2 : Webhook Make.com
- [ ] Vérifier : Image reçue dans Buffer
- [ ] Test 3 : Publication Instagram (compte test ou draft)
- [ ] Vérifier : Post publié correctement

**Rollback** : Si problème, `USE_NANO_BANANA=false`

---

## 📊 TODO 7 : A/B Testing Initial (Cette Semaine)

**Objectif** : Valider impact sur engagement

**Protocole** :

### Phase A : Baseline (2 jours)
- [ ] Publier 3 posts avec **Nano Banana Pro**
- [ ] Noter : Likes, comments, saves, reach après 24h
- [ ] Moyennes : L=___, C=___, S=___, R=___

### Phase B : Comparaison (2 jours)
- [ ] Comparer avec 3 derniers posts **Flux Kontext**
- [ ] Calculer : Différence % sur chaque métrique
- [ ] Noter : Commentaires sur "consistance visage"

### Critères de Succès

| Métrique | Objectif |
|----------|----------|
| Likes | Stable ou +10% |
| Comments | Stable ou +15% |
| Saves | +20% |
| Commentaires positifs | Aucun commentaire sur inconsistance |

---

## 🔧 TODO 8 : Monitoring & Alertes (Future)

**Objectif** : Système de surveillance production

**Actions futures** :
- [ ] Dashboard Notion avec métriques quotidiennes
- [ ] Alerte si coût Nano > $0.08/image
- [ ] Alerte si temps génération > 120s
- [ ] Alerte si taux échec > 5%
- [ ] Review hebdomadaire analytics

---

## 📝 TODO 9 : Documentation Continue

**Cette semaine** :
- [ ] Mettre à jour 06-NANO-BANANA-PRO-MIGRATION.md avec résultats tests
- [ ] Compléter section "Tests & Validation"
- [ ] Ajouter screenshots comparaisons
- [ ] Documenter best practices prompts

**Mois prochain** :
- [ ] Créer 07-STORIES-AUTOMATION.md
- [ ] Créer 08-ANALYTICS-DASHBOARD.md
- [ ] Créer 09-GROWTH-TACTICS.md

---

## ⚠️ Risques à Surveiller

### Risque 1 : Nano pas assez constant en production
**Probabilité** : 🟢 Faible (tests positifs)  
**Mitigation** : Code LoRA prêt en backup  
**Action si occurence** : Switch `USE_NANO_BANANA=false`

### Risque 2 : Coût Nano trop élevé
**Probabilité** : 🟡 Moyenne  
**Mitigation** : Monitoring après 50 images  
**Action si occurence** : Analyse ROI, potentiel retour Flux

### Risque 3 : Rate limit Nano aussi strict
**Probabilité** : 🟢 Faible  
**Mitigation** : Ajouter crédits Replicate ($10-20)  
**Action si occurence** : Auto-recharge à $20 minimum

---

## 🎯 Résultats Attendus Fin de Semaine

### Livrables

- [x] Documentation complète session (✅ FAIT)
- [ ] Nano validé en production
- [ ] 5-10 posts Instagram avec Nano
- [ ] Métriques performance collectées
- [ ] Décision Go/No-Go définitive

### Métriques de Succès

| KPI | Cible |
|-----|-------|
| **Consistance détails** | >90% |
| **Coût moyen** | <$0.06 |
| **Temps moyen** | <90s |
| **Engagement vs baseline** | ≥100% |
| **Commentaires négatifs** | 0 |

---

## 📞 Points de Décision

### Decision Point 1 : Après TODO 1 (Tests)

**Question** : Nano maintient-il les détails constants ?

- **Si OUI** → Continuer TODO 2-8 (production)
- **Si NON** → Plan B : LoRA training avec 11 images Flux

### Decision Point 2 : Après TODO 6 (Production)

**Question** : Workflow complet fonctionne en production ?

- **Si OUI** → Scaler à 3 posts/jour
- **Si NON** → Debug, fix, retest

### Decision Point 3 : Après TODO 7 (A/B Testing)

**Question** : Engagement améliore ou stable ?

- **Si OUI** → Migration 100% Nano définitive
- **Si NEUTRE** → Continuer monitoring
- **Si NON** → Analyser causes, ajuster

---

## 🚀 Quick Actions (5 min chacune)

**Avant de commencer la prochaine session** :

- [ ] Vérifier serveur Next.js tourne
- [ ] Vérifier crédits Replicate disponibles
- [ ] Vérifier Buffer connecté à Instagram
- [ ] Review cette TODO list
- [ ] Ouvrir `/test-nanobanana` dans navigateur

---

## 📚 Documentation Référence

**Pour cette session, consulter** :
- [docs/06-NANO-BANANA-PRO-MIGRATION.md](docs/06-NANO-BANANA-PRO-MIGRATION.md)
- [SESSION-02-DEC-2024.md](SESSION-02-DEC-2024.md)
- [CHANGELOG.md](CHANGELOG.md) v2.2.0

---

**Créé le** : 2 Décembre 2024, 23h00  
**Statut** : 🟢 Prêt pour prochaine session  
**Prochaine revue** : Après validation Nano

---

*Checklist vivante - Update après chaque session*

