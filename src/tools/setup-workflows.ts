import * as fs from 'fs';
import * as path from 'path';

import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';

import { WORKFLOWS } from '../workflows/templates';

export const setupWorkflowsTool: ToolDefinition = tool({
  description: 'Set up GitHub Actions workflows for open-workflows agents.',
  args: {
    workflows: tool.schema
      .array(tool.schema.enum(['review', 'label', 'doc-sync', 'release']))
      .describe('Which workflows to install'),
  },
  async execute(args) {
    const { workflows } = args;
    const results: string[] = [];

    const workflowDir = path.join(process.cwd(), '.github', 'workflows');

    if (!fs.existsSync(workflowDir)) {
      fs.mkdirSync(workflowDir, { recursive: true });
    }

    const workflowMap: Record<string, string> = {
      review: 'pr-review',
      label: 'issue-label',
      'doc-sync': 'doc-sync',
      release: 'release',
    };

    for (const wf of workflows) {
      const fileName = workflowMap[wf];
      const content = WORKFLOWS[fileName as keyof typeof WORKFLOWS];

      if (!content) {
        results.push(`Unknown workflow: ${wf}`);
        continue;
      }

      const filePath = path.join(workflowDir, `${fileName}.yml`);
      fs.writeFileSync(filePath, content, 'utf-8');
      results.push(`Created: .github/workflows/${fileName}.yml`);
    }

    results.push('');
    results.push('Next steps:');
    results.push('1. Add MINIMAX_API_KEY secret: gh secret set MINIMAX_API_KEY');
    results.push('2. Commit and push the workflow files');

    return results.join('\n');
  },
});
