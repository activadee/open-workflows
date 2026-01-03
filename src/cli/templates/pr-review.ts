import { CACHE_RESTORE_STEP, ENV_API_KEY, ENV_OAUTH } from './shared';

export const PR_REVIEW = (useOAuth: boolean) => `name: PR Review

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
${useOAuth ? CACHE_RESTORE_STEP : ''}
      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Review PR
        run: bunx opencode-ai run --model anthropic/claude-sonnet-4-5 "Load the pr-review skill and review PR \${{ github.event.pull_request.number }}"
        env:${useOAuth ? ENV_OAUTH : ENV_API_KEY}
`;
