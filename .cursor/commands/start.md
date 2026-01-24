# Start Session

You are starting a new work session on the IG-influencer project.

## Your Mission

1. Read the user's message below to understand what they want to work on
2. Find the corresponding feature in `features/`
3. Read its README.md to understand current state
4. Check for active tasks in `tasks/` folder
5. Be ready to work

## Finding the Feature

Explore `features/` to find the corresponding feature based on the user's request.

Structure:
- Platform folders (`instagram/`, `fanvue/`) contain sub-features
- Cross-platform features are at the root of `features/`
- Each feature has a `README.md` with current state
- Each feature may have a `tasks/` folder with active task docs

## Rules

- **Read the feature README first** — It has current state, what works, what doesn't, active tasks
- **Check `tasks/` folder** — Look for TASK-*.md files for active work
- **Check DECISIONS.md** — Don't re-debate settled decisions
- **Check TESTS.md if exists** — Know what's been tested
- **NEVER read from `archive/`** — Old docs, outdated

## Start

1. Parse the user's message to identify the feature area
2. List `features/` to find the right folder
3. Read `features/{path}/README.md`
4. Check if `features/{path}/tasks/` exists:
   - If working on existing task → read that TASK-XXX.md
   - If new work → suggest `/ralph-plan` to create a task
5. Optionally read `DECISIONS.md` and recent sessions if relevant
6. Summarize what you understand and confirm the work focus

## Task Status Values

- 🔵 Todo — Not started
- 🟡 In Progress — Currently working on
- ✅ Done — Completed (file renamed to DONE-XXX)
- ❌ Blocked — Cannot proceed

## Ralph Integration

Tasks live in `features/*/tasks/`. When Ralph completes a task, it:
- Adds a "Ralph Sessions" record with date, summary, files modified
- Renames `TASK-XXX.md` → `DONE-XXX.md`
- Updates feature README

**User's request follows:**
