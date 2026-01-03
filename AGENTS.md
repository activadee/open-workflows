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
│   │   ├── skill.md
│   │   └── src/submit-review.ts
│   ├── issue-label/           # AI-powered
│   │   ├── action.yml
│   │   ├── skill.md
│   │   └── src/apply-labels.ts
│   ├── doc-sync/              # AI-powered
│   │   ├── action.yml
│   │   └── skill.md
│   └── release/               # No AI - pure script
│       ├── action.yml
│       └── src/publish.ts
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
| Helper scripts | `actions/{name}/src/*.ts` |
| Release logic | `actions/release/src/publish.ts` |
| CLI | `src/cli/` |
| Workflow templates | `src/cli/templates/` |

## HELPER SCRIPTS

| Script | Purpose |
|--------|---------|
| `submit-review.ts` | Post/update sticky PR comment |
| `apply-labels.ts` | Create + apply labels |
| `publish.ts` | Version bump, changelog, npm publish, GitHub release |

## CONVENTIONS

- **AI actions**: `action.yml` + `skill.md` + optional `src/*.ts`
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
