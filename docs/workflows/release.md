# Release Workflow

The `release` agent automatically determines the next version, generates release notes, and creates GitHub releases.

## Overview

When triggered, this workflow:
1. Checks out the repository with full git history
2. Analyzes commits since the last tag to determine version bump (major/minor/patch)
3. Generates release notes summarizing changes with author and PR/issue references
4. Updates package.json version and commits the change
5. Creates a GitHub release with the generated notes

## Usage

Create `.github/workflows/release.yml`:

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

      - name: Create Release
        run: bunx opencode-ai run --agent release "Create a new release for ${{ github.repository }}"
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

The release workflow:
- Triggers manually via GitHub Actions UI (workflow_dispatch)
- Fetches full git history to analyze changes since last release
- Determines semantic version bump automatically:
  - `BREAKING CHANGE` / `feat!` / `fix!` → **major** version
  - `feat:` → **minor** version
  - `fix:`, `chore:`, etc. → **patch** version
- Generates release notes including author (@username), issue refs (#123), and PR numbers (#456)
- Updates package.json version and commits the change
- Creates a GitHub release with the generated notes
- Requires the `gh` CLI tool (available in GitHub Actions by default)

## How It Works

1. When you trigger the workflow manually via GitHub Actions UI
2. OpenCode reads the current version from package.json
3. It finds the last git tag and analyzes commits since then
4. Based on commit messages, it determines the version bump (major/minor/patch)
5. The release agent generates release notes with author and PR/issue references
6. It updates package.json, commits, and pushes the version bump
7. Finally, it creates a GitHub release with the generated notes

## Creating a Release

To trigger the release workflow:

1. Go to your repository's Actions tab
2. Select the "Release" workflow
3. Click "Run workflow"
4. The agent will determine the version bump and create the release

The workflow will:
- Analyze commits since the last tag
- Determine version (major/minor/patch based on conventional commits)
- Update package.json version
- Create a GitHub release with generated notes
