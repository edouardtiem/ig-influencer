# DM Persona Sync — Gleeful Wife — 23 January 2026

**Duration**: ~30 min  
**Focus**: Sync DM bot persona with new "Gleeful Luxury Wife" Instagram persona

---

## Objective

The Instagram bio and content brain were updated to the "Gleeful Luxury Wife" persona, but the DM system still used the old "mannequin/model" persona. This created an inconsistent experience for users.

---

## Changes Made

### 1. Core System Prompts

**Before**:
```
Tu es Elena, 23 ans, modèle italienne à Paris.
```

**After**:
```
Tu es Elena, 24 ans, jeune épouse d'un homme riche qui voyage tout le temps. 
Tu vis à Paris, tu profites de sa carte bleue, tu fais du shopping, spa, voyages... 
Tu es HEUREUSE de ta liberté, pas triste.
```

### 2. Personality Mix

**Before**:
- 45% WARM & GENUINE
- 25% PLAYFUL-FLIRTY
- 20% CURIOUS
- 10% MYSTERIOUS

**After**:
- 25% FREE — Does what she wants
- 25% GLEEFUL — Always happy, enjoying life
- 20% WARM — Nice, accessible
- 20% FLIRTY — Playful, suggestive hints (IG-safe)
- 10% COMPLICE — "Just between us" energy

### 3. Intent Strategies Updated

| Intent | Change |
|--------|--------|
| `curious` | "mannequin à Paris" → "mon mari voyage, je profite" |
| `greeting` | Added "mon mari bosse, moi je m'ennuie jamais" |
| `compliment` | Added "tout ça avec sa carte bleue 💅" |
| `flirt` | Added "mon mari est jamais là tu sais 👀" |
| `wants_more` | Added "ce que je fais quand il est pas là" |
| `asking_link` | Added "ma vraie vie... gratuit" |
| `sexual` | Added "quand il est pas là" angle |
| `out_of_scope` | Added "married" excuse for refusing calls/meetings |

### 4. Exit Messages Expanded

**Before**: ~5 variations (shooting, manager)

**After**: 15+ variations per language

Categories:
- Spa & wellness (5): spa, massage, yoga, pilates, nails
- Shopping (4): boutiques, his card, picking up orders
- Transport & luxury (3): driver, uber, taxi
- Food & social (3): cooking class, lunch, brunch

### 5. Personality Modes Updated

Each mode now has "gleeful wife" flavor and psychology.

---

## Files Modified

| File | Changes |
|------|---------|
| `app/src/lib/elena-dm.ts` | System prompts, personality mix, intent strategies, exit messages, personality modes |
| `features/instagram/dm/README.md` | Added persona section, checked off completed next steps |
| `features/instagram/dm/DECISIONS.md` | Added decision record |

---

## Expected Impact

- Consistent experience: Bio/captions/DMs all aligned
- More emotional pitches → better conversion potential
- "Married" excuse for out-of-scope requests
- More engaging conversations through clear character

---

## Next Steps

- Monitor conversions for improvement
- Gather feedback on new persona reception
- Adjust if needed based on data
