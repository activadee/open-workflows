# PROJECT KNOWLEDGE BASE

**Version:** 2.0.0
**Branch:** main

## OVERVIEW

AI-powered GitHub automation workflows via composite actions. Provides PR reviews, issue labeling, documentation sync, and release automation. Uses Bun runtime + TypeScript.

## STRUCTURE

```
open-workflows/
├── actions/                    # Composite GitHub Actions
│   ├── pr-review/
│   │   ├── action.yml         # Action definition
│   │   ├── skill.md           # AI instructions
│   │   └── src/
│   │       └── submit-review.ts
│   ├── issue-label/
│   │   ├── action.yml
│   │   ├── skill.md
│   │   └── src/
│   │       └── apply-labels.ts
│   ├── doc-sync/
│   │   ├── action.yml
│   │   └── skill.md
│   └── release/
│       ├── action.yml
│       ├── skill.md
│       └── src/
│           ├── bun-release.ts
│           └── github-release.ts
├── src/
│   └── cli/                   # Workflow installer CLI
│       ├── index.ts
│       ├── installer.ts
│       └── templates/
├── .github/workflows/         # Dogfooding workflows
└── README.md
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Modify action behavior | `actions/{name}/skill.md` | AI instructions |
| Change action setup | `actions/{name}/action.yml` | GitHub Action config |
| Modify helper scripts | `actions/{name}/src/*.ts` | Bun TypeScript scripts |
| CLI changes | `src/cli/` | Workflow installer |
| Workflow templates | `src/cli/templates/` | YAML generators |

## ACTIONS (4)

| Action | Trigger | Description |
|--------|---------|-------------|
| `pr-review` | pull_request | AI code review, posts sticky comment |
| `issue-label` | issues | Auto-labels based on content |
| `doc-sync` | pull_request | Syncs docs with code changes |
| `release` | workflow_dispatch | Semantic versioning + npm publish |

## HELPER SCRIPTS

| Script | Location | Purpose |
|--------|----------|---------|
| `submit-review.ts` | `actions/pr-review/src/` | Post/update sticky PR comment |
| `apply-labels.ts` | `actions/issue-label/src/` | Create + apply labels |
| `bun-release.ts` | `actions/release/src/` | Version bump + npm publish |
| `github-release.ts` | `actions/release/src/` | Create GitHub release |

## CONVENTIONS

- **Action pattern**: `action.yml` + `skill.md` + optional `src/*.ts`
- **Skills**: Markdown files with AI instructions
- **Scripts**: Bun TypeScript, called via `bun <script> --args`
- **Build**: Bun for CLI bundling

## ANTI-PATTERNS

- **No npm/yarn**: Bun only
- **No plugin exports**: This is not an OpenCode plugin anymore
- **No local skills**: Skills are bundled with actions

## COMMANDS

```bash
bun run build      # Bundle CLI
bun run dev        # Build with watch
bun run typecheck  # tsc --noEmit
bun run test       # Run tests
```

## USER USAGE

```yaml
# In user's workflow
- uses: activadee/open-workflows/actions/pr-review@main
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    OPENCODE_AUTH: ${{ secrets.OPENCODE_AUTH }}  # or ANTHROPIC_API_KEY
```

Or via CLI:
```bash
bunx @activade/open-workflows
```
