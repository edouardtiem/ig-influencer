# 📊 Daily Account Insights Tracking

> Implémenter le tracking des vraies métriques journalières via account-level insights

**Priorité** : 🟡 Medium  
**Estimation** : 3-4h  
**Status** : 📋 Planifié

---

## 🎯 Objectif

Actuellement, les analytics agrègent les vues par **date de publication** du post. Un post publié le 16/12 qui reçoit 100 vues le 23/12 est compté comme "16/12", pas comme activité du 23/12.

**Solution** : Utiliser les insights au niveau du compte Instagram avec `period=day` pour obtenir les vraies métriques journalières.

---

## 📊 Métriques disponibles

Via l'endpoint `/insights` du compte Instagram (`period=day`) :

| Métrique | Description | Exemple |
|----------|-------------|---------|
| `reach` | Comptes uniques touchés par jour | 258 personnes le 22/12 |
| `accounts_engaged` | Comptes ayant interagi | 89 comptes |
| `total_interactions` | Total interactions (likes+comments+saves+shares) | 89 interactions |
| `likes` | Total likes par jour | 54 likes |
| `comments` | Total comments par jour | 34 comments |
| `shares` | Total shares par jour | 2 shares |
| `saves` | Total saves par jour | 1 save |
| `profile_views` | Visites profil par jour | 12 visites (avec `metric_type=total_value`) |
| `follower_count` | Nombre followers | 66 (avec `metric_type=total_value`) |
| `follows_and_unfollows` | Nouveaux follows/unfollows | +6 followers |

---

## 🏗️ Implémentation

### 1. Créer table Supabase `daily_account_insights`

```sql
CREATE TABLE daily_account_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  reach INTEGER,
  accounts_engaged INTEGER,
  total_interactions INTEGER,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  saves INTEGER,
  profile_views INTEGER,
  follower_count INTEGER,
  new_followers INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(character, date)
);

CREATE INDEX idx_daily_insights_character_date ON daily_account_insights(character, date DESC);
```

### 2. Modifier sync-analytics pour récupérer account insights

**Fichier** : `app/src/app/api/sync-analytics/route.ts`

Ajouter fonction :
```typescript
async function fetchAccountDailyInsights(
  accountId: string,
  accessToken: string
): Promise<{
  reach: number;
  accounts_engaged: number;
  total_interactions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  profile_views: number;
  follower_count: number;
  new_followers: number;
}> {
  // Fetch reach, interactions, etc. with period=day
  // Fetch profile_views and follower_count with metric_type=total_value
  // Return today's values
}
```

Appeler dans `syncAccount()` et sauvegarder dans `daily_account_insights`.

### 3. Créer nouveau graphique sur page analytics

**Fichier** : `app/src/app/analytics/page.tsx`

Ajouter section "📊 Métriques Journalières Réelles" avec :
- Graphique Reach par jour (vraies données)
- Graphique Interactions par jour
- Graphique Profile Views par jour
- Comparaison avec l'ancien graphique (par date de publication)

### 4. Modifier API analytics pour utiliser daily_account_insights

**Fichier** : `app/src/app/api/analytics/route.ts`

Option 1 : Remplacer complètement l'agrégation par posts
Option 2 : Ajouter un paramètre `?method=daily` pour choisir la méthode

---

## ✅ Checklist

- [ ] Créer table `daily_account_insights` dans Supabase
- [ ] Ajouter fonction `fetchAccountDailyInsights()` dans sync-analytics
- [ ] Modifier `syncAccount()` pour sauvegarder daily insights
- [ ] Modifier API analytics pour utiliser daily_account_insights
- [ ] Créer nouveau graphique sur page analytics
- [ ] Tester avec données réelles (Mila + Elena)
- [ ] Documenter la différence entre les deux méthodes

---

## 🔗 Références

- [Session Analytics Fix](./../docs/SESSION-23-DEC-2024-ANALYTICS-FIX.md)
- [Instagram Graph API Insights](https://developers.facebook.com/docs/instagram-api/reference/ig-user/insights)
- [Session Analytics Page](./../docs/SESSION-22-DEC-2024-ANALYTICS-PAGE.md)

---

## 💡 Notes

- Les insights au niveau du compte sont plus précis que l'agrégation par posts
- Permet de voir l'activité réelle par jour (inclut interactions sur anciens posts)
- Complémentaire avec le tracking par date de publication (montre performance des posts individuels)

