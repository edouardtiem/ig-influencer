# 🎨 Workflow Automatisé BigLust → Fanvue

**ID** : TODO-018  
**Priorité** : 🔴 High  
**Estimation** : ~8-10h  
**Status** : 📋 Planifié

---

## 📋 Description

Automatiser complètement le workflow de génération d'images BigLust jusqu'à l'upload sur Fanvue, avec validation humaine à chaque étape et tracking complet dans Supabase.

**Problème actuel** :
- Crop manuel des visages après génération
- Upload manuel sur Fanvue
- Pas de tracking de ce qui a été envoyé à qui
- Risque d'envoyer 2x la même image au même user

**Solution** :
Pipeline automatisé avec crop MediaPipe, validation humaine, upload Fanvue avec vaults, et tracking Supabase.

---

## 🎯 Objectifs

1. ✅ Crop automatique du visage avec MediaPipe (100% local, NSFW-safe)
2. ✅ Validation humaine avant upload (dossier review)
3. ✅ Upload automatique vers Fanvue avec gestion des vaults
4. ✅ Tracking complet dans Supabase (éviter doublons, gérer ventes PPV)
5. ✅ CLI unifiée pour orchestrer le workflow

---

## 📊 Architecture

### Pipeline en 5 étapes

```
1. GÉNÉRATION (ComfyUI) → 2. CROP (MediaPipe) → 3. VALIDATION → 4. UPLOAD (Fanvue) → 5. TRACKING (Supabase)
```

### Structure de dossiers

```
~/elena-content-pipeline/
├── 1_raw/              # Images brutes de ComfyUI
├── 2_cropped/          # Images après crop automatique
├── 3_review/           # À valider humainement
├── 4_approved/         # Validées, prêtes pour upload
├── 5_uploaded/         # Déjà uploadées sur Fanvue
└── rejected/           # Images rejetées
```

---

## 🔧 Technologies

| Composant | Technologie | Raison |
|-----------|-------------|--------|
| **Crop visage** | Python + MediaPipe | Précis, rapide (~20ms/image), NSFW-safe |
| **Pipeline** | Node.js | Cohérent avec codebase |
| **Stockage** | Supabase | Déjà en place |
| **Upload** | Fanvue API | Déjà implémenté |

---

## 📋 Plan d'Implémentation

### Phase 1 : Script Crop MediaPipe (~2h)
- [ ] Créer script Python `auto-crop-face.py`
- [ ] Intégrer MediaPipe Face Mesh (468 landmarks)
- [ ] Options de crop : `no_face`, `lips_only`, `chin`
- [ ] Fallback si pas de visage détecté (crop fixe top 30%)
- [ ] Tester sur batch d'images existantes

### Phase 2 : Structure Dossiers + Watcher (~1h)
- [ ] Créer structure de dossiers
- [ ] Script Node.js pour watcher `~/ComfyUI/output/`
- [ ] Auto-déplacer nouvelles images vers `1_raw/`
- [ ] Trigger script crop automatique

### Phase 3 : Migration Supabase (~30min)
- [ ] Créer table `elena_content` avec tous les champs
- [ ] Index pour recherche rapide
- [ ] Migration SQL dans `app/supabase/migrations/`

### Phase 4 : Script Upload Fanvue (~2h)
- [ ] Créer script `upload-to-fanvue.mjs`
- [ ] Gestion des vaults (`elena-feed`, `elena-ppv`, `elena-archive`)
- [ ] Upload multipart via API Fanvue
- [ ] Sauvegarde metadata dans Supabase
- [ ] Déplacer images vers `5_uploaded/`

### Phase 5 : CLI Unifiée (~1h)
- [ ] Créer `elena-pipeline.mjs` pour orchestrer tout
- [ ] Commandes : `crop`, `upload`, `status`, `validate`
- [ ] Intégration avec scripts existants

### Phase 6 : Interface Validation (Optionnel, ~3h)
- [ ] Page web locale avec grille d'images
- [ ] Boutons : ✅ Approve / ❌ Reject / 📝 Add tags
- [ ] Tout en local, pas de serveur nécessaire

---

## 📊 Table Supabase `elena_content`

```sql
CREATE TABLE elena_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Fichier local
  original_filename TEXT NOT NULL,
  cropped_filename TEXT,
  local_path TEXT,
  
  -- Fanvue
  fanvue_media_uuid TEXT,
  fanvue_vault TEXT,               -- 'feed', 'ppv', 'archive'
  fanvue_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'generated', -- generated, cropped, approved, uploaded, sent
  
  -- Metadata
  category TEXT,                   -- 'nude', 'masturbation', 'lingerie'...
  tags TEXT[],
  description TEXT,
  
  -- PPV tracking
  price_cents INTEGER,
  sent_to_users TEXT[],            -- Liste des user_ids à qui c'est envoyé
  times_purchased INTEGER DEFAULT 0,
  revenue_cents INTEGER DEFAULT 0,
  
  -- Timestamps
  generated_at TIMESTAMP DEFAULT NOW(),
  uploaded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 Vaults Fanvue

| Vault | Usage | Contenu |
|-------|-------|---------|
| `elena-feed` | Posts sur le feed | Contenu "gratuit" pour abonnés |
| `elena-ppv` | Messages PPV | Contenu payant en DM |
| `elena-archive` | Déjà utilisé | Tracking de ce qui a été envoyé |

---

## ✅ Critères de Succès

- [ ] Crop automatique fonctionne sur 100% des images générées
- [ ] Validation humaine possible avant upload
- [ ] Upload automatique vers Fanvue avec vaults
- [ ] Tracking complet dans Supabase
- [ ] Pas de doublons (même image envoyée 2x au même user)
- [ ] CLI unifiée pour gérer le workflow

---

## 🔗 Références

- [Session Design](./docs/sessions/2026-01-19-biglust-fanvue-workflow-design.md)
- [Fanvue API Vault Docs](https://api.fanvue.com/docs/reference/vault/list-vault-folders)
- [MediaPipe Face Mesh](https://google.github.io/mediapipe/solutions/face_mesh.html)
- [Elena Big Lust Guide](./docs/ELENA_BIG_LUST_GUIDE.md)

---

## 📝 Notes

- **MediaPipe est la meilleure solution** car 100% local (pas de censure NSFW), rapide (~20ms/image), et précis (468 landmarks)

- **Validation humaine essentielle** avant upload — les images générées peuvent avoir des défauts

- **Tracking Supabase critique** pour éviter les doublons et gérer les ventes PPV

---

**Prochaine étape** : Implémenter Phase 1 — Script crop MediaPipe
