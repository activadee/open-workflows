export { PR_REVIEW } from './pr-review';
export { ISSUE_LABEL } from './issue-label';
export { DOC_SYNC } from './doc-sync';
export { RELEASE } from './release';
export { OPENCODE_AUTH } from './opencode-auth';

export type WorkflowType = 'review' | 'label' | 'doc-sync' | 'release' | 'opencode-auth';

export const WORKFLOW_FILE_MAP: Record<WorkflowType, string> = {
  review: 'pr-review',
  label: 'issue-label',
  'doc-sync': 'doc-sync',
  release: 'release',
  'opencode-auth': 'opencode-auth',
};
