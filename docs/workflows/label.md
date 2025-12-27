# Label Workflow

The `opencode-label.yml` workflow automatically applies labels to GitHub issues using AI.

## Overview

When an issue is opened or edited, this workflow:
1. Checks out the repository
2. Loads the labeling prompt from this repository
3. Runs OpenCode to analyze the issue
4. Applies appropriate labels to the issue

## Usage

```yaml
# .github/workflows/issue-label.yml
name: Issue Label

on:
  issues:
    types: [opened, edited]

jobs:
  label:
    uses: activadee/opencode-shared-workflows/.github/workflows/opencode-label.yml@main
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

## Customization

### Using a Different Model

```yaml
jobs:
  label:
    uses: activadee/opencode-shared-workflows/.github/workflows/opencode-label.yml@main
    secrets: inherit
    with:
      model: opencode/big-pickle
```

## How It Works

The label workflow uses OpenCode to analyze issues and apply appropriate labels. When an issue is opened or edited:

1. OpenCode reads the issue title and body
2. Analyzes the content to understand the issue type
3. Applies up to 3 relevant labels from existing repository labels
4. Creates new labels only if no existing label fits
