# open-workflows

AI-powered GitHub automation workflows as an OpenCode plugin. Provides agents for code reviews, issue labeling, documentation sync, and release notes.

Powered by [OpenCode](https://opencode.ai).

## Installation

Add the plugin to your `opencode.json`:

```json
{
  "plugin": ["@activadee-ai/open-workflows"]
}
```

Then install and set up workflows:

```bash
bun add -d @activadee-ai/open-workflows
```

Ask OpenCode to set up the workflows:

```
> Set up PR review and issue labeling workflows
```

OpenCode will use the `setup_workflows` tool to create the GitHub Action files.

## What You Get

### Agents

| Agent | Description | Trigger |
|-------|-------------|---------|
| `review` | AI-powered PR code review | Pull request opened/updated |
| `label` | Automatic issue labeling | Issue opened/edited |
| `doc-sync` | Keep docs in sync with code | PR with code changes |
| `release` | Generate release notes | Release created |

### Tools

| Tool | Description |
|------|-------------|
| `submit_review` | Posts PR review with inline comments to GitHub |
| `apply_labels` | Applies labels to GitHub issues |
| `commit_docs` | Commits documentation updates to the PR branch |
| `setup_workflows` | Creates GitHub Actions workflow files |

## GitHub Actions Setup

After setting up workflows, add your API key as a repository secret:

```bash
gh secret set MINIMAX_API_KEY -b"your-key"
```

Then commit and push the workflow files.

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│  opencode.json                                                  │
│  { "plugin": ["@activadee-ai/open-workflows"] }                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Plugin provides:                                               │
│  ├── Agents: review, label, doc-sync, release                  │
│  └── Tools: submit_review, apply_labels, commit_docs,          │
│             setup_workflows                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
          "Set up workflows"  │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  .github/workflows/                                             │
│  ├── pr-review.yml          # Triggers on PR events            │
│  ├── issue-label.yml        # Triggers on issue events         │
│  ├── doc-sync.yml           # Triggers on PR code changes      │
│  └── release.yml            # Triggers on releases             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  GitHub Actions runs:                                           │
│  opencode run --agent review "Review PR #123"                   │
└─────────────────────────────────────────────────────────────────┘
```

## Customization

### Change Model

The agents use `minimax/MiniMax-M2.1` by default. Override in your `opencode.json`:

```json
{
  "plugin": ["@activadee-ai/open-workflows"],
  "agent": {
    "review": {
      "model": "openai/gpt-4o"
    }
  }
}
```

### Modify Agent Behavior

Override agent prompts in your `opencode.json`:

```json
{
  "plugin": ["@activadee-ai/open-workflows"],
  "agent": {
    "review": {
      "prompt": "You are a code reviewer. Focus on security issues only."
    }
  }
}
```

## Requirements

- Bun (latest recommended)
- OpenCode CLI
- GitHub repository with Actions enabled

## License

MIT
