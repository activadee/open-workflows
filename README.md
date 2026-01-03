# open-workflows

AI-powered GitHub automation workflows via composite actions.

Powered by [OpenCode](https://opencode.ai).

## Quick Start

```bash
bunx @activade/open-workflows
```

The CLI will prompt you to select workflows and install them to `.github/workflows/`.

## What's Installed

Workflow files that use composite actions from this repository:

| Workflow | Trigger | Description |
|----------|---------|-------------|
| `pr-review.yml` | Pull request | AI-powered code reviews |
| `issue-label.yml` | Issue opened/edited | Auto-label issues based on content |
| `doc-sync.yml` | Pull request | Keep docs in sync with code changes |
| `release.yml` | Manual dispatch | Semantic versioning and release notes |

## Manual Usage

You can also use the composite actions directly without the CLI:

```yaml
name: PR Review
on:
  pull_request:
jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: activadee/open-workflows/actions/pr-review@main
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Available Actions

| Action | Description |
|--------|-------------|
| `activadee/open-workflows/actions/pr-review@main` | AI code review |
| `activadee/open-workflows/actions/issue-label@main` | Auto-label issues |
| `activadee/open-workflows/actions/doc-sync@main` | Sync documentation |
| `activadee/open-workflows/actions/release@main` | Create releases |

## Authentication

### Option 1: API Key (Simple)

Add your Anthropic API key as a secret:

```bash
gh secret set ANTHROPIC_API_KEY
```

### Option 2: Claude Max / OAuth (Subscription)

If you have a Claude Max subscription through OpenCode:

```bash
cat ~/.local/share/opencode/auth.json | base64 | gh secret set OPENCODE_AUTH
```

Then use `OPENCODE_AUTH` instead of `ANTHROPIC_API_KEY` in your workflow.

### For Releases

The release workflow also requires an npm token:

```bash
gh secret set NPM_TOKEN
```

## CLI Options

```bash
bunx @activade/open-workflows [OPTIONS]

OPTIONS
  --force, -f    Override existing files without prompts
  --version, -v  Display version
  --help, -h     Display help
```

## How It Works

1. Workflow triggers on GitHub event (PR, issue, manual)
2. Composite action sets up Bun and OpenCode
3. OpenCode runs with the bundled skill
4. AI analyzes content and takes action (post review, apply labels, etc.)

Each action bundles:
- `action.yml` - GitHub Action definition
- `skill.md` - Instructions for the AI
- `src/*.ts` - Helper scripts for structured operations

## Customizing

Fork this repository and modify the skills in `actions/*/skill.md` to customize behavior.

## License

MIT
