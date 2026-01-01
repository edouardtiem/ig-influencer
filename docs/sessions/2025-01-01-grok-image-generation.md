# 📝 SESSION — Grok Image Generation + Reference Images

**Date** : 1er janvier 2025  
**Durée** : ~45min

---

## 🎯 Objectifs

1. ✅ Tester génération d'images avec Grok API
2. ✅ Explorer support images de référence dans l'API
3. ✅ Créer workflow pour génération manuelle d'images

---

## ✅ Ce qui a été fait cette session

### 1. Test Génération Image Grok
- **Script créé** : `app/scripts/generate-grok-image-now.mjs`
- **Résultat** : ✅ Fonctionne parfaitement !
  - Image générée en ~12 secondes
  - Style très proche de la référence (piscine infinity, coucher de soleil, bikini blanc)
  - Coût : ~$0.07 par image
  - Format : JPG, URL temporaire xAI

### 2. Découverte Limitation API
- **Problème** : L'API xAI ne supporte PAS les images de référence
  - Paramètre `size` non supporté (erreur 400)
  - Pas de paramètre `image_url` ou `reference_image` dans `/v1/images/generations`
  - L'app X permet les références en mode "test", mais pas l'API publique

### 3. Corrections Code
- **`app/src/lib/grok.ts`** :
  - Retrait paramètre `size` (non supporté)
  - Simplification `generateImage()` (prompt text seulement)
  - Workaround : Enhancement prompt avec description de référence (pas de vrai style matching)

### 4. Workflow Décidé
- **Génération manuelle** : 1 image/jour pour 10 jours
- **Processus** :
  1. Éditer prompt dans `generate-grok-image-now.mjs`
  2. Run script
  3. Copier URL générée
  4. Planifier sur Fanvue manuellement

---

## 📁 Fichiers créés/modifiés

| Fichier | Action | Description |
|---------|--------|-------------|
| `app/scripts/generate-grok-image-now.mjs` | Créé | Script pour générer 1 image avec Grok |
| `app/src/lib/grok.ts` | Modifié | Retrait paramètre `size`, simplification API |
| `app/scripts/list-elena-cloudinary-images.mjs` | Créé | Script pour lister images Elena Cloudinary (pour références futures) |

---

## 🚧 En cours (non terminé)

- ⚠️ **Images de référence** : Pas disponible dans l'API publique xAI
- ⚠️ **Workflow automatisé** : À créer quand xAI ajoutera le support

---

## 📋 À faire prochaine session

- [ ] Générer 10 images pour les 10 prochains jours
- [ ] Planifier images sur Fanvue manuellement
- [ ] Surveiller si xAI ajoute support images de référence dans l'API
- [ ] Tester prompts variés (bedroom, bathroom, beach, lifestyle)

---

## 🐛 Bugs découverts

1. **Paramètre `size` non supporté** : 
   - Erreur 400 "Argument not supported: size"
   - Fix : Retiré du body de la requête

---

## 💡 Idées notées

- **Workaround Vision → Prompt** : Utiliser Grok Vision pour décrire une image de référence, puis utiliser cette description comme prompt (pas testé, probablement pas assez précis)
- **Alternative APIs** : OpenAI DALL-E supporte variations d'images ($0.04-0.12/image)
- **Replicate Flux** : Image-to-image support ($0.003/image)

---

## 📝 Notes importantes

### Grok Image Generation API

**Endpoint** : `POST https://api.x.ai/v1/images/generations`

**Paramètres supportés** :
- `model` : `"grok-2-image"` (obligatoire)
- `prompt` : Texte seulement (obligatoire)
- `n` : Nombre d'images (1-10, default: 1)
- `response_format` : `"url"` ou `"b64_json"` (default: `"url"`)

**Paramètres NON supportés** :
- ❌ `size` (retourne erreur 400)
- ❌ `image_url` / `reference_image`
- ❌ `quality`
- ❌ `style`

**Réponse** :
```json
{
  "data": [
    {
      "url": "https://imgen.x.ai/xai-imgen/...",
      "revised_prompt": "..."
    }
  ]
}
```

**Coût** : ~$0.07 par image (à vérifier pricing officiel)

**Temps de génération** : ~10-15 secondes

### Workflow Manuel

1. Éditer `PROMPT` dans `generate-grok-image-now.mjs`
2. Run : `node scripts/generate-grok-image-now.mjs`
3. Copier l'URL retournée
4. Upload sur Cloudinary (optionnel)
5. Planifier sur Fanvue via dashboard

---

## 🔗 Références

- [xAI Image Generation Docs](https://docs.x.ai/docs/guides/image-generations)
- [xAI API Overview](https://docs.x.ai/docs/overview)
- [Session Chat Bot Grok](./2025-01-01-fanvue-chat-grok.md)

---

**Commits** :
- `10a7c21` - fix(grok): remove unsupported size parameter + add generate-grok-image-now script

