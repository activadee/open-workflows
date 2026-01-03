# Issue Label Workflow

The `issue-label` skill automatically applies labels to GitHub issues.

## Overview

When an issue is opened or edited:
1. GitHub Actions triggers the workflow
2. OpenCode loads the `issue-label` skill
3. AI analyzes issue content and repository labels
4. Applies up to 3 labels using `apply_labels` tool

## Installation

```bash
bunx open-workflows
```

Select "Issue Label" when prompted.

## Workflow File

`.github/workflows/issue-label.yml`:

```yaml
name: Issue Label

on:
  issues:
    types: [opened, edited]

jobs:
  label:
    runs-on: ubuntu-latest
    permissions:
      issues: write
    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Label Issue
        run: bunx opencode-ai run "Load the issue-label skill and label issue ${{ github.event.issue.number }}"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes | GitHub authentication (automatic) |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key |

## Label Categories

Common labels the skill looks for:
- `bug` - Something isn't working
- `feature` / `feature-request` - New functionality
- `enhancement` - Improvement to existing
- `documentation` - Docs updates needed
- `question` - Needs clarification
- `good-first-issue` - Good for newcomers

## Customizing

Edit `.opencode/skill/issue-label/SKILL.md` to:
- Add project-specific label categories
- Change naming conventions
- Modify max label count
