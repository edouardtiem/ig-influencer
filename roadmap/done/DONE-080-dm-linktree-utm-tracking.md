# DONE-080: DM Linktree UTM Tracking + OG Image

**Date** : 20 janvier 2026  
**Durée** : ~1h  
**Status** : ✅ Completed

---

## 🎯 Objectif

Optimiser le funnel DM en routant vers Linktree au lieu de Fanvue direct, avec tracking UTM séparé pour bio vs DM, et ajouter une image OG pour les previews de liens dans les chats.

**Contexte** : Après 36h de tracking, conversion DM directe très faible (0.22%) vs bio (10.5%). Solution : router via Linktree qui convertit mieux.

---

## ✅ Ce qui a été fait

### 1. Changement stratégique DM → Linktree
- ✅ Remplacement lien Fanvue direct par `elenav.link/dm` dans DMs
- ✅ Lien bio mis à jour vers `elenav.link/bio`
- ✅ Raison : Linktree convertit 48x mieux (10.5% vs 0.22%)

### 2. URLs propres avec UTM cachés
- ✅ Création `/bio` → redirige avec `utm_medium=bio`
- ✅ Création `/dm` → redirige avec `utm_medium=dm`
- ✅ UTM trackés dans Vercel Analytics mais invisibles pour utilisateur
- ✅ Middleware Next.js gère les redirections

### 3. Image Open Graph
- ✅ Ajout `teaser.png` comme image OG
- ✅ Configuration Twitter Card
- ✅ Preview dans chats au lieu du logo Vercel

### 4. Fixes TypeScript
- ✅ Fix variable `hasQuestion` dupliquée (lignes 742/855)
- ✅ Fix propriété `note` invalide dans `saveMessage()`
- ✅ Fix stages manquants (`closing`, `followup`) dans stats

---

## 📁 Fichiers créés/modifiés

### Modifiés
- `app/src/lib/elena-dm.ts` — Lien Linktree + fixes TypeScript
- `app/src/middleware.ts` — Redirections `/bio` et `/dm`
- `app/src/app/elena/layout.tsx` — Metadata OG image

---

## 🔧 Détails techniques

### Middleware Redirections

Le middleware intercepte `/bio` et `/dm` et ajoute les UTM params avant redirection :

```typescript
// /bio → redirect to root with UTM params
if (pathname === "/bio") {
  const url = new URL("/elena", request.url);
  url.searchParams.set("utm_source", "instagram");
  url.searchParams.set("utm_medium", "bio");
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
- **Vercel Analytics** : Séparation claire bio vs DM via `utm_medium`
- **Fanvue** : Continue de tracker conversions finales via lien "Linkthree"
- **Meilleure attribution** : On sait d'où vient chaque visiteur

### Conversion améliorée
- **Hypothèse** : Conversion DM devrait passer de 0.22% → ~5-10%
- **Raison** : Linktree moins agressif, meilleure expérience utilisateur

---

## 🐛 Bugs résolus

1. **Variable `hasQuestion` dupliquée** — Supprimé doublon ligne 855
2. **Propriété `note` invalide** — Supprimé de `saveMessage()` metadata (ligne 2233)
3. **Stages manquants** — Ajouté `closing` et `followup` dans stats object (ligne 2698)

---

## 📋 Prochaines étapes

- [ ] Tester redirections `/bio` et `/dm` après déploiement
- [ ] Vérifier preview image dans Instagram DM (cache peut prendre quelques heures)
- [ ] Analyser analytics après 48h pour comparer conversion bio vs DM
- [ ] Créer image OG optimisée 1200x630 si nécessaire (actuellement 822x869)

---

## 🔗 Liens

- [Session détaillée](./docs/sessions/2026-01-20-dm-linktree-utm-tracking.md)
- [Vercel Analytics Docs](https://vercel.com/docs/analytics)
- [Open Graph Protocol](https://ogp.me/)
