# Release Workflow

The `release` agent automatically generates release notes when a GitHub release is created.

## Overview

When a new release is published, this workflow:
1. Checks out the repository with full git history
2. Gets the previous tag for comparison
3. Runs the OpenCode release agent to generate release notes
4. Updates the release body with the generated notes

## Usage

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  release:
    types: [created]

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Get previous tag
        id: prev_tag
        run: |
          PREV=$(git describe --tags --abbrev=0 ${{ github.event.release.tag_name }}^ 2>/dev/null || echo "")
          echo "tag=$PREV" >> $GITHUB_OUTPUT

      - name: Generate Release Notes
        id: notes
        run: |
          NOTES=$(bunx opencode-ai run --agent release "Generate release notes for ${{ github.event.release.tag_name }}" 2>&1)
          echo "notes<<EOF" >> $GITHUB_OUTPUT
          echo "$NOTES" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          MINIMAX_API_KEY: ${{ secrets.MINIMAX_API_KEY }}

      - name: Update Release Body
        run: gh release edit ${{ github.event.release.tag_name }} --notes "${{ steps.notes.outputs.notes }}"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes | GitHub authentication token |
| `MINIMAX_API_KEY` | Yes | MiniMax API key for AI |

## Behavior

The release workflow:
- Triggers automatically when a release is published
- Fetches full git history to analyze changes since last release
- Generates release notes summarizing new features, fixes, and changes
- Updates the release description with AI-generated notes
- Requires the `gh` CLI tool (available in GitHub Actions by default)

## How It Works

1. When you create a GitHub release, the workflow triggers
2. It determines the previous git tag for comparison
3. OpenCode analyzes commits, PRs, and changes since the last release
4. The release agent generates comprehensive release notes
5. The workflow updates the release body with the generated notes

## Creating a Release

To trigger the release workflow:

1. Push a tag to GitHub:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. Or create a release in the GitHub UI:
   - Go to your repository's Releases page
   - Click "Draft a new release"
   - Choose a tag and release title
   - Click "Publish release"

The workflow will automatically generate and attach release notes to your release.
