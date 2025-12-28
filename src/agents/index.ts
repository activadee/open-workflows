import type { Hooks } from '@opencode-ai/plugin';

import { docSyncAgentConfig } from './doc-sync/index';
import { labelAgentConfig } from './label/index';
import { releaseAgentConfig } from './release/index';
import { reviewAgentConfig } from './review/index';

export const configureAgents: NonNullable<Hooks['config']> = async (cfg) => {
  cfg.agent = {
    ...cfg.agent,
    review: reviewAgentConfig,
    label: labelAgentConfig,
    'doc-sync': docSyncAgentConfig,
    release: releaseAgentConfig,
  };
};
