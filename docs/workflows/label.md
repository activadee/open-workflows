# Label Workflow

The `label` agent automatically applies labels to GitHub issues using AI.

## Overview

When an issue is opened or edited, this workflow:
1. Checks out the repository
2. Sets up Bun runtime
3. Runs the OpenCode label agent to analyze the issue
4. Applies appropriate labels to the issue using the `apply_labels` tool

## Usage

Create `.github/workflows/issue-label.yml`:

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
      - uses: actions/checkout@v6

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Label Issue
        run: bunx opencode-ai run --agent label "Label issue ${{ github.event.issue.number }}"
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

The label workflow:
- Reads the issue title and body
- Applies up to 3 appropriate labels
- Prefers existing repository labels
- Creates new labels only if necessary
- Uses lowercase with hyphens for label names

## Label Conventions

- **Format**: lowercase with hyphens (e.g., `bug-fix`, `feature-request`)
- **Length**: 1-3 words, under 30 characters
- **Common categories**: bug, feature, enhancement, documentation, question, good-first-issue

## How It Works

The label workflow uses OpenCode to analyze issues and apply appropriate labels. When an issue is opened or edited:

1. OpenCode reads the issue title and body
2. Analyzes the content to understand the issue type
3. Applies up to 3 relevant labels from existing repository labels
4. Creates new labels only if no existing label fits
