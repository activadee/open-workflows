# Doc Sync Workflow

The `doc-sync` workflow automatically keeps documentation in sync with code changes.

## Overview

When a pull request is opened or updated, this workflow:
1. Checks out the repository
2. Configures Git for commits
3. Sets up Bun runtime
4. Runs the OpenCode doc-sync agent to analyze changes and update documentation
5. Commits any documentation changes

## Usage

Create `.github/workflows/doc-sync.yml`:

```yaml
name: Doc Sync

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  sync:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v6
        with:
          ref: ${{ github.head_ref }}

      - name: Configure Git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Sync Documentation
        run: bunx opencode-ai run --agent doc-sync "Sync documentation for PR ${{ github.event.pull_request.number }}"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          MINIMAX_API_KEY: ${{ secrets.MINIMAX_API_KEY }}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes | GitHub authentication token |
| `MINIMAX_API_KEY` | Yes | MiniMax API key for AI |

## Behavior

The doc-sync workflow:
- Only runs on non-draft pull requests
- Creates a per-file checklist and analyzes each changed file to identify documentation needs
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
