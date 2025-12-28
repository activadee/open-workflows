# PROJECT KNOWLEDGE BASE

**Generated:** 2025-12-29
**Commit:** cf9e3a3
**Branch:** main

## OVERVIEW

OpenCode plugin providing AI-powered GitHub automation workflows: PR reviews, issue labeling, documentation sync, and release notes generation. Uses Bun runtime + TypeScript.

## STRUCTURE

```
open-workflows/
├── src/
│   ├── index.ts        # Plugin export (configureAgents + tools)
│   ├── cli/            # Interactive installer (bunx open-workflows)
│   ├── agents/         # Agent configs: review, label, doc-sync, release
│   └── tools/          # Tool implementations: submit_review, apply_labels, commit_docs, setup_workflows
├── .github/workflows/  # GitHub Actions that invoke opencode-ai agents
├── docs/               # User-facing workflow documentation
└── test/               # Plugin export validation tests
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new agent | `src/agents/{name}/` | Create `index.ts` (AgentConfig) + `prompt.ts`, register in `src/agents/index.ts` |
| Add new tool | `src/tools/{name}/` | Create `index.ts` (ToolDefinition) + `schema.ts` (Zod), register in `src/tools/index.ts` |
| Modify agent prompt | `src/agents/{name}/prompt.ts` | Single exported const string |
| Add workflow template | `src/tools/setup-workflows/templates.ts` | Add to WORKFLOWS object |
| CLI changes | `src/cli/index.ts` | Uses @clack/prompts for interactive UI |
| Test plugin exports | `test/plugin.test.js` | bun:test framework |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `plugin` | Function | `src/index.ts` | Main export, returns { config, tool } |
| `configureAgents` | Function | `src/agents/index.ts` | Registers all agent configs |
| `tools` | Object | `src/tools/index.ts` | Exports all tool definitions |
| `AgentConfig` | Type | `@opencode-ai/sdk` | Agent definition shape |
| `ToolDefinition` | Type | `@opencode-ai/plugin/tool` | Tool definition shape |

### Module Dependencies

```
src/index.ts
├── src/agents/index.ts ──> src/agents/*/index.ts (AgentConfig)
│                              └── src/agents/*/prompt.ts (PROMPT string)
└── src/tools/index.ts ──> src/tools/*/index.ts (ToolDefinition)
                              └── src/tools/*/schema.ts (Zod schema)
```

## CONVENTIONS

- **Agent pattern**: `index.ts` exports `{name}AgentConfig: AgentConfig`, `prompt.ts` exports `{NAME}_PROMPT: string`
- **Tool pattern**: `index.ts` exports `{name}Tool: ToolDefinition` via `tool()` wrapper, `schema.ts` exports `{Name}Schema` (Zod)
- **Zod version**: Uses zod ~4.1.8 (v4 API)
- **Build**: Bun for bundling + tsc for declarations only (no tsc compilation)
- **Runtime**: Bun shell (`Bun.$\`...\``) for subprocess execution in tools
- **Permissions**: Agents explicitly declare tool permissions in config

## ANTI-PATTERNS (THIS PROJECT)

- **No npm/yarn**: Bun only. Use `bun run`, `bun add`, `bunx`
- **No tsc build**: tsc only emits declarations, Bun does actual build
- **No direct gh CLI in agents**: Agents use tools that wrap gh commands
- **No inline schemas**: Zod schemas live in separate `schema.ts` files

## UNIQUE STYLES

- **Model**: Agents use `minimax/MiniMax-M2.1` model
- **Sticky comments**: Review tool uses HTML comment marker for idempotent updates
- **Workflow templates**: YAML strings with escaped `\${{ }}` for GitHub Actions vars

## COMMANDS

```bash
bun run build      # Clean + bundle + emit declarations
bun run dev        # Build with watch
bun run typecheck  # tsc --noEmit
bun run test       # Build then bun test
```

## NOTES

- CLI shebang: `#!/usr/bin/env bun` - requires Bun installed
- GitHub Actions require `MINIMAX_API_KEY` secret
- Tools use `Bun.$` shell for gh CLI calls (Bun-specific API)
- Plugin installed in target repos via `@activadee-ai/open-workflows@latest` in `.opencode/opencode.json`
