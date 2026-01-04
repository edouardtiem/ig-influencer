# 🌍 DM System — Language Detection & Dynamic Response Language

**Date** : 5 janvier 2025  
**Durée** : ~1h

---

## 🎯 Objectif

Implémenter une détection de langue intelligente pour Elena :
- **Commencer systématiquement en anglais**
- **Détecter la langue du lead** (explicite OU après plusieurs messages)
- **Stocker la langue en BDD** pour maintenir la cohérence
- **Répondre dans la langue détectée** (pas de mélange FR/EN)

---

## ✅ Ce qui a été fait cette session

### 1. **Migration SQL — Champs Language Detection**

**Ajout de 3 colonnes** à `elena_dm_contacts` :
- `detected_language` : Code langue (en, fr, it, es, pt, de) ou NULL
- `language_confidence` : Niveau de confiance 0-10
- `language_detected_at` : Timestamp de détection

**Règles de confiance** :
- **10** = Statement explicite ("parle français", "in english please")
- **3+** = Après 3+ messages dans la même langue (pattern detection)

**Fichier** : `app/supabase/migrations/004_add_language_detection.sql`

---

### 2. **Language Detection Logic**

**Fonction `detectLanguageFromMessage()`** :
- **Explicit statements** : Patterns comme "je parle français", "speak english", "parlo italiano"
- **Pattern matching** : Mots courants FR/EN/IT/ES/PT/DE
- Retourne `{ language, isExplicit }`

**Fonction `updateContactLanguage()`** :
- Si **explicite** → Set immédiatement avec confidence 10
- Si **pattern détecté** → Incrémente confidence, set quand >= 3
- Si **langue différente** mais déjà détectée → Garde l'originale (pas de switch mid-conversation)

**Langues supportées** :
- 🇬🇧 English (en) — **Par défaut**
- 🇫🇷 Français (fr)
- 🇮🇹 Italiano (it)
- 🇪🇸 Español (es)
- 🇵🇹 Português (pt)
- 🇩🇪 Deutsch (de)

**Fichier** : `app/src/lib/elena-dm.ts` (lignes 888-1030)

---

### 3. **Integration dans ProcessDM**

**Flow** :
1. Message reçu → `processDM()`
2. Contact récupéré → `getOrCreateContact()`
3. **Language detection** → `updateContactLanguage()` appelé après `updateContactAfterMessage()`
4. Langue mise à jour dans le contact object
5. Passée à `generateElenaResponse()`

**Fichier** : `app/src/lib/elena-dm.ts` (ligne ~1707)

---

### 4. **Dynamic Language Instruction dans Prompt**

**Modification de `generateElenaResponse()`** :
- Récupère `contact.detected_language` (ou 'en' par défaut)
- Génère instruction selon langue :
  - `🌍 LANGUE: Français. Réponds en français uniquement. Pas de mots anglais.`
  - `🌍 LANGUAGE: English. Respond in English only.`
  - etc.
- Injectée dans le `contextPrompt` passé à Claude

**Impact** :
- ✅ Elena répond dans la langue détectée
- ✅ Pas de mélange FR/EN
- ✅ Cohérence maintenue grâce au stockage BDD

**Fichier** : `app/src/lib/elena-dm.ts` (lignes ~1379-1426)

---

## 📁 Fichiers créés/modifiés

### Créés
- `app/supabase/migrations/004_add_language_detection.sql` : Migration SQL

### Modifiés
- `app/src/lib/elena-dm.ts` :
  - Interface `DMContact` : Ajout `detected_language`, `language_confidence`, `language_detected_at`
  - Fonction `detectLanguageFromMessage()` : Détection avec patterns + explicit statements
  - Fonction `updateContactLanguage()` : Logique de mise à jour avec confidence
  - `processDM()` : Appel à `updateContactLanguage()` après incoming message
  - `generateElenaResponse()` : Instruction langue dynamique dans le prompt

---

## 📊 Impact

| Aspect | Avant | Après |
|--------|-------|-------|
| **Premier message** | ❓ Aléatoire | ✅ Toujours anglais |
| **Détection langue** | ❌ Aucune | ✅ Explicite OU 3+ messages |
| **Cohérence langue** | ❌ Mélange FR/EN | ✅ Langue unique maintenue |
| **Stockage** | ❌ Pas de tracking | ✅ Langue stockée en BDD |

---

## 🚧 En cours (non terminé)

- **Test en production** : Vérifier que la détection fonctionne correctement
- **Monitoring** : Analyser les langues détectées (analytics)

---

## 📋 À faire prochaine session

- [ ] **Audit des langues détectées** : Vérifier que les patterns fonctionnent bien
- [ ] **Ajuster patterns si besoin** : Ajouter plus de mots/phrases selon les retours
- [ ] **Analytics dashboard** : Afficher la répartition des langues détectées
- [ ] **Question en suspens** : Reset funnel après 7 jours pour warm/hot leads ?

---

## 🐛 Bugs découverts

- Aucun bug découvert lors de l'implémentation

---

## 💡 Idées notées

- **Language-specific pitches** : Adapter les pitches Fanvue selon la langue (FR vs EN vs IT)
- **Language-specific personality** : Elena pourrait avoir des nuances selon la langue (plus directe en FR, plus playful en EN)
- **Multi-language support** : Si un contact mixe 2 langues, détecter la langue dominante

---

## 📝 Notes importantes

### Confidence Levels

- **0-2** : Pas assez de messages, pas de langue confirmée
- **3-9** : Langue confirmée après plusieurs messages (pattern-based)
- **10** : Langue confirmée explicitement (user statement)

### Explicit Statements Patterns

**Français** :
- "je parle français" / "parle français" / "en français" / "français svp"
- "je suis français/française" / "from france" / "de france"

**English** :
- "i speak english" / "in english" / "english please" / "speak english"
- "i am english" / "from usa" / "from uk" / "from america"

**Italiano** :
- "parlo italiano" / "in italiano" / "italiano per favore"
- "sono italiano/italiana" / "from italy" / "dall'italia"

**Español** :
- "hablo español" / "en español" / "español por favor"
- "soy español/española" / "from spain" / "de españa"

**Português** :
- "falo português" / "em português" / "português por favor"
- "sou brasileiro/brasileira" / "from brazil" / "from portugal"

**Deutsch** :
- "ich spreche deutsch" / "auf deutsch" / "deutsch bitte"
- "ich bin deutsch" / "from germany" / "aus deutschland"

### Pattern Matching

Chaque langue a une liste de patterns (mots courants) :
- **FR** : bonjour, salut, merci, comment, pourquoi, c'est, je suis, tu es, etc.
- **EN** : hello, hi, thanks, how, are you, i am, you are, etc.
- **IT** : ciao, grazie, come, stai, sono, sei, etc.
- **ES** : hola, gracias, cómo, estás, soy, eres, etc.
- **PT** : olá, obrigado, como, você, eu sou, etc.
- **DE** : hallo, danke, wie, geht's, bin, bist, etc.

Le score est calculé en comptant les matches, et la langue avec le score le plus élevé est détectée.

---

**Commits** :
- `feat(dm): smart language detection + dynamic response language`

