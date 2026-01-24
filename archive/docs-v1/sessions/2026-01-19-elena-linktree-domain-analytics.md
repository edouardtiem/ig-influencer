# 🔗 Elena Linktree Domain Configuration + Analytics

**Date** : 19 janvier 2026  
**Durée** : ~30min

---

## ✅ Ce qui a été fait cette session

1. **Configuration domaine `elenav.link`** — Middleware Next.js pour afficher le Linktree à la racine
2. **Mise à jour lien Instagram** — Changement vers `@elenav.paris`
3. **Ajout Vercel Analytics** — Tracking visites et pages vues pour `elenav.link`

---

## 📁 Fichiers créés/modifiés

### Créés
- `app/src/middleware.ts` — Middleware Next.js pour routing par domaine

### Modifiés
- `app/vercel.json` — Ajout rewrites pour `elenav.link` → `/elena`
- `app/src/app/layout.tsx` — Ajout composant `<Analytics />` de Vercel
- `app/src/app/elena/components/SecondaryLinks.tsx` — Mise à jour URL Instagram vers `https://instagram.com/elenav.paris`
- `package.json` — Ajout dépendance `@vercel/analytics`

---

## 🔧 Détails techniques

### Middleware Next.js

Le middleware intercepte les requêtes sur `elenav.link` et `www.elenav.link` pour réécrire la route `/` vers `/elena` :

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

**Pourquoi middleware au lieu de rewrites Vercel ?**  
Les rewrites Vercel ne fonctionnaient pas correctement. Le middleware Next.js est plus fiable pour ce cas d'usage.

### Vercel Analytics

Installation et configuration selon la [documentation officielle](https://vercel.com/docs/analytics/quickstart) :

1. Package installé : `npm i @vercel/analytics`
2. Composant ajouté dans `layout.tsx` racine :
   ```tsx
   import { Analytics } from "@vercel/analytics/next";
   // ...
   <Analytics />
   ```
3. Analytics activé dans le dashboard Vercel (onglet Analytics → Enable)

**Données disponibles** : Visites, pages vues, pays, devices, etc. dans le dashboard Vercel.

---

## 🚧 En cours (non terminé)

- Aucun

---

## 📋 À faire prochaine session

- [ ] Optimiser la vidéo background (actuellement 14MB, devrait être ~500KB-1MB)
- [ ] Tester le conversion rate une fois le site live
- [ ] Analyser les analytics Vercel après quelques jours de trafic
- [ ] A/B tester différentes durées de countdown timer (13/17/23/29/37 min)

---

## 🐛 Bugs découverts

- **Rewrite Vercel non fonctionnel** — Les rewrites dans `vercel.json` ne fonctionnaient pas, résolu avec middleware Next.js

---

## 💡 Idées notées

- Possibilité d'ajouter un dark/light mode selon l'heure
- Géolocalisation pour détecter la langue automatiquement
- A/B testing automatique des CTAs

---

## 📝 Notes importantes

- Le domaine `elenav.link` a été acheté sur Vercel
- Le dashboard Mila reste accessible sur `ig-influencer.vercel.app`
- Le Linktree est maintenant accessible directement sur `elenav.link` (racine)
- Analytics Vercel nécessite quelques heures/jours pour commencer à afficher des données significatives

---

## 🔗 Liens utiles

- [Vercel Analytics Documentation](https://vercel.com/docs/analytics/quickstart)
- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
