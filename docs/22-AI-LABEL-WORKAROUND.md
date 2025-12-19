# 🤖 AI Label — Solution de contournement Instagram

> **Status** : Solution active (API non supportée)  
> **Dernière vérification** : 18 décembre 2024

---

## 📋 Contexte

Instagram a introduit une option manuelle dans l'app pour marquer les contenus comme "Créé avec l'IA". Cependant, cette fonctionnalité **n'est pas disponible** via l'API Graph.

### État de l'API Graph Instagram

| Fonctionnalité | Status |
|----------------|--------|
| Label "Créé avec l'IA" | ❌ Non supporté |
| Paramètre `is_ai_generated` | ❌ N'existe pas |
| Détection automatique IA | 🔄 En développement (Meta) |

**Sources** :
- [Meta Blog - Labelling AI Content (Feb 2024)](https://about.fb.com/fr/news/2024/02/identifier-les-contenus-generes-par-lia-sur-facebook-instagram-et-threads/)
- [Instagram Graph API Reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media)

---

## ✅ Solution implémentée

### Option 1 : Disclosure dans la caption

```typescript
const AI_DISCLOSURE = '✨ AI-generated content';

function addAIDisclaimer(caption: string): string {
  return `${caption}\n\n${AI_DISCLOSURE}`;
}
```

### Option 2 : Hashtags dédiés

```typescript
const AI_HASHTAGS = '#AIGenerated #DigitalCreator #AIArt';

function addAIHashtags(caption: string): string {
  return `${caption}\n\n${AI_HASHTAGS}`;
}
```

### Option 3 : Combinaison (recommandée)

```typescript
function formatCaptionWithAIDisclaimer(caption: string): string {
  const AI_DISCLOSURE = '✨ AI-generated content';
  const AI_HASHTAGS = '#AIGenerated #DigitalCreator';
  return `${caption}\n\n${AI_DISCLOSURE}\n${AI_HASHTAGS}`;
}
```

---

## 🎯 Hashtags recommandés

| Hashtag | Usage | Volume |
|---------|-------|--------|
| `#AIGenerated` | Principal, clair | Élevé |
| `#DigitalCreator` | Branding | Élevé |
| `#AIArt` | Artistique | Très élevé |
| `#AIInfluencer` | Niche | Moyen |
| `#VirtualInfluencer` | Niche | Moyen |

---

## 📝 Exemple d'implémentation

```typescript
// lib/instagram.ts

export const AI_DISCLOSURE_CONFIG = {
  enabled: true,
  text: '✨ AI-generated content',
  hashtags: ['#AIGenerated', '#DigitalCreator'],
};

export function formatCaption(
  caption: string, 
  options?: { includeAIDisclosure?: boolean }
): string {
  const { includeAIDisclosure = AI_DISCLOSURE_CONFIG.enabled } = options || {};
  
  if (!includeAIDisclosure) {
    return caption;
  }
  
  const hashtags = AI_DISCLOSURE_CONFIG.hashtags.join(' ');
  return `${caption}\n\n${AI_DISCLOSURE_CONFIG.text}\n${hashtags}`;
}
```

---

## 🔄 Mises à jour à surveiller

Meta a annoncé travailler sur :
1. **Détection automatique** des contenus IA via métadonnées
2. **Labelling automatique** sur toutes les plateformes Meta
3. **Standards C2PA** pour traçabilité des contenus

→ Vérifier régulièrement les [changelogs de l'API Graph](https://developers.facebook.com/docs/graph-api/changelog/)

---

## 📊 Comparaison des approches

| Approche | Avantages | Inconvénients |
|----------|-----------|---------------|
| Caption disclaimer | Clair, visible | Prend de la place |
| Hashtags uniquement | Discret, SEO | Moins explicite |
| Combinaison | Complet, transparent | Plus long |
| Aucun | Minimaliste | Non transparent |

**Recommandation projet** : Combinaison caption + 2 hashtags

---

*Documentation créée le 18/12/2024*

