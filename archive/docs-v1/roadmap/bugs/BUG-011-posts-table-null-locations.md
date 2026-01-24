# BUG-011 — Table `posts` a des locations NULL

## 📋 Description
La table `posts` contient des entrées avec `location_key` et `location_name` à NULL, alors que `scheduled_posts` a les données complètes.

## 🐛 Symptôme
- Le history layer ne pouvait pas déterminer les locations récentes
- Le scheduler forçait des throwbacks à chaque post

## 🔍 Cause
La table `posts` n'est pas synchronisée avec `scheduled_posts` quand un post est publié.

## ✅ Workaround actuel
Le history layer lit maintenant `scheduled_posts WHERE status='posted'` au lieu de `posts`.

## 💡 Fix permanent suggéré
Ajouter un sync dans l'executor :
```javascript
// Après publication réussie
await supabase.from('posts').upsert({
  character_name: character,
  location_key: post.location_key,
  location_name: post.location_name,
  // ... autres champs
});
```

## 📊 Impact
- **Sévérité** : Moyenne (workaround en place)
- **Priorité** : Basse

## 🔗 Références
- Session : SESSION-28-DEC-2024-SCHEDULER-FIX.md
- Commit : `fix: scheduler timing + history layer reads actual posted content`

