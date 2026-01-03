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
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Review PR
        run: bunx opencode-ai run "Load the pr-review skill and review PR \${{ github.event.pull_request.number }}"
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          ANTHROPIC_API_KEY: \${{ secrets.ANTHROPIC_API_KEY }}
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
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Label Issue
        run: bunx opencode-ai run "Load the issue-label skill and label issue \${{ github.event.issue.number }}"
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          ANTHROPIC_API_KEY: \${{ secrets.ANTHROPIC_API_KEY }}
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
      - uses: actions/checkout@v4
        with:
          ref: \${{ github.head_ref }}

      - name: Configure Git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Sync Documentation
        run: bunx opencode-ai run "Load the doc-sync skill and sync documentation for PR \${{ github.event.pull_request.number }}"
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          ANTHROPIC_API_KEY: \${{ secrets.ANTHROPIC_API_KEY }}
`,
  release: `name: Release

on:
  workflow_dispatch:

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Configure Git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Setup npm auth
        run: echo "//registry.npmjs.org/:_authToken=\${{ secrets.NPM_TOKEN }}" > ~/.npmrc

      - name: Create Release
        run: bunx opencode-ai run "Load the release-notes skill and create a new release"
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          ANTHROPIC_API_KEY: \${{ secrets.ANTHROPIC_API_KEY }}
`,
} as const;

export type WorkflowType = 'review' | 'label' | 'doc-sync' | 'release';

export const WORKFLOW_FILE_MAP: Record<WorkflowType, keyof typeof WORKFLOWS> = {
  review: 'pr-review',
  label: 'issue-label',
  'doc-sync': 'doc-sync',
  release: 'release',
};
