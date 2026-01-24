# Roadmap

> Simplified roadmap — Active work only

**Last updated**: 23 January 2026

---

## 🚧 Active Work

| Feature | Status | Focus | Link |
|---------|--------|-------|------|
| **ComfyUI Generation** | 🟡 In Progress | Grain reduction, face consistency | [→](./features/comfyui-generation-workflow/) |
| **Conversion Tracking** | 🟡 Monitoring | 0% conversion, waiting for data | [→](./features/conversion-tracking/) |
| **Fanvue Pipeline** | 📋 Planned | BigLust → Fanvue automation | [→](./features/fanvue/pipeline/) |

---

## ✅ Stable Features

### Instagram

| Feature | Status | Link |
|---------|--------|------|
| Content Brain | 🟢 Stable | v3 "Freedom Mode" | [→](./features/instagram/content-brain/) |
| DM Automation | 🟢 Stable | Gleeful Wife persona synced | [→](./features/instagram/dm/) |
| Comments | 🟢 Stable | ManyChat auto-reply | [→](./features/instagram/comments/) |

### Fanvue

| Feature | Status | Link |
|---------|--------|------|
| DM Bot | 🟢 Stable | Venice AI | [→](./features/fanvue/dm/) |
| Posting | 🟢 Stable | 17h daily | [→](./features/fanvue/posting/) |

### Other

| Feature | Status | Link |
|---------|--------|------|
| Elena Persona | 🟢 Stable | Character defined | [→](./features/elena-persona/) |

---

## 📋 Backlog

| Task | Priority | Link |
|------|----------|------|
| Fanvue Pipeline (TODO-018) | 🔴 High | [→](./features/fanvue/pipeline/) |
| Daily Account Insights | 🟡 Medium | [→](./roadmap/todo/TODO-012-daily-account-insights.md) |
| Elena Stories Highlights | 🟡 Medium | - |

---

## 💡 Ideas

| Idea | Impact | Link |
|------|--------|------|
| X (Twitter) Strategy | 🔴 High | [→](./roadmap/ideas/IDEA-010-x-twitter-strategy.md) |
| Comment Likes Automation | 🟡 Medium | [→](./roadmap/ideas/IDEA-012-comment-likes-automation.md) |

---

## 📊 Feature Documentation Structure

```
features/
├── instagram/
│   ├── dm/                    # ManyChat + Claude funnel
│   ├── content-brain/         # Scheduling, posting
│   └── comments/              # Auto-reply
│
├── fanvue/
│   ├── dm/                    # Venice AI bot
│   ├── posting/               # Daily posts
│   └── pipeline/              # BigLust → Fanvue (planned)
│
├── comfyui-generation-workflow/   # LoRA, checkpoints, quality
├── conversion-tracking/           # IG → Fanvue attribution
└── elena-persona/                 # Character definition
```

Each folder contains:
- `README.md` — Current state, what works, next steps
- `DECISIONS.md` — Why we chose X over Y
- `TESTS.md` — Test results (if applicable)
- `sessions/` — Session logs

---

## 📝 Session Workflow

See [SESSION-PROMPTS.md](./SESSION-PROMPTS.md) for start/end session commands.
