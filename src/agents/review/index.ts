import { REVIEW_PROMPT } from './prompt';
import { AgentConfig } from '@opencode-ai/sdk';

export const reviewAgentConfig: AgentConfig = {
  description: 'AI-powered pull request code review',
  mode: 'primary' as const,
  model: 'minimax/MiniMax-M2.1',
  prompt: REVIEW_PROMPT,
  permission: {
    external_directory: 'deny'
  },
  tools: {
    bash: true,
    read: true,
    glob: true,
    grep: true,
    todoread: true,
    todowrite: true,
    write: false,
    edit: false,
    submit_review: true,
  },
};
