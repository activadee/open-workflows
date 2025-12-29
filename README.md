# open-workflows

AI-powered GitHub automation workflows as an OpenCode plugin. Provides agents for code reviews, issue labeling, documentation sync, and release notes.

Powered by [OpenCode](https://opencode.ai).

## Quick Start (CLI)

Install the CLI and run the interactive installer:

```bash
bun add -d @activadee-ai/open-workflows
npx open-workflows
```

The CLI will prompt you to select which workflows to install and automatically sets up the configuration.

### CLI Flags

- `--version`, `-v` - Display version information
- `--help`, `-h` - Display usage instructions

## Plugin Installation

Add the plugin to your `opencode.json`:

```json
{
  "plugin": ["@activadee-ai/open-workflows"]
}
```

## Available Workflows

- **PR Review** - AI-powered code reviews on pull requests
- **Issue Label** - Auto-label issues based on content
- **Doc Sync** - Keep documentation in sync with code changes
- **Release** - Generate release notes and publish to npm/GitHub

## GitHub Actions Setup

The `setup_workflows` tool will generate the GitHub Action files in `.github/workflows/`. No manual steps are required.
