# Setup Guide

This guide walks you through setting up `@activadee-ai/open-workflows` in your repository.

## Prerequisites

- GitHub repository with Actions enabled
- OpenCode CLI (installed in CI by the workflow files)
- A model provider API key (default: MiniMax)

## 1) Install the plugin (Bun)

```bash
bun add -d @activadee-ai/open-workflows
```

## 2) Configure OpenCode

Create `opencode.json` at your repo root:

```json
{
  "plugin": ["@activadee-ai/open-workflows"]
}
```

Optional: override the model per-agent in `opencode.json`.

## 3) Add GitHub Secrets

Add your API key as a GitHub Actions secret:

```bash
gh secret set MINIMAX_API_KEY -b"your-key"
```

## 4) Install workflow files

### Option A: CLI Installer (recommended)

Run the interactive installer to select and configure workflows:

```bash
npx open-workflows
```

The CLI will:
1. Prompt you to select which workflows to install
2. Create the workflow files in `.github/workflows/`
3. Create or update `.opencode/opencode.json` with the plugin configuration

### Option B: Ask OpenCode to install

In an OpenCode session, ask:

```
Set up PR review and issue labeling workflows
```

OpenCode will use the `setup_workflows` tool (from this plugin) to generate the `.github/workflows/*.yml` files.

### Option C: Copy examples

If you prefer manual setup, copy the examples from `examples/README.md` into your repository.

## 5) Verify

- Open a PR → the PR review workflow should run
- Open or edit an issue → the issue labeling workflow should run

If something fails, check the Actions logs and confirm the `MINIMAX_API_KEY` secret is set.
