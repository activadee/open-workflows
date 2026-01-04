# PROJECT KNOWLEDGE BASE

**Version:** 2.0.0
**Branch:** main

## OVERVIEW

GitHub automation workflows via composite actions. AI-powered reviews, labeling, and doc sync - plus automated releases with npm provenance.

## STRUCTURE

```
open-workflows/
├── actions/                    # Composite GitHub Actions
│   ├── pr-review/             # AI-powered
│   │   ├── action.yml
│   │   └── skill.md
│   ├── issue-label/           # AI-powered
│   │   ├── action.yml
│   │   └── skill.md
│   ├── doc-sync/              # AI-powered
│   │   ├── action.yml
│   │   └── skill.md
│   └── release/               # No AI - pure script
│       ├── action.yml
│       └── src/publish.ts
├── scripts/                    # OpenCode custom tools (copied to ~/.config/opencode/tool/)
│   ├── submit-review.ts       # PR review tool
│   └── apply-labels.ts        # Issue labeling tool
├── src/
│   └── cli/                   # Workflow installer CLI
│       ├── index.ts
│       ├── installer.ts
│       └── templates/
├── .github/workflows/         # Dogfooding workflows
└── README.md
```

## ACTIONS

| Action | AI | Description |
|--------|-----|-------------|
| `pr-review` | Yes | AI code review, posts sticky comment |
| `issue-label` | Yes | Auto-labels based on content |
| `doc-sync` | Yes | Syncs docs with code changes |
| `release` | No | Semantic versioning + npm publish with provenance |

## WHERE TO LOOK

| Task | Location |
|------|----------|
| AI action behavior | `actions/{name}/skill.md` |
| Action setup | `actions/{name}/action.yml` |
| OpenCode tools | `scripts/*.ts` |
| Release logic | `actions/release/src/publish.ts` |
| CLI | `src/cli/` |
| Workflow templates | `src/cli/templates/` |

## OPENCODE TOOLS

Tools in `scripts/` are copied to `~/.config/opencode/tool/` at runtime.

| Script | Purpose |
|--------|---------|
| `submit-review.ts` | Post/update sticky PR comment |
| `apply-labels.ts` | Create + apply labels |

## RELEASE SCRIPT

| Script | Purpose |
|--------|---------|
| `publish.ts` | Version bump, changelog, npm publish, GitHub release |

## CONVENTIONS

- **AI actions**: `action.yml` + `skill.md` (tools in `scripts/`)
- **Non-AI actions**: `action.yml` + `src/*.ts` (no skill.md)
- **Scripts**: Bun TypeScript, uses `Bun.$` for shell
- **Build**: Bun for CLI bundling

## ANTI-PATTERNS

- **No plugin exports**: Pure composite actions
- **No npm/yarn**: Bun only

## COMMANDS

```bash
bun run build      # Bundle CLI
bun run dev        # Build with watch
bun run typecheck  # tsc --noEmit
bun run test       # Run tests
```

## USER USAGE

**AI-powered actions:**
```yaml
- uses: activadee/open-workflows/actions/pr-review@main
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    OPENCODE_AUTH: ${{ secrets.OPENCODE_AUTH }}  # or ANTHROPIC_API_KEY
```

**Release action (no AI, OIDC publishing):**
```yaml
- uses: activadee/open-workflows/actions/release@main
  with:
    bump: patch  # or minor, major
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**CLI:**
```bash
bunx @activade/open-workflows
```
