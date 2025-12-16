# TODO-004 — Intégration Supabase

> Persistance des données : historique posts + conversations

**Status** : 📋 Todo
**Priorité** : 🔴 High
**Estimation** : 3h
**Créé** : 16 décembre 2024

---

## 📋 Objectif

Connecter Supabase au projet pour :
1. **Historique des posts** - Tracker tout ce qui est publié avec metadata
2. **Historique des conversations** - Stocker les interactions (smart comments, DMs)
3. **Analytics** - Stocker les stats Instagram pour voir l'évolution

---

## 🗄️ Schéma DB proposé

### Table `posts`
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instagram_post_id TEXT UNIQUE NOT NULL,
  post_type TEXT NOT NULL, -- 'carousel', 'single', 'reel'
  
  -- Content
  caption TEXT NOT NULL,
  hashtags TEXT[],
  image_urls TEXT[] NOT NULL,
  video_url TEXT,
  
  -- Metadata
  location_name TEXT,
  location_id TEXT,
  slot TEXT,
  content_type TEXT,
  outfit TEXT,
  lighting TEXT,
  
  -- Timestamps
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Analytics
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  reach INT DEFAULT 0,
  impressions INT DEFAULT 0,
  saves INT DEFAULT 0,
  analytics_updated_at TIMESTAMPTZ
);
```

### Table `conversations`
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instagram_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  
  first_contact_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  user_type TEXT, -- 'photographer', 'fitness', 'brand', etc.
  notes TEXT,
  
  UNIQUE(instagram_user_id)
);
```

### Table `messages`
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  
  direction TEXT NOT NULL, -- 'inbound', 'outbound'
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  
  post_screenshot_url TEXT,
  post_url TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 📦 Implémentation

### 1. Setup
- [ ] Créer projet Supabase
- [ ] Exécuter le SQL ci-dessus
- [ ] Installer `@supabase/supabase-js`
- [ ] Ajouter env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`)

### 2. Client Supabase
- [ ] Créer `src/lib/supabase.ts` avec types TypeScript

### 3. Intégration Posts
- [ ] Modifier `src/lib/instagram.ts` pour sauvegarder après publish
- [ ] Modifier `scripts/carousel-post.mjs` pour sauvegarder
- [ ] Modifier `scripts/vacation-reel-post.mjs` pour sauvegarder

### 4. Intégration Conversations
- [ ] Modifier `src/lib/smart-comments.ts` pour logger les commentaires
- [ ] Créer endpoint pour logger les DMs manuellement (optionnel)

### 5. Sync Analytics (optionnel)
- [ ] Créer `/api/sync-analytics` pour récupérer les stats Instagram
- [ ] Cron job pour sync quotidien

---

## 📁 Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `src/lib/supabase.ts` | 🆕 Créer |
| `src/lib/instagram.ts` | ✏️ Modifier |
| `src/lib/smart-comments.ts` | ✏️ Modifier |
| `scripts/carousel-post.mjs` | ✏️ Modifier |
| `scripts/vacation-reel-post.mjs` | ✏️ Modifier |
| `.env.local` | ✏️ Ajouter vars |
| `env.example.txt` | ✏️ Documenter |

---

## 💡 Notes

- Graph API donne les analytics mais les stocker permet de voir l'évolution
- Supabase gratuit = 500MB DB + 1GB storage = largement suffisant
- Row Level Security (RLS) pas nécessaire car backend-only

---

## 🔗 Références

- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [Instagram Graph API Insights](https://developers.facebook.com/docs/instagram-api/reference/ig-media/insights)

