import { CACHE_RESTORE_STEP, ENV_API_KEY, ENV_OAUTH } from './shared';

export const DOC_SYNC = (useOAuth: boolean) => `name: Doc Sync

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
${useOAuth ? CACHE_RESTORE_STEP : ''}
      - name: Configure Git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Sync Documentation
        run: bunx opencode-ai run --model anthropic/claude-haiku-4-5 "Load the doc-sync skill and sync documentation for PR \${{ github.event.pull_request.number }}"
        env:${useOAuth ? ENV_OAUTH : ENV_API_KEY}
`;
