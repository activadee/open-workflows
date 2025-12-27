import type { Hooks } from '@opencode-ai/plugin';

import { applyLabelsTool } from './apply-labels';
import { commitDocsTool } from './commit-docs';
import { setupWorkflowsTool } from './setup-workflows';
import { submitReviewTool } from './submit-review';

export const tools: NonNullable<Hooks['tool']> = {
  submit_review: submitReviewTool,
  apply_labels: applyLabelsTool,
  commit_docs: commitDocsTool,
  setup_workflows: setupWorkflowsTool,
};
