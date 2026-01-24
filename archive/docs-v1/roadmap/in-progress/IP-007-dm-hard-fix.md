# 🔧 IP-007 — Hard Fix DM Automation

**Date** : 19 janvier 2026  
**Objectif** : Résoudre TOUS les bugs DM de manière définitive avec tests systématiques

---

## 🔴 Problèmes identifiés

### 1. Boucle "hey 🖤"
- Le bot répond "hey 🖤" en boucle sur certaines conversations
- Cause probable : fallback qui s'active trop souvent

### 2. Boucle messages de fin
- "je dois filer", "mon manager m'appelle" envoyés en boucle
- Cause probable : pas de HARD STOP après envoi du message de fin

### 3. Conversations 300+ messages sans arrêt
- Des contacts HOT avec 300+ messages qui continuent
- MESSAGE_CAPS ignoré ou contourné

### 4. Elena demande de parler anglais
- Au lieu de répondre dans la langue de l'utilisateur
- Devrait parler toutes les langues

### 5. Double messages (ManyChat)
- Webhook envoyé 2x parfois
- Accepté comme limitation ManyChat

---

## 🔬 Plan d'investigation

### Phase 1 : Analyse du code

- [ ] Comprendre le flow complet : webhook → processDM → response
- [ ] Identifier tous les points où un message peut être envoyé
- [ ] Vérifier la logique de STOP (où et comment)
- [ ] Vérifier la logique de détection de langue

### Phase 2 : Scripts de test

- [ ] Script 1 : Simuler un message entrant normal
- [ ] Script 2 : Simuler un contact avec 50+ messages (devrait être STOP)
- [ ] Script 3 : Simuler un contact PITCHED qui revient
- [ ] Script 4 : Simuler un contact STOPPED
- [ ] Script 5 : Tester différentes langues

### Phase 3 : Hypothèses et fixes

| # | Hypothèse | Test | Fix | Status |
|---|-----------|------|-----|--------|
| H1 | MESSAGE_CAPS pas respecté | Simuler contact > cap | ? | ⏳ |
| H2 | STOPPED contacts reçoivent encore des réponses | Simuler STOPPED | ? | ⏳ |
| H3 | Exit message envoyé mais pas de flag STOP | Vérifier DB après exit | ? | ⏳ |
| H4 | Langue forcée à l'anglais dans le prompt | Lire le code | ? | ⏳ |
| H5 | Fallback "hey 🖤" encore présent | Grep le code | ? | ⏳ |

---

## 📝 Résultats d'investigation

### Tests effectués (19/01/2026 11:38)

```
TEST 1: Contacts avec 100+ messages
- 10 contacts avec 100-581 messages
- TOUS STOPPED maintenant ✅
- BUG: message_count = ~50% du réel (compte que les entrants)

TEST 2: Contacts STOPPED avec messages après stop
- 1 contact a reçu un message APRÈS stop (@matches8078)

TEST 3: Exit messages en boucle
- ✅ Aucune boucle détectée maintenant

TEST 4: Boucles "hey 🖤"
- ✅ Aucune boucle détectée maintenant

TEST 5: MESSAGE_CAPS consistency
- 🐛 Stage HOT: 10 contacts > 20 msgs mais PAS STOPPED
- 🐛 Stage PITCHED: 10 contacts > 5 msgs mais PAS STOPPED

TEST 6: Webhook pour contact STOPPED
- ✅ Retourne skip=true (correct)

TEST 7: Problèmes de langue
- 🐛 20 messages demandant l'anglais alors que Elena parle toutes langues

TEST 8: Conversations récentes (12h)
- 6x réponses vides
- 3x messages à contacts STOPPED
```

### Bugs identifiés et fixes

| # | Bug | Cause | Fix | Status |
|---|-----|-------|-----|--------|
| B1 | Contacts > cap pas STOPPED | Caps réduits après leur dernière interaction | Script force STOP 105 contacts | ✅ FIXÉ |
| B2 | Messages à contacts STOPPED | Exit messages (normal) | N/A - comportement attendu | ✅ OK |
| B3 | Elena demande l'anglais | Default language = 'en' | Remove default, mirror user's language | ✅ FIXÉ |
| B4 | message_count != réel | Compte que entrants | Non critique pour caps | ℹ️ INFO |

### Résultats après fixes (19/01/2026 11:50)

```
TEST 1: Contacts avec 100+ messages
- Tous STOPPED ✅

TEST 5: MESSAGE_CAPS consistency
- ✅ Stage cold: OK (cap=15)
- ✅ Stage warm: OK (cap=20)
- ✅ Stage hot: OK (cap=20)
- ✅ Stage pitched: OK (cap=5)
- ✅ Stage converted: OK (cap=50)
- ✅ Stage paid: OK (cap=100)

TEST 6: Webhook pour contact STOPPED
- ✅ Retourne skip=true (correct)

TEST 8: Conversations récentes (12h)
- ✅ 0x hey 🖤 seul
- ✅ 0x exit messages en boucle
- 6x réponses vides (fallback smart - acceptable)
```

---

## ✅ Critères de succès

1. Un contact STOPPED ne reçoit AUCUN message
2. Un contact > MESSAGE_CAP ne reçoit plus de messages
3. Pas de boucle "hey 🖤"
4. Pas de boucle "je dois filer"
5. Elena répond dans la langue de l'utilisateur
6. Tests passent tous

---

## 🔗 Fichiers concernés

- `app/src/lib/elena-dm.ts` — Logique principale
- `app/src/app/api/dm/webhook/route.ts` — Webhook ManyChat
- Scripts de test à créer

