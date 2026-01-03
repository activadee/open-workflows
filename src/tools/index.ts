import type { Hooks } from '@opencode-ai/plugin';

import { applyLabelsTool } from './apply-labels';
import { bunReleaseTool } from './bun-release';
import { githubReleaseTool } from './github-release';
import { submitReviewTool } from './submit-review';

export const tools: NonNullable<Hooks['tool']> = {
  submit_review: submitReviewTool,
  apply_labels: applyLabelsTool,
  github_release: githubReleaseTool,
  bun_release: bunReleaseTool,
};
