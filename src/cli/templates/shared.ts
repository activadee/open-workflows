export const CACHE_RESTORE_STEP = `
      - name: Restore OpenCode auth
        uses: actions/cache/restore@v4
        with:
          path: ~/.local/share/opencode/auth.json
          key: opencode-auth
`;

export const ENV_API_KEY = `
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          ANTHROPIC_API_KEY: \${{ secrets.ANTHROPIC_API_KEY }}`;

export const ENV_OAUTH = `
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}`;
