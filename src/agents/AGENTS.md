# AGENTS DIRECTORY

Agent configurations for OpenCode plugin. Each agent = one GitHub automation workflow.

## STRUCTURE

```
agents/
├── index.ts        # Registers all agents via configureAgents()
├── review/         # PR code review agent
├── label/          # Issue auto-labeling agent
├── doc-sync/       # Documentation sync agent
└── release/        # Release notes generation agent
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add new agent | Create `{name}/index.ts` + `{name}/prompt.ts`, register in `index.ts` |
| Change agent behavior | `{name}/prompt.ts` - system prompt string |
| Change agent permissions | `{name}/index.ts` - `tools` object |
| Change agent model | `{name}/index.ts` - `model` field |

## PATTERN

Each agent directory contains exactly 2 files:

**index.ts**:
```typescript
export const {name}AgentConfig: AgentConfig = {
  description: '...',
  mode: 'primary',
  model: 'minimax/MiniMax-M2.1',
  prompt: {NAME}_PROMPT,
  permission: { external_directory: 'deny' },
  tools: { /* tool permissions */ }
};
```

**prompt.ts**:
```typescript
export const {NAME}_PROMPT = `...`;  // Multi-line system prompt
```

## AGENT-TOOL MAPPING

| Agent | Primary Tool | Invoked By |
|-------|-------------|------------|
| review | `submit_review` | PR opened/synced |
| label | `apply_labels` | Issue opened/edited |
| doc-sync | `commit_docs` | PR opened/synced |
| release | `bun_release`, `github_release` | Workflow_dispatch |
