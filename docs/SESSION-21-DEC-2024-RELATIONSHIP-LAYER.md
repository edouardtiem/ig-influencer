# 📝 SESSION — 21 Décembre 2024 (Partie 3)

## 💕 Relationship Layer — The Secret

**Date** : 21 décembre 2024  
**Durée** : ~45min

---

### ✅ Ce qui a été fait cette session :

1. **Nouveau Layer 6 : Relationship Layer**
   - Créé `app/scripts/lib/relationship-layer.mjs`
   - Système de hints subtils pour suggérer la relation Mila x Elena
   - 5 niveaux de teasing progressifs
   - Catalogue de 15+ types de hints

2. **Intégration dans Content Brain V2.2**
   - Import du relationship layer
   - Ajout au prompt Claude (section 6️⃣)
   - Nouveau champ `relationship_hint` dans le JSON output
   - Règle STRICTE #9 : intégrer le hint suggéré

3. **Update CHARACTER_SHEETS**
   - Ajout de la section "Sa meilleure amie"
   - Backstory enrichie (t-shirt Blondie, bar rock du 11e)
   - **LE SECRET** clairement indiqué (mais jamais dit publiquement)

4. **Schema Supabase mis à jour**
   - Nouvelle table `relationship_hints` pour tracker l'usage
   - Mise à jour des données `relationships` avec backstory enrichie
   - Version 1.1.0

---

### 📁 Fichiers créés/modifiés :

**Créés :**
- `app/scripts/lib/relationship-layer.mjs` — Le layer complet

**Modifiés :**
- `app/scripts/cron-scheduler.mjs` — V2.2 avec 6 layers
- `app/supabase/schema.sql` — Table relationship_hints

---

### 💕 LE SECRET

> **Mila et Elena sont ensemble, mais on ne le dit JAMAIS.**
> 
> On suggère subtilement à travers :
> - Captions tendres ("ma personne" 💕)
> - Éléments visuels (2 tasses, main dans le frame)
> - Timing parallèle (même lieu, même jour)
> - Items partagés (Elena porte le collier de Mila)

**Règles d'or :**
1. JAMAIS confirmer explicitement
2. Laisser les fans spéculer (engagement!)
3. Si question directe → "C'est ma best friend 💕"
4. Subtext > text — show, don't tell

---

### 🎭 Niveaux de Teasing

| Level | Nom | Description | Exemples |
|-------|-----|-------------|----------|
| 1 | parallel_lives | Même lieu, même jour (non dit) | Les deux à Montmartre |
| 2 | best_friends | Ensemble, tags, amitié visible | Brunch à deux |
| 3 | intimate_hints | 2 tasses, main presque visible | "Cozy morning 💕" |
| 4 | couple_energy | Valentine's "solo", items partagés | Elena avec collier étoile |
| 5 | undeniable | Même chambre d'hôtel (angles différents) | Fans reconstituent |

**Niveau actuel : 3** (intimate_hints)

---

### 📊 Hint Catalog (extrait)

| Type | Level | Fréquence | Note |
|------|-------|-----------|------|
| `tag_each_other` | 2 | 2x/week | Tag dans caption |
| `duo_content` | 2 | 1x/week | Ensemble visible |
| `matching_outfits` | 3 | 2x/month | Jamais même jour |
| `same_location_same_day` | 3 | 1x/week | Jamais même frame |
| `two_cups` | 4 | 2x/month | Ne pas dire pour qui |
| `shared_item` | 4 | 1x/month | Bijou de l'autre |
| `caption_slip` | 5 | 2x/year | "We" → "I*" |

---

### 💡 Idées notées :

- Tracker les comments qui mentionnent "couple", "dating", "together"
- A/B test : posts avec hint vs sans hint → engagement
- Progression naturelle du teasing level avec growth du compte
- Event spécial Valentine's Day 2025 (double teasing)

---

### 📝 Notes importantes :

**Comment ça marche dans le scheduler :**

```javascript
// Le scheduler reçoit le hint suggéré
const relationship = await fetchRelationship(supabase, character);
// → { suggestedHint: { type: 'two_cups', level: 4, ... } }

// Claude l'intègre dans le planning
// Post généré avec relationship_hint: 'two_cups'
// → prompt_hints: "morning coffee, two cups visible on table"
// → caption: "Morning ritual ☕ You prefer tea or coffee?"
```

**Exemple output enrichi :**

```
════════════════════════════════════════════════════════════
🧠 CONTENT BRAIN V2.2 — ELENA
════════════════════════════════════════════════════════════

💕 Relationship hint: same_location_same_day
   → Mila a posté depuis Montmartre hier

📅 Planning généré:
────────────────────────────────────────────────────────────
10:00 │ CAROUSEL │ ✨ Café Montmartre
       Caption: "Exploring new neighborhoods 🤍 Any recommendations?"
       [HINT: same location as Mila yesterday]
────────────────────────────────────────────────────────────
```

---

### 🚀 Prochaines étapes :

- [ ] Tester le scheduler V2.3 en local
- [ ] Créer `video-reel-post-elena.mjs`
- [ ] Tracker l'engagement des posts avec hints vs sans
- [ ] Préparer contenu Valentine's Day 2025

---

### ⚡ Update: Extended Thinking activé

**V2.3** utilise maintenant Claude Sonnet 4 avec Extended Thinking :

```javascript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 16000,
  thinking: {
    type: 'enabled',
    budget_tokens: 10000,  // Deep reasoning sur 6 layers
  },
  messages: [{ role: 'user', content: prompt }],
});
```

**Coût estimé** : ~$4.30/mois (vs $2.50 sans thinking)

**Avantages** :
- Meilleure analyse des 6 layers d'intelligence
- Hints relationship plus subtils et contextuels
- Décisions narratives plus cohérentes

---

**Commits de cette session :**
```
feat: Add Relationship Layer (V2.3) - The Secret 💕
- New relationship-layer.mjs with hint system
- Updated cron-scheduler with 6 layers + Extended Thinking
- Enhanced CHARACTER_SHEETS with secret backstory
- New relationship_hints table in Supabase
```

