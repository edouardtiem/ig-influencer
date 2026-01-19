# PRD — Elena Custom Linktree

## Overview

### Project Name
Elena Custom Linktree / Link-in-Bio Page

### Goal
Replace the current Linktree with a custom-built, high-converting landing page optimized for Fanvue subscriptions. The page will be mobile-first, feature a video background, age verification, and conversion optimization elements.

### Success Metrics
- **Primary**: Click-through rate to Fanvue (target: >40%)
- **Secondary**: Time on page (target: >30 seconds)
- **Tertiary**: Conversion rate Fanvue trial signups (tracked via UTM)

---

## Target Audience

### Primary User
- Male, 18-45 years old
- Coming from Instagram bio link (mobile 90%+)
- Looking for adult content / "girlfriend experience"
- Speaks English (international audience)

### User Journey
```
Instagram Profile → Bio Link → Age Verification (18+) → Linktree Page → Fanvue CTA → Subscription
```

---

## Design Specifications

### Visual Direction: "Soft Boudoir"

| Element | Specification |
|---------|---------------|
| **Background** | Video loop (muted, autoplay) with dark overlay (60-70% opacity) |
| **Primary Color** | Soft pink `#E8A0BF` |
| **Secondary Color** | Off-white `#FAF5F0` |
| **Background Color** | Dark charcoal `#0a0a0a` (fallback if video fails) |
| **Accent** | Blush pink `#F5D0E0` |
| **Typography - Headings** | Cormorant Garamond (elegant, romantic) |
| **Typography - Body** | Inter or system sans-serif (readable) |
| **Vibe** | Intimate, feminine, "girlfriend experience", premium but approachable |

### Color Palette (Hex)
```
Primary Pink:      #E8A0BF
Secondary White:   #FAF5F0
Background Dark:   #0a0a0a
Accent Blush:      #F5D0E0
Text Light:        #FFFFFF
Text Muted:        #A0A0A0
```

### Responsive Breakpoints
- **Mobile** (primary): 320px - 480px
- **Tablet**: 481px - 768px
- **Desktop**: 769px+

---

## Page Structure

### 1. Age Verification Modal (First Visit Only)

**Trigger**: Displays on first visit (no cookie/localStorage found)

**Content**:
```
┌─────────────────────────────────────────┐
│                                         │
│            🔞                           │
│                                         │
│     This page contains adult content    │
│                                         │
│     You must be 18+ to continue         │
│                                         │
│     ☐ I confirm I am 18 years or older  │
│                                         │
│          [ ENTER ]                      │
│                                         │
│     By entering, you agree to our       │
│     Terms of Service                    │
│                                         │
└─────────────────────────────────────────┘
```

**Behavior**:
- Checkbox required to enable button
- On confirm: Set `localStorage.ageVerified = true` + cookie (30 days)
- Background video visible but blurred behind modal
- Modal cannot be dismissed without confirming

---

### 2. Main Page Layout

```
┌─────────────────────────────────────────┐
│  🎬 VIDEO BACKGROUND (loop, muted)      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Dark overlay 65%                       │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │                                     ││
│  │      ┌──────────┐                   ││
│  │      │  AVATAR  │  (with pink glow) ││
│  │      └──────────┘                   ││
│  │                                     ││
│  │         Elena                       ││
│  │   "Your secret escape 💋"           ││
│  │                                     ││
│  │  ┌─────────────────────────────────┐││
│  │  │  ⏰ COUNTDOWN TIMER             │││
│  │  │  "Free trial ends in 37:23"     │││
│  │  └─────────────────────────────────┘││
│  │                                     ││
│  │  ┌─────────────────────────────────┐││
│  │  │  🔥 MAIN CTA - FANVUE           │││
│  │  │  "Get FREE Access for 7 Days"   │││
│  │  │  [Teaser image]                 │││
│  │  │  [ JOIN NOW - IT'S FREE ]       │││
│  │  └─────────────────────────────────┘││
│  │                                     ││
│  │  📸 PHOTO GALLERY PREVIEW          ││
│  │  [🔥img] [⭐img] [🔥img] [⭐img]    ││
│  │  "Unlock 500+ exclusive photos"    ││
│  │                                     ││
│  │  ┌─────────────────────────────────┐││
│  │  │  💬 SOCIAL PROOF                │││
│  │  │  "🔔 Someone just subscribed"   │││
│  │  │  "New account • Dec 2024"       │││
│  │  └─────────────────────────────────┘││
│  │                                     ││
│  │  🔗 SECONDARY LINKS                ││
│  │  [ Instagram ] [ TikTok ]          ││
│  │                                     ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

---

## Component Specifications

### 2.1 Video Background

| Property | Value |
|----------|-------|
| Source | `replicate-prediction-ba4tvq9zbnrmw0cvhb1syjdshm.mp4` (to be optimized) |
| Playback | Autoplay, loop, muted |
| Overlay | Linear gradient black 65% opacity |
| Fallback | Solid `#0a0a0a` background |
| Mobile optimization | Compressed version <3MB, poster image fallback |
| Position | `object-fit: cover`, full viewport |

### 2.2 Profile Section

| Element | Specification |
|---------|---------------|
| Avatar | 100x100px, circular, 3px pink border with glow effect |
| Name | "Elena" - Cormorant Garamond, 28px, white |
| Tagline | "Your secret escape 💋" - Inter, 16px, pink `#E8A0BF` |
| Glow effect | `box-shadow: 0 0 20px rgba(232, 160, 191, 0.5)` |

### 2.3 Countdown Timer

| Property | Value |
|----------|-------|
| Display format | `MM:SS` (e.g., "37:23") |
| Initial time | Random between 13:00 and 37:00 (plus random seconds) |
| Storage | `sessionStorage` (resets each session) |
| Behavior | Counts down in real-time |
| On expire | Resets to new random time (user doesn't know) |
| Text | "⏰ Free trial offer ends in **37:23**" |
| A/B tracking | Store initial time in analytics for conversion correlation |

**Timer Rotation Values** (for A/B testing):
```javascript
const timerOptions = [
  { minutes: 13, label: '13min' },
  { minutes: 17, label: '17min' },
  { minutes: 23, label: '23min' },
  { minutes: 29, label: '29min' },
  { minutes: 37, label: '37min' },
];
// Random seconds 0-59 added to each
```

### 2.4 Main CTA Block (Fanvue)

| Element | Specification |
|---------|---------------|
| Container | Rounded corners (16px), subtle pink border, glass effect |
| Headline | "Get FREE Access for 7 Days" - Bold, 20px |
| Subtext | "Full access to all my content • DM me anytime 💬" - 14px, muted |
| Teaser image | Suggestive photo (emoji-censored), 16:9 ratio, rounded |
| Button | Full width, pink background `#E8A0BF`, white text, 18px |
| Button text | "JOIN NOW - IT'S FREE 🔓" |
| Button hover | Glow effect, slight scale (1.02) |
| Link | Fanvue URL with UTM: `?ref=linktree&timer={timerValue}` |

### 2.5 Photo Gallery

| Property | Value |
|----------|-------|
| Layout | Horizontal scroll or 2x2 grid (mobile) |
| Images | 5-6 explicit photos with emoji censorship |
| Image size | Square thumbnails, 120x120px |
| Emoji overlay | 🔥, ⭐, 💗, 🍒 positioned over intimate areas |
| Caption | "Unlock 500+ exclusive photos & videos" |
| Interaction | Tap on image → redirect to Fanvue (same as main CTA) |
| Blur effect | Optional: slight blur (2px) to tease |

**Emoji Placement Strategy**:
- Chest area: 🔥 or ⭐ (larger, 40-60px)
- Lower area: 🔥 or 💗 (larger, 40-60px)
- Position: Absolute, centered on area to cover

### 2.6 Social Proof Section

#### A) Live Notification (Fake)
| Property | Value |
|----------|-------|
| Display | Toast-style notification, appears every 30-60s |
| Animation | Slide in from bottom, fade out after 4s |
| Content rotation | Random names + random time (2-17 min ago) |
| Examples | "🔔 James just subscribed • 4 min ago" |
| Names pool | Common English names (anonymous feel) |

```javascript
const names = ['James', 'Mike', 'David', 'Chris', 'Alex', 'Ryan', 'Tom', 'John', 'Anonymous'];
const times = ['2 min', '4 min', '7 min', '11 min', '13 min', '17 min'];
```

#### B) Static Social Proof
| Element | Content |
|---------|---------|
| Badge 1 | "✨ New account • December 2024" |
| Badge 2 | "🔥 Growing fast" |
| Badge 3 | "💬 I reply to everyone" |

### 2.7 Secondary Links

| Link | Icon | URL | Priority |
|------|------|-----|----------|
| Instagram | IG icon | instagram.com/elena_xxx | Low |
| TikTok | TT icon | tiktok.com/@elena_xxx | Low |

**Style**: Smaller buttons, outline style (not filled), less prominent

---

## Technical Specifications

### Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Hosting | Vercel |
| Analytics | Vercel Analytics + Custom events |
| Storage | localStorage / sessionStorage |
| Domain | Custom domain (TBD by user) |

### File Structure

```
app/
├── elena/                    # Route: /elena (or root if dedicated domain)
│   ├── page.tsx             # Main linktree page
│   ├── layout.tsx           # Layout with metadata
│   └── components/
│       ├── AgeVerification.tsx
│       ├── VideoBackground.tsx
│       ├── ProfileSection.tsx
│       ├── CountdownTimer.tsx
│       ├── MainCTA.tsx
│       ├── PhotoGallery.tsx
│       ├── SocialProof.tsx
│       ├── SecondaryLinks.tsx
│       └── NotificationToast.tsx
├── public/
│   └── elena/
│       ├── video-bg.mp4     # Optimized video (<3MB)
│       ├── video-poster.jpg # Fallback image
│       ├── avatar.jpg       # Profile picture
│       └── gallery/
│           ├── photo-1.jpg  # With emoji overlay baked in
│           ├── photo-2.jpg
│           └── ...
```

### Performance Requirements

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3s |
| Video load | Lazy load after page paint |
| Image optimization | WebP, compressed, lazy loaded |
| Total page weight | < 5MB (including video) |

### SEO & Meta

```typescript
export const metadata: Metadata = {
  title: 'Elena - Exclusive Content',
  description: 'Get exclusive access to Elena\'s private content. Free 7-day trial.',
  robots: 'noindex, nofollow', // Adult content - don't index
  openGraph: {
    title: 'Elena - Exclusive Content',
    description: 'Your secret escape 💋',
    images: ['/elena/og-image.jpg'],
  },
};
```

---

## Analytics & Tracking

### Events to Track

| Event | Trigger | Data |
|-------|---------|------|
| `page_view` | Page load (after 18+ verification) | `source`, `device`, `country` |
| `age_verified` | User confirms 18+ | `timestamp` |
| `cta_click` | Main Fanvue button clicked | `timer_value`, `time_on_page` |
| `gallery_click` | Gallery image clicked | `image_index` |
| `secondary_link` | Instagram/TikTok clicked | `link_type` |
| `notification_shown` | Fake notification displayed | `notification_id` |
| `timer_expired` | Countdown reaches 0 | `initial_timer_value` |

### UTM Parameters (Fanvue Link)

```
https://fanvue.com/elena?
  ref=linktree
  &utm_source=linktree
  &utm_medium=link
  &utm_campaign=free_trial
  &timer={timerValueInMinutes}
```

### A/B Testing Data Points

| Variable | Options | Goal |
|----------|---------|------|
| Timer duration | 13, 17, 23, 29, 37 min | Measure conversion by timer |
| CTA text | "JOIN NOW - IT'S FREE" vs "GET FREE ACCESS" | Click rate |
| Photo count | 4 vs 6 photos | Engagement |

---

## Content Requirements

### Assets Needed

| Asset | Format | Size | Status |
|-------|--------|------|--------|
| Background video | MP4, H.264 | < 3MB compressed | ✅ User has original |
| Video poster (fallback) | JPG/WebP | < 100KB | ⬜ To create |
| Profile avatar | JPG/WebP | 200x200px, < 50KB | ⬜ To create |
| Gallery photos (5-6) | JPG/WebP with emoji | 400x400px each | ⬜ To generate via Big Lust |
| OG image | JPG | 1200x630px | ⬜ To create |

### Copy/Text

| Element | English Copy |
|---------|--------------|
| Tagline | "Your secret escape 💋" |
| Timer text | "⏰ Free trial offer ends in" |
| CTA headline | "Get FREE Access for 7 Days" |
| CTA subtext | "Full access to all my content • DM me anytime 💬" |
| CTA button | "JOIN NOW - IT'S FREE 🔓" |
| Gallery caption | "Unlock 500+ exclusive photos & videos" |
| Age modal title | "This page contains adult content" |
| Age modal checkbox | "I confirm I am 18 years or older" |
| Age modal button | "ENTER" |

---

## Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| Video fails to load | Show poster image, then solid background |
| User declines 18+ | Show message "You must be 18+ to view this content" + redirect option |
| Slow connection | Lazy load images, show skeleton loaders |
| JavaScript disabled | Static fallback page with links |
| Very old browser | Graceful degradation, basic styling |
| User clears cookies | Age verification shows again (acceptable) |

---

## Security & Compliance

| Requirement | Implementation |
|-------------|----------------|
| Age verification | Checkbox + localStorage (sufficient for link page, not hosting explicit content) |
| GDPR | No personal data collected, only anonymous analytics |
| Cookie notice | Not required (only functional cookies) |
| Terms link | Link to Fanvue terms (they handle compliance) |

---

## Development Phases

### Phase 1: MVP (Current Sprint)
- [x] PRD documentation
- [ ] Video optimization (compress to <3MB)
- [ ] Basic page structure
- [ ] Age verification modal
- [ ] Video background
- [ ] Profile section
- [ ] Main CTA block
- [ ] Countdown timer (single value)
- [ ] Deploy to Vercel

### Phase 2: Enhancement
- [ ] Photo gallery with emoji censorship
- [ ] Social proof notifications
- [ ] Timer A/B testing rotation
- [ ] Analytics integration
- [ ] Custom domain setup

### Phase 3: Optimization
- [ ] A/B test analysis
- [ ] Performance optimization
- [ ] Conversion tracking refinement
- [ ] Additional social proof elements

---

## Open Questions

1. **Domain**: What custom domain will be purchased?
2. **Fanvue link**: Exact URL with trial promotion?
3. **Avatar image**: Use existing Elena image or generate new?
4. **Gallery photos**: Generate 5-6 new images via Big Lust?
5. **Instagram/TikTok URLs**: Exact profile URLs?

---

## Appendix

### Inspiration References
- Soft boudoir aesthetic
- Dark mode with pink accents
- Mobile-first link pages
- OnlyFans/Fanvue creator landing pages

### Technical References
- Next.js App Router: https://nextjs.org/docs/app
- Tailwind CSS: https://tailwindcss.com/docs
- Vercel Analytics: https://vercel.com/docs/analytics

---

*Document created: January 19, 2026*
*Last updated: January 19, 2026*
*Version: 1.0*
