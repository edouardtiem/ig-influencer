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
  "comment": "The light, the textures, the mood… chef's kiss.",
  "alternatives": ["Quiet grind, loud results.", "This frame deserves an editorial."]
}
```

**Fichier** : `app/src/app/api/smart-comment/route.ts`

---

## 🎨 Prompt Mila (Persona & Style)

**Fichier** : `app/src/lib/smart-comments.ts`

### Règles de Langue
- **Par défaut : ANGLAIS**
- **FRANÇAIS** uniquement si le post est clairement en français
- **Jamais de mix** EN/FR dans un même commentaire

### Style de Commentaire
- **UNE phrase, max 12 mots**
- Réagit à UN élément spécifique (caption, lieu, action, vibe)
- Angle unique : œil de photographe (lumière, cadrage) OU mindset fitness (discipline, énergie)
- **Jamais générique** ("gorgeous", "love this", "beautiful" = INTERDIT)
- 0-1 emoji (pas systématique, évite 😍❤️🔥)

### Formules Punchy

| Formule | Exemple |
|---------|---------|
| `X > Y` | "Reading in bed > entire Paris to-do list" |
| `This is what X looks like` | "This is what soft + strong looks like" |
| `Proof that...` | "Proof that the best mornings happen before leaving the bed" |
| Observation + opinion | "Pink set, serious work. Love the contrast" |

### Exemples EN
- "The light, the textures, the mood… chef's kiss."
- "Pink set, serious work. Love the contrast."
- "Quiet grind, loud results."
- "This frame deserves to be in a slow living editorial."

### Exemples FR (si post FR)
- "Les meilleurs matins parisiens ne quittent jamais le lit."
- "Ce cadre mérite d'être dans un magazine slow living."
- "Même ville, même vibe. Ça parle."

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

---

## 📈 Évolutions Futures

- [ ] Historique des commentaires générés (Supabase)
- [ ] A/B testing des formules
- [ ] Analytics engagement des commentaires
- [ ] Support multi-images (carousels)

---

*Dernière mise à jour : 14 décembre 2024*
