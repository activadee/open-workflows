# open-workflows

AI-powered GitHub automation workflows as an OpenCode plugin. Uses **Skills** for customizable PR reviews, issue labeling, documentation sync, and release automation.

Powered by [OpenCode](https://opencode.ai).

## Quick Start

```bash
bunx open-workflows
```

The CLI will:
1. Prompt you to select workflows
2. Install skills to `.opencode/skill/`
3. Install GitHub Actions workflows to `.github/workflows/`
4. Create/update `.opencode/opencode.json`

## What's Installed

### Skills (`.opencode/skill/`)

| Skill | Description |
|-------|-------------|
| `pr-review` | AI-powered code review with structured findings |
| `issue-label` | Auto-label issues based on content |
| `doc-sync` | Keep docs in sync with code changes |
| `release-notes` | Semantic versioning and release automation |

### Workflows (`.github/workflows/`)

| Workflow | Trigger | Description |
|----------|---------|-------------|
| `pr-review.yml` | Pull request | Reviews PRs using `pr-review` skill |
| `issue-label.yml` | Issue opened/edited | Labels issues using `issue-label` skill |
| `doc-sync.yml` | Pull request | Syncs docs using `doc-sync` skill |
| `release.yml` | Manual dispatch | Creates releases using `release-notes` skill |

## CLI Options

```bash
bunx open-workflows [OPTIONS]

OPTIONS
  --skills       Install skills only
  --workflows    Install workflows only
  --version, -v  Display version
  --help, -h     Display help
```

## Plugin Installation

Add to your `opencode.json`:

```json
{
  "plugin": ["@activade/open-workflows"]
}
```

The plugin provides 4 tools for the skills to use:
- `submit_review` - Post PR review comments
- `apply_labels` - Apply labels to issues
- `github_release` - Create GitHub releases
- `bun_release` - Publish to npm

## GitHub Secrets

Add your API key as a GitHub Actions secret:

```bash
gh secret set ANTHROPIC_API_KEY
```

For the release workflow, also add:

```bash
gh secret set NPM_TOKEN
```

## How It Works

1. GitHub Actions trigger on events (PR, issue, manual)
2. Workflow runs OpenCode with a task message
3. OpenCode loads the appropriate skill
4. Skill guides the AI through the workflow
5. AI uses the plugin's tools to complete actions

## Customizing Skills

Skills are just markdown files. After installation, edit `.opencode/skill/*/SKILL.md` to customize behavior.

## License

MIT
