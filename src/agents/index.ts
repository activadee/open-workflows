import type { Hooks } from '@opencode-ai/plugin';

import { DOC_SYNC_PROMPT } from '../prompts/doc-sync';
import { LABEL_PROMPT } from '../prompts/label';
import { RELEASE_PROMPT } from '../prompts/release';
import { REVIEW_PROMPT } from '../prompts/review';

const DEFAULT_MODEL = 'minimax/MiniMax-M2.1';

const BASE_TOOLS = {
  bash: true,
  read: true,
  glob: true,
  grep: true,
  write: false,
  edit: false,
} as const;

export const configureAgents: NonNullable<Hooks['config']> = async (cfg) => {
  cfg.agent = {
    ...cfg.agent,
    review: {
      description: 'AI-powered pull request code review',
      mode: 'subagent' as const,
      model: DEFAULT_MODEL,
      prompt: REVIEW_PROMPT,
      tools: BASE_TOOLS,
    },
    label: {
      description: 'Automatically label GitHub issues',
      mode: 'subagent' as const,
      model: DEFAULT_MODEL,
      prompt: LABEL_PROMPT,
      tools: BASE_TOOLS,
    },
    'doc-sync': {
      description: 'Sync documentation with code changes',
      mode: 'subagent' as const,
      model: DEFAULT_MODEL,
      prompt: DOC_SYNC_PROMPT,
      tools: {
        ...BASE_TOOLS,
        write: true,
        edit: true,
      },
    },
    release: {
      description: 'Generate release notes from commits',
      mode: 'subagent' as const,
      model: DEFAULT_MODEL,
      prompt: RELEASE_PROMPT,
      tools: BASE_TOOLS,
    },
  };
};
