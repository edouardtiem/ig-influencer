# 🤖 Guide de Setup ManyChat — Automatisation DMs Instagram → Fanvue

**Date** : 26 décembre 2024  
**Objectif** : Automatiser les DMs Instagram pour convertir vers Fanvue  
**Architecture** : Phase 1 = Visual Builder (simple, rapide)

---

## 📋 Prérequis

- [x] Compte ManyChat créé
- [ ] Compte Instagram Business connecté à ManyChat
- [ ] Pack Fanvue créé avec lien disponible
- [ ] Compte Instagram Business actif (@elenav.paris)

---

## 🔌 Étape 1 : Connecter Instagram Business à ManyChat

### 1.1 Connexion initiale

1. Se connecter à ManyChat : https://manychat.com
2. Aller dans **Settings** → **Integrations**
3. Cliquer sur **Instagram** → **Connect Instagram**
4. Sélectionner le compte Instagram Business (@elenav.paris)
5. Autoriser les permissions nécessaires :
   - ✅ Read messages
   - ✅ Send messages
   - ✅ Manage comments (optionnel)

### 1.2 Vérification

- Aller dans **Audience** → Vérifier que le compte Instagram apparaît
- Tester en envoyant un DM depuis un autre compte

---

## 🎯 Étape 2 : Créer le Flow "PACK" (Keyword Trigger)

### 2.1 Création du Flow

1. Aller dans **Flows** → **Create Flow**
2. Nommer le flow : `PACK - Fanvue Link`
3. **Trigger** : **Keyword**
   - Keyword : `PACK` (case-insensitive)
   - Variantes : `pack`, `Pack`, `PACK`, `Pack Elena`, `fanvue`

### 2.2 Structure du Flow

```
┌─────────────────────────────────────────┐
│ TRIGGER: Keyword "PACK"                │
├─────────────────────────────────────────┤
│                                         │
│ 1. Send Message                         │
│    "Hey babe! 💋                        │
│                                         │
│     Tu veux voir mon pack exclusif ?    │
│     Voici le lien : [FANVUE_LINK]      │
│                                         │
│     Enjoy! ✨"                          │
│                                         │
│ 2. Add Tag: "interested_pack"          │
│                                         │
│ 3. End Flow                             │
└─────────────────────────────────────────┘
```

### 2.3 Configuration détaillée

**Action 1 : Send Message**
- Type : Text Message
- Message :
```
Hey babe! 💋

Tu veux voir mon pack exclusif ?
Voici le lien : [LIEN_FANVUE]

Enjoy! ✨
```
- Remplacer `[LIEN_FANVUE]` par le vrai lien Fanvue

**Action 2 : Add Tag** (optionnel mais recommandé)
- Tag name : `interested_pack`
- Permet de tracker les utilisateurs intéressés

**Action 3 : End Flow**

---

## 👋 Étape 3 : Créer le Flow "Welcome" (Nouveau DM)

### 3.1 Création du Flow

1. Aller dans **Flows** → **Create Flow**
2. Nommer le flow : `Welcome - First DM`
3. **Trigger** : **New DM**
   - Activer pour tous les nouveaux messages directs

### 3.2 Structure du Flow

```
┌─────────────────────────────────────────┐
│ TRIGGER: New DM                         │
├─────────────────────────────────────────┤
│                                         │
│ 1. Send Message (Welcome)               │
│    "Hey! 👋                             │
│                                         │
│     Merci pour ton message 💌           │
│                                         │
│     Si tu veux voir mon contenu         │
│     exclusif, envoie 'PACK' ! 📸        │
│                                         │
│     À bientôt! ✨"                      │
│                                         │
│ 2. Add Tag: "new_dm"                    │
│                                         │
│ 3. End Flow                             │
└─────────────────────────────────────────┘
```

### 3.3 Configuration détaillée

**Action 1 : Send Message**
- Type : Text Message
- Message :
```
Hey! 👋

Merci pour ton message 💌

Si tu veux voir mon contenu exclusif, envoie 'PACK' ! 📸

À bientôt! ✨
```

**Action 2 : Add Tag**
- Tag name : `new_dm`

---

## 🎨 Étape 4 : Flow Avancé "PACK" avec Image (Optionnel)

Pour rendre le flow plus attractif, ajouter une image teaser :

### 4.1 Flow amélioré

```
┌─────────────────────────────────────────┐
│ TRIGGER: Keyword "PACK"                 │
├─────────────────────────────────────────┤
│                                         │
│ 1. Send Image                           │
│    URL: [TEASER_IMAGE_URL]              │
│    (Photo cover du pack)                │
│                                         │
│ 2. Send Message                         │
│    "Voici un aperçu... 🔥               │
│                                         │
│     Pour le pack complet :              │
│     [FANVUE_LINK]                       │
│                                         │
│     Enjoy babe! 💋"                     │
│                                         │
│ 3. Add Tag: "interested_pack"          │
│                                         │
│ 4. End Flow                             │
└─────────────────────────────────────────┘
```

**Image teaser** : Utiliser la photo cover du pack (S1-0 ou S2-0 depuis Cloudinary)

---

## 🧪 Étape 5 : Tester les Flows

### 5.1 Test Flow "PACK"

1. Depuis un autre compte Instagram, envoyer un DM à @elenav.paris
2. Envoyer le message : `PACK`
3. Vérifier que la réponse automatique arrive avec le lien Fanvue

### 5.2 Test Flow "Welcome"

1. Depuis un compte qui n'a jamais envoyé de DM, envoyer un premier message
2. Vérifier que le message de bienvenue arrive automatiquement

### 5.3 Vérifications

- ✅ Messages arrivent rapidement (< 5 secondes)
- ✅ Liens Fanvue fonctionnent
- ✅ Tags sont ajoutés correctement
- ✅ Pas de doublons de messages

---

## 📊 Étape 6 : Tracking & Analytics

### 6.1 Tags ManyChat à utiliser

| Tag | Usage |
|-----|-------|
| `interested_pack` | Utilisateurs ayant demandé le pack |
| `new_dm` | Nouveaux contacts DM |
| `fanvue_clicked` | (Si webhook configuré) |

### 6.2 Analytics ManyChat

1. Aller dans **Analytics** → **Flows**
2. Vérifier :
   - Nombre de déclenchements du flow "PACK"
   - Taux de conversion DM → Fanvue (manuel pour l'instant)

### 6.3 Tracking manuel (Phase 1)

Pour Phase 1, tracking simple :
- Compter les DMs avec "PACK" dans ManyChat Analytics
- Comparer avec les ventes Fanvue
- Calculer taux de conversion : `Ventes / DMs "PACK" × 100`

---

## 🔄 Étape 7 : Optimisation (Phase 2 - Optionnel)

### 7.1 Webhook vers Backend

Pour Phase 2, si besoin de tracking avancé :

```typescript
// Endpoint webhook ManyChat → Backend
POST /api/manychat-webhook
{
  "subscriber_id": "...",
  "flow_id": "pack_flow",
  "tag": "interested_pack"
}
```

### 7.2 Messages personnalisés

- Utiliser les variables ManyChat : `{{first_name}}`, `{{last_name}}`
- Adapter le message selon l'heure (matin/soir)

---

## 📝 Messages Templates Recommandés

### Template 1 : Flow PACK (Simple)

```
Hey babe! 💋

Tu veux voir mon pack exclusif ?
Voici le lien : [LIEN_FANVUE]

Enjoy! ✨
```

### Template 2 : Flow PACK (Avec teaser)

```
Voici un aperçu... 🔥

Pour le pack complet :
[LIEN_FANVUE]

Enjoy babe! 💋
```

### Template 3 : Flow Welcome

```
Hey! 👋

Merci pour ton message 💌

Si tu veux voir mon contenu exclusif, envoie 'PACK' ! 📸

À bientôt! ✨
```

### Template 4 : Follow-up (Optionnel)

Si utilisateur demande mais ne clique pas après 24h :

```
Hey! Tu avais demandé mon pack 📸

Le lien est toujours dispo : [LIEN_FANVUE]

Bisous! 💋
```

---

## ✅ Checklist de Setup

- [ ] Instagram Business connecté à ManyChat
- [ ] Flow "PACK" créé et activé
- [ ] Flow "Welcome" créé et activé
- [ ] Lien Fanvue ajouté dans les flows
- [ ] Tests effectués depuis compte externe
- [ ] Tags configurés (`interested_pack`, `new_dm`)
- [ ] Analytics ManyChat vérifiés
- [ ] Documentation sauvegardée

---

## 🚨 Points d'Attention

### Limitations ManyChat Free

- **Limite** : 1,000 contacts actifs/mois
- **Solution** : Upgrade si nécessaire (15$/mois pour 5,000 contacts)

### Bonnes Pratiques

1. **Réponse rapide** : ManyChat répond instantanément ✅
2. **Messages naturels** : Éviter le spam, garder un ton authentique
3. **CTA clair** : "Envoie 'PACK'" est simple et direct
4. **Pas de sur-automatisation** : Laisser de la place pour les vraies conversations

### Conformité Instagram

- ✅ ManyChat est autorisé par Instagram Business
- ✅ Respecter les limites de messages (pas de spam)
- ✅ Ne pas envoyer de messages non sollicités

---

## 📚 Ressources

- [ManyChat Documentation](https://manychat.com/docs/)
- [Instagram Direct Messages API](https://developers.facebook.com/docs/instagram-platform/features/direct-messaging)
- [ManyChat Pricing](https://manychat.com/pricing)

---

## 🎯 Objectifs & KPIs

### Objectifs Phase 1

- **Conversion DM → Fanvue** : 5-10%
- **DMs "PACK" par jour** : 5-10 (selon engagement)
- **Revenus mensuels** : 500€ (objectif initial)

### Formule de Tracking

```
Taux de conversion = (Ventes Fanvue / DMs "PACK") × 100
Revenu mensuel = Ventes × Prix pack
```

---

*Dernière mise à jour : 26 décembre 2024*

