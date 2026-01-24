# 📅 Session 28 Décembre 2024 — Fanvue Bot Uncensored Research

**Date** : 28 décembre 2024  
**Durée** : ~1h

---

## 🎯 Objectif de la session

Rechercher les options pour créer un bot IA similaire au système DM Instagram mais pour **Fanvue**, avec un niveau de contenu **beaucoup plus spicy/sexuel**. Évaluation des modèles uncensored disponibles et choix de la meilleure solution.

---

## ✅ Ce qui a été fait cette session :

### 1. 🔍 Recherche modèles uncensored — Replicate

- **Résultat** : ❌ **Aucun modèle uncensored disponible**
- Replicate ne propose que des modèles standards censurés (Meta Llama, Claude via proxy, etc.)
- Pas d'options Dolphin ou abliterated

### 2. 🌐 Recherche modèles uncensored — OpenRouter

- **Résultat** : ✅ **Venice Uncensored disponible (GRATUIT)**
- Modèle : `venice/dolphin-mistral-24b-venice:free`
- Basé sur Dolphin Mistral 24B, 100% uncensored
- API compatible OpenAI SDK
- Endpoint : `https://openrouter.ai/api/v1`

### 3. 🏛️ Recherche Venice.ai Direct

- **Résultat** : ✅ **Meilleure option — API directe disponible**
- Modèle : `venice-uncensored` (Venice Uncensored 1.1)
- Endpoint : `https://api.venice.ai/api/v1`
- **100% compatible OpenAI SDK** (drop-in replacement)
- Compte existant → 0 setup supplémentaire

### 4. 📊 Comparaison Venice Direct vs OpenRouter

| Aspect | **Venice Direct** | **OpenRouter** |
|--------|-------------------|----------------|
| **Latence** | ⚡ Plus rapide (direct) | 🐢 +50-100ms (proxy) |
| **Modèles** | Venice only | 200+ providers |
| **Fallback** | ❌ Non | ✅ Auto-fallback |
| **Pricing** | VCU (credits) ou USD | Pay-per-token |
| **Setup** | ✅ Compte existant | ❌ Nouveau compte |

**Décision** : **Venice Direct** — Plus rapide, compte existant, API identique

### 5. 💡 Recommandation finale

**Utiliser Venice.ai directement avec la clé API existante** :

```typescript
// Venice AI - 100% compatible OpenAI SDK
import OpenAI from 'openai';

const venice = new OpenAI({
  baseURL: 'https://api.venice.ai/api/v1',
  apiKey: process.env.VENICE_API_KEY,  // Clé API Venice existante
});

const response = await venice.chat.completions.create({
  model: 'venice-uncensored',  // Modèle sans censure
  messages: [
    { role: 'system', content: ELENA_HOT_SYSTEM_PROMPT },
    { role: 'user', content: userMessage }
  ],
  max_tokens: 200,
});
```

**Avantages** :
- ✅ 2 lignes de différence avec Claude actuel
- ✅ Plus rapide (pas de proxy)
- ✅ Compte existant → 0 setup
- ✅ Modèle uncensored validé

---

## 📁 Fichiers créés/modifiés :

- ✅ `docs/sessions/2024-12-28-fanvue-bot-uncensored-research.md` (ce fichier)

---

## 🚧 En cours (non terminé) :

- **Bot Fanvue** : Architecture définie, prêt à implémenter
  - Prompt "hot mode" Elena à créer
  - Intégration API Chat Fanvue (`read:chat` / `write:chat`)
  - Schema Supabase pour tracking conversations Fanvue

---

## 📋 À faire prochaine session :

- [ ] **Implémenter bot Fanvue avec Venice Uncensored**
  - [ ] Créer `app/src/lib/elena-dm-fanvue.ts`
  - [ ] Créer prompt système Elena "hot mode" (9/10 sensualité)
  - [ ] Intégrer API Chat Fanvue (`/v1/messages` ou `/v1/conversations`)
  - [ ] Créer endpoint `/api/fanvue/dm/webhook` ou polling CRON
  - [ ] Schema Supabase pour contacts/messages Fanvue
  - [ ] Ajouter `VENICE_API_KEY` à `.env`

- [ ] **Tester contenu explicite** : Vérifier limites Venice Uncensored
- [ ] **Documenter stratégie conversion** : Fanvue DM → Abonnement payant

---

## 🐛 Bugs découverts :

- Aucun

---

## 💡 Idées notées :

- **Approche hybride** : Claude pour conversation normale, Venice Uncensored pour flirt/sexting explicite
- **Escalation automatique** : Détecter intent du message → router vers modèle approprié
- **Fallback OpenRouter** : Si Venice down, utiliser OpenRouter comme backup

---

## 📝 Notes importantes :

### Modèles uncensored disponibles

| Provider | Modèle | Prix | Notes |
|----------|--------|------|-------|
| **Venice.ai** | `venice-uncensored` | VCU/USD | ✅ **CHOISI** — Direct, rapide, compte existant |
| **OpenRouter** | `venice/dolphin-mistral-24b-venice:free` | Gratuit | Alternative si Venice down |
| **Together.ai** | Llama uncensored | Payant | Pas testé |
| **HuggingFace** | Modèles abliterated | Self-host | Trop complexe |

### Implémentation technique

**Changement minimal** vs système DM Instagram actuel :
- Même architecture (webhook/polling → API → AI → Response)
- Même Supabase schema (adapté pour Fanvue)
- Seule différence : **modèle AI** (Venice vs Claude) + **prompt "hot"**

### Claude vs Venice Uncensored

| Aspect | Claude | Venice Uncensored |
|--------|--------|-------------------|
| **Contenu suggestif** | ⭐⭐⭐ (limité) | ⭐⭐⭐⭐⭐ (aucune limite) |
| **Qualité conversation** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Coût** | $$ | $ (VCU) |
| **Latence** | ~1-2s | ~0.5-2s |

**→ Venice parfait pour Fanvue où le contenu doit être explicite**

---

## 🔗 Liens utiles

- [Venice.ai API Docs](https://docs.venice.ai/api-reference/endpoint/chat/completions)
- [Venice.ai Models](https://docs.venice.ai/models/overview)
- [OpenRouter Venice Uncensored](https://openrouter.ai/models?q=uncensored)
- [DM Automation System](./2024-12-26-dm-automation.md)
- [Fanvue OAuth Integration](./2024-12-26-fanvue-oauth.md)

---

*Session documentée le 28/12/2024*







