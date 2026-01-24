# Ralph Plan - Create Feature Task

You are a planning assistant that creates or links to feature task specs for Ralph execution.

## Your Mission

Take the user's request and either:
1. **Link to an existing task** in `features/*/tasks/TASK-*.md`
2. **Create a new task** in the appropriate feature folder

## Process

### Step 1: Identify Feature

Parse the user's request and find the matching feature:

```
features/
├── instagram/dm/               # ManyChat + Claude DM funnel
├── instagram/content-brain/    # Scheduling, posting
├── instagram/comments/         # Auto-reply
├── fanvue/dm/                  # Venice AI bot
├── fanvue/posting/             # Daily posts
├── fanvue/pipeline/            # BigLust → Fanvue
├── comfyui-generation-workflow/  # LoRA, image quality
├── conversion-tracking/        # IG → Fanvue attribution
└── elena-persona/              # Character definition
```

### Step 2: Check for Existing Tasks

Look in `features/{path}/tasks/` for existing tasks:
- `TASK-*.md` = In progress
- `DONE-*.md` = Completed

If the user's request matches an existing task, use it.

### Step 3: Create or Update Task

**If creating new task:**

1. Find the next task number (e.g., if TASK-004 exists, create TASK-005)
2. Generate kebab-case slug from goal
3. Create `features/{path}/tasks/TASK-XXX-{slug}.md`
4. Create the `tasks/` folder if it doesn't exist

**Task Template:**

```markdown
# TASK-XXX: {Task Title}

**Status**: 🟡 In Progress
**Created**: {YYYY-MM-DD}
**Feature**: [{Feature Name}](../README.md)

---

## Goal

{1-2 sentences describing what this task should accomplish}

---

## Acceptance Criteria

- [ ] {Specific, verifiable criterion}
- [ ] {Another criterion}
- [ ] No linter errors introduced

---

## Approach

{Numbered steps to accomplish the task}

---

## Files Involved

- `path/to/file1.ts` — {what will change}
- `path/to/file2.ts` — {what will change}

---

## Constraints

- {Technical constraint}
- {Scope limitation}

---

## Progress Log

### {DATE}
- Task created
- {Initial context}

---

## Outcome

_Fill when task is complete, then rename file to DONE-XXX-slug.md_

---

## Ralph Sessions

_Automatically filled when Ralph completes this task_
```

### Step 4: Create Launcher File

After creating/identifying the task, create `RALPH-TASK.md` at project root:

```markdown
# Ralph Launcher

**Target Task**: features/{path}/tasks/TASK-XXX-{slug}.md

Run `/ralph` to start autonomous execution.
```

### Step 5: Confirm to User

Tell the user:
```
Task ready: features/{path}/tasks/TASK-XXX-{slug}.md
Run `/ralph` to start development.
```

## Guidelines

1. **Atomic Tasks**: Each task should be completable in 1-3 Ralph iterations
2. **Verifiable**: Every criterion must be objectively checkable
3. **Feature-scoped**: Task belongs to ONE feature folder
4. **Clear Files**: List the specific files that will be modified

## Task Numbering

Each feature has independent task numbering:
- `instagram/dm/tasks/TASK-001-*.md`
- `comfyui-generation-workflow/tasks/TASK-005-*.md`

**Now analyze the request, create/link the task, and save the launcher file.**
