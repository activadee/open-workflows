# Setup Guide

This guide walks you through setting up `@activade/open-workflows` in your repository.

## Prerequisites

- GitHub repository with Actions enabled
- OpenCode CLI (installed automatically by workflows)
- Anthropic API key

## Quick Start

```bash
bunx open-workflows
```

This interactive installer will:
1. Prompt you to select workflows
2. Install skills to `.opencode/skill/`
3. Install GitHub Actions to `.github/workflows/`
4. Create/update `.opencode/opencode.json`

## Manual Setup

### 1. Install the Plugin

```bash
bun add -d @activade/open-workflows
```

### 2. Create OpenCode Config

Create `.opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4-5",
  "small_model": "anthropic/claude-haiku-4-5",
  "plugin": ["@activade/open-workflows"],
  "permission": {
    "skill": {
      "pr-review": "allow",
      "issue-label": "allow",
      "doc-sync": "allow",
      "release-notes": "allow"
    }
  }
}
```

### 3. Add GitHub Secrets

```bash
gh secret set ANTHROPIC_API_KEY
```

For releases, also add:

```bash
gh secret set NPM_TOKEN
```

### 4. Install Skills

Copy skills from the package to your repo:

```bash
bunx open-workflows --skills
```

Or manually copy from `node_modules/@activade/open-workflows/skills/` to `.opencode/skill/`.

### 5. Install Workflows

```bash
bunx open-workflows --workflows
```

Or manually create workflow files in `.github/workflows/`.

## Customizing Skills

After installation, edit `.opencode/skill/*/SKILL.md` to customize behavior.

Example: Change review focus areas in `.opencode/skill/pr-review/SKILL.md`.

## Customizing Models

Override models in `opencode.json`:

```json
{
  "model": "openai/gpt-4o",
  "small_model": "openai/gpt-4o-mini"
}
```

## Verify Setup

1. Open a PR - the review workflow should run
2. Open an issue - the label workflow should run
3. Check Actions logs for any errors
