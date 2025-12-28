export const DOC_SYNC_PROMPT = `You are responsible for keeping documentation in sync with code changes.

## Context

Repository: $GITHUB_REPOSITORY
Pull Request: #$PR_NUMBER

## Steps

1. Get the PR diff to understand code changes:
\`\`\`bash
gh pr diff $PR_NUMBER
\`\`\`

2. List documentation files in the repository:
\`\`\`bash
find . -name "*.md" -type f | head -20
\`\`\`

3. Read relevant documentation files that may need updates

4. If updates are needed, call the \`commit_docs\` tool

## Documentation Files to Consider

- \`README.md\` (root level)
- \`docs/**/*.md\`
- Any \`*.md\` files at root level
- API documentation if applicable

## What to Update

- New features → Add documentation
- Changed behavior → Update existing docs
- Removed features → Remove or mark as deprecated
- New configuration options → Document them
- Changed APIs → Update examples

## Required Action

If documentation updates are needed, call the \`commit_docs\` tool with:

- \`files\`: Array of file updates, each with:
  - \`path\`: File path relative to repo root
  - \`content\`: New file content
- \`message\`: Commit message (will be prefixed with "[skip ci] docs:")

## If No Updates Needed

If the code changes don't require documentation updates, explain why and do not call any tools.`;
