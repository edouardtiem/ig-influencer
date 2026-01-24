# 💡 IDEA-020 — Custom Fields Expansion pour DM

**Date** : 19 janvier 2026  
**Priorité** : 🟠 Haute  
**Complexité** : Moyenne  
**Impact estimé** : +15-25% conversion rate

---

## 📋 Résumé

Suite au fix du système de custom fields (`elena_should_send`), étendre l'architecture pour une personnalisation avancée des conversations DM.

---

## 🎯 Objectifs

1. **Personnalisation linguistique** — Répondre dans la bonne langue dès le premier message
2. **Flows intelligents** — Conditions ManyChat basées sur l'état du contact
3. **Mémoire long-terme** — Se souvenir des infos partagées par l'utilisateur
4. **Meilleurs pitches** — Adapter le pitch selon le profil

---

## 📊 État actuel vs Cible

### Actuellement
| Custom Field | Usage |
|--------------|-------|
| `elena_response` | Texte à envoyer |
| `elena_should_send` | Flag d'envoi |

### Cible Phase 1
| Custom Field | Usage |
|--------------|-------|
| `elena_response` | Texte à envoyer |
| `elena_should_send` | Flag d'envoi |
| `elena_language` | Langue détectée (en/fr/it/es) |
| `elena_stage` | Stage funnel (cold/warm/hot/pitched) |
| `elena_msg_count` | Nombre de messages |

### Cible Phase 2+
| Custom Field | Usage |
|--------------|-------|
| `elena_score` | Score engagement 0-100 |
| `elena_first_name` | Prénom extrait |
| `elena_last_intent` | Dernier intent détecté |

---

## 🔧 Implémentation

### Phase 1 : Langue + Stage (1-2 jours)

**Backend** (`/api/dm/webhook/route.ts`) :
```typescript
return NextResponse.json({
  success: true,
  should_send: true,
  response: result.response,
  // NOUVEAU :
  detected_language: result.contact.detected_language || 'auto',
  lead_stage: result.contact.stage,
  message_count: result.contact.message_count,
});
```

**ManyChat Response Mapping** :
- `detected_language` → `elena_language`
- `lead_stage` → `elena_stage`
- `message_count` → `elena_msg_count`

### Phase 2 : Détection langue améliorée (1-2 jours)

**Option recommandée : Hybride**
1. Utiliser `{{locale}}` ManyChat comme valeur initiale
2. Affiner avec détection algorithmique
3. Permettre changement explicite

**Flow ManyChat optionnel** :
```
[Premier DM] → [Quick Reply langue] → [Store + Continue]
```

### Phase 3 : Mémoire long-terme (3-5 jours)

**Nouvelle table Supabase** :
```sql
CREATE TABLE elena_contact_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES elena_dm_contacts(id),
  fact_type TEXT,
  fact_value TEXT,
  confidence DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Types de faits** :
- `location` — Ville/pays
- `job` — Métier
- `hobby` — Centres d'intérêt
- `mentioned` — Événements mentionnés

---

## 📈 Impact attendu

| Métrique | Avant | Après (estimé) |
|----------|-------|----------------|
| Réponses dans bonne langue | ~70% | ~95% |
| Taux réponse après pitch | ~15% | ~25% |
| Conversions Fanvue | Baseline | +15-25% |
| NPS implicite (engagement) | Baseline | +20% |

---

## ⚠️ Risques

1. **Complexité ManyChat** — Plus de custom fields = plus de conditions à gérer
2. **Performance** — Plus de données à transférer dans chaque requête
3. **Maintenance** — Sync Supabase ↔ ManyChat à maintenir

**Mitigations** :
- Documentation claire des custom fields
- Monitoring des temps de réponse webhook
- Tests automatisés pour vérifier le mapping

---

## 📁 Fichiers à modifier

- `app/src/app/api/dm/webhook/route.ts` — Ajouter champs dans response
- `app/src/lib/elena-dm.ts` — Enrichir données retournées
- `app/supabase/migrations/XXX_contact_facts.sql` — Nouvelle table (Phase 3)

---

## 🔗 Dépendances

- ✅ [DONE-072] ManyChat Conditional Fix
- ✅ [DONE-073] Auto-Reactivation
- 🔄 Accès admin ManyChat pour créer custom fields

---

## 📝 Notes

Inspiré par les best practices ManyChat 2025-2026 :
- Array fields pour données multi-valeurs
- System fields pour compliance (opt-in, timezone)
- Layered memory architecture (short-term + long-term)

Références :
- [ManyChat Custom Fields Docs](https://help.manychat.com/hc/en-us/articles/14281167138588)
- [ManyChat System Fields](https://help.manychat.com/hc/en-us/articles/14281292522652)
