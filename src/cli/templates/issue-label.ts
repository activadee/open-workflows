import { CACHE_RESTORE_STEP, ENV_API_KEY, ENV_OAUTH } from './shared';

export const ISSUE_LABEL = (useOAuth: boolean) => `name: Issue Label

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
${useOAuth ? CACHE_RESTORE_STEP : ''}
      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Label Issue
        run: bunx opencode-ai run --model anthropic/claude-haiku-4-5 "Load the issue-label skill and label issue \${{ github.event.issue.number }}"
        env:${useOAuth ? ENV_OAUTH : ENV_API_KEY}
`;
