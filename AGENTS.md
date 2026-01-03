# PROJECT KNOWLEDGE BASE

**Version:** 0.0.1
**Branch:** main

## OVERVIEW

OpenCode plugin providing AI-powered GitHub automation workflows via **Skills**: PR reviews, issue labeling, documentation sync, and release notes generation. Uses Bun runtime + TypeScript.

## STRUCTURE

```
open-workflows/
├── src/
│   ├── index.ts        # Plugin export (tools + hooks)
│   ├── cli/            # Interactive installer
│   │   ├── index.ts    # CLI entry point
│   │   ├── installer.ts # Installation logic
│   │   └── templates/  # Workflow YAML templates
│   │       ├── index.ts
│   │       ├── shared.ts
│   │       ├── auth.ts
│   │       ├── pr-review.ts
│   │       ├── issue-label.ts
│   │       ├── doc-sync.ts
│   │       └── release.ts
│   ├── skills/         # Embedded skill content
│   │   ├── index.ts    # Re-exports SKILLS object
│   │   ├── pr-review.ts
│   │   ├── issue-label.ts
│   │   ├── doc-sync.ts
│   │   └── release-notes.ts
│   └── tools/          # Tool implementations
│       ├── submit-review/
│       ├── apply-labels/
│       ├── github-release/
│       ├── bun-release/
│       └── utils/retry.ts
├── .github/workflows/  # GitHub Actions
├── docs/               # User documentation
└── test/               # Plugin tests
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new tool | `src/tools/{name}/` | Create `index.ts` + `schema.ts`, register in `src/tools/index.ts` |
| Add new skill | `src/skills/{name}.ts` | Export skill content, add to `src/skills/index.ts` |
| Modify plugin hooks | `src/index.ts` | Event, chat.params, tool.execute hooks |
| CLI changes | `src/cli/index.ts` | Uses @clack/prompts for UI |
| Workflow templates | `src/cli/templates/{name}.ts` | Function returning YAML, uses shared.ts |
| Test plugin exports | `test/plugin.test.js` | bun:test framework |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `plugin` | Function | `src/index.ts` | Main export, returns tools + hooks |
| `tools` | Object | `src/tools/index.ts` | Exports all tool definitions |
| `withRetry` | Function | `src/tools/utils/retry.ts` | Retry with exponential backoff |
| `installSkills` | Function | `src/cli/installer.ts` | Copies skills to target repo |
| `installWorkflows` | Function | `src/cli/installer.ts` | Creates workflow YAML files |

## TOOLS (4)

| Tool | Purpose | Uses |
|------|---------|------|
| `submit_review` | Post/update sticky PR comment | `gh api` + retry |
| `apply_labels` | Label issues, create new labels | `gh label`, `gh issue edit` |
| `github_release` | Create GitHub releases | `gh release create` |
| `bun_release` | Version bump, push, npm publish | `bun pm version`, `bun publish` |

## SKILLS (4)

| Skill | Trigger | Tools Used |
|-------|---------|------------|
| `pr-review` | pull_request | `submit_review` |
| `issue-label` | issues | `apply_labels` |
| `doc-sync` | pull_request | Native `write`, `bash` |
| `release-notes` | workflow_dispatch | `bun_release`, `github_release` |

## CONVENTIONS

- **Skill pattern**: `src/skills/{name}.ts` exporting skill markdown string
- **Tool pattern**: `index.ts` exports via `tool()` wrapper, `schema.ts` exports Zod schema
- **Zod version**: ~4.1.8 (v4 API)
- **Build**: Bun for bundling + tsc for declarations
- **Runtime**: Bun shell (`Bun.$`) for subprocess execution

## ANTI-PATTERNS

- **No npm/yarn**: Bun only
- **No tsc build**: tsc only emits declarations
- **No inline schemas**: Zod schemas in separate files

## COMMANDS

```bash
bun run build      # Clean + bundle + declarations
bun run dev        # Build with watch
bun run typecheck  # tsc --noEmit
bun run test       # Build then bun test
```
