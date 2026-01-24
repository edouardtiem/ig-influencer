# 🎨 Workflow Complet BigLust → Fanvue — Design Session

**Date** : 19 janvier 2026  
**Durée** : ~1h30  
**Type** : Design & Architecture

---

## 📋 Contexte

Problème identifié : Après génération d'images via ComfyUI/BigLust, le visage généré ne correspond pas au visage d'Elena. Actuellement, traitement manuel :
1. Recadrage manuel des photos
2. Crop pour enlever le visage (ou garder bas des lèvres si ressemble un peu)
3. Upload manuel sur Fanvue
4. Pas de tracking de ce qui a été envoyé à qui

**Objectif** : Automatiser complètement le workflow de la génération à l'upload Fanvue avec validation humaine à chaque étape.

---

## ✅ Ce qui a été fait cette session

1. **Analyse approfondie de la codebase existante**
   - ComfyUI API client (`app/scripts/comfyui-api.mjs`)
   - Fanvue API client (`app/src/lib/fanvue.ts`)
   - Structure des scripts de génération (`batch-elena-*.mjs`)
   - Documentation BigLust (`docs/ELENA_BIG_LUST_GUIDE.md`)

2. **Recherche documentation Fanvue API**
   - Endpoints Vault/Folders identifiés
   - Flow d'upload multipart documenté
   - Support des vaults confirmé

3. **Design workflow complet**
   - Pipeline en 5 étapes avec validation humaine
   - Structure de dossiers proposée
   - Architecture Supabase pour tracking
   - Plan d'implémentation en 6 phases

---

## 🎯 Workflow Proposé

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WORKFLOW COMPLET                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. GÉNÉRATION          2. CROP            3. VALIDATION      4. UPLOAD     │
│  ┌──────────┐          ┌──────────┐        ┌──────────┐      ┌──────────┐  │
│  │ ComfyUI  │ ──────▶  │ Script   │ ────▶  │ Dossier  │ ───▶ │ Fanvue   │  │
│  │ BigLust  │          │ MediaPipe│        │ review/  │      │ Vault    │  │
│  └──────────┘          └──────────┘        └──────────┘      └──────────┘  │
│       │                     │                   │                  │        │
│       ▼                     ▼                   ▼                  ▼        │
│  ~/ComfyUI/output/    ~/output/cropped/    ~/output/ready/   Fanvue Folders │
│                                                                              │
│  5. TRACKING (Supabase)                                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ elena_content: id, filename, status, fanvue_uuid, sent_to[], tags... │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Structure de Dossiers Proposée

```
~/elena-content-pipeline/
├── 1_raw/              # Images brutes de ComfyUI (symlink vers ~/ComfyUI/output)
├── 2_cropped/          # Images après crop automatique du visage
├── 3_review/           # À valider humainement (avant upload)
├── 4_approved/         # Validées, prêtes pour upload
├── 5_uploaded/         # Déjà uploadées sur Fanvue
└── rejected/           # Images rejetées
```

---

## 🔧 Technologies Choisies

| Composant | Technologie | Raison |
|-----------|-------------|--------|
| **Crop visage** | Python + MediaPipe | Plus précis, rapide (~20ms/image), NSFW-safe (100% local) |
| **Pipeline** | Node.js | Cohérent avec codebase existante |
| **Stockage** | Supabase | Déjà en place dans le projet |
| **Upload** | Fanvue API | Déjà implémenté dans `fanvue.ts` |

### Pourquoi MediaPipe ?

- ✅ **100% local** — Pas de censure NSFW (contrairement aux APIs cloud)
- ✅ **Ultra rapide** — ~10-30ms par image (CPU only, pas besoin GPU)
- ✅ **Précis** — 468 landmarks faciaux (tu choisis exactement où couper)
- ✅ **Simple** — Un seul `pip install mediapipe`

---

## 📊 Architecture Supabase

### Table `elena_content`

```sql
CREATE TABLE elena_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Fichier local
  original_filename TEXT NOT NULL,
  cropped_filename TEXT,
  local_path TEXT,
  
  -- Fanvue
  fanvue_media_uuid TEXT,          -- UUID retourné par Fanvue
  fanvue_vault TEXT,               -- 'feed', 'ppv', 'archive'
  fanvue_url TEXT,                 -- URL publique si disponible
  
  -- Status
  status TEXT DEFAULT 'generated', -- generated, cropped, approved, uploaded, sent
  
  -- Metadata
  category TEXT,                   -- 'nude', 'masturbation', 'lingerie'...
  tags TEXT[],                     -- ['legs_spread', 'selfie', 'wet']
  description TEXT,                -- Description générée ou manuelle
  
  -- PPV tracking
  price_cents INTEGER,             -- Prix suggéré en cents
  sent_to_users TEXT[],            -- Liste des user_ids à qui c'est envoyé
  times_purchased INTEGER DEFAULT 0,
  revenue_cents INTEGER DEFAULT 0,
  
  -- Timestamps
  generated_at TIMESTAMP DEFAULT NOW(),
  uploaded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Avantages** :
- Tracking complet de ce qui a été uploadé où
- Évite d'envoyer 2x la même image au même user
- Base pour automatisation future du chat PPV
- Tracking des ventes par image

---

## 🎯 Vaults Fanvue Proposés

| Vault | Usage | Contenu |
|-------|-------|---------|
| `elena-feed` | Posts sur le feed | Contenu "gratuit" pour abonnés |
| `elena-ppv` | Messages PPV | Contenu payant en DM |
| `elena-archive` | Déjà utilisé | Tracking de ce qui a été envoyé |

---

## 📋 Plan d'Implémentation

| Phase | Tâche | Effort | Dépendances |
|-------|-------|--------|-------------|
| **1** | Script crop MediaPipe | ~2h | Python, MediaPipe |
| **2** | Structure dossiers + watcher | ~1h | Node.js |
| **3** | Migration Supabase `elena_content` | ~30min | Supabase |
| **4** | Script upload Fanvue | ~2h | API Fanvue existante |
| **5** | CLI unifiée `elena-pipeline.mjs` | ~1h | Étapes 1-4 |
| **6** | Interface validation (optionnel) | ~3h | HTML/JS simple |

---

## 🔍 Points d'Attention Identifiés

### 1. Limites Fanvue API
- **Rate limits** : À vérifier dans la doc pour les quotas d'upload
- **Taille fichiers** : Multipart upload requis pour gros fichiers
- **Scopes** : `write:media` déjà présent dans la config

### 2. Validation Humaine
- **Essentielle** avant upload — les images générées peuvent avoir des défauts
- **Simple au début** : Dossier + drag & drop
- **Plus tard** : Interface web si le volume augmente

### 3. Tracking PPV
- **Important** de tracker `sent_to_users` pour éviter :
  - Envoyer 2x la même image au même user
  - Poster en feed une image déjà vendue en PPV

---

## 📁 Fichiers à Créer (Prochaine Session)

1. `app/scripts/auto-crop-face.mjs` — Script Python MediaPipe pour crop automatique
2. `app/scripts/upload-to-fanvue.mjs` — Script upload vers Fanvue avec vaults
3. `app/scripts/elena-pipeline.mjs` — CLI unifiée pour orchestrer le workflow
4. `app/supabase/migrations/XXX_elena_content.sql` — Migration table Supabase
5. `docs/ELENA_PIPELINE_WORKFLOW.md` — Documentation complète du workflow

---

## 🚧 En cours (non terminé)

- Design terminé, implémentation à faire
- Scripts à créer
- Migration Supabase à créer
- Tests à effectuer

---

## 📋 À faire prochaine session

- [ ] Créer script Python MediaPipe pour crop automatique
- [ ] Créer structure de dossiers et watcher Node.js
- [ ] Créer migration Supabase `elena_content`
- [ ] Créer script upload Fanvue avec gestion des vaults
- [ ] Créer CLI unifiée `elena-pipeline.mjs`
- [ ] Tester le workflow complet end-to-end
- [ ] Documenter le workflow dans `docs/ELENA_PIPELINE_WORKFLOW.md`

---

## 💡 Idées Notées

1. **Interface web de validation** (Phase 6 optionnelle)
   - Page web locale avec grille d'images
   - Boutons : ✅ Approve / ❌ Reject / 📝 Add tags
   - Tout en local, pas de serveur nécessaire

2. **Automatisation chat PPV** (Future)
   - Avec la table `elena_content`, on peut automatiser les suggestions PPV
   - Éviter d'envoyer 2x la même image au même user
   - Pricing dynamique basé sur l'historique

3. **Crop intelligent**
   - Si MediaPipe ne détecte pas de visage → crop fixe top 30%
   - Option "lips_only" si le bas des lèvres ressemble à Elena
   - Option "no_face" pour couper complètement le visage

---

## 📝 Notes Importantes

- **MediaPipe est la meilleure solution** pour le crop car :
  - 100% local (pas de censure NSFW)
  - Ultra rapide (~20ms/image)
  - Précis (468 landmarks)
  - Simple à installer

- **Validation humaine essentielle** avant upload — les images générées peuvent avoir des défauts (mains, anatomie, etc.)

- **Tracking Supabase critique** pour éviter les doublons et gérer les ventes PPV

- **Vaults Fanvue** permettent d'organiser le contenu (feed vs PPV vs archive)

---

## 🔗 Références

- [Fanvue API Vault Documentation](https://api.fanvue.com/docs/reference/vault/list-vault-folders)
- [MediaPipe Face Mesh](https://google.github.io/mediapipe/solutions/face_mesh.html)
- [ComfyUI API Client](./comfyui-api.mjs)
- [Fanvue API Client](../app/src/lib/fanvue.ts)
- [Elena Big Lust Guide](../ELENA_BIG_LUST_GUIDE.md)

---

**Prochaine étape** : Implémenter Phase 1 — Script crop MediaPipe
