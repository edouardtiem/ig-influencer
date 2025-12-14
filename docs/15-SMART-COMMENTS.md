# 💬 Smart Comments — Commentaires IG automatisés via iOS Shortcut

> Système de génération de commentaires Instagram personnalisés "Mila-style" à partir d'un screenshot.

**Date création** : 14 décembre 2024

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
| Analyse image | Claude Vision API (claude-3-haiku) |
| Backend | Next.js API Route |
| Trigger | iOS Shortcuts |
| Output | Presse-papier iPhone |

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

### 🧠 4 Stratégies de Commentaire

#### 1. CURIOSITY GAP (la plus puissante)
Suggère quelque chose sans tout révéler → crée une tension.

| ❌ Avant | ✅ Après |
|---------|---------|
| "The lighting is amazing" | "This is why I ditched ring lights." |
| "Love the vibe" | "Reminds me of my first street shoot. Different game." |

#### 2. PEER POSITIONING
Parle comme une collègue, pas une fan. Tu COMPRENDS.

| ❌ Fan | ✅ Peer |
|--------|--------|
| "Beautiful shot!" | "Natural light doing the heavy lifting. What time was this?" |
| "So cool!" | "The dreads against raw stone. Was that the plan?" |

#### 3. OPINION FORTE / MICRO-TAKE
Avoir un AVIS. Trancher.

- "Street > studio. Every time."
- "This is what confidence looks like. No posing needed."
- "Proof that the best shots happen when you're not trying."

#### 4. REBOND CAPTION
Si la caption pose une question ou dit quelque chose de spécifique.

- Caption: "Should I post more?" → "The fact that you're asking means you already know."
- Caption avec "???" → "That '???' energy is everything."

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
