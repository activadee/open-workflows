# Doc Sync Workflow

The `doc-sync` skill keeps documentation in sync with code changes.

## Overview

When a pull request is opened or updated:
1. GitHub Actions triggers the workflow
2. OpenCode loads the `doc-sync` skill
3. AI analyzes each changed file for doc impact
4. Updates relevant docs using native `write` and `bash` tools
5. Commits changes with `[skip ci]` prefix

## Installation

```bash
bunx open-workflows
```

Select "Doc Sync" when prompted.

## Workflow File

`.github/workflows/doc-sync.yml`:

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
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.head_ref }}

      - name: Configure Git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Sync Documentation
        run: bunx opencode-ai run "Load the doc-sync skill and sync documentation for PR ${{ github.event.pull_request.number }}"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes | GitHub authentication (automatic) |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key |

## Documentation Files

The skill checks these locations:
- `README.md` at repository root
- Files under `docs/` directory
- API documentation
- Configuration examples

## What Gets Updated

| Code Change | Doc Update |
|-------------|------------|
| New feature | Add documentation |
| Changed behavior | Update existing docs |
| Removed feature | Remove or mark deprecated |
| New config option | Document option |
| Changed API | Update examples |

## Customizing

Edit `.opencode/skill/doc-sync/SKILL.md` to:
- Change documentation scope
- Add project-specific style guidelines
- Modify commit message format
