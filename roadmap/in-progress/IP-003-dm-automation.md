# 🚧 IP-003 — DM Automation System (Elena)

**Priorité** : 🔴 High  
**Impact** : 🔴 High  
**Effort** : 🟡 Medium (~7h total)  
**Status** : 🚧 In Progress (Spécifié, prêt à implémenter)

---

## 📋 Description

Système complet d'automatisation des DMs Instagram pour Elena :
- Réponse automatique via Claude AI (voix Elena)
- Lead scoring automatique (cold → warm → hot)
- Conversion vers Fanvue gratuit puis payant
- Historique complet dans Supabase

---

## 🎯 Objectifs

| Métrique | Target |
|----------|--------|
| DM → Fanvue Free | 10-15% |
| Free → Paid | 5-10% |
| Messages avant pitch | 6-8 |
| Taux de réponse | >80% |

---

## 🏗️ Architecture

```
Instagram DM → ManyChat → Webhook → Claude AI → Response
                                      ↓
                                  Supabase
                                  (contacts, messages)
```

---

## 📝 Spécifications

**Documentation complète** : [docs/24-DM-AUTOMATION-SYSTEM.md](../../docs/24-DM-AUTOMATION-SYSTEM.md)

### Tables Supabase
- `elena_dm_contacts` — Leads avec stage scoring
- `elena_dm_messages` — Historique conversations

### API Endpoints
- `POST /api/dm/webhook` — Webhook ManyChat
- `GET /api/dm/contacts` — Liste contacts + stats

### System Prompt
- Elena = modèle IA (honnête si demandé)
- Lead scoring par nombre de messages
- Stratégie différente par stage

---

## ✅ Checklist Implémentation

### Phase 1 : Infrastructure (2h)
- [ ] Créer table `elena_dm_contacts` dans Supabase
- [ ] Créer table `elena_dm_messages` dans Supabase
- [ ] Créer indexes
- [ ] Test connexion Supabase

### Phase 2 : API Webhook (3h)
- [ ] Créer `/api/dm/webhook/route.ts`
- [ ] Intégrer Claude API
- [ ] Logique lead scoring
- [ ] Sauvegarde messages
- [ ] Test local

### Phase 3 : ManyChat (1h)
- [ ] Configurer Flow "AI Response"
- [ ] Webhook URL Vercel
- [ ] Test end-to-end

### Phase 4 : Dashboard (1h)
- [ ] Endpoint `/api/dm/contacts`
- [ ] Stats par stage
- [ ] (Optionnel) UI

---

## 📁 Fichiers à Créer

```
app/src/app/api/dm/
├── webhook/
│   └── route.ts
├── contacts/
│   └── route.ts
└── lib/
    └── elena-prompt.ts
```

---

## 💰 Coûts

| Service | Coût/mois |
|---------|-----------|
| ManyChat Pro | ~15$ |
| Claude API | ~5-10$ |
| Supabase | Gratuit |
| **Total** | **~20-25$** |

---

## 🔗 Liens

- [Spec complète](../../docs/24-DM-AUTOMATION-SYSTEM.md)
- [Session 26/12/2024](../../docs/sessions/2024-12-26-dm-automation.md)
- [IDEA-009 Original](../ideas/IDEA-009-elena-ai-agent.md)
- [ManyChat Setup](../../docs/23-MANYCHAT-SETUP.md)

---

## 📅 Timeline

- **26 Dec** : Spécification complète ✅
- **27 Dec** : Phase 1 (Supabase) 
- **28 Dec** : Phase 2 (API)
- **29 Dec** : Phase 3-4 (ManyChat + Test)

---

*Créé le 26 décembre 2024*
*Migré depuis IDEA-009*

