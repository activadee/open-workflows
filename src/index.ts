import type { Plugin } from '@opencode-ai/plugin';

import { configureAgents } from './agents';
import { tools } from './tools';

export const plugin: Plugin = async () => {
  return {
    config: configureAgents,
    tool: tools,
  };
};

export default plugin;
