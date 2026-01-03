export { AUTH_WORKFLOW } from './auth';
export { PR_REVIEW } from './pr-review';
export { ISSUE_LABEL } from './issue-label';
export { DOC_SYNC } from './doc-sync';
export { RELEASE } from './release';

export type WorkflowType = 'review' | 'label' | 'doc-sync' | 'release';

export const WORKFLOW_FILE_MAP: Record<WorkflowType, string> = {
  review: 'pr-review',
  label: 'issue-label',
  'doc-sync': 'doc-sync',
  release: 'release',
};
