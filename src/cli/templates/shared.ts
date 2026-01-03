export const ENV_OPENCODE_AUTH = `
          OPENCODE_AUTH: \${{ secrets.OPENCODE_AUTH }}`;

export const ENV_API_KEY = `
          ANTHROPIC_API_KEY: \${{ secrets.ANTHROPIC_API_KEY }}`;

export const CACHE_RESTORE_STEP = `
      - uses: actions/cache/restore@v4
        with:
          path: ~/.local/share/opencode/auth.json
          key: opencode-auth
`;
