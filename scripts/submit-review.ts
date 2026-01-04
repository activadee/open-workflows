import { tool } from "@opencode-ai/plugin"

const z = tool.schema;
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

const ArgsSchema = z.object({
  repository: z.string().regex(/^[^/]+\/[^/]+$/).describe('GitHub repository in owner/repo format'),
  pullNumber: z.number().int().positive().describe('Pull request number'),
  commitSha: z.string().min(7).describe('Head commit SHA for the pull request'),
  summary: z.string().describe('Brief overall assessment of the changes'),
  verdict: z.enum(['approve', 'request_changes']).describe('Review verdict'),
  issues: z.array(
    z.object({
      file: z.string().describe('File path from the diff'),
      line: z.number().describe('Line number on the RIGHT (new) side'),
      severity: z.enum(['critical', 'high', 'medium', 'low']).describe('Issue severity'),
      title: z.string().describe('Short issue title'),
      explanation: z.string().describe('Detailed explanation'),
      suggestion: z.string().optional().describe('Replacement code only (no prose, no code fences)'),
    })
  ).describe('List of issues found'),
}).superRefine((value, ctx) => {
  const hasMediumOrHighOrCritical = value.issues.some(
    (issue) => issue.severity === 'critical' || issue.severity === 'high' || issue.severity === 'medium'
  );

  if (value.verdict === 'request_changes' && value.issues.length === 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['issues'],
      message: 'request_changes verdicts must include at least one issue.',
    });
  }

  if (value.verdict === 'approve' && hasMediumOrHighOrCritical) {
    ctx.addIssue({
      code: 'custom',
      path: ['verdict'],
      message: 'Approve verdict is only allowed when there are no critical, high, or medium severity issues.',
    });
  }
});

function formatVerdict(verdict: Verdict): string {
  return verdict === 'request_changes' ? 'REQUEST CHANGES' : 'APPROVE';
}

function deriveTitle(explanation: string, index: number): string {
  const trimmed = explanation.trim();
  if (!trimmed) return `Issue ${index + 1}`;
  const firstSentence = trimmed.split('. ')[0].trim();
  return firstSentence.length <= 80 ? firstSentence : firstSentence.slice(0, 77) + '...';
}

function normalizeIssue(rawIssue: unknown, index: number): ReviewIssue {
  const record = typeof rawIssue === 'object' && rawIssue !== null ? (rawIssue as Record<string, unknown>) : {};
  const file = typeof record.file === 'string' ? record.file : '';
  const lineValue = typeof record.line === 'number' ? record.line : NaN;
  const line = Number.isFinite(lineValue) && lineValue > 0 ? Math.floor(lineValue) : 0;
  const severityValue = typeof record.severity === 'string' ? record.severity : '';
  const severity: Severity = ['critical', 'high', 'medium', 'low'].includes(severityValue) ? severityValue as Severity : 'low';
  const explanation = typeof record.explanation === 'string' ? record.explanation.trim() : '';
  const title = typeof record.title === 'string' && record.title.trim() ? record.title.trim() : deriveTitle(explanation, index);
  const suggestion = typeof record.suggestion === 'string' ? record.suggestion.trim() : undefined;

  return { file, line, severity, title, explanation: explanation || 'No explanation provided.', suggestion };
}

function indent(text: string, prefix: string): string {
  return text.split('\n').map((line) => `${prefix}${line}`).join('\n');
}

function buildStickyCommentBody(summary: string, verdict: Verdict, issues: ReviewIssue[], commitSha?: string): string {
  let body = `## AI Review Summary\n\n`;
  body += `**Verdict:** ${formatVerdict(verdict)}\n`;
  if (commitSha) body += `**Commit:** \`${commitSha.slice(0, 7)}\`\n`;
  body += '\n';

  if (issues.length === 0) {
    body += `### Findings\n\nNo significant issues found.\n\n`;
  } else {
    body += `### Findings\n\n`;
    for (const issue of issues) {
      const location = issue.file && issue.line > 0 ? `${issue.file}:${issue.line}` : issue.file || 'unknown';
      body += `- **[${issue.severity.toUpperCase()}]** \`${location}\` – ${issue.title}\n`;
      body += `  - ${issue.explanation}\n`;
      if (issue.suggestion) {
        if (issue.suggestion.includes('\n')) {
          body += `  - **Suggested fix:**\n\n`;
          body += `    \`\`\`\n${indent(issue.suggestion, '    ')}\n    \`\`\`\n`;
        } else {
          body += `  - **Suggested fix:** ${issue.suggestion}\n`;
        }
      }
    }
    body += '\n';
  }

  body += `### Overall Assessment\n\n${summary}\n\n`;
  body += STICKY_MARKER;
  return body;
}

export default {
  description: "Submit a sticky review comment on a GitHub PR. Updates existing comment if present.",
  args: ArgsSchema.shape,
  async execute(args: unknown) {
    const validated = ArgsSchema.parse(args);
    const { repository, pullNumber, commitSha, summary, verdict, issues } = validated;

    const normalizedIssues = issues.map((issue, index) => normalizeIssue(issue, index));
    const body = buildStickyCommentBody(summary.trim(), verdict as Verdict, normalizedIssues, commitSha);

    let existingCommentId: number | null = null;

    try {
      const commentsJson = await Bun.$`gh api /repos/${repository}/issues/${pullNumber}/comments --paginate`.text();
      const comments = JSON.parse(commentsJson) as Array<{ id: number; body: string }>;
      const existing = comments.find((c) => c.body.includes(STICKY_MARKER));
      if (existing) existingCommentId = existing.id;
    } catch {}

    const payload = JSON.stringify({ body });
    const input = new Response(payload);

    if (existingCommentId) {
      await Bun.$`gh api --method PATCH /repos/${repository}/issues/comments/${existingCommentId} --input - < ${input}`.quiet();
      return 'Updated existing review comment';
    }

    await Bun.$`gh api --method POST /repos/${repository}/issues/${pullNumber}/comments --input - < ${input}`.quiet();
    return 'Posted review comment';
  },
};
