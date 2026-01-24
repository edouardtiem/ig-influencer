# End Session

You are ending a work session. Save all progress to the feature documentation, then commit and push.

## Your Mission

Document everything that was done this session so the next session (or agent) can continue seamlessly, then create a git commit with all changes.

## Steps

### 1. Update Task Document (PRIMARY)

If working on a task in `features/*/tasks/`:

**If task is in progress:**
- Add a progress log entry with today's date
- Update status if changed
- Note what was done and what's next

**If task is complete:**
- Add final progress log entry
- Fill in the "Outcome" section
- Add Ralph session record if completed by Ralph:

```markdown
## Ralph Sessions

### {DATE} — COMPLETED
**Summary**: {What was accomplished}

**Files Modified**:
- `file.ts` — {change}
```

- Rename file from `TASK-XXX-slug.md` to `DONE-XXX-slug.md`
- Move from "Active Tasks" to "Completed Tasks" table in README.md

**If new work was started:**
- Create new `TASK-XXX-slug.md` in `tasks/` folder
- Add to "Active Tasks" table in README.md

### 2. Update README.md

In the feature's `README.md`:
- Update "Active Tasks" table if task status changed
- Move completed tasks to "Completed Tasks" table
- Add new items to "What Works ✅" if we discovered something works
- Add new items to "What Doesn't Work ❌" if we discovered something doesn't work
- Update "Last updated" date
- Update "Status" if feature status changed

### 3. Update DECISIONS.md (if decisions were made)

If we made any decisions during this session, add them:

```markdown
## YYYY-MM-DD: {Decision Title}

**Context**: {Why we needed to decide}

**Options considered**:
1. Option A → Result
2. Option B → Result

**Decision**: {What we chose}

**Reason**: {Why}

**Result**: {Outcome}
```

### 4. Update TESTS.md (if tests were run)

If we ran any tests, add them to the summary table and detailed logs.

### 5. Create Session File (optional, for significant sessions)

Only create a session file if the session had significant findings or complex work.
Location: `features/{path}/sessions/YYYY-MM-DD-{topic}.md`

### 6. Update ROADMAP-v2.md (if status changed)

If the feature status changed (e.g., from "In Progress" to "Stable"), update ROADMAP-v2.md.

### 7. Clean Up Launcher (if using Ralph)

If `RALPH-TASK.md` exists and the task is complete, delete it.

## Task Document Template

When creating a new task:

```markdown
# TASK-XXX: {Task Title}

**Status**: 🔵 Todo | 🟡 In Progress | ✅ Done | ❌ Blocked
**Created**: {date}
**Feature**: [{Feature Name}](../README.md)

---

## Goal

{What this task should accomplish}

---

## Acceptance Criteria

- [ ] {Specific, verifiable criterion}
- [ ] No linter errors introduced

---

## Approach

{Numbered steps}

---

## Files Involved

- `path/to/file.ts` — {what will change}

---

## Progress Log

### {DATE}
- {What was done}
- {What's next}

---

## Outcome

_Fill when task is complete, then rename file to DONE-XXX-slug.md_

---

## Ralph Sessions

_Automatically filled when Ralph completes this task_
```

## Execute

1. Identify which feature and task we worked on this session
2. Update the task document with progress
3. Update README.md task tables if needed
4. Apply updates to other relevant files (DECISIONS, TESTS)
5. Confirm what was saved

## Git Commit & Push

After documentation is complete:

1. Run `git status` to see all changes
2. Run `git diff` to review what changed
3. Stage all relevant files: `git add .`
4. Create a commit with a clear message describing the session work:

```bash
git commit -m "$(cat <<'EOF'
feat(feature-name): brief description

- Detail 1
- Detail 2

EOF
)"
```

5. Push to remote: `git push`

### Commit Message Guidelines

- Use conventional commits: `feat`, `fix`, `docs`, `refactor`, `chore`
- Include feature scope: `feat(dm):`, `fix(comfyui):`, `docs(tasks):`
- Keep first line under 72 chars
- List key changes in body

### Example

```bash
git add .
git commit -m "$(cat <<'EOF'
feat(dm): sync bot with gleeful wife persona

- Updated system prompts with new personality mix
- Added 15+ exit message variations
- Updated pitch templates with emotional angle

EOF
)"
git push
```

**Begin documentation and commit now.**
