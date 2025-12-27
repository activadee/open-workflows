import { execSync } from 'child_process';

import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';

const STICKY_MARKER = '<!-- open-workflows:review-sticky -->';

interface ReviewIssue {
  file: string;
  line: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  explanation: string;
  suggestion?: string;
}

function buildInlineCommentBody(issue: ReviewIssue): string {
  let body = `**[${issue.severity.toUpperCase()}]** ${issue.title}\n\n${issue.explanation}`;
  if (issue.suggestion) {
    body += `\n\n\`\`\`suggestion\n${issue.suggestion}\n\`\`\``;
  }
  return body;
}

function buildStickyCommentBody(summary: string, issues: ReviewIssue[], commitSha?: string): string {
  let body = `## AI Review Summary\n\n`;

  if (commitSha) {
    body += `**Commit:** \`${commitSha.slice(0, 7)}\`\n\n`;
  }

  if (issues.length === 0) {
    body += `### Findings\n\nNo significant issues found.\n\n`;
  } else {
    body += `### Findings\n\n`;
    for (const issue of issues) {
      body += `- **[${issue.severity.toUpperCase()}]** \`${issue.file}:${issue.line}\` – ${issue.title}\n`;
      body += `  - ${issue.explanation}\n`;
      if (issue.suggestion) {
        body += `  - **Suggestion:** ${issue.suggestion}\n`;
      }
    }
    body += '\n';
  }

  body += `### Overall Assessment\n\n${summary}\n\n`;
  body += STICKY_MARKER;

  return body;
}

export const submitReviewTool: ToolDefinition = tool({
  description: 'Submit the code review and post comments to GitHub PR.',
  args: {
    summary: tool.schema.string().describe('Brief overall assessment of the changes'),
    verdict: tool.schema.enum(['approve', 'comment', 'request_changes']).describe('Review verdict'),
    issues: tool.schema
      .array(
        tool.schema.object({
          file: tool.schema.string().describe('File path from the diff'),
          line: tool.schema.number().describe('Line number in the file'),
          severity: tool.schema.enum(['critical', 'high', 'medium', 'low']).describe('Issue severity'),
          title: tool.schema.string().describe('Short issue title'),
          explanation: tool.schema.string().describe('Detailed explanation'),
          suggestion: tool.schema.string().optional().describe('Suggested fix'),
        })
      )
      .describe('List of issues found'),
    stickyComment: tool.schema
      .boolean()
      .default(false)
      .describe('Use a single sticky comment instead of inline comments'),
  },
  async execute(args) {
    const { summary, verdict, issues, stickyComment } = args;

    const repo = process.env.GITHUB_REPOSITORY;
    const prNumber = parseInt(process.env.PR_NUMBER || '', 10);
    const commitSha = process.env.COMMIT_SHA || '';

    if (!repo) throw new Error('GITHUB_REPOSITORY environment variable is required');
    if (!prNumber) throw new Error('PR_NUMBER environment variable is required');
    if (!commitSha) throw new Error('COMMIT_SHA environment variable is required');

    if (stickyComment) {
      const body = buildStickyCommentBody(summary, issues as ReviewIssue[], commitSha);
      let existingCommentId: number | null = null;
      try {
        const commentsJson = execSync(`gh api /repos/${repo}/issues/${prNumber}/comments --paginate`, {
          encoding: 'utf-8',
        });
        const comments = JSON.parse(commentsJson) as Array<{ id: number; body: string }>;
        const existing = comments.find((c) => c.body.includes(STICKY_MARKER));
        if (existing) existingCommentId = existing.id;
      } catch {
        // Ignore
      }

      const payload = JSON.stringify({ body });
      if (existingCommentId) {
        execSync(`gh api --method PATCH /repos/${repo}/issues/comments/${existingCommentId} --input -`, {
          encoding: 'utf-8',
          input: payload,
        });
        return 'Updated existing review comment';
      } else {
        execSync(`gh api --method POST /repos/${repo}/issues/${prNumber}/comments --input -`, {
          encoding: 'utf-8',
          input: payload,
        });
        return 'Posted review comment';
      }
    }

    const event =
      verdict === 'approve' ? 'APPROVE' : verdict === 'request_changes' ? 'REQUEST_CHANGES' : 'COMMENT';

    const comments = (issues as ReviewIssue[]).map((issue) => ({
      path: issue.file,
      line: issue.line,
      side: 'RIGHT' as const,
      body: buildInlineCommentBody(issue),
    }));

    const payload = {
      event,
      body: summary,
      commit_id: commitSha,
      comments,
    };

    execSync(
      `gh api --method POST -H "Accept: application/vnd.github+json" /repos/${repo}/pulls/${prNumber}/reviews --input -`,
      { encoding: 'utf-8', input: JSON.stringify(payload) }
    );

    return `PR review posted (${event}) with ${(issues as ReviewIssue[]).length} inline comment(s)`;
  },
});
