# Ralph Quick - Fast Autonomous Task Execution

A lightweight version of Ralph for smaller tasks (3-5 steps max).

## Behavior

1. If `RALPH-TASK.md` exists at project root, read it and the linked task file
2. Otherwise, take the user's request directly:
   - Identify the feature area
   - Break into 3-5 immediate steps
   - Execute ALL steps autonomously without asking for confirmation
3. Document and report results when complete

## Format

```
🚀 RALPH QUICK MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Steps identified:
1. [step 1]
2. [step 2]
3. [step 3]

⚡ Executing...

[... autonomous execution ...]

✅ COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Summary:
- [what was done]
- [files modified]
- [any notes]
```

## Documentation (if using task file)

After execution, update the task file in `features/*/tasks/TASK-XXX-*.md`:

1. Add progress log entry
2. Add Ralph session record:

```markdown
## Ralph Sessions

### {DATE} — COMPLETED (quick mode)
**Summary**: {What was accomplished in 1-2 sentences}

**Files Modified**:
- `file.ts` — {change}
```

3. Rename to `DONE-XXX-*.md` if complete
4. Update feature README task tables
5. Delete `RALPH-TASK.md` launcher

## Rules

- NO confirmation prompts
- NO verbose explanations during execution
- Execute EVERYTHING then report
- **ALWAYS DOCUMENT** if using a task file
- Max 5 steps (for larger tasks, use full `/ralph`)

**Execute the request now.**
