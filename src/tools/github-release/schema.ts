import { z } from 'zod';

export const GithubReleaseSchema = z
  .object({
    repository: z
      .string()
      .regex(/^[^/]+\/[^/]+$/)
      .describe('GitHub repository in owner/repo format'),
    tag: z
      .string()
      .regex(/^v?\d+\.\d+\.\d+(-[\w.]+)?$/)
      .describe('Version tag (e.g., v1.2.3 or 1.2.3)'),
    notes: z
      .array(z.string())
      .describe('Release notes as bullet points (one string per bullet)'),
    title: z
      .string()
      .optional()
      .describe('Release title (defaults to tag name)'),
    prerelease: z
      .boolean()
      .optional()
      .describe('Mark as prerelease (default: false)'),
    draft: z
      .boolean()
      .optional()
      .describe('Create as draft release (default: false)'),
  })
  .superRefine((value, ctx) => {
    if (value.notes.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['notes'],
        message: 'At least one release note bullet point must be provided.',
      });
    }

    const emptyNotes = value.notes.filter((note) => note.trim().length === 0);
    if (emptyNotes.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['notes'],
        message: 'Release note bullet points must not be empty.',
      });
    }
  });
