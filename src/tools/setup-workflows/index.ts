import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';

import { SetupWorkflowsSchema } from './schema';
import { installWorkflows, type WorkflowType } from './installer';

export const setupWorkflowsTool: ToolDefinition = tool({
  description: 'Set up GitHub Actions workflows for open-workflows agents.',
  args: SetupWorkflowsSchema.shape,
  async execute(args) {
    const { workflows } = SetupWorkflowsSchema.parse(args);
    const results = installWorkflows({ workflows: workflows as WorkflowType[] });
    
    const output: string[] = [];
    
    for (const result of results) {
      if (result.status === 'created') {
        output.push(`Created: ${result.path}`);
      } else if (result.status === 'skipped') {
        output.push(`Skipped: ${result.path} (already exists)`);
      } else {
        output.push(result.message);
      }
    }

    output.push('');
    output.push('Next steps:');
    output.push('1. Add MINIMAX_API_KEY secret: gh secret set MINIMAX_API_KEY');
    output.push('2. Commit and push the workflow files');

    return output.join('\n');
  },
});
