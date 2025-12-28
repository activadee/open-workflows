import { LABEL_PROMPT } from './prompt';
import { AgentConfig } from '@opencode-ai/sdk';

export const labelAgentConfig: AgentConfig = {
  description: 'Automatically label GitHub issues',
  mode: 'primary' as const,
  model: 'minimax/MiniMax-M2.1',
  prompt: LABEL_PROMPT,
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
    apply_labels: true,
  },
};
