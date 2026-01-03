# Example GitHub Actions Workflows

These examples show how to use `@activade/open-workflows` composite actions in your repository.

## Prerequisites

For AI-powered actions (pr-review, issue-label, doc-sync), add your API key:

```bash
gh secret set ANTHROPIC_API_KEY
```

Or if using Claude Max subscription:

```bash
cat ~/.local/share/opencode/auth.json | base64 | gh secret set OPENCODE_AUTH
```

## PR Review

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

      - uses: activadee/open-workflows/actions/pr-review@main
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Issue Labeling

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

      - uses: activadee/open-workflows/actions/issue-label@main
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Doc Sync

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
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.head_ref }}
          fetch-depth: 0

      - uses: activadee/open-workflows/actions/doc-sync@main
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Release (No AI required)

The release action doesn't use AI - it generates changelogs from git commits and publishes with npm provenance.

`.github/workflows/release.yml`:

```yaml
name: Release

on:
  workflow_dispatch:
    inputs:
      bump:
        description: 'Version bump type'
        required: true
        type: choice
        options:
          - patch
          - minor
          - major
      version:
        description: 'Override version (optional)'
        required: false
        type: string

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: activadee/open-workflows/actions/release@main
        with:
          bump: ${{ inputs.bump }}
          version: ${{ inputs.version }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

No NPM_TOKEN needed - uses OIDC trusted publishing with provenance.

Trigger with:
```bash
gh workflow run release -f bump=patch
```

## Using Claude Max (OAuth)

Replace `ANTHROPIC_API_KEY` with `OPENCODE_AUTH` in AI-powered workflows:

```yaml
- uses: activadee/open-workflows/actions/pr-review@main
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    OPENCODE_AUTH: ${{ secrets.OPENCODE_AUTH }}
```
