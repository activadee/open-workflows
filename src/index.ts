import type { Plugin } from '@opencode-ai/plugin';

import { tools } from './tools';

export const plugin: Plugin = async () => {
  return {
    tool: tools,

    event: async ({ event: _event }) => {},

    'chat.params': async (input, output) => {
      const structuredPatterns = [
        'pr-review',
        'issue-label',
        'doc-sync',
        'release-notes',
        'Review PR',
        'Label issue',
        'Sync documentation',
        'Create release',
      ];

      const messageContent = JSON.stringify(input.message || '');
      if (structuredPatterns.some((p) => messageContent.includes(p))) {
        output.temperature = 0.2;
      }
    },

    'tool.execute.before': async (_input) => {},

    'tool.execute.after': async (_input, _output) => {},
  };
};

export default plugin;
