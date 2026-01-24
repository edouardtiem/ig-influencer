# Elena Art Direction: Direct Flash — Session 2026-01-23

## Summary

Defined and documented Elena's visual art direction (DA) for content-brain integration. Final decision: **Direct Flash + Editorial Mess (80%)** for indoor/night, **Editorial Mess only (20%)** for outdoor/day.

---

## Decision

### DA Formula

**80% of posts:**
- Direct Flash lighting (Helmut Newton style)
- Editorial Mess setting (bedroom, hotel, magazines)
- Night/indoor scenarios

**20% of posts:**
- Natural light (Editorial Mess setting only)
- Outdoor/daylight scenarios
- Same pose/expression energy

### Constant Elements (100%)
- Powerful pose (hands on hips, standing)
- Serious expression (not smiling)
- Black outfits (bodysuit, blazer, slip)
- Gold jewelry always visible
- Dominant, confrontational energy

---

## Prompt Template for Direct Flash

```
LIGHTING - DIRECT FLASH STARK:
- DIRECT ON-CAMERA FLASH, harsh and unforgiving
- Hard shadows cast behind subject on wall
- Clinical, stark, almost surveillance-like quality
- High contrast between lit areas and dark shadows
- No soft light, no diffusion, raw flash aesthetic

SETTING - EDITORIAL MESS:
- Luxurious bedroom, unmade bed with white sheets
- Magazines scattered, lived-in luxury apartment
- Night time, flash is the only light source

POSE & EXPRESSION:
- Standing with powerful confident pose, hand on hip
- Direct confrontational gaze at camera
- Dominant energy, she controls the frame
- NOT smiling - serious, powerful expression

MOOD:
- Voyeuristic, like caught by paparazzi in private moment
- Powerful feminine energy, she's in control
- Helmut Newton meets editorial fashion
```

### Negative Prompt Addition
```
soft light, diffused light, golden hour, warm tones, 
smiling, happy, cute, friendly, vacation photo
```

---

## Implementation Notes

### Location Category Detection
Add logic to determine:
- `indoor_night` → Apply Direct Flash
- `outdoor_day` → Skip Direct Flash, keep pose/expression

### Indoor/Night Locations
- Bedroom (chambre, boudoir)
- Hotel room
- Bathroom
- Club/bar
- Backstage
- Street at night

### Outdoor/Day Locations (no flash)
- Pool (daylight)
- Beach
- Yacht
- Café terrace
- Street (daylight)

---

## Files Created

- `docs/art-direction/ELENA-DA-DIRECT-FLASH.md` — Full DA documentation
- `app/scripts/test-da-direct-flash.mjs` — Test generator

---

## Next Steps for Content-Brain

- [ ] Add `applyDirectFlashDA()` function to prompt builder
- [ ] Detect location category in `generateImagesForPost()`
- [ ] Apply 80/20 rule based on location
- [ ] Update Elena expression lists (remove friendly/smiling options)
- [ ] Add Direct Flash negative prompts

---

## Engagement Potential

| Metric | Estimate |
|--------|----------|
| Target ER | 2-3% |
| Format | Carousels (10.15% avg ER) |
| Differentiation | High (Newton style is rare) |

---

## Related Docs

- `/docs/art-direction/ELENA-DA-DIRECT-FLASH.md`
- `/docs/sessions/2026-01-23-elena-art-direction-discovery.md`
