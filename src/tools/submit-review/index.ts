import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';
import { SubmitReviewSchema } from './schema';

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

const SUGGESTION_PREFIXES: RegExp[] = [
  /^change to:\s*/i,
  /^change it to:\s*/i,
  /^replace with:\s*/i,
  /^suggestion:\s*/i,
  /^add a comment:\s*/i,
];

function sanitizeSummaryText(summary: string): string {
  const trimmed = summary.trim();
  const artifactMatch = trimmed.match(/^(.*?)(?:\",\s*\"?verdict\"?|\"verdict\"|",\s*"verdict")/s);
  if (artifactMatch) return artifactMatch[1].trim();
  return trimmed;
}

function formatVerdict(verdict: Verdict): string {
  if (verdict === 'request_changes') return 'REQUEST CHANGES';
  return verdict.toUpperCase();
}

function deriveTitle(explanation: string, index: number): string {
  const trimmed = explanation.trim();
  if (!trimmed) return `Issue ${index + 1}`;

  const firstLine = trimmed.split('\n')[0].trim();
  const firstSentence = firstLine.split('. ')[0].trim();
  const title = firstSentence || firstLine || `Issue ${index + 1}`;

  if (title.length <= 80) return title;
  return title.slice(0, 77) + '...';
}

function extractFirstCodeFence(text: string): string | null {
  const match = text.match(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}

function normalizeSuggestionText(suggestion: string): string {
  const trimmed = suggestion.trim();
  const fenced = extractFirstCodeFence(trimmed);

  let normalized = (fenced ?? trimmed).trim();
  for (const prefix of SUGGESTION_PREFIXES) {
    normalized = normalized.replace(prefix, '').trim();
  }

  return normalized.trim();
}

function indent(text: string, prefix: string): string {
  return text
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n');
}

function normalizeIssue(rawIssue: unknown, index: number): ReviewIssue {
  const record = typeof rawIssue === 'object' && rawIssue !== null ? (rawIssue as Record<string, unknown>) : {};

  const file = typeof record.file === 'string' ? record.file : '';

  const lineValue = typeof record.line === 'number' ? record.line : Number.NaN;
  const line = Number.isFinite(lineValue) && lineValue > 0 ? Math.floor(lineValue) : 0;

  const severityValue = typeof record.severity === 'string' ? record.severity : '';
  const severity: Severity =
    severityValue === 'critical' || severityValue === 'high' || severityValue === 'medium' || severityValue === 'low'
      ? severityValue
      : 'low';

  const explanation = typeof record.explanation === 'string' ? record.explanation.trim() : '';
  const title =
    typeof record.title === 'string' && record.title.trim() ? record.title.trim() : deriveTitle(explanation, index);

  const rawSuggestion = typeof record.suggestion === 'string' ? record.suggestion : undefined;
  const suggestion = rawSuggestion ? normalizeSuggestionText(rawSuggestion) : undefined;

  return {
    file,
    line,
    severity,
    title,
    explanation: explanation || 'No explanation provided.',
    suggestion: suggestion && suggestion.trim() ? suggestion : undefined,
  };
}

function buildStickyCommentBody(summary: string, verdict: Verdict, issues: ReviewIssue[], commitSha?: string): string {
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
      if (issue.suggestion) {
        const normalizedSuggestion = normalizeSuggestionText(issue.suggestion);
        if (normalizedSuggestion) {
          if (normalizedSuggestion.includes('\n')) {
            body += `  - **Suggested fix:**\n\n`;
            body += `    \`\`\`\n${indent(normalizedSuggestion, '    ')}\n    \`\`\`\n`;
          } else {
            body += `  - **Suggested fix:** ${normalizedSuggestion}\n`;
          }
        }
      }
    }
    body += '\n';
  }

  body += `### Overall Assessment\n\n${summary}\n\n`;
  body += STICKY_MARKER;

  return body;
}

export const submitReviewTool: ToolDefinition = tool({
  description: 'Submit a single sticky review comment on a GitHub PR.',
  args: SubmitReviewSchema.shape,
  async execute(args) {
    const { repository, pullNumber, commitSha, summary, verdict, issues } = SubmitReviewSchema.parse(args);

    const normalizedSummary = sanitizeSummaryText(summary);
    const rawIssues = Array.isArray(issues) ? issues : [];
    const normalizedIssues = rawIssues.map((issue, index) => normalizeIssue(issue, index));

    const body = buildStickyCommentBody(normalizedSummary, verdict as Verdict, normalizedIssues, commitSha);

    let existingCommentId: number | null = null;
    let fetchError: string | null = null;
    try {
      const commentsJson = await Bun.$`gh api /repos/${repository}/issues/${pullNumber}/comments --paginate`.text();
      const comments = JSON.parse(commentsJson) as Array<{ id: number; body: string }>;
      const existing = comments.find((c) => c.body.includes(STICKY_MARKER));
      if (existing) existingCommentId = existing.id;
    } catch (error) {
      // Distinguish between "no comment found" and actual API errors
      fetchError = error instanceof Error ? error.message : String(error);
    }

    const payload = JSON.stringify({ body });
    const input = new Response(payload);

    if (existingCommentId) {
      await Bun.$`gh api --method PATCH /repos/${repository}/issues/comments/${existingCommentId} --input - < ${input}`.quiet();
      return fetchError
        ? `Warning: ${fetchError}. Updated existing review comment`
        : 'Updated existing review comment';
    }

    await Bun.$`gh api --method POST /repos/${repository}/issues/${pullNumber}/comments --input - < ${input}`.quiet();
    return fetchError
      ? `Warning: ${fetchError}. Posted new review comment`
      : 'Posted review comment';
  },
});
