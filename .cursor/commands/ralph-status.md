# Ralph Status - Task Progress Check

Check the current status of active tasks across all features.

## Actions

1. Check for `RALPH-TASK.md` in project root (active Ralph session)
2. Scan all `features/*/tasks/` folders for TASK-*.md files
3. Generate a progress report

## Process

### Step 1: Check Active Session

Look for `RALPH-TASK.md` at project root:
- If found, read it and note the linked task

### Step 2: Scan All Features

For each feature folder, list `tasks/` and categorize:
- `TASK-*.md` = Active/In Progress
- `DONE-*.md` = Completed

### Step 3: Generate Report

## Output Format

```
╔══════════════════════════════════════════════════════════════╗
║                    RALPH STATUS REPORT                       ║
╠══════════════════════════════════════════════════════════════╣
║ Active Session: [Yes/No]                                     ║
║ Target: [task path if active]                                ║
╠══════════════════════════════════════════════════════════════╣
║ 🟡 ACTIVE TASKS                                              ║
╠══════════════════════════════════════════════════════════════╣
║ comfyui-generation-workflow/                                 ║
║   • TASK-004: Qwen face refinement                          ║
║   • TASK-005: RunPod persistent setup                       ║
╠──────────────────────────────────────────────────────────────╣
║ instagram/dm/                                                ║
║   • (none)                                                   ║
╠══════════════════════════════════════════════════════════════╣
║ ✅ RECENTLY COMPLETED                                        ║
╠══════════════════════════════════════════════════════════════╣
║ comfyui-generation-workflow/                                 ║
║   • DONE-001: Grain reduction                               ║
╠──────────────────────────────────────────────────────────────╣
║ instagram/dm/                                                ║
║   • DONE-001: Gleeful wife persona sync                     ║
╚══════════════════════════════════════════════════════════════╝
```

## If No Tasks Found

Report that no active tasks exist and suggest using `/ralph-plan` to create one.

**Check status now.**
