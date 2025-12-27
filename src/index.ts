import type { Plugin } from '@opencode-ai/plugin';

import { configureAgents } from './agents/index';
import { tools } from './tools/index';

export const plugin: Plugin = async () => {
  return {
    config: configureAgents,
    tool: tools,
  };
};

export default plugin;
