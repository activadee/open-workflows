# open-workflows

GitHub automation workflows via composite actions. AI-powered reviews, labeling, and doc sync - plus automated releases with npm provenance.

## Quick Start

```bash
bunx @activade/open-workflows
```

The CLI will prompt you to select workflows and install them to `.github/workflows/`.

## Available Actions

| Action | AI | Description |
|--------|-----|-------------|
| `pr-review` | Yes | AI-powered code reviews |
| `issue-label` | Yes | Auto-label issues based on content |
| `doc-sync` | Yes | Keep docs in sync with code changes |
| `release` | No | Semantic versioning with npm provenance |

## Manual Usage

### AI-Powered Actions

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

### Release Action (No AI)

```yaml
name: Release
on:
  workflow_dispatch:
    inputs:
      bump:
        description: 'Version bump'
        required: true
        type: choice
        options: [patch, minor, major]
jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: activadee/open-workflows/actions/release@main
        with:
          bump: ${{ inputs.bump }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

No NPM_TOKEN needed - uses OIDC trusted publishing with provenance.

## Authentication

### For AI Actions

**Option 1: API Key**
```bash
gh secret set ANTHROPIC_API_KEY
```

**Option 2: Claude Max (OAuth)**
```bash
gh secret set OPENCODE_AUTH < ~/.local/share/opencode/auth.json
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

**AI Actions (pr-review, issue-label, doc-sync):**
1. Workflow triggers on GitHub event
2. Composite action sets up Bun and OpenCode
3. OpenCode runs with the bundled skill
4. AI analyzes content and takes action

**Release Action:**
1. Manually triggered with version bump type
2. Generates changelog from git commits
3. Publishes to npm with provenance
4. Creates GitHub release with notes

## Customizing

Fork this repository and modify:
- `actions/*/skill.md` - AI behavior for AI-powered actions
- `actions/release/src/publish.ts` - Release logic

## License

MIT
