import { PR_REVIEW } from './pr-review';
import { ISSUE_LABEL } from './issue-label';
import { DOC_SYNC } from './doc-sync';
import { RELEASE_NOTES } from './release-notes';

export { PR_REVIEW } from './pr-review';
export { ISSUE_LABEL } from './issue-label';
export { DOC_SYNC } from './doc-sync';
export { RELEASE_NOTES } from './release-notes';

export interface SkillDefinition {
  name: string;
  content: string;
}

export const SKILLS: Record<string, SkillDefinition> = {
  'pr-review': { name: 'pr-review', content: PR_REVIEW },
  'issue-label': { name: 'issue-label', content: ISSUE_LABEL },
  'doc-sync': { name: 'doc-sync', content: DOC_SYNC },
  'release-notes': { name: 'release-notes', content: RELEASE_NOTES },
};

export const SKILL_NAMES = Object.keys(SKILLS) as (keyof typeof SKILLS)[];
