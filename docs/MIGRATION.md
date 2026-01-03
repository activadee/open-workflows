# Migrating from v2.x to v3.0

## Overview

v3.0 is a breaking change that moves from **Agents** to **Skills** as the primary pattern.

## Breaking Changes

### 1. Agents Removed

v3.0 uses Skills instead of agents. Skills are loaded on-demand via the native `skill` tool.

**Before (v2.x):**
```bash
bunx opencode-ai run --agent review "Review PR 123"
```

**After (v3.0):**
```bash
bunx opencode-ai run "Load the pr-review skill and review PR 123"
```

### 2. API Key Change

Default model changed from MiniMax to Claude.

**Before (v2.x):**
```yaml
env:
  MINIMAX_API_KEY: ${{ secrets.MINIMAX_API_KEY }}
```

**After (v3.0):**
```yaml
env:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### 3. Skills Installation Required

Skills must be installed to `.opencode/skill/`. Run the CLI:

```bash
bunx open-workflows
```

Or install skills only:

```bash
bunx open-workflows --skills
```

### 4. Tools Removed

| Removed Tool | Replacement |
|--------------|-------------|
| `commit_docs` | Use native `write` + `bash` tools (skill describes the workflow) |
| `setup_workflows` | Use CLI: `bunx open-workflows` |

### 5. Workflow YAML Changes

Workflows now load skills instead of invoking agents.

**Before:**
```yaml
- name: Review PR
  run: bunx opencode-ai run --agent review "Review PR ${{ github.event.pull_request.number }}"
```

**After:**
```yaml
- name: Review PR
  run: bunx opencode-ai run "Load the pr-review skill and review PR ${{ github.event.pull_request.number }}"
```

## Migration Steps

### Step 1: Update Secrets

Add the new API key:

```bash
gh secret set ANTHROPIC_API_KEY
```

### Step 2: Run Installer

```bash
bunx open-workflows
```

This will:
- Install skills to `.opencode/skill/`
- Update workflow files
- Update `opencode.json`

### Step 3: Remove Old Config

If you have custom agent configurations in `opencode.json`, remove them. The plugin no longer registers agents.

### Step 4: Update Custom Workflows

If you have custom GitHub Actions that use `--agent`, update them to load skills instead.

## New Features in v3.0

### Skills are Customizable

Edit `.opencode/skill/*/SKILL.md` to customize behavior. Skills are just markdown files with YAML frontmatter.

### Plugin Hooks

The plugin now includes lifecycle hooks:
- Temperature tuning for structured tasks
- Pre/post tool execution logging
- Event handling for errors

### Retry Logic

All tools now include retry with exponential backoff for transient failures.

### Abort Signal Support

Tools respect the abort signal for graceful cancellation.

## Rollback

To rollback to v2.x:

1. Pin the version in your workflow:
   ```yaml
   run: bunx @activadee-ai/open-workflows@2.3.0
   ```

2. Restore `MINIMAX_API_KEY` secret

3. Use `--agent` syntax in workflows

## Questions?

Open an issue: https://github.com/activadee/open-workflows/issues
