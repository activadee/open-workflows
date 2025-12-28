export const WORKFLOWS = {
  'pr-review': `name: PR Review

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
        run: bunx opencode-ai run --agent review "Review PR \${{ github.event.pull_request.number }}"
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          MINIMAX_API_KEY: \${{ secrets.MINIMAX_API_KEY }}
          COMMIT_SHA: \${{ github.event.pull_request.head.sha }}
`,
  'issue-label': `name: Issue Label

on:
  issues:
    types: [opened, edited]

jobs:
  label:
    runs-on: ubuntu-latest
    permissions:
      issues: write
    steps:
      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Label Issue
        run: bunx opencode-ai run --agent label "Label issue \${{ github.event.issue.number }}"
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          MINIMAX_API_KEY: \${{ secrets.MINIMAX_API_KEY }}
`,
  'doc-sync': `name: Doc Sync

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  sync:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v6
        with:
          ref: \${{ github.head_ref }}

      - name: Configure Git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Sync Documentation
        run: bunx opencode-ai run --agent doc-sync "Sync documentation for PR \${{ github.event.pull_request.number }}"
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          MINIMAX_API_KEY: \${{ secrets.MINIMAX_API_KEY }}
          COMMIT_SHA: \${{ github.event.pull_request.head.sha }}
`,
  'release': `name: Release

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
          PREV=\$(git describe --tags --abbrev=0 \${{ github.event.release.tag_name }}^ 2>/dev/null || echo "")
          echo "tag=\$PREV" >> \$GITHUB_OUTPUT

      - name: Generate Release Notes
        id: notes
        run: |
          NOTES=\$(bunx opencode-ai run --agent release "Generate release notes for \${{ github.event.release.tag_name }}" 2>&1)
          echo "notes<<EOF" >> \$GITHUB_OUTPUT
          echo "\$NOTES" >> \$GITHUB_OUTPUT
          echo "EOF" >> \$GITHUB_OUTPUT
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          MINIMAX_API_KEY: \${{ secrets.MINIMAX_API_KEY }}

      - name: Update Release Body
        run: gh release edit \${{ github.event.release.tag_name }} --notes "\${{ steps.notes.outputs.notes }}"
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`,
} as const;
