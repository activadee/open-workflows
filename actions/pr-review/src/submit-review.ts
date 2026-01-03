#!/usr/bin/env bun
/// <reference types="bun-types" />

/**
 * Usage: bun submit-review.ts --repo owner/repo --pr 123 --commit abc1234 \
 *        --verdict approve --summary "Clean code" --issues '[...]'
 */

import { parseArgs } from "util";

const STICKY_MARKER = '<!-- open-workflows:review-sticky -->';

type Severity = 'critical' | 'high' | 'medium' | 'low';
type Verdict = 'approve' | 'request_changes';

interface ReviewIssue {
  file: string;
  line: number;
  severity: Severity;
  title: string;
  explanation: string;
  suggestion?: string;
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLast = attempt === maxRetries - 1;
      const msg = error instanceof Error ? error.message : String(error);
      const isRetryable = msg.includes('rate limit') || msg.includes('timeout') || 
                          msg.includes('503') || msg.includes('ECONNRESET');
      if (isLast || !isRetryable) throw error;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  throw new Error('Max retries exceeded');
}

function formatVerdict(verdict: Verdict): string {
  return verdict === 'request_changes' ? 'REQUEST CHANGES' : 'APPROVE';
}

function buildCommentBody(summary: string, verdict: Verdict, issues: ReviewIssue[], commitSha?: string): string {
  let body = `## AI Review Summary\n\n`;
  body += `**Verdict:** ${formatVerdict(verdict)}\n`;
  if (commitSha) {
    body += `**Commit:** \`${commitSha.slice(0, 7)}\`\n`;
  }
  body += '\n';

  if (issues.length === 0) {
    body += `### Findings\n\nNo significant issues found.\n\n`;
  } else {
    body += `### Findings\n\n`;
    for (const issue of issues) {
      const location = issue.file && issue.line > 0 ? `${issue.file}:${issue.line}` : issue.file || 'unknown';
      body += `- **[${issue.severity.toUpperCase()}]** \`${location}\` – ${issue.title}\n`;
      body += `  - ${issue.explanation}\n`;
      if (issue.suggestion?.trim()) {
        const suggestion = issue.suggestion.trim();
        if (suggestion.includes('\n')) {
          body += `  - **Suggested fix:**\n\n    \`\`\`\n${suggestion.split('\n').map(l => `    ${l}`).join('\n')}\n    \`\`\`\n`;
        } else {
          body += `  - **Suggested fix:** ${suggestion}\n`;
        }
      }
    }
    body += '\n';
  }

  body += `### Overall Assessment\n\n${summary}\n\n`;
  body += STICKY_MARKER;
  return body;
}

async function main() {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      repo: { type: 'string' },
      pr: { type: 'string' },
      commit: { type: 'string' },
      verdict: { type: 'string' },
      summary: { type: 'string' },
      issues: { type: 'string' },
    },
    strict: true,
  });

  const { repo, pr, commit, verdict, summary, issues: issuesJson } = values;

  if (!repo || !pr || !verdict || !summary) {
    console.error('Missing required arguments: --repo, --pr, --verdict, --summary');
    process.exit(1);
  }

  const prNumber = parseInt(pr, 10);
  if (isNaN(prNumber)) {
    console.error('Invalid PR number');
    process.exit(1);
  }

  if (verdict !== 'approve' && verdict !== 'request_changes') {
    console.error('Verdict must be "approve" or "request_changes"');
    process.exit(1);
  }

  let issues: ReviewIssue[] = [];
  if (issuesJson) {
    try {
      issues = JSON.parse(issuesJson);
    } catch {
      console.error('Invalid JSON for --issues');
      process.exit(1);
    }
  }

  const body = buildCommentBody(summary, verdict as Verdict, issues, commit);

  let existingCommentId: number | null = null;
  try {
    const result = await withRetry(() => 
      Bun.$`gh api /repos/${repo}/issues/${prNumber}/comments --paginate`.text()
    );
    const comments = JSON.parse(result) as Array<{ id: number; body: string }>;
    const existing = comments.find(c => c.body.includes(STICKY_MARKER));
    if (existing) existingCommentId = existing.id;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Warning: Failed to fetch existing comments:', msg);
  }

  const payload = JSON.stringify({ body });
  const input = new Response(payload);

  if (existingCommentId) {
    await withRetry(() =>
      Bun.$`gh api --method PATCH /repos/${repo}/issues/comments/${existingCommentId} --input - < ${input}`.quiet()
    );
    console.log('Updated existing review comment');
  } else {
    await withRetry(() =>
      Bun.$`gh api --method POST /repos/${repo}/issues/${prNumber}/comments --input - < ${input}`.quiet()
    );
    console.log('Posted new review comment');
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
