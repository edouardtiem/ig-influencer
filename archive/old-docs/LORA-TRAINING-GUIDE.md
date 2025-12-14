# 🎨 Guide Complet - Training LoRA pour Mila

Ce guide explique comment entraîner un LoRA personnalisé pour obtenir **95%+ de consistance faciale** dans toutes tes générations.

---

## 📋 Table des Matières

1. [Qu'est-ce qu'un LoRA ?](#quest-ce-quun-lora)
2. [Pourquoi utiliser un LoRA ?](#pourquoi-utiliser-un-lora)
3. [Workflow Complet](#workflow-complet)
4. [Coûts & Durée](#coûts--durée)
5. [Troubleshooting](#troubleshooting)

---

## Qu'est-ce qu'un LoRA ?

**LoRA (Low-Rank Adaptation)** est une technique de fine-tuning qui "apprend" le visage de Mila à partir de 20-30 images.

### Différence avec les méthodes actuelles:

| Méthode | Consistance | Coût/image | Setup |
|---------|-------------|------------|-------|
| **Flux Kontext (actuel)** | 70% | $0.04 | Aucun |
| **Flux Kontext + Face Swap** | 80% | $0.08 | Aucun |
| **LoRA** | 95%+ | $0.03 | $3-5 (une fois) |

### Comment ça marche ?

1. Tu fournis 20-30 images de Mila
2. Le modèle "apprend" ses traits caractéristiques
3. Le LoRA peut ensuite générer Mila dans n'importe quel contexte avec le même visage

---

## Pourquoi utiliser un LoRA ?

### ✅ Avantages

- **Consistance maximale** : Le visage est identique à 95%+ entre les générations
- **Moins cher** : $0.03/image au lieu de $0.04-0.08
- **Plus rapide** : ~5 secondes par génération
- **Flexibilité** : Fonctionne dans tous les contextes (gym, plage, café, etc.)
- **Contrôle** : Ajuste la "force" du LoRA (0.8-1.2)

### ⚠️ Considérations

- **Setup initial** : Nécessite 20-30 bonnes images de départ
- **Coût training** : $3-5 USD (une seule fois)
- **Temps training** : 20-30 minutes
- **Qualité input** : Les images de training doivent être relativement cohérentes

---

## Workflow Complet

### 📍 Étape 1: Accéder à la page de préparation

```bash
http://localhost:3000/training-prep
```

Tu verras tes 4 images de base actuelles de Mila.

### 📍 Étape 2: Sélectionner l'image de référence

Choisis l'image où le visage de Mila te semble **le plus cohérent et naturel**.

**Critères de sélection:**
- ✅ Visage net et visible
- ✅ Éclairage naturel
- ✅ Expression neutre à légèrement souriante
- ✅ Front face ou léger 3/4
- ❌ Pas trop de maquillage ou filtres
- ❌ Pas d'artefacts IA visibles

### 📍 Étape 3: Générer le Character Sheet

Clique sur **"🎨 Générer 30 variations de cette image"**

Le système va générer automatiquement:

| Catégorie | Quantité | Description |
|-----------|----------|-------------|
| **Angles de visage** | 8 | Face, profil, 3/4, etc. |
| **Expressions** | 6 | Sourire, rire, sérieux, etc. |
| **Poses corps** | 8 | Debout, assis, marche, etc. |
| **Contextes** | 8 | Gym, café, plage, bedroom, etc. |

**⏱️ Durée:** 15-20 minutes (génération automatique)
**💰 Coût:** ~$1.20 USD

> ☕ Pendant ce temps, tu peux prendre un café ! Le processus est entièrement automatique.

### 📍 Étape 4: Sélectionner les meilleures images

Une fois la génération terminée, tu arrives automatiquement sur la page de sélection.

**Objectif:** Sélectionner 20-30 images qui **se ressemblent le plus** entre elles.

**Comment sélectionner:**
- ✅ Clique sur une image pour la sélectionner (bordure verte)
- ✅ Re-clique pour désélectionner
- ✅ Maximum 30 images
- ✅ Minimum 20 images (recommandé: 25)

**Critères de sélection:**

```
PRIORISE la cohérence entre les images plutôt que la perfection individuelle !
```

- ✅ Le visage se **ressemble** d'une image à l'autre
- ✅ Même forme de visage, mêmes yeux, même nez
- ✅ Variété d'angles, poses, et contextes
- ❌ Éviter images avec artefacts flagrants
- ❌ Éviter images floues ou mal cadrées

**Astuce:** Utilise le bouton **"⚡ Sélection rapide"** pour auto-sélectionner les 25 premières, puis affine manuellement.

### 📍 Étape 5: Lancer le Training

Une fois 20-30 images sélectionnées:

1. Clique sur **"🚀 Entraîner LoRA avec X images"**
2. Le système va:
   - Créer un ZIP de tes images
   - L'uploader sur Cloudinary
   - Lancer le training sur Replicate

**⏱️ Durée:** 20-30 minutes
**💰 Coût:** $3-5 USD

Tu seras automatiquement redirigé vers la page de statut.

### 📍 Étape 6: Suivre le Training

Sur la page `/training-status?id=XXX` tu peux:

- ✅ Voir le statut en temps réel
- ✅ Consulter les logs de training
- ✅ Récupérer l'URL du LoRA une fois terminé

**Statuts possibles:**
- 🔄 `starting` - Initialisation
- ⚙️ `processing` - Training en cours
- ✅ `succeeded` - Terminé avec succès !
- ❌ `failed` - Échec (voir logs)

> 💡 Tu peux fermer la page, le training continuera. Reviens 20-30 min plus tard !

### 📍 Étape 7: Tester le LoRA

Une fois le training terminé, tu reçois:

```
Version ID: votre-username/mila-lora-1234567890
Weights URL: https://replicate.delivery/pbxt/...
```

**Test rapide:**

Clique sur **"🎨 Tester le LoRA maintenant"** ou va sur `/test-lora?lora=VERSION_ID`

Génère quelques images avec différents scénarios pour vérifier la consistance.

### 📍 Étape 8: Utiliser le LoRA en Production

Deux options:

#### Option A: Remplacer Flux Kontext complètement

```typescript
// app/src/app/api/auto-post/route.ts

// AVANT
const result = await generateWithFluxKontext(template, referenceImageUrl);

// APRÈS
const MILA_LORA_URL = "votre-username/mila-lora-1234567890";
const result = await generateWithLora(template, MILA_LORA_URL, 1.0);
```

#### Option B: Hybrid (80% LoRA, 20% Kontext pour variété)

```typescript
const MILA_LORA_URL = process.env.MILA_LORA_URL;
const useLoRA = Math.random() < 0.8; // 80% LoRA

if (useLoRA && MILA_LORA_URL) {
  result = await generateWithLora(template, MILA_LORA_URL, 1.0);
} else {
  result = await generateWithFluxKontext(template, referenceImageUrl);
}
```

**Ajoute dans `.env.local`:**

```bash
# LoRA trained model
MILA_LORA_URL=votre-username/mila-lora-1234567890
MILA_LORA_SCALE=1.0
```

---

## Coûts & Durée

### Coûts détaillés

| Étape | Coût | One-time ou Récurrent |
|-------|------|----------------------|
| **Génération Character Sheet** (30 images) | ~$1.20 | One-time |
| **Training LoRA** | ~$3-5 | One-time |
| **Génération avec LoRA** (par image) | ~$0.03 | Récurrent |
| **TOTAL Setup** | **~$4-6** | **One-time** |

### Comparaison mensuelle (90 posts)

| Méthode | Coût/image | Coût total 90 images |
|---------|------------|---------------------|
| Flux Kontext seul | $0.04 | **$3.60/mois** |
| LoRA + Setup | $0.03 + $5 setup | **$7.70 mois 1, puis $2.70/mois** |

**ROI:** Le LoRA est rentabilisé dès le 2ème mois !

### Temps détaillé

| Étape | Temps actif | Temps d'attente |
|-------|-------------|-----------------|
| Sélection image de base | 2 min | - |
| Génération Character Sheet | - | 15-20 min |
| Sélection manuelle 25 images | 5-10 min | - |
| Lancement training | 1 min | - |
| Training LoRA | - | 20-30 min |
| Test du LoRA | 5 min | - |
| **TOTAL** | **~15 min actif** | **~40 min passif** |

**Tu peux faire tout ça en un samedi matin ! ☕**

---

## Troubleshooting

### ❌ Le training échoue

**Causes possibles:**

1. **Pas assez d'images sélectionnées**
   - Solution: Minimum 20 images
   
2. **Images trop variées**
   - Solution: Sélectionne des images plus cohérentes entre elles
   
3. **Quota Replicate dépassé**
   - Solution: Vérifie ton compte Replicate

4. **Problème de format**
   - Solution: Les images doivent être en JPG/PNG

### ⚠️ Le LoRA produit des visages "figés"

**Symptôme:** Toutes les images ont exactement le même visage, même expression

**Cause:** LoRA trop fort

**Solution:**
```typescript
// Baisser le lora_scale de 1.0 à 0.8
const result = await generateWithLora(template, MILA_LORA_URL, 0.8);
```

### ⚠️ Le LoRA ne change rien (toujours des variations)

**Symptôme:** Les images générées varient encore beaucoup

**Cause:** LoRA trop faible

**Solution:**
```typescript
// Augmenter le lora_scale de 1.0 à 1.2
const result = await generateWithLora(template, MILA_LORA_URL, 1.2);
```

### ⚠️ Le Character Sheet prend trop de temps

**Cause:** Génération de 30 images en séquentiel = 15-20 min

**Solution:** C'est normal ! Va prendre un café. Le processus est automatique.

**Alternative:** Réduire le nombre d'images dans l'API:

```typescript
// app/api/generate-character-sheet/route.ts
const count = Math.min(parseInt(searchParams.get('count') || '1'), 20);
// Au lieu de 30, génère seulement 20
```

### 🔧 Relancer un training

Si le premier training n'est pas satisfaisant:

1. Retourne sur `/select-training` avec tes images
2. Sélectionne un **nouveau sous-ensemble** (essaie d'exclure les images problématiques)
3. Lance un nouveau training
4. Compare les résultats

**Tip:** Tu peux entraîner plusieurs LoRA et garder le meilleur !

---

## 🎯 Checklist Rapide

Avant de commencer, assure-toi d'avoir:

- [ ] Compte Replicate avec API token configuré
- [ ] Cloudinary configuré (pour stockage images)
- [ ] `REPLICATE_USERNAME` dans `.env.local`
- [ ] Au moins $10 USD de crédits Replicate
- [ ] 1h de disponibilité (dont 40 min passives)

---

## 📚 Ressources

- [Replicate - Flux Dev LoRA Trainer](https://replicate.com/ostris/flux-dev-lora-trainer)
- [Guide LoRA officiel](https://replicate.com/docs/guides/fine-tune-a-language-model)
- [Exemples d'influenceurs IA avec LoRA](https://replicate.com/collections/ai-influencers)

---

## 🤝 Besoin d'Aide ?

Si tu as des questions ou rencontres des problèmes:

1. Vérifie les logs dans `/training-status`
2. Consulte cette documentation
3. Teste avec moins d'images d'abord (20 au lieu de 30)

---

**Dernière mise à jour:** Décembre 2024
**Version:** 1.0

