# 📅 Session 29 Décembre 2024 — Fanvue Daily System Elena

**Date** : 29 décembre 2024  
**Durée** : ~1h30

---

## 🎯 Objectif

Créer un système automatique de posting quotidien sur Fanvue pour Elena avec :
- 1 photo par jour à 17h Paris
- Contenu "safe-sexy" qui passe les filtres Nano Banana Pro
- Posts réservés aux abonnés (pas les suiveurs gratuits)
- GitHub Actions pour l'automatisation

---

## ✅ Ce qui a été fait cette session

### 1. Calendrier de contenu 14 jours
- 14 prompts safe-sexy utilisant le vocabulaire de `docs/19-QUALITY-SEXY-STRATEGY.md`
- Rotation automatique après 14 jours
- Variété : bedroom, bathroom, yoga, balcony, vanity, etc.

### 2. Script de génération + posting
- Génération via Nano Banana Pro avec références Elena (face + body)
- Upload automatique sur Cloudinary
- Post sur Fanvue API (subscribers only)
- Support mode test (`--test`) et jour forcé (`--day N`)

### 3. GitHub Action quotidienne
- Cron à 16:00 UTC = 17:00 Paris (hiver)
- Workflow dispatch manuel avec options
- Tous les secrets configurables

### 4. Mise à jour lib Fanvue
- Support des tokens via variables d'environnement
- Fonction `initTokensFromEnv()` pour CI/CD

---

## 📁 Fichiers créés/modifiés

| Fichier | Action | Description |
|---------|--------|-------------|
| `app/src/config/fanvue-daily-elena.ts` | ✨ Créé | Calendrier 14 jours + prompts safe-sexy |
| `app/scripts/daily-fanvue-elena.mjs` | ✨ Créé | Script génération + post Fanvue |
| `.github/workflows/fanvue-daily-elena.yml` | ✨ Créé | GitHub Action 17h Paris |
| `app/src/lib/fanvue.ts` | 📝 Modifié | Support tokens env vars |
| `app/scripts/elena-yoga-studio.mjs` | ✨ Créé | Script test yoga (non utilisé) |

---

## 🔐 Secrets GitHub à configurer

Pour que le GitHub Action fonctionne, ajouter ces secrets dans **Settings → Secrets and variables → Actions** :

```
REPLICATE_API_TOKEN          # Génération images
CLOUDINARY_CLOUD_NAME        # Hébergement images
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
FANVUE_CLIENT_ID             # OAuth Fanvue
FANVUE_CLIENT_SECRET
FANVUE_ACCESS_TOKEN          # Token obtenu via OAuth flow
FANVUE_REFRESH_TOKEN         # Refresh token
```

⚠️ **NE PAS mettre `.env.local` sur GitHub !** Les secrets doivent être dans GitHub Secrets.

---

## 📅 Calendrier de contenu

| Jour | ID | Nom | Caption |
|------|-----|-----|---------|
| 1 | `morning_bed_stretch` | Morning Stretch | Good morning from Paris... barely awake 💋 |
| 2 | `bathroom_mirror_selfie` | Mirror Moment | Just got out of the shower... 🚿✨ |
| 3 | `sofa_evening` | Sofa Vibes | Netflix and... 🍷 |
| 4 | `vanity_getting_ready` | Getting Ready | Getting ready for something special tonight... 💄 |
| 5 | `yoga_flexibility` | Yoga Time | Flexibility is key 🧘‍♀️ |
| 6 | `balcony_golden_hour` | Golden Hour | Paris sunsets hit different ✨ |
| 7 | `bath_self_care` | Self-Care Sunday | Sunday self-care ritual 🛁🕯️ |
| 8 | `bed_edge_confident` | Bedroom Confidence | Feeling myself today 💋 |
| 9 | `oversized_sweater` | Cozy Morning | Boyfriend sweater but no boyfriend needed 😏 |
| 10 | `post_workout_glow` | Post-Workout Glow | That after workout feeling 💪✨ |
| 11 | `silk_slip_evening` | Evening Ready | Ready for tonight... or staying in? 🖤 |
| 12 | `lazy_bed_day` | Lazy Day | Some days you just stay in bed 😴💕 |
| 13 | `fresh_from_shower` | Fresh Out | That fresh feeling ✨🚿 |
| 14 | `satin_loungewear` | Satin Dreams | Ending the day right 🌙 |

---

## 🚀 Utilisation

### Test local (génère sans poster)
```bash
cd app
node scripts/daily-fanvue-elena.mjs --test
```

### Forcer un jour spécifique
```bash
node scripts/daily-fanvue-elena.mjs --day 5 --test
```

### Production (avec post Fanvue)
```bash
node scripts/daily-fanvue-elena.mjs
```

### Via GitHub Actions
- Automatique : tous les jours à 17h Paris
- Manuel : Actions → "Elena Daily Fanvue Post" → Run workflow

---

## 🧪 Tests effectués

- ✅ Génération image Day 1 "Morning Stretch" 
- ✅ Upload Cloudinary réussi
- ✅ Prompt safe-sexy passe les filtres Nano Banana Pro
- ✅ Consistance Elena (visage, bijoux, corps)
- ⏳ Post Fanvue non testé (besoin tokens en prod)

---

## 📋 À faire prochaine session

- [ ] Obtenir et configurer les tokens Fanvue dans GitHub Secrets
- [ ] Tester le post réel sur Fanvue
- [ ] Activer le GitHub Action en production
- [ ] Monitorer les premiers posts automatiques

---

## 💡 Notes techniques

### Vocabulaire Safe-Sexy (docs/19-QUALITY-SEXY-STRATEGY.md)
- ❌ "lingerie" → ✅ "delicate silk camisole", "loungewear"
- ❌ "sensual" → ✅ "captivating", "alluring", "magnetic"
- ❌ "sexy pose" → ✅ "confident feminine pose"

### Fanvue API
- `is_premium: true` = abonnés seulement (payants)
- `is_premium: false` = suiveurs gratuits

### Horaire CRON
- `0 16 * * *` = 16:00 UTC = 17:00 Paris (hiver) / 18:00 Paris (été)

---

## 🔗 Documents liés

- [19-QUALITY-SEXY-STRATEGY.md](../19-QUALITY-SEXY-STRATEGY.md) — Vocabulaire safe-sexy
- [Fanvue OAuth Session](./2024-12-26-fanvue-oauth.md) — Setup OAuth initial
- [Elena Character](../characters/elena/PERSONNAGE.md) — Character sheet Elena

---

*Session terminée le 29 décembre 2024*

