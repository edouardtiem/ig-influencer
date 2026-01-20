# SESSION 18 DEC 2024 — AI Label Instagram API

---

## 📝 FIN DE SESSION — À SAUVEGARDER

**Date** : 18 décembre 2024  
**Durée** : ~15min

### ✅ Ce qui a été fait cette session :
1. Recherche documentation Graph API Instagram pour label "Créé avec l'IA"
2. Confirmation : **AUCUN paramètre API** pour activer automatiquement le label IA
3. Définition de la solution de contournement : caption + hashtags

### 📁 Fichiers créés/modifiés :
- `docs/SESSION-18-DEC-2024-AI-LABEL.md` (ce fichier)
- `docs/22-AI-LABEL-WORKAROUND.md` (documentation permanente)

### 🚧 En cours (non terminé) :
- Implémentation de la solution dans `lib/instagram.ts` (à faire)

### 📋 À faire prochaine session :
- [ ] Ajouter helper `addAIDisclaimer()` dans `lib/instagram.ts`
- [ ] Intégrer le disclaimer dans tous les scripts de publication

### 🐛 Bugs découverts :
- Aucun

### 💡 Idées notées :
- Surveiller les mises à jour de l'API Meta — ils ont annoncé travailler sur le labelling IA automatique

### 📝 Notes importantes :

#### 🔍 Résultat de la recherche API Graph Instagram

**Question** : Peut-on activer automatiquement la mention "Créé avec l'IA" via l'API Graph ?

**Réponse** : **NON** — Il n'existe actuellement aucun paramètre dans l'API Graph Instagram pour ajouter automatiquement le label "Créé avec l'IA".

**Sources consultées** :
- [Documentation officielle Meta - Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing)
- [Référence API IG User Media](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media)
- [Annonce Meta sur labelling IA (Feb 2024)](https://about.fb.com/fr/news/2024/02/identifier-les-contenus-generes-par-lia-sur-facebook-instagram-et-threads/)

**Paramètres disponibles pour création de média** :
```
image_url, video_url, media_type, caption, location_id, 
is_carousel_item, children, thumb_offset, share_to_feed
```
→ **Pas de `is_ai_generated`, `ai_label`, ou similaire**

#### ✅ Solution de contournement adoptée

**Méthode 1 : Caption**
```typescript
// Ajouter en fin de caption
const caption = `${originalCaption}\n\n✨ AI-generated content`;
```

**Méthode 2 : Hashtags**
```typescript
const AI_HASHTAGS = '#AIGenerated #DigitalCreator #AIArt';
const caption = `${originalCaption}\n\n${AI_HASHTAGS}`;
```

**Méthode combinée (recommandée)** :
```typescript
function formatCaptionWithAIDisclaimer(caption: string): string {
  const AI_DISCLOSURE = '✨ AI-generated content';
  const AI_HASHTAGS = '#AIGenerated #DigitalCreator';
  return `${caption}\n\n${AI_DISCLOSURE}\n${AI_HASHTAGS}`;
}
```

---

**Action** : Documentation créée, prêt pour implémentation future.

---

