import type { Plugin } from '@opencode-ai/plugin';

import { tools } from './tools';

const WORKFLOW_TOOLS = ['submit_review', 'apply_labels', 'github_release', 'bun_release'];

export const plugin: Plugin = async () => {
  return {
    tool: tools,

    event: async ({ event }) => {
      if (event.type === 'session.error') {
        console.error(`[open-workflows] Session error:`, event.properties);
      }
    },

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

    'tool.execute.before': async (input) => {
      if (WORKFLOW_TOOLS.includes(input.tool)) {
        console.log(`[open-workflows] Executing ${input.tool}...`);
      }
    },

    'tool.execute.after': async (input, output) => {
      if (WORKFLOW_TOOLS.includes(input.tool)) {
        console.log(`[open-workflows] ${input.tool}: ${output.title}`);
      }
    },
  };
};

export default plugin;
