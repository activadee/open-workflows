import { DOC_SYNC_PROMPT } from './prompt';
import { AgentConfig } from '@opencode-ai/sdk';

export const docSyncAgentConfig: AgentConfig = {
  description: 'Sync documentation with code changes',
  mode: 'primary' as const,
  model: 'minimax/MiniMax-M2.1',
  prompt: DOC_SYNC_PROMPT,
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
    write: true,
    edit: true,
    commit_docs: true,
  },
};
