# Session 22 Décembre 2024 — Fix Cloudinary Auto-Post

## 📝 FIN DE SESSION — À SAUVEGARDER

**Date** : 22 Décembre 2024
**Durée** : ~30min

### ✅ Ce qui a été fait cette session :

1. **Diagnostic du problème** : Les posts automatiques de Mila n'étaient pas publiés ce matin
2. **Identification de la cause** : Cloudinary a changé sa configuration pour rejeter les "unsigned uploads" avec `upload_preset: 'ml_default'`
3. **Fix appliqué** : Conversion vers des **signed uploads** avec signature SHA1 dans `scheduled-post.mjs`
4. **Vérification** : Post de Mila 08:00 publié avec succès après le fix

### 📁 Fichiers modifiés :

- `app/scripts/scheduled-post.mjs` — Ajout de `crypto` import et signatures SHA1 pour les uploads images et vidéos
- `app/scripts/cron-executor.mjs` — Nettoyage des logs de debug
- `app/scripts/check-schedules.mjs` — Nettoyage des logs de debug

### 🚧 En cours (non terminé) :

- Rien, le fix est complet et vérifié

### 📋 À faire prochaine session :

- [ ] Vérifier que les posts automatiques fonctionnent correctement dans les prochaines heures
- [ ] Surveiller les logs GitHub Actions pour le Content Brain

### 🐛 Bugs découverts :

- **Cloudinary Unsigned Upload Blocked** : Le preset `ml_default` n'accepte plus les uploads non signés. Le message d'erreur était : `"Upload preset must be whitelisted for unsigned uploads"`. Fix : utiliser des signed uploads avec signature SHA1.

### 💡 Idées notées :

- Les scripts legacy (`carousel-post.mjs`, `photo-reel-post.mjs`, etc.) utilisaient déjà des signed uploads, donc ils fonctionnent. Seul `scheduled-post.mjs` (utilisé par Content Brain) avait le bug.

### 📝 Notes importantes :

#### Flux Content Brain
```
1. cron-scheduler.mjs (7h Paris)
   └── Génère le plan du jour dans Supabase

2. cron-executor.mjs (toutes les 30 min)
   └── Vérifie les posts à publier
       └── Appelle scheduled-post.mjs

3. scheduled-post.mjs
   └── Génère images (Replicate Nano Banana Pro)
   └── Upload vers Cloudinary (SIGNED UPLOAD)
   └── Publie sur Instagram
```

#### Signed Upload Cloudinary
```javascript
// Générer la signature
const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
const signature = crypto
  .createHash('sha1')
  .update(paramsToSign + process.env.CLOUDINARY_API_SECRET)
  .digest('hex');

// FormData avec signature
formData.append('public_id', publicId);
formData.append('timestamp', timestamp.toString());
formData.append('api_key', process.env.CLOUDINARY_API_KEY);
formData.append('signature', signature);
```

---

**Commit** : `fix(cloudinary): use signed uploads to fix 'Upload preset must be whitelisted' error`

