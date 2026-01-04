import { ENV_OPENCODE_AUTH, ENV_API_KEY } from './shared';

export const DOC_SYNC = (useOAuth: boolean) => `name: Doc Sync

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
          ref: \${{ github.head_ref }}
          fetch-depth: 0

      - uses: activadee/open-workflows/actions/doc-sync@main
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}${useOAuth ? ENV_OPENCODE_AUTH : ENV_API_KEY}
`;
