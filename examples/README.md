# Example GitHub Actions Workflows

These are minimal examples showing how to use the `@activadee-ai/open-workflows` **OpenCode plugin** in your repository.

## Prerequisites

1. Add the plugin to your `opencode.json`:

```json
{
  "plugin": ["@activadee-ai/open-workflows"]
}
```

1. Add your model provider key (default: Anthropic) as a GitHub Actions secret:

```bash
gh secret set MINIMAX_API_KEY -b"your-key"
```

## PR Review

Create `.github/workflows/pr-review.yml`:

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

      - uses: oven-sh/setup-bun@v2

      - name: Install OpenCode
        run: bun add -g opencode-ai

      - name: Review PR
        run: opencode run --agent review "Review PR ${{ github.event.pull_request.number }}"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          MINIMAX_API_KEY: ${{ secrets.MINIMAX_API_KEY }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
          COMMIT_SHA: ${{ github.event.pull_request.head.sha }}
```

## Issue Labeling

Create `.github/workflows/issue-label.yml`:

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

      - uses: oven-sh/setup-bun@v2

      - name: Install OpenCode
        run: bun add -g opencode-ai

      - name: Label Issue
        run: opencode run --agent label "Label issue ${{ github.event.issue.number }}"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          MINIMAX_API_KEY: ${{ secrets.MINIMAX_API_KEY }}
          ISSUE_NUMBER: ${{ github.event.issue.number }}
```

## Doc Sync

Create `.github/workflows/doc-sync.yml`:

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
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.head_ref }}

      - name: Configure Git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

      - uses: oven-sh/setup-bun@v2

      - name: Install OpenCode
        run: bun add -g opencode-ai

      - name: Sync Documentation
        run: opencode run --agent doc-sync "Sync documentation for PR ${{ github.event.pull_request.number }}"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          MINIMAX_API_KEY: ${{ secrets.MINIMAX_API_KEY }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
```

## Release Notes

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
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: oven-sh/setup-bun@v2

      - name: Install OpenCode
        run: bun add -g opencode-ai

      - name: Get previous tag
        id: prev_tag
        run: |
          PREV=$(git describe --tags --abbrev=0 ${{ github.event.release.tag_name }}^ 2>/dev/null || echo "")
          echo "tag=$PREV" >> $GITHUB_OUTPUT

      - name: Generate Release Notes
        id: notes
        run: |
          NOTES=$(opencode run --agent release "Generate release notes for ${{ github.event.release.tag_name }}" 2>&1)
          echo "notes<<EOF" >> $GITHUB_OUTPUT
          echo "$NOTES" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          MINIMAX_API_KEY: ${{ secrets.MINIMAX_API_KEY }}
          RELEASE_TAG: ${{ github.event.release.tag_name }}
          PREVIOUS_TAG: ${{ steps.prev_tag.outputs.tag }}

      - name: Update Release Body
        run: gh release edit ${{ github.event.release.tag_name }} --notes "${{ steps.notes.outputs.notes }}"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
