import { z } from 'zod';

export const SubmitReviewSchema = z
  .object({
    repository: z
      .string()
      .regex(/^[^/]+\/[^^/]+$/)
      .describe('GitHub repository in owner/repo format'),
    pullNumber: z.number().int().positive().describe('Pull request number'),
    commitSha: z.string().min(7).describe('Head commit SHA for the pull request'),
    summary: z.string().describe('Brief overall assessment of the changes'),
    verdict: z.enum(['approve', 'request_changes']).describe('Review verdict'),
    issues: z
      .array(
        z.object({
          file: z.string().describe('File path from the diff'),
          line: z.number().describe('Line number on the RIGHT (new) side'),
          severity: z.enum(['critical', 'high', 'medium', 'low']).describe('Issue severity'),
          title: z.string().describe('Short issue title'),
          explanation: z.string().describe('Detailed explanation'),
          suggestion: z
            .string()
            .optional()
            .describe('Replacement code only (no prose, no code fences, no change to prefix)'),
        })
      )
      .describe('List of issues found'),
  })
  .superRefine((value, ctx) => {
    const summary = value.summary.trim().toLowerCase();

    if (summary === 'test' || summary === 'testing') {
      ctx.addIssue({
        code: "custom",
        path: ['summary'],
        message:
          'Summary looks like a placeholder. Only call submit_review with a real review summary after analyzing the diff.',
      });
    }

    const hasMediumOrHighOrCritical = value.issues.some(
      (issue) => issue.severity === 'critical' || issue.severity === 'high' || issue.severity === 'medium'
    );

    if (value.verdict === 'request_changes' && value.issues.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ['issues'],
        message:
          'request_changes verdicts must include at least one issue with file, line, severity, and explanation.',
      });
    }

    if (value.verdict === 'approve' && hasMediumOrHighOrCritical) {
      ctx.addIssue({
        code: "custom",
        path: ['verdict'],
        message:
          'Approve verdict is only allowed when there are no critical, high, or medium severity issues.',
      });
    }

    const summaryCollapsed = value.summary.replace(/\s+/g, ' ').trim();
    if (summaryCollapsed.length < 20 && (value.verdict === 'request_changes' || value.issues.length > 0)) {
      ctx.addIssue({
        code: "custom",
        path: ['summary'],
        message:
          'Summary is too short. Provide a concise but meaningful overall assessment (at least around twenty characters).',
      });
    }
  });
