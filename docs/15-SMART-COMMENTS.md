# 💬 Smart Comments V2 — Commentaires IG automatisés via iOS Shortcut

> Système de génération de commentaires Instagram intelligents avec Extended Thinking. Fonctionne pour tous les comptes.

**Date création** : 14 décembre 2024  
**Dernière MAJ** : 17 décembre 2024 (V2 - Extended Thinking)

---

## 🎯 Objectif

Commenter les posts Instagram d'autres créateurs de manière "smart" pour :
- Engager et attirer l'attention sur le profil Mila
- Générer des commentaires mémorables (pas génériques)
- Automatiser le workflow depuis l'iPhone

---

## 🔧 Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Analyse image | Claude Vision API (**claude-sonnet-4-20250514** + Extended Thinking) |
| Backend | Next.js API Route |
| Trigger | iOS Shortcuts |
| Output | Presse-papier iPhone |

### V2 Améliorations

| Avant (V1) | Après (V2) |
|------------|------------|
| `claude-3-haiku` | `claude-sonnet-4-20250514` |
| Pas de thinking | **Extended Thinking** (10K tokens) |
| 4 stratégies | **8 stratégies** variées |
| Patterns répétitifs | **Anti-repetition** explicite |
| Mila-only | **Universel** (tous comptes) |

---

## 📱 Workflow iOS

```
Screenshot post IG → Partager → Raccourci "Mila Comment"
       ↓
Encode Base64 → POST /api/smart-comment
       ↓
Claude analyse → Génère commentaire Mila-style
       ↓
Copie dans presse-papier → Notification succès
       ↓
Coller commentaire sur Instagram
```

**Temps total** : ~3-5 secondes

---

## 🔌 API Endpoint

### `POST /api/smart-comment`

**Request** (JSON) :
```json
{
  "imageBase64": "base64_encoded_image_data",
  "mimeType": "image/png"
}
```

**Response** :
```json
{
  "success": true,
  "comment": "The dreads against raw stone. Was that the plan?",
  "alternatives": ["Street > studio. Every time.", "Natural texture on natural texture. Intentional?"],
  "analysis": {
    "accountType": "photographer",
    "contentType": "portrait",
    "language": "en",
    "hasQuestion": false,
    "specificElement": "contrast between dreads and stone wall texture"
  },
  "strategy": "peer_positioning"
}
```

**Fichier** : `app/src/app/api/smart-comment/route.ts`

---

## 🎨 Prompt Mila V3 — Curiosity Gap & Peer Positioning

**Fichier** : `app/src/lib/smart-comments.ts`

### 🎯 Objectif
Faire cliquer sur le profil Mila (pas juste "engager").

### 📊 Variables Détectées Automatiquement

| Variable | Valeurs | Usage |
|----------|---------|-------|
| `accountType` | photographer, fitness, lifestyle, fashion, travel, other | Adapter le ton |
| `contentType` | portrait, selfie, gym, landscape, outfit, other | Choisir l'angle |
| `language` | en, fr | Langue du commentaire |
| `hasQuestion` | true/false | Rebondir sur la question |
| `specificElement` | string | L'élément unique sur lequel réagir |

### 🧠 8 Stratégies de Commentaire (V2)

#### 1. 🧠 CURIOSITY GAP
Suggère quelque chose sans tout révéler.
- "This is exactly why I stopped shooting in studios."
- "Took me way too long to figure this out."

#### 2. 👁️ HYPER-SPECIFIC OBSERVATION
Remarque un détail que personne d'autre ne verra.
- "The way the shadow falls on just the right side. Accident or planned?"
- "The negative space is doing more work than the subject."

#### 3. 🔥 HOT TAKE
Opinion tranchée, assumée.
- "Golden hour is overrated. This proves it."
- "Everyone's doing moody tones. This brightness hits different."

#### 4. 💬 CAPTION RESPONSE
Réponds à ce qu'ils ont écrit.
- "The '...' says more than the whole caption."
- "If you have to ask, you already know."

#### 5. 🎯 INSIDER QUESTION
Question technique d'insider.
- "What focal length? The compression is crazy."
- "How long did you wait for that light?"

#### 6. 😏 PLAYFUL TEASE
Taquinerie légère.
- "Okay but how many takes? Be honest."
- "Save some good light for the rest of us."

#### 7. 🌟 UNEXPECTED ANGLE
Compliment quelque chose d'inhabituel.
- "The confidence is louder than the outfit."
- "Your location scouting is underrated."

#### 8. 🤝 SHARED EXPERIENCE
Montre que tu vis la même chose.
- "The 'effortless but actually 45 minutes' energy."
- "Rare to nail both the pose AND the lighting."

### Règles Strictes

| Règle | Détail |
|-------|--------|
| Langue | EN par défaut, FR si caption FR, jamais de mix |
| Longueur | 8-15 mots (idéal: 10-12) |
| Emoji | 0-1 (évite 😍❤️🔥) |
| Question | Peut finir par une question courte |

### ❌ INTERDIT (commentaires de fan)
- "So gorgeous!" 
- "Love this!"  
- "Beautiful shot!"
- "Goals!"
- "The lighting is amazing" (descriptif, pas engageant)
- Tout ce qui pourrait s'appliquer à N'IMPORTE QUEL post

### 🚫 PATTERNS BANNIS (V2 anti-repetition)
Ces formules étaient sur-utilisées en V1 :
- "[Thing A] + [Thing B]. Intentional?" ❌
- "[Thing A] against [Thing B]. Was that the plan?" ❌
- "[X] on [Y]. Calculated or chance?" ❌
- "Natural [X] doing the heavy lifting" ❌

Le modèle est maintenant explicitement instruit de les éviter.

---

## 📲 Configuration iOS Shortcut

### Étapes du Raccourci

1. **Receive** : Photos (input du partage)
2. **Encode Base64** : Image → Variable "Encodage Base64"
3. **Get contents of URL** :
   - URL : `https://ig-influencer.vercel.app/api/smart-comment`
   - Method : POST
   - Headers : `Content-Type: application/json`
   - Body (JSON) :
     ```json
     {
       "imageBase64": [Variable Encodage Base64],
       "mimeType": "image/png"
     }
     ```
4. **Get Dictionary Value** : Key = `comment`
5. **Copy to Clipboard**
6. **Show Notification** : "Commentaire copié ! 📋"

### ⚠️ Point Critique

Dans le JSON body, utiliser la **variable bleue** "Encodage Base64", pas le texte littéral `[Encodage Base64]`.

---

## 🔐 Variables d'Environnement

```bash
# .env.local
Claude_key=sk-ant-api03-...
```

**Vercel** : Ajouter `Claude_key` dans Settings → Environment Variables

---

## 🧪 Test Local

### Via Web UI
http://localhost:3000/smart-comment

### Via cURL
```bash
# Encoder une image
BASE64=$(base64 -i screenshot.png)

# Appeler l'API
curl -X POST http://localhost:3000/api/smart-comment \
  -H "Content-Type: application/json" \
  -d "{\"imageBase64\": \"$BASE64\", \"mimeType\": \"image/png\"}"
```

---

## 📁 Fichiers Créés

| Fichier | Description |
|---------|-------------|
| `app/src/lib/smart-comments.ts` | Logique Claude Vision + prompt Mila |
| `app/src/app/api/smart-comment/route.ts` | API endpoint POST/GET |
| `app/src/app/smart-comment/page.tsx` | Interface test web |

---

## 🐛 Problèmes Résolus

### 1. iOS envoie texte littéral au lieu de variable
**Symptôme** : API reçoit `[Encodage Base64]` comme string
**Fix** : Utiliser la variable bleue dans Shortcuts, pas le texte

### 2. Base64 invalide (caractères invisibles)
**Symptôme** : `400 invalid base64 data`
**Fix** : Fonction `cleanBase64()` qui strip les prefixes `data:...`, newlines, espaces

### 3. Modèle Claude introuvable
**Symptôme** : `404 model not found`
**Fix** : Utiliser `claude-3-haiku-20240307` (accessible avec clé standard)

### 4. Claude retourne du texte avant le JSON
**Symptôme** : `SyntaxError: Unexpected token 'A', "Analyse :..."` 
**Cause** : Claude ajoute du texte explicatif ("Analyse :", "Voici le JSON :") avant l'objet JSON
**Fix** : 
1. Prompt renforcé avec warning explicite :
   ```
   ⚠️ CRITICAL: Réponds UNIQUEMENT avec un objet JSON valide. 
   Pas de texte avant, pas de texte après.
   ```
2. Parsing robuste avec regex fallback :
   ```typescript
   // Extrait le JSON même s'il y a du texte autour
   const jsonMatch = content.match(/\{[\s\S]*\}/);
   if (jsonMatch) {
     jsonStr = jsonMatch[0];
   }
   ```

---

## 📈 Évolutions Futures

- [ ] Historique des commentaires générés (Supabase)
- [ ] A/B testing des formules
- [ ] Analytics engagement des commentaires
- [ ] Support multi-images (carousels)

---

*Dernière mise à jour : 14 décembre 2024*
