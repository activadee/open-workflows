import { execSync } from 'child_process';
import type { PRDetails, IssueDetails, CommitInfo } from '../types.js';
import { log } from './logger.js';

export function getPRDetails(repo: string, prNumber: number): PRDetails {
  log.step(`Fetching PR #${prNumber} details...`);

  const prJson = execSync(
    `gh pr view ${prNumber} --repo ${repo} --json number,title,body,headRefOid,baseRefName,headRefName`,
    { encoding: 'utf-8' }
  );
  const pr = JSON.parse(prJson);

  const diff = execSync(
    `gh pr diff ${prNumber} --repo ${repo}`,
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
  );

  return {
    number: pr.number,
    title: pr.title,
    body: pr.body || '',
    headSha: pr.headRefOid,
    baseBranch: pr.baseRefName,
    headBranch: pr.headRefName,
    diff,
  };
}

export function getIssueDetails(repo: string, issueNumber: number): IssueDetails {
  log.step(`Fetching issue #${issueNumber} details...`);

  const issueJson = execSync(
    `gh issue view ${issueNumber} --repo ${repo} --json number,title,body,labels`,
    { encoding: 'utf-8' }
  );
  const issue = JSON.parse(issueJson);

  return {
    number: issue.number,
    title: issue.title,
    body: issue.body || '',
    labels: issue.labels?.map((l: { name: string }) => l.name) || [],
  };
}

export function getRepoLabels(repo: string): string[] {
  const labelsJson = execSync(
    `gh label list --repo ${repo} --json name --limit 100`,
    { encoding: 'utf-8' }
  );
  const labels = JSON.parse(labelsJson);
  return labels.map((l: { name: string }) => l.name);
}

export function getLocalDiff(): string {
  try {
    // Get staged + unstaged changes
    const staged = execSync('git diff --staged', { encoding: 'utf-8' });
    const unstaged = execSync('git diff', { encoding: 'utf-8' });
    const combined = staged + unstaged;
    
    if (combined.trim()) {
      return combined;
    }
    
    // Fall back to diff from last commit
    return execSync('git diff HEAD~1', { encoding: 'utf-8' });
  } catch {
    return '';
  }
}

export function getRepoTags(repo: string): string[] {
  log.step(`Fetching tags for ${repo}...`);

  const tagsJson = execSync(
    `gh api repos/${repo}/tags --paginate`,
    { encoding: 'utf-8' }
  );
  const tags = JSON.parse(tagsJson);
  return tags.map((t: { name: string }) => t.name);
}

export function getLatestReleaseTag(repo: string): string | null {
  try {
    const releaseJson = execSync(
      `gh api repos/${repo}/releases/latest`,
      { encoding: 'utf-8' }
    );
    const release = JSON.parse(releaseJson);
    return release.tag_name || null;
  } catch {
    return null;
  }
}

export function getCommitsInRange(repo: string, fromRef: string, toRef: string): CommitInfo[] {
  log.step(`Fetching commits from ${fromRef} to ${toRef}...`);

  const commitsJson = execSync(
    `gh api repos/${repo}/compare/${fromRef}...${toRef} --jq '.commits[] | {sha: .sha, message: .commit.message, author: .author.login, committer: .committer.login, date: .commit.author.date}'`,
    { encoding: 'utf-8' }
  );

  if (!commitsJson.trim()) {
    return [];
  }

  const commits = commitsJson.split('\n').filter(line => line.trim());
  return commits.map(line => JSON.parse(line));
}

export function getCommitWithPR(repo: string, sha: string): { prNumber?: number; prTitle?: string } {
  try {
    const resultJson = execSync(
      `gh api repos/${repo}/commits/${sha}/pulls --jq '.[0] // empty'`,
      { encoding: 'utf-8' }
    );

    if (!resultJson.trim()) {
      return {};
    }

    const pr = JSON.parse(resultJson);
    return {
      prNumber: pr.number,
      prTitle: pr.title,
    };
  } catch {
    return {};
  }
}

export function createGitHubRelease(
  repo: string,
  tag: string,
  name: string,
  body: string,
  draft: boolean = false,
  prerelease: boolean = false
): void {
  log.step(`Creating release ${tag}...`);

  const draftArg = draft ? '--draft' : '';
  const prereleaseArg = prerelease ? '--prerelease' : '';

  execSync(
    `gh release create "${tag}" --repo ${repo} --title "${name}" --notes "${body}" ${draftArg} ${prereleaseArg}`,
    { encoding: 'utf-8' }
  );

  log.success(`Release ${tag} created successfully!`);
}

export function generateReleaseNotes(repo: string, tag: string, previousTag: string): string {
  try {
    const notesJson = execSync(
      `gh api repos/${repo}/releases/generate-notes --field tag_name="${tag}" --field previous_tag_name="${previousTag}"`,
      { encoding: 'utf-8' }
    );
    const result = JSON.parse(notesJson);
    return result.body || '';
  } catch {
    return '';
  }
}

export function ensureGhCli(): void {
  try {
    execSync('gh --version', { stdio: 'ignore' });
  } catch {
    throw new Error(
      'GitHub CLI (gh) is required but not found. Install it from: https://cli.github.com'
    );
  }
}

export function ensureGhAuth(): void {
  // First, ensure GITHUB_TOKEN is also available as GH_TOKEN for gh CLI
  if (process.env.GITHUB_TOKEN && !process.env.GH_TOKEN) {
    process.env.GH_TOKEN = process.env.GITHUB_TOKEN;
  }

  try {
    execSync('gh auth status', { stdio: 'ignore' });
  } catch {
    // Try to use GITHUB_TOKEN/GH_TOKEN environment variable
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (token) {
      try {
        // Export token for gh CLI to use
        execSync(`echo "${token}" | gh auth login --with-token`, { stdio: 'ignore' });
        return;
      } catch {
        // Fall through to error
      }
    }
    throw new Error(
      'GitHub CLI not authenticated. Run: gh auth login\n' +
      'Or set GITHUB_TOKEN environment variable.'
    );
  }
}

export interface GhPermissionStatus {
  authenticated: boolean;
  hasPullRequestWrite: boolean;
  hasIssuesWrite: boolean;
  hasContentsWrite: boolean;
  tokenScopes?: string[];
}

export function checkGhPermissions(): GhPermissionStatus {
  const status: GhPermissionStatus = {
    authenticated: false,
    hasPullRequestWrite: false,
    hasIssuesWrite: false,
    hasContentsWrite: false,
    tokenScopes: [],
  };

  try {
    execSync('gh auth status', { stdio: 'ignore' });
    status.authenticated = true;
  } catch {
    return status;
  }

  try {
    const userJson = execSync('gh api user --jq ".login"', { encoding: 'utf-8' });
    status.authenticated = !!userJson.trim();
  } catch {
    return status;
  }

  try {
    const scopesJson = execSync('gh auth status --jq ".token_scopes" 2>/dev/null || echo "[]"', {
      encoding: 'utf-8',
    });
    const scopes: string[] = JSON.parse(scopesJson.trim() || '[]');
    status.tokenScopes = scopes;

    status.hasPullRequestWrite = scopes.some(
      (s: string) => s.includes('repo') || s.includes('pull-request')
    );
    status.hasIssuesWrite = scopes.some(
      (s: string) => s.includes('repo') || s.includes('issues')
    );
    status.hasContentsWrite = scopes.some(
      (s: string) => s.includes('repo') || s.includes('contents')
    );
  } catch {
    status.hasPullRequestWrite = true;
    status.hasIssuesWrite = true;
    status.hasContentsWrite = true;
  }

  return status;
}

export function requireGhPermission(required: 'pull-request' | 'issue' | 'contents'): void {
  const perms = checkGhPermissions();

  if (!perms.authenticated) {
    throw new Error(
      'GitHub CLI not authenticated. Run: gh auth login'
    );
  }

  switch (required) {
    case 'pull-request':
      if (!perms.hasPullRequestWrite) {
        throw new Error(
          'GitHub token lacks pull-requests:write permission. ' +
          'This is needed to create PR comments. ' +
          'Please re-authenticate with: gh auth refresh -s repo'
        );
      }
      break;
    case 'issue':
      if (!perms.hasIssuesWrite) {
        throw new Error(
          'GitHub token lacks issues:write permission. ' +
          'This is needed to create issue comments and labels. ' +
          'Please re-authenticate with: gh auth refresh -s repo'
        );
      }
      break;
    case 'contents':
      if (!perms.hasContentsWrite) {
        throw new Error(
          'GitHub token lacks contents:write permission. ' +
          'This is needed to commit changes. ' +
          'Please re-authenticate with: gh auth refresh -s repo'
        );
      }
      break;
  }
}
