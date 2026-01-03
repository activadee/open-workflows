# PR Review Workflow

The `pr-review` skill provides AI-powered code review for pull requests, focusing on **real issues that matter** rather than style nitpicks.

## Overview

When a pull request is opened or updated:
1. GitHub Actions triggers the workflow
2. OpenCode loads the `pr-review` skill
3. AI checks for prior review comments on the PR
4. AI analyzes each changed file for substantive issues
5. Posts a sticky comment with findings using `submit_review` tool

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
      - uses: actions/checkout@v4

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

## Review Philosophy

The skill is designed to act like a **senior engineer in a time-limited code review**:

- Focus on issues that represent real risks or actual bugs
- Skip style preferences and subjective opinions
- Prioritize signal over noise with fewer, higher-quality findings
- Check prior review comments to avoid re-flagging resolved issues

## Review Focus Areas

The skill focuses on substantive issues in these areas:

### 1. Correctness
Logic errors, broken control flow, off-by-one bugs, incorrect conditions.

**Flags**: Missing await, wrong operators, broken loops
**Skips**: Unused variables, type confusion without runtime impact

### 2. Security
Exploitable vulnerabilities that could be attacked.

**Flags**: SQL injection, XSS, auth bypass, secrets in code
**Skips**: Hypothetical scenarios, generic security advice

### 3. Stability
Issues that cause crashes, data loss, or resource problems.

**Flags**: Unhandled rejections, race conditions, resource leaks
**Skips**: Extra defensive checks, optional timeout additions

### 4. Maintainability
Clarity issues that cause actual confusion.

**Flags**: Misleading names, logic contradicting docs
**Skips**: Naming preferences, "could be cleaner" suggestions

## What the Skill Avoids

The skill explicitly skips these common nitpicks:

1. **Coding style preferences** - Spacing, quotes, line length (linters handle this)
2. **Defensive programming suggestions** - Extra null checks beyond type requirements
3. **DRY violations without real cost** - Small duplication that doesn't hurt maintenance
4. **Missing code comments** - Unless security-critical or intentionally obscure
5. **Subjective complexity concerns** - "Function too long" without concrete problems
6. **Minor refactoring suggestions** - Aesthetic improvements without objective benefit

## Context Awareness

The skill reads prior PR comments before reviewing to:

- Understand what feedback was already given
- Verify if previous issues were addressed
- Avoid re-flagging the same issues
- Acknowledge resolved feedback in the review summary

## Verdict Behavior

The skill uses verdicts conservatively:

- **`request_changes`**: Only for issues that should **block the merge** (bugs, security holes, stability risks)
- **`approve`**: Used generously for clean PRs or when issues are low-severity

Severity levels:
- `low`: Worth noting but doesn't block merge
- `medium`: Will probably cause a bug in production
- `high`: Will definitely cause problems for users
- `critical`: Security vulnerability or data loss risk

## Customizing

Edit `.opencode/skill/pr-review/SKILL.md` to:
- Change review priorities
- Add project-specific guidelines
- Modify the verdict rules
- Adjust what counts as a nitpick
