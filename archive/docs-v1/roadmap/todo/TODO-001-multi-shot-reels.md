# TODO-001 — Multi-Shot Reels (Carousel → Video)

> Transformer un carousel de 3 photos en un reel de 12-15 secondes avec transitions

**Status** : 📋 Todo  
**Priorité** : 🔴 High  
**Estimation** : 4h  
**Créé** : 15/12/2024  
**Terminé** : -  

---

## 📋 Description

Créer un pipeline qui prend 3 images d'un carousel existant, génère un clip vidéo pour chacune avec Kling, puis les assemble en un seul reel avec FFmpeg.

```
CAROUSEL (3 photos)                    REEL FINAL (12-15s)
┌─────────┐                            ┌─────────────────────┐
│ Photo 1 │ ──► Kling 4s ──►          │ Clip 1 (4s)         │
├─────────┤                   FFmpeg   │ ↓ transition        │
│ Photo 2 │ ──► Kling 4s ──► ═══════► │ Clip 2 (4s)         │
├─────────┤                            │ ↓ transition        │
│ Photo 3 │ ──► Kling 4s ──►          │ Clip 3 (4s)         │
└─────────┘                            └─────────────────────┘
```

---

## 🎯 Objectifs

- [ ] Créer fonction `generateMultiShotReel(images[], prompts[])`
- [ ] Implémenter téléchargement clips Replicate → local
- [ ] Implémenter assemblage FFmpeg avec transitions
- [ ] Support ajout musique optionnel
- [ ] Upload final sur Cloudinary
- [ ] Tester avec `gym-carousel/`

---

## 🔧 Implémentation

### Workflow

```typescript
async function createMultiShotReel(carouselPath) {
  const images = getCarouselImages(carouselPath);
  const clips = await Promise.all(images.map(generateKlingClip));
  const localClips = await downloadClips(clips);
  const finalReel = await ffmpegConcat(localClips, { transition: 'fade' });
  return await uploadToCloudinary(finalReel);
}
```

### Fichiers

```
src/lib/ffmpeg.ts         # Nouveau
src/lib/kling.ts          # Extension
```

---

## 💰 Coût

- 3 clips × $0.40 = **$1.20/reel**
- Même coût qu'un clip 12s mais plus dynamique

---

## 📝 Notes

- Avantage : réutilise les carousels existants
- Plus de variété visuelle (multi-angle)
- Look plus professionnel

---

## 🔗 Liens

- Feature parent : [IP-001](../in-progress/IP-001-reels-pipeline.md)
- Doc : [17-VIDEO-REELS-PIPELINE.md](../../docs/17-VIDEO-REELS-PIPELINE.md)

