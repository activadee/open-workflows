import { z } from 'zod';

export const CommitDocsSchema = z
  .object({
    files: z
      .array(
        z.object({
          path: z.string().describe('File path relative to repo root'),
          content: z.string().describe('New file content'),
        })
      )
      .describe('Files to update'),
    message: z.string().describe('Commit message (will be prefixed with [skip ci] docs:)'),
  })
  .superRefine((value, ctx) => {
    if (value.files.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['files'],
        message: 'At least one documentation file must be provided when calling commit_docs.',
      });
    }

    const messageCollapsed = value.message.replace(/\s+/g, ' ').trim();
    if (messageCollapsed.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['message'],
        message: 'Commit message must not be empty.',
      });
    }
  });
