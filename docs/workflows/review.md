# Review Workflow

The `review` agent provides AI-powered code review for pull requests.

## Overview

When a pull request is ready for review, this workflow:
1. Checks out the repository
2. Sets up Bun runtime
3. Runs the OpenCode review agent to analyze the PR changes
4. Posts review comments using the `submit_review` tool

## Usage

Create `.github/workflows/pr-review.yml`:

```yaml
name: PR Review

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v6

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Review PR
        run: bunx opencode-ai run --agent review "Review PR ${{ github.event.pull_request.number }}"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          MINIMAX_API_KEY: ${{ secrets.MINIMAX_API_KEY }}
          COMMIT_SHA: ${{ github.event.pull_request.head.sha }}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes | GitHub authentication token |
| `MINIMAX_API_KEY` | Yes | MiniMax API key for AI |
| `COMMIT_SHA` | Yes | The commit SHA to review |

## Behavior

The review workflow:
- Only runs on non-draft pull requests
- Creates a per-file checklist and reviews each changed file
- Synthesizes findings focusing on correctness, security, stability, and maintainability
- Posts or updates a single PR comment with issues and locations using the `submit_review` tool
- Avoids style zealotry - only flags style issues that hide bugs or cause confusion
- Posts an approve-style summary if no significant issues are found

## Review Focus Areas

The review agent checks:
- **Correctness** - Logic errors, bugs, edge cases
- **Security** - Vulnerabilities, injection risks, auth issues
- **Stability** - Error handling, race conditions, resource leaks
- **Maintainability** - Code organization, naming, documentation gaps
