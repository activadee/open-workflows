---
name: pr-review
description: AI-powered pull request code review focusing on correctness, security, stability, and maintainability.
license: MIT
---

## What I Do

Review pull request changes systematically and post findings as a sticky PR comment. Focus on **real issues that matter** - bugs, security risks, and stability problems that would block a merge in a typical code review.

## Review Philosophy

**Ask yourself before flagging any issue**: "Would a senior engineer in a time-limited code review raise this issue?"

- Flag issues that represent **real risks** or **actual bugs**
- Skip style preferences and subjective opinions
- Prioritize signal over noise - fewer, higher-quality findings

## Workflow

1. **Check prior feedback**: Fetch existing PR comments to understand context
   ```bash
   gh pr view <number> --json comments --jq '.comments[].body'
   ```

2. **Gather PR context**: Get PR metadata and changed files
   ```bash
   gh pr view <number> --json files,title,body,headRefOid
   ```

3. **Create validation todo list**: Track previously-flagged issues (if any) using `todowrite`
   - One item per prior issue: "Validate if [issue] was addressed"
   - One item per changed file for new review

4. **Analyze each file**:
   - Mark todo as `in_progress`
   - Read the file diff and surrounding context
   - Note ONLY issues that pass the "real issue" test (see Review Priorities)
   - Mark todo as `completed`

5. **Synthesize review**: After ALL files are analyzed, determine verdict and summary
   - Acknowledge addressed feedback from prior reviews
   - Only include NEW issues not previously identified

6. **Post review**: Run the submit-review script (see Posting Review section)

## Review Priorities

Focus on these areas. Each includes concrete examples of what IS and ISN'T worth flagging.

### 1. Correctness (Logic errors that cause wrong behavior)

| Flag This | Skip This |
|-----------|-----------|
| Off-by-one errors in loops/bounds | Type confusion that doesn't break runtime |
| Broken control flow (early returns, missing breaks) | Unused variables (linters catch this) |
| Incorrect boolean logic | Missing optional chaining on guaranteed-present fields |
| Wrong comparison operators | Stylistic null checks beyond language guarantees |
| Missing await on async calls | |

### 2. Security (Exploitable vulnerabilities)

| Flag This | Skip This |
|-----------|-----------|
| SQL/NoSQL injection | Hypothetical attack scenarios requiring admin access |
| XSS vulnerabilities | Missing rate limiting (unless auth-related) |
| Auth bypass possibilities | Theoretical timing attacks |
| Secrets/credentials in code | Generic "consider security implications" |
| Unsafe deserialization | |
| Path traversal | |

### 3. Stability (Issues causing crashes or data loss)

| Flag This | Skip This |
|-----------|-----------|
| Unhandled promise rejections in critical paths | Adding extra try-catch "just in case" |
| Race conditions with visible effects | Defensive null checks on typed fields |
| Resource leaks (unclosed handles, listeners) | Missing error logging (non-critical) |
| Infinite loops / recursion without base case | Optional timeout additions |
| Division by zero possibilities | |

### 4. Maintainability (Clarity issues causing confusion)

| Flag This | Skip This |
|-----------|-----------|
| Misleading function/variable names | Naming preferences (camelCase vs snake_case) |
| Logic that contradicts its documentation | Minor comment improvements |
| Dead code that appears intentional | DRY violations without maintenance risk |
| Inconsistency with adjacent code patterns | Subjective "this could be cleaner" |

## Common Nitpicks to Avoid

**DO NOT flag these issues** - they create noise without value:

1. **Coding style preferences** - Spaces vs tabs, quote styles, trailing commas, line length. Let linters handle this.

2. **Defensive programming suggestions** - Adding null checks, optional chaining, or try-catch blocks beyond what the type system or runtime requires.

3. **DRY violations without real cost** - Small code duplication that doesn't create maintenance burden. Not everything needs abstraction.

4. **Missing code comments** - Unless the code is security-critical or intentionally non-obvious, don't require comments.

5. **Subjective complexity concerns** - "This function is too long" or "Consider breaking this up" without identifying a concrete problem it causes.

6. **Minor refactoring suggestions** - Aesthetic improvements, variable renaming preferences, or "cleaner" alternatives that aren't objectively better.

## Context from Prior Reviews

Before starting your review:

1. **Fetch existing PR comments** to see prior feedback:
   ```bash
   gh pr view <number> --json comments,reviews --jq '.comments[].body, .reviews[].body'
   ```

2. **If previous issues were flagged**:
   - Create a todo item for each: "Validate: [previous issue title]"
   - Check if the latest commits address each issue
   - Mark as completed with status (resolved/still-present)

3. **In your final review**:
   - Acknowledge issues that were fixed: "Previously flagged X - now resolved"
   - Only flag issues that are NEW or STILL UNRESOLVED
   - Don't re-flag the same issue in slightly different words

## Posting Review

The script path is provided in your task message. Run the submit-review script:

```bash
bun "<script_path>/submit-review.ts" \
  --repo "owner/repo" \
  --pr 123 \
  --commit "abc1234" \
  --verdict "approve" \
  --summary "Your overall assessment" \
  --issues '[{"file":"src/foo.ts","line":42,"severity":"high","title":"Issue title","explanation":"Why this matters","suggestion":"Optional fix"}]'
```

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `--repo` | Yes | Repository in owner/repo format |
| `--pr` | Yes | Pull request number |
| `--commit` | No | Commit SHA (first 7 chars shown in review) |
| `--verdict` | Yes | `approve` or `request_changes` |
| `--summary` | Yes | 1-3 sentence overall assessment |
| `--issues` | No | JSON array of issues found |

### Issue Format

Each issue in the array:

```json
{
  "file": "src/auth/login.ts",
  "line": 42,
  "severity": "critical|high|medium|low",
  "title": "Short description (~80 chars)",
  "explanation": "Why this matters, what's wrong",
  "suggestion": "Optional: replacement code"
}
```

## Verdict Rules

**Only use `request_changes` for issues that should BLOCK the merge:**

- `critical`: Security vulnerabilities, data loss risks, complete feature breakage
- `high`: Bugs that will affect users, significant logic errors
- `medium`: Edge cases likely to cause issues, unclear but problematic patterns

**Use `approve` generously:**

- If issues are `low` severity only - approve with notes
- If issues are style/preference-based - approve (and don't flag them)
- If you're unsure whether something is a real issue - lean toward approve

**Severity guidance:**

- Default to `low` unless the issue clearly meets `medium` or higher criteria
- `medium` = "This will probably cause a bug in production"
- `high` = "This will definitely cause problems for users"
- `critical` = "This is a security hole or will cause data loss"

## Common Mistakes to Avoid

- Do NOT run the script more than once per review
- Do NOT use line numbers from the left (old) side of the diff
- Do NOT skip the per-file todo workflow
- Do NOT guess repository, PR number, or commit SHA - derive from git/gh commands
- Do NOT re-flag issues from prior reviews that were already addressed
- Do NOT flag style issues that linters or formatters should handle

## Example Issue

```json
{
  "file": "src/auth/login.ts",
  "line": 42,
  "severity": "high",
  "title": "SQL injection vulnerability in user lookup",
  "explanation": "User input is concatenated directly into the SQL query without sanitization. An attacker could inject malicious SQL to bypass authentication or extract data.",
  "suggestion": "const user = await db.query('SELECT * FROM users WHERE email = $1', [email])"
}
```

## Example of What NOT to Flag

```typescript
// DON'T flag: "Consider using optional chaining"
const name = user.profile.name;  // If types guarantee profile exists, this is fine

// DON'T flag: "Variable could be const"
let count = 0;  // Let linters handle this

// DON'T flag: "Function is too long"
function processOrder() { /* 80 lines */ }  // Unless there's a concrete bug

// DON'T flag: "Consider adding error handling"
await saveUser(user);  // Unless errors here would cause data loss
```
