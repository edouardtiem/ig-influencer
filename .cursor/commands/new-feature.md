# New Feature

You are creating a new feature in the IG-influencer project.

## Your Mission

1. Understand what new feature the user wants to create
2. Determine where it should live in the structure
3. Create the folder and files using the templates below

## Structure Decision

### If it's a new platform
Create: `features/{platform}/README.md` + sub-features

### If it's a sub-feature of existing platform
Create: `features/{platform}/{feature}/`

### If it's cross-platform
Create: `features/{feature}/` at root level

## Templates to Use

### Folder Structure
```
features/{path}/
├── README.md          # Always create
├── DECISIONS.md       # Create if decisions to track
├── TESTS.md           # Create if tests to track
└── sessions/          # Always create (empty folder)
```

### README.md Template

```markdown
# {Feature Name}

> One-line description

**Status**: 📋 Planned | 🟡 In Progress | 🟢 Stable
**Last updated**: {today's date}

---

## Current State

{Describe current situation - what exists, what doesn't}

---

## What Works ✅

| What | Details |
|------|---------|
| (none yet) | |

## What Doesn't Work ❌

| What | Details |
|------|---------|
| (none yet) | |

## Open Questions ❓

- {List unknowns}

---

## Next Steps

- [ ] {First thing to do}
- [ ] {Second thing}

---

## Quick Links

- [Decisions →](./DECISIONS.md)

---

## Key Files

| File | Purpose |
|------|---------|
| (none yet) | |
```

### DECISIONS.md Template

```markdown
# Decisions — {Feature Name}

Chronological log of decisions made and why.

---

(No decisions yet)
```

### TESTS.md Template (only if needed)

```markdown
# Tests — {Feature Name}

All tests run, with results and learnings.

---

## Summary Table

| Test | Date | Result | Notes |
|------|------|--------|-------|
| (none yet) | | | |

---

## Detailed Test Logs

(No tests yet)
```

## Steps

1. Parse user's description to understand the feature
2. Decide where it goes in the structure
3. Create the folder and files
4. Update `ROADMAP-v2.md` to add the new feature
5. Update `SESSION-PROMPTS.md` feature locations table
6. Confirm creation

**User's feature description follows:**
