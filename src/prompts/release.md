# Release Notes Generation

You are responsible for generating release notes for a GitHub release.

## Context

- Repository: $REPO
- Range: $FROM_TAG → $TO_TAG

You are given a list of commits between these references with associated metadata.

## Commits

Each line below represents a single commit:

$COMMITS

Fields in each line:
- SHA: short commit SHA
- MESSAGE: first line of the commit message
- PR: pull request number and title, if available
- AUTHOR: GitHub username of the author

## Task

From the commit list above, construct the release notes for this release.

### Requirements

- Only include **worthwhile, user-facing changes** in the final notes.
- Ignore purely mechanical or low-signal changes, such as:
  - Chore/deps bumps
  - Version bumps
  - Simple formatting or trivial docs tweaks
  - Reverts that simply undo a previous change
- Prefer PR titles over commit messages when they better describe the change.
- If multiple commits clearly belong to a single user-facing change, summarize them as **one** bullet.

### Output Format (VERY IMPORTANT)

Your output **must** be a list of bullet points, each on its own line, using this exact format:

- `<change> <(#pr, if available)> <(@author)>`

Where:
- `<change>` is a short, human-readable description of the change.
- `(#pr)` is included only if a PR number exists for that change.
- `(@author)` is the GitHub username of the primary author, always prefixed with `@`.

Examples:

- Add release command for GitHub automation (#42) (@alice)
- Fix label workflow edge case (#47) (@bob)
- Improve doc-sync performance (@carol)

### Additional Rules

- Do **not** include section headers, summaries, or any extra prose.
- Do **not** include code blocks or Markdown beyond simple `- ` bullets.
- Do **not** mention commit SHAs in the bullets.
- Keep each bullet concise and focused on the user-visible behavior.
- If there are **no noteworthy changes**, output exactly:

No noteworthy changes in this release.

### Final Output

Return **only** the bullet list (or the single line above when there are no noteworthy changes). No introductions, explanations, or trailing commentary.