import { z } from 'zod';

export const BunReleaseSchema = z.object({
  version: z
    .string()
    .regex(/^v?\d+\.\d+\.\d+(-[\w.]+)?$/)
    .describe('Version to release (e.g., v1.2.3 or 1.2.3)'),
});
