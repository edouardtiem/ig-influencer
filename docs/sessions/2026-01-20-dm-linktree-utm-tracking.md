# 🔗 DM Linktree UTM Tracking + OG Image

**Date** : 20 janvier 2026  
**Durée** : ~1h

---

## 🎯 Objectif

Optimiser le funnel DM en routant vers Linktree au lieu de Fanvue direct, avec tracking UTM séparé pour bio vs DM, et ajouter une image OG pour les previews de liens dans les chats.

---

## ✅ Ce qui a été fait

### 1. **Changement stratégique : DM → Linktree**
- **Problème identifié** : Conversion DM directe très faible (0.22% vs 10.5% pour bio)
- **Solution** : Router les DMs vers `elenav.link` au lieu de Fanvue direct
- **Raison** : Linktree convertit 48x mieux, moins "pushy", effet de légitimité

### 2. **URLs propres avec UTM cachés**
- Création de `/bio` et `/dm` qui redirigent avec UTM params
- **Bio Instagram** : `elenav.link/bio` → `?utm_medium=bio`
- **DMs** : `elenav.link/dm` → `?utm_medium=dm`
- UTM trackés dans Vercel Analytics mais invisibles pour l'utilisateur

### 3. **Image Open Graph pour previews**
- Ajout de `teaser.png` comme image OG
- Preview dans les chats Instagram/DM au lieu du logo Vercel
- Configuration Twitter Card également

### 4. **Fixes TypeScript**
- Fix variable `hasQuestion` définie 2 fois
- Fix propriété `note` invalide dans `saveMessage`
- Fix stages manquants (`closing`, `followup`) dans stats

---

## 📁 Fichiers créés/modifiés

### Modifiés
- `app/src/lib/elena-dm.ts` — Changement lien Fanvue → Linktree, fix bugs TypeScript
- `app/src/middleware.ts` — Ajout redirections `/bio` et `/dm` avec UTM
- `app/src/app/elena/layout.tsx` — Ajout metadata OG image

---

## 🔧 Détails techniques

### Middleware Redirections

```typescript
// /bio → redirect to root with UTM params (for Instagram bio - clean URL)
if (pathname === "/bio") {
  const url = new URL("/elena", request.url);
  url.searchParams.set("utm_source", "instagram");
  url.searchParams.set("utm_medium", "bio");
  url.searchParams.set("utm_campaign", "elena");
  return NextResponse.redirect(url, 301);
}

// /dm → redirect to root with UTM params (for DM automation - clean URL)
if (pathname === "/dm") {
  const url = new URL("/elena", request.url);
  url.searchParams.set("utm_source", "instagram");
  url.searchParams.set("utm_medium", "dm");
  url.searchParams.set("utm_campaign", "elena");
  return NextResponse.redirect(url, 301);
}
```

### Open Graph Metadata

```typescript
openGraph: {
  title: "Elena ✨",
  description: "Your secret escape 💋",
  type: "website",
  images: [
    {
      url: "https://elenav.link/elena/teaser.png",
      width: 1200,
      height: 630,
      alt: "Elena",
    },
  ],
}
```

---

## 📊 Résultats attendus

### Tracking amélioré
- **Vercel Analytics** : Séparation claire bio vs DM
- **Fanvue** : Continue de tracker conversions finales via lien "Linkthree"
- **Meilleure attribution** : On sait d'où vient chaque visiteur

### Conversion améliorée
- **Hypothèse** : Conversion DM devrait passer de 0.22% → ~5-10%
- **Raison** : Linktree moins agressif, meilleure expérience utilisateur

---

## 🐛 Bugs résolus

1. **Variable `hasQuestion` dupliquée** — Ligne 742 et 855, supprimé doublon
2. **Propriété `note` invalide** — Supprimé de `saveMessage()` metadata
3. **Stages manquants** — Ajouté `closing` et `followup` dans stats object

---

## 📋 Prochaines étapes

- [ ] Tester les redirections `/bio` et `/dm` après déploiement
- [ ] Vérifier preview image dans Instagram DM après cache refresh
- [ ] Analyser analytics après 48h pour comparer conversion bio vs DM
- [ ] Créer image OG optimisée 1200x630 si nécessaire (actuellement 822x869)

---

## 🔗 Liens

- [DONE-080](./roadmap/done/DONE-080-dm-linktree-utm-tracking.md)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Open Graph Protocol](https://ogp.me/)
