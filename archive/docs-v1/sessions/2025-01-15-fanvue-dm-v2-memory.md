# Session 15 Janvier 2025 — Fanvue DM System V2 + Memory

## 📝 Résumé

Implémentation complète du système de DM automation pour Fanvue avec :
- Venice AI (uncensored) pour les conversations sans limites
- Système de mémoire long-terme pour personnalisation
- Détection de langue automatique
- Système de PPV closing
- Re-engagement intelligent (21h-1h timezone local)

## ✅ Ce qui a été fait

### 1. Supabase Schema (Migration 007)
- `fanvue_dm_contacts` — Contacts avec stage, language, revenue tracking
- `fanvue_user_profiles` — Mémoire long-terme (personal, buyer, psychological)
- `fanvue_dm_messages` — Historique des conversations
- `fanvue_ppv_content` — Vault du contenu PPV
- `fanvue_purchases` — Tracking des achats

### 2. Venice AI Client
- Client OpenAI-compatible pour Venice AI
- Prompt Elena "Hot Mode" sans limites
- Support multi-langue (FR, EN, IT, ES, PT, DE)
- Context injection pour personnalisation

### 3. Système de Mémoire
- Extraction automatique avec Claude Haiku
- Profil personnel (nom, location, job, timezone)
- Profil acheteur (spending pattern, objections, triggers)
- Profil psychologique (tone, fantasies, boundaries)
- CRON every 6h pour batch analysis

### 4. Re-engagement Intelligent
- Fenêtre 21h-1h dans le timezone de l'utilisateur
- Minimum 24h depuis dernier message
- Messages personnalisés selon profil
- CRON hourly pour check

### 5. PPV System
- Vault de contenu avec categories (teaser, soft, spicy, explicit)
- Prix en cents (199 = 1.99€)
- Tracking des envois et conversions
- Matching avec préférences utilisateur

### 6. GitHub Actions
- `fanvue-memory-extraction.yml` — Every 6h
- `fanvue-reengagement.yml` — Hourly at :30

## 📁 Fichiers créés

```
app/supabase/migrations/
└── 007_fanvue_dm_system.sql

app/src/lib/
├── venice.ts                    # Venice AI client
├── fanvue-language.ts           # Language detection
├── fanvue-memory.ts             # Memory extraction
├── fanvue-reengagement.ts       # Re-engagement logic
└── elena-dm-fanvue.ts           # Main DM automation

app/src/config/
└── fanvue-ppv-vault.ts          # PPV content catalog

app/scripts/
├── fanvue-memory-extraction.mjs  # CRON script (6h)
├── fanvue-reengagement.mjs       # CRON script (hourly)
├── fanvue-ppv-seed.mjs           # Seed PPV content
└── test-fanvue-dm.mjs            # Test script

.github/workflows/
├── fanvue-memory-extraction.yml
└── fanvue-reengagement.yml
```

## 📁 Fichiers modifiés

```
app/src/lib/fanvue.ts            # Added PPV support (price param)
app/src/app/api/fanvue/webhook/route.ts  # Venice AI + Memory + PPV
app/env.example.txt              # Added VENICE_API_KEY
```

## 🧪 Tests

```bash
# Test complet du système
cd app && node scripts/test-fanvue-dm.mjs

# Résultat: ✅ ALL TESTS PASSED
# - Supabase: ✅ Connected
# - Venice AI: ✅ Working ("Merci, bello! You're not so bad yourself...")
# - Message processing: ✅ Working
```

## 📋 À faire prochaine session

- [ ] Créer les photos PPV pour Elena
- [ ] Upload sur Cloudinary (elena-fanvue-ppv folder)
- [ ] Mettre à jour `fanvue-ppv-vault.ts` avec vraies URLs
- [ ] Run `node scripts/fanvue-ppv-seed.mjs`
- [ ] Configurer webhook Fanvue vers Vercel
- [ ] Ajouter `VENICE_API_KEY` dans GitHub Secrets
- [ ] Test live avec vrai message Fanvue

## 🔧 Configuration requise

### Environment Variables
```env
VENICE_API_KEY=your_venice_api_key
```

### GitHub Secrets à ajouter
- `VENICE_API_KEY`

### Fanvue Webhook URL
```
https://ig-influencer.vercel.app/api/fanvue/webhook
```

Events à activer :
- `message.created`
- `purchase.created`
- `follower.created`
- `subscriber.created`

## 📊 Architecture

```
Fanvue Message → Webhook → elena-dm-fanvue.ts
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
              Get Profile          Venice AI
              (Supabase)          (Uncensored)
                    ↓                   ↓
              Inject Context → Generate Response
                                        ↓
                              ┌─────────┴─────────┐
                              ↓                   ↓
                        Send Message         Send PPV?
                        (Fanvue API)        (if hot/pitched)
```

## 💡 Notes

- Venice AI utilise `llama-3.3-70b` (testé et fonctionnel)
- Le système de mémoire est similaire à celui d'Instagram (elena-dm.ts)
- Le re-engagement ne fonctionne que pour les stages warm/hot/pitched
- Max 3 re-engagements par contact pour éviter le spam
