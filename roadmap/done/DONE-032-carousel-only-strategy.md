# DONE-032: Carousel-Only Strategy

**Date** : 24 décembre 2024  
**Version** : v2.24.0  
**Status** : ✅ Done

---

## 🎯 Objectif

Simplifier le pipeline de publication en supprimant complètement les reels (plus besoin de FFmpeg/Kling) et migrer vers une stratégie 100% carrousels.

---

## ✅ Ce qui a été fait

1. **Migration scheduler vers carousel-only**
   - Supprimé règles "minimum reels" et "video reel recommendations"
   - Ajouté règle "TOUS LES POSTS sont des CAROUSELS"
   - Prompt Claude mis à jour pour ne demander que des carrousels
   - `post_type: 'carousel'` forcé dans la base de données

2. **Fix tokens GitHub**
   - Synchronisé `INSTAGRAM_ACCESS_TOKEN` (Mila) avec `.env.local`
   - Synchronisé `INSTAGRAM_ACCESS_TOKEN_ELENA` (Elena) avec `.env.local`
   - Résolu problème des posts marqués "posted" mais non publiés

3. **Régénération planning**
   - Supprimé ancien planning du 24/12 (avec reels)
   - Régénéré planning complet avec nouvelle stratégie carousel-only

---

## 📁 Fichiers modifiés

- `app/scripts/cron-scheduler.mjs`

---

## 🔗 Références

- [Session Documentation](../docs/SESSION-24-DEC-2024-CAROUSEL-ONLY.md)

---

## 💡 Avantages

- ✅ Plus besoin de FFmpeg (simplifie GitHub Actions)
- ✅ Plus besoin de Kling (génération plus rapide)
- ✅ Pipeline plus simple et fiable
- ✅ Carrousels performent bien selon analytics

