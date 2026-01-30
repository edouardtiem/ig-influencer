# TASK-004: Temporary X Posting with Existing Cloudinary Content

**Status**: 🟡 In Progress
**Created**: 2026-01-30
**Feature**: [X](../README.md) > [Posting](../posting/)

---

## Goal

Start posting to X **immediately** using already-generated Elena images from Cloudinary, while ComfyUI face consistency is still being developed.

This is a **temporary side workflow** — not the main auto-posting system (TASK-003).

---

## Acceptance Criteria

- [ ] Script to post image + caption to X from Cloudinary URL
- [x] Curated list of usable Cloudinary images (33 images cataloged)
- [x] Captions in Elena's voice (33 pre-generated, ready for review)
- [ ] Can post manually or semi-automatically
- [ ] Sets `possibly_sensitive: true` for NSFW content

---

## Available Cloudinary Images (33 total)

### Category Legend
- **SFW** = Safe for work, no sensitive flag needed
- **Spicy** = Bikini/lingerie, needs `possibly_sensitive: true`

### SFW Images (10) — Good for morning/afternoon posts

| # | Name | Location | Description |
|---|------|----------|-------------|
| 2 | [carousel-3-1769344556](https://res.cloudinary.com/dily60mr0/image/upload/v1769344556/elena-scheduled/carousel-3-1769344556.jpg) | Paris apartment | Black bodysuit, bright room, smiling, city view through windows |
| 3 | [carousel-1-1769257943](https://res.cloudinary.com/dily60mr0/image/upload/v1769257943/elena-scheduled/carousel-1-1769257943.jpg) | Paris gallery | Black bodysuit + grey coat + knee boots, fashion shot in covered passage |
| 7 | [carousel-1-1768653117](https://res.cloudinary.com/dily60mr0/image/upload/v1768653117/elena-scheduled/carousel-1-1768653117.jpg) | Milan hotel | Camel loungewear set, leaning by window, city street view |
| 11 | [carousel-1-1768511906](https://res.cloudinary.com/dily60mr0/image/upload/v1768511907/elena-scheduled/carousel-1-1768511906.jpg) | Paris gallery | Black bodysuit + mesh, confident pose in covered passage |
| 17 | [neaxx5rpux9nc2fqzq7o](https://res.cloudinary.com/dily60mr0/image/upload/v1767954162/elena-trending-test/neaxx5rpux9nc2fqzq7o.jpg) | Paris rooftop | Beige crop top + black mesh skirt, Eiffel Tower, sunglasses |
| 19 | [ljnvpscynjz5qutszpn8](https://res.cloudinary.com/dily60mr0/image/upload/v1767951368/elena-trending-test/ljnvpscynjz5qutszpn8.jpg) | Paris rooftop | Beige ribbed midi dress, cityscape at sunset |
| 20 | [dvtbjwtuxlffnrrhuyut](https://res.cloudinary.com/dily60mr0/image/upload/v1767951444/elena-trending-test/dvtbjwtuxlffnrrhuyut.jpg) | Paris helipad | Black blazer dress + tights + heels, Eiffel Tower, classy/powerful |
| 25 | [balcony_golden_hour](https://res.cloudinary.com/dily60mr0/image/upload/v1767435656/elena-fanvue-daily/balcony_golden_hour-1767435656.jpg) | Paris balcony | Nude/beige bodysuit, golden hour light, rooftops, smiling |
| 27 | [yoga_flexibility](https://res.cloudinary.com/dily60mr0/image/upload/v1767370720/elena-fanvue-daily/yoga_flexibility-1767370720.jpg) | Yoga studio | Black sports bra + shorts, on mat, smiling, fitness vibes |
| 31 | [reel-1-1766653839](https://res.cloudinary.com/dily60mr0/image/upload/v1766653839/elena-scheduled/reel-1-1766653839.jpg) | Kitchen | White crop top + cardigan + leggings, cozy holiday vibes |

### Spicy Images (23) — Good for evening posts, needs `possibly_sensitive: true`

| # | Name | Location | Description |
|---|------|----------|-------------|
| 1 | [side_profile_sofa](https://res.cloudinary.com/dily60mr0/image/upload/v1769617777/elena-fanvue-daily/side_profile_sofa-1769617777.jpg) | Paris apartment | Black lace bodysuit, lying on pink sofa, wine glass, face hidden |
| 4 | [aerial_sheets_artistic](https://res.cloudinary.com/dily60mr0/image/upload/v1769185344/elena-fanvue-daily/aerial_sheets_artistic-1769185343.jpg) | Bedroom | Burgundy satin lingerie set, lying on white sheets, artistic aerial |
| 5 | [test1-back-lingerie-safe](https://res.cloudinary.com/dily60mr0/image/upload/v1768923050/test1-back-lingerie-safe-1768519529_ofmvql.jpg) | Paris bedroom | Black lace lingerie, back view, golden hour, elegant |
| 6 | [pov_looking_down_body](https://res.cloudinary.com/dily60mr0/image/upload/v1768753068/elena-fanvue-daily/pov_looking_down_body-1768753068.jpg) | Marble bathroom | White lace bra + panties, torso POV shot, no face |
| 8 | [bed_stomach_arched](https://res.cloudinary.com/dily60mr0/image/upload/v1768521933/elena-fanvue-daily/bed_stomach_arched-1768521932.jpg) | Hotel bed | White/cream lace lingerie, lying on stomach, arched, face hidden |
| 9 | [chest6-bed-suggestive](https://res.cloudinary.com/dily60mr0/image/upload/v1768520677/elena-test-chest/chest6-bed-suggestive-1768520676.jpg) | Elegant bedroom | Black lace lingerie, green silk sheets, lounging pose |
| 10 | [test5-bikini-pool-back](https://res.cloudinary.com/dily60mr0/image/upload/v1768519728/elena-test-limits/test5-bikini-pool-back-1768519727.jpg) | Infinity pool | Black bikini, sunset ocean view, back pose, wet hair |
| 12 | [carousel-1-1768504932](https://res.cloudinary.com/dily60mr0/image/upload/v1768504932/elena-scheduled/carousel-1-1768504932.jpg) | Bali pool | Terracotta bikini, rice terraces, sitting by pool, morning coffee |
| 13 | [carousel-1-1768331913](https://res.cloudinary.com/dily60mr0/image/upload/v1768331913/elena-scheduled/carousel-1-1768331913.jpg) | Bali terraces | Beige one-piece, standing by infinity pool, misty mountains |
| 14 | [carousel-1-1768245582](https://res.cloudinary.com/dily60mr0/image/upload/v1768245583/elena-scheduled/carousel-1-1768245582.jpg) | Tropical villa | Taupe one-piece, seated by pool, palm trees, evening light |
| 15 | [carousel-1-1768158807](https://res.cloudinary.com/dily60mr0/image/upload/v1768158808/elena-scheduled/carousel-1-1768158807.jpg) | Bali villa | Terracotta one-piece, standing by pool, tropical sunset |
| 16 | [carousel-1-1768134792](https://res.cloudinary.com/dily60mr0/image/upload/v1768134793/elena-scheduled/carousel-1-1768134792.jpg) | Rooftop pool | Champagne deep-V one-piece, city skyline (Tel Aviv?), golden hour |
| 18 | [dyyczmeigytezc1u8m2e](https://res.cloudinary.com/dily60mr0/image/upload/v1767954027/elena-trending-test/dyyczmeigytezc1u8m2e.jpg) | Paris rooftop | Champagne plunging mini dress, pool lounger, Eiffel Tower sunset |
| 21 | [kling-ready-sweater-back](https://res.cloudinary.com/dily60mr0/image/upload/v1767950088/elena-reels/kling-ready-sweater-back-1767950087710.jpg) | Paris apartment | Oversized cream sweater + thong, back view, window, rooftops |
| 22 | [carousel-2-1767875851](https://res.cloudinary.com/dily60mr0/image/upload/v1767875851/elena-scheduled/carousel-2-1767875851.jpg) | Bali pool | Rust bikini, in pool, smiling, wet hair, rice terraces |
| 23 | [carousel-2-1767554046](https://res.cloudinary.com/dily60mr0/image/upload/v1767554047/elena-scheduled/carousel-2-1767554046.jpg) | Yacht | Black bikini, sunset sea, champagne glass, golden hour |
| 24 | [carousel-3-1767530035](https://res.cloudinary.com/dily60mr0/image/upload/v1767530035/elena-scheduled/carousel-3-1767530035.jpg) | Dubai pool | Black bikini + gold hardware, Marina skyline, seated on edge |
| 26 | [carousel-3-1767467755](https://res.cloudinary.com/dily60mr0/image/upload/v1767467756/elena-scheduled/carousel-3-1767467755.jpg) | Alps hot tub | Black swimsuit + silk robe, snow mountains, luxe chalet |
| 28 | [carousel-2-1766956207](https://res.cloudinary.com/dily60mr0/image/upload/v1766956208/elena-scheduled/carousel-2-1766956207.jpg) | Maldives | White bikini, wooden dock, turquoise water, palm island |
| 29 | [carousel-2-1766798390](https://res.cloudinary.com/dily60mr0/image/upload/v1766798391/elena-scheduled/carousel-2-1766798390.jpg) | Mykonos | Black bikini + gold, pool edge, white buildings, sunset |
| 30 | [vanity_thong](https://res.cloudinary.com/dily60mr0/image/upload/v1766745727/elena-fanvue-free/vanity_thong-1766745726.jpg) | Vanity room | Black sports bra + thong, mirror, back view, getting ready |
| 32 | [elena-pack1-photo_3](https://res.cloudinary.com/dily60mr0/image/upload/v1766572399/elena-fanvue-pack1/elena-pack1-photo_3-1766572398786.jpg) | Paris bathroom | Black sports bra + bottoms, marble + gold fixtures, wet hair |
| 33 | [reel-1-1766499613](https://res.cloudinary.com/dily60mr0/image/upload/v1766499613/elena-scheduled/reel-1-1766499613.jpg) | Bali pool | White bikini + tropical kimono, sunset, rice terraces |

---

## Approach

### Phase 1: Image Inventory
1. User provides Cloudinary URLs
2. Categorize by content type (SFW teaser, spicy, NSFW)
3. Note which have good face consistency

### Phase 2: Posting Script
1. Create `app/scripts/x-post-cloudinary.mjs`
2. Takes Cloudinary URL as input
3. Downloads image → uploads to X media endpoint
4. Generates caption with Claude
5. Posts tweet with media

### Phase 3: Usage
- Run manually when ready to post
- Or set up simple cron for 3-4x/day

---

## Technical Notes

### X Media Upload Flow

```javascript
// 1. Download image from Cloudinary
// 2. Upload to X media endpoint
const mediaId = await client.v1.uploadMedia(imageBuffer, { mimeType: 'image/png' });

// 3. Post tweet with media
await client.v2.tweet({
  text: caption,
  media: { media_ids: [mediaId] },
  possibly_sensitive: isNSFW
});
```

---

## Dependencies

- X OAuth 2.0 tokens (already working)
- Cloudinary images (user to provide)
- Claude API for captions (already configured)

---

## Progress Log

### 2026-01-30 (Session 1)
- Task created
- User provided 33 Cloudinary URLs
- Analyzed all 33 images visually (downloaded to scratchpad, used multimodal Read)
- Categorized: 10 SFW, 23 Spicy
- Created detailed catalog with locations and descriptions
- Generated 33 pre-written captions (v1, then rewrote v2 with intimacy angle per user feedback)
- Intimacy angle: followers feel like they're the secret, the one Elena is flirting with behind husband's back
- Created review document: `app/scripts/data/elena-x-captions-review.md`
- Created JSON catalog: `app/scripts/data/elena-x-captions.json`
- Created image metadata: `app/scripts/data/elena-cloudinary-catalog.json`
- Created posting script: `app/scripts/x-post-cloudinary.mjs`
- Fixed multiple issues: missing URLs in JSON, variable scope error, expired tokens
- **Test posted** (text-only): https://x.com/elenav_paris/status/2017260244187894157
- **Blocker**: Media upload requires `media.write` OAuth scope
- X Developer Portal is down, can't enable scope in app settings
- Added TODO comment to x-oauth2-test.mjs about media.write scope
- **Next**: When portal is up, enable `media.write` scope and re-auth

**Files created this session:**
- `app/scripts/x-post-cloudinary.mjs` — Main posting script
- `app/scripts/data/elena-x-captions.json` — 33 captions with URLs
- `app/scripts/data/elena-x-captions-review.md` — Human-readable review doc
- `app/scripts/data/elena-cloudinary-catalog.json` — Full image metadata

---

## Outcome

_Fill when task is complete_

---
