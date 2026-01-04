import { ENV_OPENCODE_AUTH, ENV_API_KEY } from './shared';

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

      - uses: activadee/open-workflows/actions/issue-label@main
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}${useOAuth ? ENV_OPENCODE_AUTH : ENV_API_KEY}
`;
