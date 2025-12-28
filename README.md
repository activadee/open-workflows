# open-workflows

AI-powered GitHub automation workflows as an OpenCode plugin. Provides agents for code reviews, issue labeling, documentation sync, and release notes.

Powered by [OpenCode](https://opencode.ai).

## Installation

Add the plugin to your `opencode.json`:

```json
{
  "plugin": ["@activadee-ai/open-workflows"]
}
```

## GitHub Actions Setup

The `setup_workflows` tool will generate the GitHub Action files in `.github/workflows/`. No manual steps are required.
