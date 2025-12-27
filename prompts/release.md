# Release Creation

You are responsible for creating a GitHub release for this repository.

## Context

- Repository: $REPO
- Range: $FROM_TAG → $TO_TAG
- Draft: $DRAFT
- Prerelease: $PRERELEASE
- Dry run: $DRY_RUN

## Goal

Create (or prepare, in dry-run mode) a GitHub release that:
- Only highlights **worthwhile, user-facing changes** between `$FROM_TAG` and `$TO_TAG`.
- Uses a release body formatted as bullet points, where **each bullet represents one meaningful change**.
- Follows this exact bullet format:

- `<change> <(#pr, if available)> <(@author)>`

Examples:

- Add release command for GitHub automation (#42) (@alice)
- Fix label workflow edge case (#47) (@bob)
- Improve doc-sync performance (@carol)

## What Counts as "Worthwhile"

Include changes that are visible or important to users, such as:
- New features
- Bug fixes
- Behavior changes
- Significant performance improvements
- Important refactors that change how users interact with the tool

Exclude or de-emphasize low-signal changes, such as:
- Dependency bumps (e.g. `deps: bump ...`)
- Pure CI changes (workflow version bumps, etc.)
- Version bump commits
- Trivial docs tweaks (typos, formatting) unless they significantly improve docs
- Reverts that just undo a previous change

## How to Gather Changes

Use the GitHub CLI to inspect changes between the two refs:

- If `$FROM_TAG` is `beginning` or empty:
  - Treat this as an initial release and consider all commits up to `$TO_TAG`.
- Otherwise:
  - Focus on commits between `$FROM_TAG...$TO_TAG`.

Examples (you may adapt as needed):

```bash
# Compare two refs and list commits
gh api \
  repos/$REPO/compare/$FROM_TAG...$TO_TAG \
  --paginate \
  --jq '.commits[] | { sha: .sha, message: .commit.message, author: .author.login }'

# Optionally fetch more details (PRs, files, etc.)
# gh api ...
```

From this information, decide which changes are worth mentioning **and** whether a new release is needed.

If there are no worthwhile changes, do not create a new version. In that case, your final output should be exactly:

No noteworthy changes in this release.

## Deciding the Version Bump

When there are worthwhile changes, decide whether the next release should be a `patch`, `minor`, or `major` bump. Use a simple, conventional heuristic:

- `major`:
  - Any commit message indicates a breaking change, e.g. contains `BREAKING CHANGE` or uses the conventional commit `!` marker (like `feat!: ...` or `refactor!: ...`).
- `minor`:
  - Any commit with a clear new feature, typically conventional commit type `feat:`.
- `patch`:
  - All other worthwhile changes (bug fixes, small behavior tweaks, docs improvements that matter to users). If in doubt, default to `patch`.

Only choose `major` or `minor` if you are confident the changes justify that level.

## Building the Release Notes Body

When constructing the release notes body:

- Use **only** simple `- ` bullets, one per line.
- Each bullet must follow: `<change> <(#pr, if available)> <(@author)>`.
- Use concise, human-readable descriptions in `<change>`.
- If a PR exists, append `(#<number>)`.
- Always append the primary author as `(@username)`.
- Do **not** mention commit SHAs in the bullets.
- Do **not** add headings, summaries, or extra prose.
- If there are **no noteworthy changes**, use exactly:

No noteworthy changes in this release.

## Creating or Previewing the Release

Obey the `Dry run` flag **strictly**:

- If `$DRY_RUN` is `true`:
  - **Do not** run any commands that change the repository or registry state. That means:
    - Do **not** run `npm version`, `git commit`, `git push`, or `gh release create`.
  - You may use read-only `gh api` or other inspection commands.
  - Your final output must be **only** the bullet list (or `No noteworthy changes in this release.`) printed to stdout.

- If `$DRY_RUN` is `false` and there are worthwhile changes:
  1. Decide the bump type: `patch`, `minor`, or `major` as described above.
  2. Run `npm version <type>` to bump the version in `package.json`, create a version commit, and create a tag (by default `vX.Y.Z`). Do **not** use `--no-git-tag-version`.
  3. Push the commit and tag back to the default remote (usually `origin`), for example:

     ```bash
     git push origin HEAD
     git push origin --follow-tags
     ```

  4. Determine the new tag to use for the GitHub release. You can use the latest tag, for example:

     ```bash
     NEW_TAG=$(git describe --tags --abbrev=0)
     ```

  5. Use the bullet list you generated as the `--notes` body and create the GitHub release:

     ```bash
     gh release create "$NEW_TAG" \
       --repo "$REPO" \
       --title "$NEW_TAG" \
       --notes "$BULLETS" \
       ${DRAFT_FLAG} \
       ${PRERELEASE_FLAG}
     ```

     Where `$BULLETS` is the exact bullet list in the required format.

If there are **no noteworthy changes**, do not bump the version and do not create or update a release. Just output:

No noteworthy changes in this release.

## Output

- In **dry run** mode: print only the bullet list (or `No noteworthy changes in this release.`) to stdout.
- In **non-dry** mode: perform the version bump, push, and `gh release create` as described above, and also echo the final bullet list so a human can see what was published.
