# DONE-076: Elena Linktree Domain Configuration + Analytics

**Date** : 19 janvier 2026  
**Durée** : ~30min  
**Status** : ✅ Completed

---

## 🎯 Objectif

Configurer le domaine `elenav.link` pour afficher le Linktree à la racine et ajouter le tracking analytics.

---

## ✅ Ce qui a été fait

### 1. Configuration Domaine
- ✅ Middleware Next.js créé pour routing par domaine
- ✅ `elenav.link` → affiche `/elena` à la racine
- ✅ `www.elenav.link` → support du sous-domaine
- ✅ Dashboard Mila reste sur `ig-influencer.vercel.app`

### 2. Mise à jour Lien Instagram
- ✅ URL Instagram mise à jour vers `@elenav.paris`
- ✅ Composant `SecondaryLinks.tsx` modifié

### 3. Vercel Analytics
- ✅ Package `@vercel/analytics` installé
- ✅ Composant `<Analytics />` ajouté au layout racine
- ✅ Analytics activé dans le dashboard Vercel

---

## 📁 Fichiers créés/modifiés

### Créés
- `app/src/middleware.ts` — Middleware Next.js pour routing par domaine

### Modifiés
- `app/vercel.json` — Ajout rewrites (non fonctionnels, remplacés par middleware)
- `app/src/app/layout.tsx` — Ajout composant Analytics
- `app/src/app/elena/components/SecondaryLinks.tsx` — Mise à jour URL Instagram
- `package.json` — Ajout dépendance `@vercel/analytics`

---

## 🔧 Détails techniques

### Middleware Next.js

Le middleware intercepte les requêtes sur `elenav.link` et réécrit `/` vers `/elena` :

```typescript
export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  if (
    (hostname === "elenav.link" || hostname === "www.elenav.link") &&
    pathname === "/"
  ) {
    return NextResponse.rewrite(new URL("/elena", request.url));
  }

  return NextResponse.next();
}
```

**Pourquoi middleware ?**  
Les rewrites Vercel dans `vercel.json` ne fonctionnaient pas correctement. Le middleware Next.js est plus fiable pour ce cas d'usage.

### Vercel Analytics

Configuration selon la [documentation officielle](https://vercel.com/docs/analytics/quickstart) :

1. Installation : `npm i @vercel/analytics`
2. Composant dans `layout.tsx` :
   ```tsx
   import { Analytics } from "@vercel/analytics/next";
   // ...
   <Analytics />
   ```
3. Activation dans dashboard Vercel (Analytics → Enable)

**Données disponibles** : Visites, pages vues, pays, devices, etc.

---

## 🐛 Bugs résolus

- **Rewrite Vercel non fonctionnel** — Les rewrites dans `vercel.json` ne fonctionnaient pas, résolu avec middleware Next.js

---

## 📋 Prochaines étapes

- [ ] Optimiser la vidéo background (actuellement 14MB)
- [ ] Analyser les analytics après quelques jours de trafic
- [ ] A/B tester différentes durées de countdown timer

---

## 🔗 Liens

- [Session détaillée](./docs/sessions/2026-01-19-elena-linktree-domain-analytics.md)
- [Vercel Analytics Docs](https://vercel.com/docs/analytics/quickstart)
- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
