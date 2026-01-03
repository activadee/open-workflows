import { ENV_OPENCODE_AUTH, ENV_API_KEY, ENV_NPM_TOKEN } from './shared';

export const RELEASE = (useOAuth: boolean) => `name: Release

on:
  workflow_dispatch:

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: activadee/open-workflows/actions/release@main
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}${useOAuth ? ENV_OPENCODE_AUTH : ENV_API_KEY}${ENV_NPM_TOKEN}
`;
