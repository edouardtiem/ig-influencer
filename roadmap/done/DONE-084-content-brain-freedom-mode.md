# DONE-084: Content Brain V3 "Freedom Mode"

**Date** : 20 janvier 2026
**Status** : ✅ Terminé

## Résumé

Refonte majeure du Content Brain pour donner **liberté totale** à Claude au lieu de hardcoder des listes de locations, outfits et poses.

## Problème

Le scheduler contenait ~665 lignes de code hardcodé :
- 90 locations Mila/Elena
- 30 locations "sexy" Elena  
- 4 catégories outfits hardcodées
- 6 poses hardcodées
- 145 lignes de règles d'exploration conditionnelles
- Claude "remplissait des cases" au lieu de créer

## Solution

### 1. Blocklist Centralisée
Nouveau fichier `nano-banana-blocklist.mjs` avec :
- Termes interdits par Nano Banana Pro
- Remplacements automatiques safe
- Fonctions `sanitizePrompt()` et `checkForBlockedTerms()`

### 2. Prompt "Freedom"
Nouveau `buildFreedomPrompt()` qui :
- Donne toutes les données dynamiques (Analytics, History, Trending, Context)
- Inclut la blocklist comme seule contrainte
- Laisse Claude décider librement locations, outfits, poses

### 3. Filet de sécurité
`scheduled-post.mjs` :
- Pré-sanitise les prompts avant génération
- Retry avec sanitisation aggressive si échec

## Impact

| Métrique | Avant | Après |
|----------|-------|-------|
| Lignes scheduler | ~1200 | ~600 |
| Créativité Claude | Listes fermées | Liberté totale |
| Maintenance | Modifier code | Aucune |

## Fichiers

- ✨ `app/scripts/lib/nano-banana-blocklist.mjs` — NOUVEAU
- ♻️ `app/scripts/cron-scheduler.mjs` — Refonte majeure
- 🔧 `app/scripts/scheduled-post.mjs` — Import blocklist + sanitization
- 📝 `docs/sessions/2026-01-20-content-brain-freedom.md`

## Test

```bash
node scripts/cron-scheduler.mjs elena
# ✅ Claude a créé 2 posts avec liberté totale
# 14h: Café Le Marais (inventé)
# 21h: Loft golden hour (inventé)
```

## Liens

- Session: [2026-01-20-content-brain-freedom.md](../../docs/sessions/2026-01-20-content-brain-freedom.md)
- Blocklist: [nano-banana-blocklist.mjs](../../app/scripts/lib/nano-banana-blocklist.mjs)
