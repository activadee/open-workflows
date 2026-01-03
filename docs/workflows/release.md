# Release Workflow

The `release-notes` skill automates version bumps, npm publishing, and GitHub releases.

## Overview

When triggered manually:
1. Analyzes commits since last tag
2. Determines semantic version bump (major/minor/patch)
3. Generates release notes with authors and references
4. Publishes to npm using `bun_release` tool
5. Creates GitHub release using `github_release` tool

## Installation

```bash
bunx open-workflows
```

Select "Release" when prompted.

## Workflow File

`.github/workflows/release.yml`:

```yaml
name: Release

on:
  workflow_dispatch:

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0

      - name: Configure Git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Setup npm auth
        run: echo "//registry.npmjs.org/:_authToken=${{ secrets.NPM_TOKEN }}" > ~/.npmrc

      - name: Create Release
        run: bunx opencode-ai run "Load the release-notes skill and create a new release"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes | GitHub authentication (automatic) |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key |
| `NPM_TOKEN` | Yes | npm publish token |

## Version Determination

Based on conventional commits:

| Pattern | Bump |
|---------|------|
| `BREAKING CHANGE`, `feat!:`, `fix!:` | Major |
| `feat:` | Minor |
| `fix:`, `chore:`, `docs:`, etc. | Patch |

## Release Notes Format

```
<description> [#<issue>] [#<pr>] @<author>
```

Example:
```
- Add retry logic to GitHub API calls #42 @alice
- Fix label creation for special characters #38 @bob
```

## Creating a Release

1. Go to Actions tab in GitHub
2. Select "Release" workflow
3. Click "Run workflow"
4. AI determines version and creates release

## Customizing

Edit `.opencode/skill/release-notes/SKILL.md` to:
- Change version determination rules
- Modify release note format
- Add exclusion patterns
