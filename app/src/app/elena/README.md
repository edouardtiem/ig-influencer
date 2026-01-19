# Elena Linktree - Setup Guide

## Quick Start

La page est accessible sur `/elena`

## Assets à ajouter

### 1. Vidéo Background
Copie ta vidéo dans : `public/elena/video-bg.mp4`

```bash
# Depuis ton bureau :
cp ~/Desktop/replicate-prediction-ba4tvq9zbnrmw0cvhb1syjdshm.mp4 public/elena/video-bg.mp4
```

**Optimisation recommandée** (pour réduire la taille) :
```bash
ffmpeg -i video-bg.mp4 -vcodec libx264 -crf 28 -preset fast -vf scale=720:-2 -an video-bg-optimized.mp4
```

### 2. Image Poster (fallback vidéo)
Crée une image poster pour le fallback : `public/elena/video-poster.jpg`

```bash
# Extraire une frame de la vidéo :
ffmpeg -i public/elena/video-bg.mp4 -ss 00:00:01 -frames:v 1 public/elena/video-poster.jpg
```

### 3. Avatar Elena
Ajoute une photo de profil : `public/elena/avatar.jpg`
- Taille recommandée : 200x200px minimum
- Format : JPG ou WebP

### 4. Photos Galerie (avec emojis)
Ajoute 5-6 photos censurées dans : `public/elena/gallery/`
- `photo-1.jpg`, `photo-2.jpg`, etc.
- Les emojis peuvent être ajoutés via Big Lust ou en post-traitement

### 5. Image Teaser (CTA)
Ajoute une image teaser : `public/elena/teaser.jpg`
- Format 16:9 recommandé
- Suggestif mais pas trop explicite

## Configuration

### URLs à mettre à jour

Dans `components/MainCTA.tsx` :
```typescript
const fanvueUrl = `https://fanvue.com/VOTRE_USERNAME?ref=linktree...`
```

Dans `components/SecondaryLinks.tsx` :
```typescript
{ name: "Instagram", url: "https://instagram.com/VOTRE_USERNAME" },
{ name: "TikTok", url: "https://tiktok.com/@VOTRE_USERNAME" },
```

## Activer les vraies images

Dans chaque composant, décommente les balises `<img>` et commente les placeholders.

### ProfileSection.tsx
```tsx
<img src="/elena/avatar.jpg" alt="Elena" className="..." />
```

### PhotoGallery.tsx
```tsx
const galleryItems = [
  { id: 1, src: "/elena/gallery/photo-1.jpg", emoji: "🔥" },
  // ...
];
```

### MainCTA.tsx
```tsx
<img src="/elena/teaser.jpg" alt="Preview" className="..." />
```

## Domaine Custom

1. Achète un domaine (ex: elena.link)
2. Dans Vercel Dashboard → Settings → Domains
3. Ajoute ton domaine
4. Configure les DNS chez ton registrar

## Analytics

Vercel Analytics est activable en 2 clics dans le dashboard Vercel :
1. Va sur ton projet Vercel
2. Analytics → Enable

## A/B Testing Timer

Les données de timer sont dans `sessionStorage`. Pour analyser les conversions :
- Le paramètre `timer=XX` est inclus dans l'URL Fanvue
- Tu peux voir dans Fanvue Analytics quel timer convertit le mieux

## Structure des fichiers

```
app/src/app/elena/
├── page.tsx           # Page principale
├── layout.tsx         # Layout avec metadata SEO
├── README.md          # Ce fichier
└── components/
    ├── AgeVerification.tsx
    ├── VideoBackground.tsx
    ├── ProfileSection.tsx
    ├── CountdownTimer.tsx
    ├── MainCTA.tsx
    ├── PhotoGallery.tsx
    ├── SocialProof.tsx
    ├── SecondaryLinks.tsx
    └── NotificationToast.tsx

app/public/elena/
├── video-bg.mp4       # Vidéo background
├── video-poster.jpg   # Fallback image
├── avatar.jpg         # Photo de profil
├── teaser.jpg         # Image CTA
└── gallery/
    ├── photo-1.jpg
    ├── photo-2.jpg
    └── ...
```
