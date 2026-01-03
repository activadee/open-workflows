import { z } from 'zod';

export const ApplyLabelsSchema = z
  .object({
    repository: z
      .string()
      .regex(/^[^/]+\/[^^/]+$/)
      .describe('GitHub repository in owner/repo format'),
    issueNumber: z.number().int().positive().describe('Issue number'),
    labels: z.array(z.string()).describe('Array of existing label names to apply (max 3)'),
    newLabels: z
      .array(
        z.object({
          name: z.string().describe('Label name'),
          color: z.string().describe('Hex color without #'),
          description: z.string().describe('Brief description'),
        })
      )
      .optional()
      .describe('New labels to create before applying'),
    explanation: z.string().describe('Brief explanation of label choices'),
  })
  .superRefine((value, ctx) => {
    const labelCount = value.labels.length + (value.newLabels?.length ?? 0);

    if (labelCount === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['labels'],
        message: 'At least one label or new label must be provided.',
      });
    }

    if (labelCount > 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['labels'],
        message: 'You may apply at most three labels in total (existing plus new).',
      });
    }

    const explanationCollapsed = value.explanation.replace(/\s+/g, ' ').trim();
    if (explanationCollapsed.length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['explanation'],
        message: 'Explanation is too short. Briefly describe why these labels were chosen.',
      });
    }
  });
