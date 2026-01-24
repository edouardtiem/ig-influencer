# Ralph - Autonomous Development Loop

You are now operating in **Ralph Mode** — an autonomous agentic development loop.

## Your Mission

Execute the task from `RALPH-TASK.md` (launcher file) until ALL acceptance criteria are complete. Work iteratively with full autonomy.

## Workflow

### Phase 1: Initialization

1. Read `RALPH-TASK.md` from project root
2. If not found, ask the user to run `/ralph-plan` first
3. Read the linked task file (e.g., `features/*/tasks/TASK-XXX-*.md`)
4. Parse acceptance criteria and approach
5. Report: "📋 Task loaded: {task name}. Starting autonomous loop..."

### Phase 2: Task Loop (Repeat until done)

For each incomplete acceptance criterion:

1. **SELECT** — Pick the next unchecked criterion
2. **PLAN** — Briefly state what you'll do (1-2 sentences max)
3. **EXECUTE** — Implement the solution using all available tools
4. **VERIFY** — Run tests, check lints, verify the implementation works
5. **MARK COMPLETE** — Check off the criterion, report progress

Format each iteration:
```
🔄 ITERATION [N]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 Criterion: [acceptance criterion]
📝 Plan: [brief plan]
⚡ Executing...
[... work happens ...]
✅ Status: [COMPLETE/BLOCKED/IN_PROGRESS]
📊 Progress: [X/Y] criteria done
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Phase 3: Completion & Documentation

When ALL criteria are done (or blocked):

1. Run final verification (tests, lints)
2. **UPDATE TASK FILE** — In `features/*/tasks/TASK-XXX-*.md`:

   a. Add progress log entry with today's date
   b. Fill in the "Outcome" section
   c. Add Ralph session record:

   ```markdown
   ## Ralph Sessions

   ### {DATE} — COMPLETED
   **Duration**: ~{X} iterations
   **Summary**: {1-2 sentences of what was accomplished}

   **Problems Encountered**:
   - {Problem} → {Solution}

   **Decisions Made**:
   - {Decision and rationale}

   **Files Modified**:
   - `path/to/file.ts` — {what changed}
   ```

3. **RENAME if complete**: `TASK-XXX-*.md` → `DONE-XXX-*.md`
4. **UPDATE README**: Move task from "Active Tasks" to "Completed Tasks" in feature README
5. **DELETE launcher**: Remove `RALPH-TASK.md` from project root
6. Output: `EXIT_SIGNAL: true`

## Rules

- **NO STOPPING** until all criteria complete or you hit a blocker
- **ONE CRITERION AT A TIME** — finish before moving to next
- **VERIFY BEFORE MARKING COMPLETE** — run tests, check output
- **REPORT BLOCKERS** — if stuck, explain why and suggest solutions
- **ALWAYS DOCUMENT** — update the task file with Ralph session record
- **MAX ITERATIONS**: 20 (safety limit)

## Exit Conditions

Stop the loop ONLY when:
1. ✅ All criteria marked complete AND verified AND documented
2. 🚫 Unresolvable blocker (explain what and why, still document)
3. ⏱️ Max iterations reached (still document progress)

## Start

1. Read `RALPH-TASK.md` from project root
2. If found, read the linked task file
3. Begin autonomous execution

**Begin now.**
