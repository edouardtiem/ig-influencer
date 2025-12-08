# 🚀 Quick Start Guide

> Guide rapide pour démarrer et utiliser le projet localement

---

## ⚡ Démarrage rapide

### 1. Installation

```bash
cd app
npm install
```

### 2. Configuration

Copier les variables d'environnement :

```bash
cp env.example.txt .env.local
```

Remplir `.env.local` avec vos clés API :

```env
# Replicate (génération images)
REPLICATE_API_TOKEN=r8_xxxxx

# Cloudinary (hébergement images permanent)
CLOUDINARY_CLOUD_NAME=dxxxxx
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=xxxxx

# Make.com (publication Instagram)
MAKE_WEBHOOK_URL=https://hook.eu1.make.com/xxxxx

# Portraits de référence (depuis Cloudinary)
MILA_BASE_FACE_URL=https://res.cloudinary.com/.../primary.jpg
MILA_REFERENCE_URLS=https://res.cloudinary.com/.../ref1.jpg,https://...

# Sécurité (pour cron jobs en production)
CRON_SECRET=un-secret-fort-aleatoire
```

### 3. Lancer le serveur

```bash
npm run dev
```

→ Ouvrir [http://localhost:3000](http://localhost:3000)

---

## 🎯 Workflows courants

### Générer des portraits de référence

1. Aller sur [http://localhost:3000/select-base](http://localhost:3000/select-base)
2. Cliquer sur **"+ Portrait x3"** (face-focused) ou **"🧍 Full Body x3"** (silhouette complète)
3. Attendre 30-60 secondes
4. **Sélectionner** les meilleurs portraits (clic sur image)
5. Cliquer **"☁️ Upload to Cloudinary"**
6. Une fois uploadés, cliquer **"⚙️ Export Config"**
7. Copier la config affichée dans `.env.local`
8. Redémarrer le serveur : `npm run dev`

### Tester la génération d'une image

**Option 1 : Via UI**
1. Aller sur [http://localhost:3000/test](http://localhost:3000/test)
2. Cliquer **"Generate Test Image"**
3. Voir le résultat

**Option 2 : Via API**
```bash
curl http://localhost:3000/api/test-generate
```

### Publier un post sur Instagram

**Prérequis :**
- Scenario Make.com activé en mode "Immediately"
- Buffer connecté au compte Instagram

```bash
curl -X POST http://localhost:3000/api/auto-post \
  -H "Authorization: Bearer test-secret"
```

Vérifier ton Instagram pour voir le post ! 📱

---

## 📡 Endpoints API

### `GET /api/status`

Vérifier l'état des services configurés

```bash
curl http://localhost:3000/api/status
```

### `POST /api/auto-post`

Générer et publier un post automatiquement

```bash
curl -X POST http://localhost:3000/api/auto-post \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### `GET /api/test-generate`

Tester la génération d'image sans publier

```bash
curl http://localhost:3000/api/test-generate
```

### `POST /api/generate-base`

Générer des portraits de base (utilisé par l'UI `/select-base`)

```bash
curl -X POST "http://localhost:3000/api/generate-base?count=3&aspectRatio=4:5"
```

### `GET /api/current-references`

Voir les références actuellement configurées

```bash
curl http://localhost:3000/api/current-references
```

---

## 🎨 Modifier le contenu

### Ajouter un nouveau template

Éditer `app/src/config/prompts.ts` :

```typescript
{
  type: 'casual',
  clothing: 'description des vêtements',
  pose: 'description de la pose',
  setting: 'description du décor',
  captions: [
    'Caption en français 🔥',
    'Autre caption possible',
  ],
  hashtags: ['#hashtag1', '#hashtag2', '#french', '#english'],
}
```

### Modifier le personnage

Éditer `app/src/config/character.ts` :

```typescript
export const CHARACTER = {
  name: 'Mila Verne',
  physical: {
    age: 22,
    height: '180cm',
    hair: 'copper auburn wavy shoulder length',
    // ... autres propriétés
  },
  // ... reste de la config
}
```

### Ajuster les poids de distribution

Dans `app/src/config/prompts.ts`, fonction `getWeightedRandomTemplate()` :

```typescript
const weights: Record<ContentType, number> = {
  lifestyle: 40,   // 40%
  fitness: 30,     // 30%
  summer: 15,      // 15%
  sexy_light: 10,  // 10%
  sexy_medium: 5,  // 5%
};
```

---

## 🔧 Troubleshooting

### Erreur : "REPLICATE_API_TOKEN not configured"

→ Vérifier que `.env.local` existe et contient `REPLICATE_API_TOKEN`
→ Redémarrer le serveur

### Erreur : "Webhook returned 410"

→ Le scenario Make.com n'est pas activé
→ Aller sur Make.com → activer en mode "Immediately"

### Images ne se génèrent pas

→ Vérifier les crédits Replicate : [https://replicate.com/account](https://replicate.com/account)
→ Minimum ~$5-10 de crédits recommandés

### Cloudinary upload échoue

→ Vérifier les credentials dans `.env.local`
→ Si URL Replicate expirée (>1h), regénérer une nouvelle image

### Les posts n'apparaissent pas sur Instagram

→ Vérifier Buffer dans Make.com (profil correctement connecté)
→ Vérifier les logs Make.com pour erreurs
→ Tester avec une URL publique (ex: Unsplash) pour isoler le problème

---

## 📊 Monitoring

### Vérifier les logs du serveur

Le terminal affiche les logs en temps réel :

```
[2024-12-02T14:17:14.559Z] Starting auto-post...
[2024-12-02T14:17:14.559Z] Selected template: fitness
[2024-12-02T14:17:14.559Z] Generating image with face swap...
[2024-12-02T14:17:44.123Z] Image generated: https://replicate.delivery/...
[2024-12-02T14:17:44.123Z] Caption: Corps et esprit alignés...
[2024-12-02T14:17:44.123Z] Publishing to Instagram via Make.com...
[2024-12-02T14:17:45.456Z] Published successfully!
```

### Vérifier les coûts Replicate

[https://replicate.com/account/billing](https://replicate.com/account/billing)

Coût moyen : **~$0.05-0.06 par image** (Nano Banana Pro)

---

## 🚀 Déploiement (production)

Voir [04-IMPLEMENTATION.md](./04-IMPLEMENTATION.md) section "Déploiement"

**Résumé rapide :**

1. **Déployer sur Vercel**
   ```bash
   cd app
   vercel --prod
   ```

2. **Ajouter les variables d'environnement sur Vercel Dashboard**

3. **Configurer cron job sur [cron-job.org](https://cron-job.org)**
   - URL : `https://votre-app.vercel.app/api/auto-post`
   - Method : POST
   - Header : `Authorization: Bearer YOUR_CRON_SECRET`
   - Schedule : 10h et 18h (2x/jour)

---

## 📚 Ressources

- [Documentation complète](./README.md)
- [Implémentation technique](./04-IMPLEMENTATION.md)
- [Character sheet](./03-PERSONNAGE.md)
- [Stratégie monétisation](./02-MONETISATION.md)

---

*Dernière mise à jour : 2 décembre 2024*

