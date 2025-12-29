import { RELEASE_PROMPT } from './prompt';
import { AgentConfig } from '@opencode-ai/sdk';

export const releaseAgentConfig: AgentConfig = {
  description: 'Determine version, publish to npm, and create GitHub release',
  mode: 'primary',
  model: 'minimax/MiniMax-M2.1',
  prompt: RELEASE_PROMPT,
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
    bun_release: true,
    github_release: true,
  },
};
