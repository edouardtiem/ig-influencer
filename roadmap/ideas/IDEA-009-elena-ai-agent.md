# 💡 IDEA-009 — Elena AI Agent (Conversationnel + Auto-Learning)

**Priorité** : 🔴 High  
**Impact** : 🔴 High  
**Effort** : 🔴 High (~8h)  
**Status** : 💡 Idea (Architecture définie)

---

## 📋 Description

Agent conversationnel IA qui gère les DMs Instagram avec Elena comme persona. L'agent flirte naturellement, détecte le bon timing pour envoyer le lien Fanvue, et s'améliore automatiquement en analysant ses succès et erreurs.

---

## 🎯 Objectifs

- **Conversion DM → Fanvue** : 10-15% (vs 5% avec automation simple)
- **Expérience utilisateur** : Conversation naturelle, pas de spam
- **Auto-amélioration** : L'agent apprend des patterns de conversations réussies
- **Tracking complet** : Toutes les conversations dans Supabase

---

## 🏗️ Architecture

```
ManyChat (DM) → Webhook → API /elena-agent → Claude AI
                                              ↓
                                         Supabase
                                         - conversations
                                         - messages
                                         - learnings
                                              ↓
                                         Feedback Loop
                                         (cron quotidien)
```

### Composants

1. **System Prompt Elena** — Persona flirty, mystérieuse, joueuse
2. **Ready Score** — 0-100 pour détecter timing optimal
3. **Conversation Memory** — Historique dans Supabase
4. **Auto-Learning** — Analyse patterns → Update prompt

---

## 📊 Tables Supabase

```sql
-- Conversations avec users
dm_conversations
- ig_user_id, ig_username
- status, ready_score, messages_count
- link_sent_at, converted_at, revenue

-- Historique des messages
dm_messages
- conversation_id, role, content
- ready_score_at_time, action_taken, ai_reasoning

-- Learnings auto-générés
agent_learnings
- learning_type, description
- example_conversation_id, example_messages
- success_rate, sample_size
- applied_to_prompt
```

---

## 🎨 System Prompt Concept

```
Tu es Elena Visconti, 26 ans, mannequin et influenceuse lifestyle à Paris.

## PERSONNALITÉ
- Mystérieuse, séductrice, joueuse
- Tu tutoies toujours, ton est décontracté
- Tu utilises des emojis avec parcimonie (💋 ✨ 🔥)
- Mix français/anglais naturel

## OBJECTIF CACHÉ
Amener naturellement la conversation vers ton pack exclusif Fanvue.
Ne JAMAIS être pushy. Le timing est tout.

## INDICATEURS "PRÊT À ACHETER" (ready_score)
+20 : Compliments sur ton physique
+15 : Questions sur ton contenu
+10 : Réponses longues et engagées
+25 : Demande explicite de plus de photos
+30 : Mention "exclusif", "privé", "voir plus"

## STRATÉGIE PAR PHASE
- Score 0-30: Small talk, apprendre à le connaître
- Score 30-60: Flirt léger, teasing sur ton contenu
- Score 60-80: Hints sur ton "côté secret"
- Score 80+: Envoyer le lien naturellement
```

---

## 📝 Implémentation

### Phase 1 : Infrastructure (3h)
- [ ] Tables Supabase créées
- [ ] API `/api/elena-agent` endpoint
- [ ] Intégration ManyChat webhook

### Phase 2 : AI Agent (3h)
- [ ] System prompt Elena finalisé
- [ ] Ready score logic
- [ ] Conversation memory management
- [ ] Response generation avec Claude

### Phase 3 : Auto-Learning (2h)
- [ ] Feedback loop cron job
- [ ] Pattern analysis
- [ ] Learning generation
- [ ] Prompt updates automatiques

---

## 📈 Métriques à Tracker

- **Conversion Rate** : DMs → Fanvue purchases
- **Ready Score Distribution** : Quand le lien est envoyé
- **Messages per Conversion** : Combien de messages avant conversion
- **Time to Conversion** : Temps entre premier DM et achat
- **Learning Impact** : Amélioration du taux de conversion après learnings

---

## 🔗 Liens

- [Session 26/12/2024](./docs/sessions/2024-12-26-manychat-ai-agent.md)
- [Guide ManyChat](./docs/23-MANYCHAT-SETUP.md)

---

*Créé le 26 décembre 2024*

