# Review Workflow

The `opencode-review.yml` workflow provides AI-powered code review for pull requests.

## Overview

When a pull request is ready for review, this workflow:
1. Checks out the repository
2. Installs OpenCode via curl
3. Fetches PR details using GitHub API
4. Loads the review prompt from this repository
5. Runs OpenCode to analyze the changes
6. Posts line-specific review comments on the PR using gh CLI

## Usage

```yaml
# .github/workflows/pr-review.yml
name: PR Review

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

jobs:
  review:
    uses: activadee/opencode-shared-workflows/.github/workflows/opencode-review.yml@main
    secrets: inherit
```

## Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `model` | string | `minimax/MiniMax-M2.1` | AI model to use |
| `fallback_model` | string | `opencode/big-pickle` | Fallback model |
| `share` | boolean | `false` | Share the OpenCode session |

## Secrets

| Secret | Required | Description |
|--------|----------|-------------|
| `MINIMAX_API_KEY` | Yes | MiniMax API key |

## Behavior

The review workflow:
- Only runs on non-draft pull requests
- Installs OpenCode via `curl -fsSL https://opencode.ai/install | bash`
- Fetches PR title, description, and commit SHA via `gh` API
- Creates line-specific comments on files for violations by default
- Optionally, when configured with the `--sticky-comment` flag in the underlying CLI, maintains a single sticky PR comment that summarizes all issues instead of individual inline comments
- Comments "lgtm" if no significant issues found (either via inline comments or in the sticky comment summary)
- Focuses on correctness, security, stability, and maintainability
- Avoids style zealotry - only flags style issues that hide bugs or cause confusion

## Customization

### Using a Different Model

```yaml
jobs:
  review:
    uses: activadee/opencode-shared-workflows/.github/workflows/opencode-review.yml@main
    secrets: inherit
    with:
      model: opencode/big-pickle
```

### Disabling Session Sharing

```yaml
jobs:
  review:
    uses: activadee/opencode-shared-workflows/.github/workflows/opencode-review.yml@main
    secrets: inherit
    with:
      share: false
```

## How It Works

The review workflow uses OpenCode to analyze pull request changes. When a PR is ready for review:

1. OpenCode fetches the PR details and changes
2. Reviews the code against best practices
3. Focuses on correctness, security, stability, and maintainability
4. Posts line-specific comments on issues found
5. Comments "lgtm" if no significant issues found
