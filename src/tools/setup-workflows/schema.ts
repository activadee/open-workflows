import { z } from 'zod';

export const SetupWorkflowsSchema = z
  .object({
    workflows: z
      .array(z.enum(['review', 'label', 'doc-sync', 'release']))
      .describe('Which workflows to install'),
  })
  .superRefine((value, ctx) => {
    if (value.workflows.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['workflows'],
        message: 'You must specify at least one workflow to install.',
      });
    }
  });
