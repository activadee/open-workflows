# PR Review Workflow

The `pr-review` skill provides AI-powered code review for pull requests.

## Overview

When a pull request is opened or updated:
1. GitHub Actions triggers the workflow
2. OpenCode loads the `pr-review` skill
3. AI analyzes each changed file
4. Posts a sticky comment with findings using `submit_review` tool

## Installation

```bash
bunx open-workflows
```

Select "PR Review" when prompted.

## Workflow File

`.github/workflows/pr-review.yml`:

```yaml
name: PR Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

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
        run: bunx opencode-ai run "Load the pr-review skill and review PR ${{ github.event.pull_request.number }}"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes | GitHub authentication (automatic) |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key |

## Review Focus Areas

The skill focuses on:

1. **Correctness** - Logic errors, bugs, edge cases
2. **Security** - Vulnerabilities, injection risks, auth issues
3. **Stability** - Error handling, race conditions, resource leaks
4. **Maintainability** - Clarity, naming, convention violations

## Customizing

Edit `.opencode/skill/pr-review/SKILL.md` to:
- Change review priorities
- Add project-specific guidelines
- Modify the verdict rules
