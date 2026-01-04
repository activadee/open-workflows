---
name: issue-label
description: Automatically apply appropriate labels to GitHub issues based on content analysis.
license: MIT
---

## What I Do

Analyze GitHub issue content and apply up to 3 appropriate labels to help maintainers triage and search issues effectively.

## Workflow

1. **Fetch issue details**: Get title, body, and existing labels
   ```bash
   gh issue view <number> --json title,body,labels
   ```

2. **Fetch repository labels**: List available labels
   ```bash
   gh label list --json name,description,color
   ```

3. **Analyze the issue**:
   - Determine the main type: bug, feature, documentation, question, etc.
   - Look for hints about complexity (good-first-issue candidate?)
   - Match to existing labels

4. **Select labels**: Choose up to 3 existing labels that best describe the issue

5. **Create new labels**: Only if no existing labels fit (rare)

6. **Apply**: Run the apply-labels script (see Applying Labels section)

## Labeling Guidelines

### Use Existing Labels
Prefer existing labels over creating new ones. Check the repository's label taxonomy first.

### Common Categories
- `bug` - Something isn't working
- `feature` or `feature-request` - New functionality
- `enhancement` - Improvement to existing feature
- `documentation` - Docs need updates
- `question` - Needs clarification
- `good-first-issue` - Good for newcomers

### Label Naming Conventions (for new labels)
- Lowercase letters only
- Words separated by hyphens
- 1-3 words, under 30 characters
- Example: `needs-reproduction`, `breaking-change`

## Applying Labels

Use the `apply-labels` tool to apply labels. The tool is automatically available.

### Tool Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `repository` | Yes | Repository in owner/repo format |
| `issueNumber` | Yes | Issue number |
| `labels` | Yes | Array of existing label names (max 3 total) |
| `explanation` | Yes | Brief reason for label choices |
| `newLabels` | No | Array of new labels to create first |

### Creating New Labels

If you need to create new labels (use sparingly), provide `newLabels`:

```json
{
  "newLabels": [
    {"name": "needs-reproduction", "color": "d93f0b", "description": "Issue needs steps to reproduce"}
  ]
}
```

Color is a hex string WITHOUT the leading `#`.

## Decision Process

1. **Read the issue carefully** - title and full body
2. **Identify the primary type** - bug? feature? question?
3. **Check for secondary aspects** - affects docs? good for beginners?
4. **Match to existing labels** - prefer exact matches
5. **If no match exists** - consider if a new label is truly needed
6. **Write explanation** - brief justification for choices

## Common Mistakes to Avoid

- Do NOT apply more than 3 labels total
- Do NOT create many highly specific labels unlikely to be reused
- Do NOT apply labels that contradict the issue content
- Do NOT overuse broad labels like `question` when specific ones exist
- Do NOT create duplicate labels with slight name variations
- Do NOT omit the explanation argument
- Do NOT call the apply-labels tool more than once

## Example Explanation

Good: "Labeled as bug and documentation based on steps to reproduce and mention of incorrect docs"

Bad: "Applied some labels"
