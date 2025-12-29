# TOOLS DIRECTORY

Tool implementations for OpenCode plugin. Each tool = one GitHub API action.

## STRUCTURE

```
tools/
├── index.ts           # Exports all tools as { tool_name: ToolDefinition }
├── apply-labels/      # Label GitHub issues
├── bun-release/       # Bump version, push tags, publish to npm
├── commit-docs/       # Commit doc changes to PR branch
├── github-release/    # Create GitHub releases
├── setup-workflows/   # Install GitHub Actions workflows
└── submit-review/     # Post review comments on PRs
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add new tool | Create `{name}/index.ts` + `{name}/schema.ts`, register in `index.ts` |
| Change tool behavior | `{name}/index.ts` - `execute()` function |
| Change tool schema | `{name}/schema.ts` - Zod schema definition |
| Add workflow template | `setup-workflows/templates.ts` - WORKFLOWS object |

## PATTERN

Each tool directory contains 2+ files:

**schema.ts**:
```typescript
import { z } from 'zod/v4';
export const {Name}Schema = z.object({ /* fields */ });
```

**index.ts**:
```typescript
import { tool } from '@opencode-ai/plugin/tool';
import { {Name}Schema } from './schema';

export const {name}Tool: ToolDefinition = tool({
  description: '...',
  args: {Name}Schema.shape,
  async execute(args) { /* implementation */ }
});
```

## TOOL DETAILS

| Tool | Purpose | Uses |
|------|---------|------|
| `submit_review` | Post/update sticky PR comment | `Bun.$` + gh CLI |
| `apply_labels` | Label issues, create new labels | `Bun.$` + gh CLI |
| `commit_docs` | Write files + commit to PR branch | `Bun.$` + git/gh |
| `setup_workflows` | Install workflow YAML files | Node fs (sync) |
| `github_release` | Create GitHub releases with notes | `Bun.$` + gh CLI |
| `bun_release` | Bump version, push tags, publish to npm | `Bun.$` + bun/npm |

## UNIQUE: setup-workflows

Has additional files:
- `installer.ts` - `installWorkflows()` + `createOpencodeConfig()`
- `templates.ts` - WORKFLOWS object with escaped YAML strings
