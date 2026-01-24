# ✅ DONE-006 — Dual-Model Sexy Strategy

> Stratégie dual-model Nano Banana + Minimax pour contenu sexy

---

## 📋 Infos

| Champ | Valeur |
|-------|--------|
| **ID** | DONE-006 |
| **Type** | Feature |
| **Priorité** | 🔴 High |
| **Date début** | 16/12/2024 |
| **Date fin** | 16/12/2024 |
| **Version** | v2.7.0 |

---

## 🎯 Objectif

Résoudre le problème de perte de contenu sexy quand Nano Banana Pro refuse les prompts "flagged as sensitive".

---

## ✅ Livrables

### 1. Documentation stratégie
- [x] Créer `docs/19-QUALITY-SEXY-STRATEGY.md`
- [x] Documenter l'architecture dual-model
- [x] Mettre à jour `docs/README.md`

### 2. Tests modèles alternatifs
- [x] Tester Minimax Image-01 (avec face reference)
- [x] Tester Seedream 3/4 (ByteDance)
- [x] Tester Flux 1.1 Pro
- [x] Comparer permissivité vs Nano Banana Pro
- [x] Valider que Minimax accepte prompts sexy

### 3. Implémentation fallback
- [x] Fonction `generateWithMinimax()` dans carousel-post.mjs
- [x] Fallback automatique quand Nano refuse
- [x] Garder le prompt original (pas dilué)
- [x] Support face reference Minimax

---

## 📁 Fichiers

| Fichier | Action |
|---------|--------|
| `docs/19-QUALITY-SEXY-STRATEGY.md` | Créé |
| `docs/README.md` | Modifié |
| `app/scripts/carousel-post.mjs` | Modifié (fallback Minimax) |
| `app/scripts/test-alternative-models.mjs` | Créé |

---

## 🔧 Architecture

```
Prompt Sexy → Nano Banana Pro
                  │
                  ├── ✅ OK → Publier
                  │
                  └── ❌ "flagged as sensitive"
                           │
                           ▼
                    Minimax Image-01
                    (même prompt, pas dilué)
                    (avec face reference)
                           │
                           └── ✅ Publier
```

---

## 📊 Résultats Tests

| Modèle | Prompt Sexy | Face Ref | Temps |
|--------|-------------|----------|-------|
| Nano Banana Pro | ❌ Refusé | Via base64 | - |
| Minimax Image-01 | ✅ Accepté | ✅ Natif | 30-35s |
| Flux 1.1 Pro | ✅ Accepté | ❌ Non | 4s |

---

## 📝 Notes

- Minimax est plus lent (30s vs 3s) mais plus permissif
- Le coût Minimax (~$0.05) vs Nano (~$0.02) est acceptable en fallback
- L'aspect ratio 3:4 de Minimax est proche du 4:5 Instagram

---

*Complété le 16 décembre 2024*


