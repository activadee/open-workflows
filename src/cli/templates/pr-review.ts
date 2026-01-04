import { ENV_OPENCODE_AUTH, ENV_API_KEY } from './shared';

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

      - uses: activadee/open-workflows/actions/pr-review@main
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}${useOAuth ? ENV_OPENCODE_AUTH : ENV_API_KEY}
`;
