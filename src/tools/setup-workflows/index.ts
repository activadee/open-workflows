import * as fs from 'fs';
import * as path from 'path';

import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';

import { WORKFLOWS } from './templates';
import { SetupWorkflowsSchema } from './schema';

export const setupWorkflowsTool: ToolDefinition = tool({
  description: 'Set up GitHub Actions workflows for open-workflows agents.',
  args: SetupWorkflowsSchema.shape,
  async execute(args) {
    const { workflows } = SetupWorkflowsSchema.parse(args);
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
      if (fs.existsSync(filePath)) {
        results.push(`Skipped: .github/workflows/${fileName}.yml (already exists)`);
        continue;
      }
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
