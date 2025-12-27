# Doc Sync Workflow

The `opencode-doc-sync.yml` workflow automatically keeps documentation in sync with code changes.

## Overview

When a pull request is opened or updated, this workflow:
1. Checks out the repository
2. Analyzes the code changes in the PR
3. Identifies documentation that needs updating
4. Edits and commits documentation changes

## Usage

```yaml
# .github/workflows/doc-sync.yml
name: Doc Sync

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  sync:
    uses: activadee/opencode-shared-workflows/.github/workflows/opencode-doc-sync.yml@main
    secrets: inherit
```

## Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `model` | string | `minimax/MiniMax-M2.1` | AI model to use |
| `fallback_model` | string | `opencode/big-pickle` | Fallback model |

## Secrets

| Secret | Required | Description |
|--------|----------|-------------|
| `MINIMAX_API_KEY` | Yes | MiniMax API key |

## Behavior

The doc-sync workflow:
- Only runs on non-draft pull requests
- Analyzes code changes to identify documentation needs
- Updates relevant documentation files
- Commits changes with `[skip ci]` to avoid triggering additional workflows

## Documentation Files

The workflow considers these files for updates:
- `README.md` (root level)
- `docs/**/*.md`
- Any `*.md` files at root level
- API documentation if applicable

## What Gets Updated

- **New features** → Documentation added
- **Changed behavior** → Existing docs updated
- **Removed features** → Docs removed or marked deprecated
- **New config options** → Documented
- **Changed APIs** → Examples updated

## Commit Message

When documentation is updated, the commit message is:
```
[skip ci] docs: sync documentation with code changes
```

## Customization

### Using a Different Model

```yaml
jobs:
  sync:
    uses: activadee/opencode-shared-workflows/.github/workflows/opencode-doc-sync.yml@main
    secrets: inherit
    with:
      model: opencode/big-pickle
```

## How It Works

The doc-sync workflow uses OpenCode to analyze code changes and automatically update documentation. When a PR is opened or updated:

1. OpenCode reviews the code changes
2. Identifies documentation that needs updating
3. Edits documentation files to reflect the changes
4. Commits with `[skip ci]` to avoid triggering additional workflows
