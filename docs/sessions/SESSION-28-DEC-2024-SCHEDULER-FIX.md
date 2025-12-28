# Session 28 décembre 2024 — Fix Scheduler & History Layer

## 🎯 Objectif
Réparer le système d'auto-post Elena qui ne fonctionnait plus (scheduler GitHub Actions ne se déclenchait pas + posts répétitifs throwback mer)

## 🐛 Problèmes identifiés

### 1. Scheduler GitHub Actions ne tourne pas
**Symptôme** : Le scheduler devait tourner à 6:00 UTC mais seul l'executor tournait

**Cause** : Les deux crons se chevauchaient à minute 0 :
- Scheduler : `'0 6 * * *'` (6:00 UTC)
- Executor : `'0,30 * * * *'` (toutes les 30 min)

À 6:00 UTC, GitHub Actions matchait les deux patterns et prenait le mauvais (`0,30` au lieu de `0 6`).

**Fix** : Changer le scheduler à `'5 6 * * *'` (6:05 UTC = 7:05 Paris)

### 2. Posts répétitifs (toujours throwback mer)
**Symptôme** : Les 3 derniers posts étaient tous Maldives/Bali/Mykonos

**Cause** : Le history layer lisait la table `posts` qui avait toutes les locations à NULL → le scheduler pensait qu'Elena n'avait jamais voyagé → forçait `throwback_travel` à chaque fois

**Fix** : Modifier history layer pour lire `scheduled_posts WHERE status='posted'` qui a les données complètes

## 📁 Fichiers modifiés

### `.github/workflows/content-brain.yml`
```yaml
# Avant
- cron: '0 6 * * *'  # Scheduler à 6:00 UTC

# Après  
- cron: '5 6 * * *'  # Scheduler à 6:05 UTC (évite chevauchement)
```

### `app/scripts/lib/history-layer.mjs`
- Changé la source de données de `posts` à `scheduled_posts`
- Ajouté mapping des champs pour compatibilité
- Ajouté log des locations à éviter

## ✅ Vérification

Après le fix, le scheduler :
1. Voit les 10 derniers posts avec leurs vraies locations
2. `hasTravelRecently = true` (détecte Maldives, Bali, etc.)
3. Ne force plus `throwback_travel` systématiquement
4. Le nouveau post était **Spa Alpes** (différent des 4 derniers)

## 📊 Posts publiés cette session

| Heure | Location | Type |
|-------|----------|------|
| 22:08 | Bungalow Maldives | throwback (avant fix) |
| 22:23 | Spa Alpes | throwback montagne (après fix ✅) |

## 🔜 Suivi

- [ ] Vérifier demain 7:05 Paris que le scheduler tourne
- [ ] Confirmer variété dans les prochains posts
- [ ] Considérer sync `scheduled_posts` → `posts` pour cohérence

## 📝 Commit
```
fix: scheduler timing + history layer reads actual posted content

1. GitHub Actions scheduler: 6:00 → 6:05 UTC
2. History layer now reads from scheduled_posts (status=posted)
```

