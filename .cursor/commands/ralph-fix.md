# Ralph Fix - Autonomous Bug Fixing Loop

An autonomous loop specifically for fixing bugs, errors, and issues.

## Your Mission

Fix the reported issue through iterative debugging until resolved.

## Workflow

### Phase 1: Diagnose
1. Read the error/issue description
2. Search codebase for related code
3. Identify root cause
4. Report diagnosis

### Phase 2: Fix Loop

```
🔧 FIX ITERATION [N]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 Issue: [description]
📍 Location: [file:line]
💡 Hypothesis: [what you think is wrong]
🛠️ Fix: [what you're changing]
✅ Verification: [how you'll verify]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Repeat until:
- Issue is resolved
- Tests pass
- No new errors introduced

### Phase 3: Verification
1. Run relevant tests
2. Check for linter errors
3. Verify the fix doesn't break other things
4. Output: `FIX_COMPLETE: true`

## Rules

- **INVESTIGATE FIRST** - Don't guess, find the actual cause
- **MINIMAL CHANGES** - Fix only what's broken
- **TEST THE FIX** - Verify it works before declaring done
- **NO REGRESSIONS** - Check you didn't break other things

## Exit Conditions

- ✅ Issue resolved and verified
- 🚫 Unable to fix (explain why, suggest alternatives)
- ⏱️ Max 10 iterations

**Analyze the issue and begin fixing.**
