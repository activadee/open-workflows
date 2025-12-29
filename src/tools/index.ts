import type { Hooks } from '@opencode-ai/plugin';

import { applyLabelsTool } from './apply-labels';
import { bunReleaseTool } from './bun-release';
import { commitDocsTool } from './commit-docs';
import { githubReleaseTool } from './github-release';
import { setupWorkflowsTool } from './setup-workflows';
import { submitReviewTool } from './submit-review';

export const tools: NonNullable<Hooks['tool']> = {
  submit_review: submitReviewTool,
  apply_labels: applyLabelsTool,
  commit_docs: commitDocsTool,
  github_release: githubReleaseTool,
  bun_release: bunReleaseTool,
  setup_workflows: setupWorkflowsTool,
};
