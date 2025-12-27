import { execSync } from 'child_process';

import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';

export const applyLabelsTool: ToolDefinition = tool({
  description: 'Apply labels to a GitHub issue.',
  args: {
    labels: tool.schema
      .array(tool.schema.string())
      .describe('Array of existing label names to apply (max 3)'),
    newLabels: tool.schema
      .array(
        tool.schema.object({
          name: tool.schema.string().describe('Label name'),
          color: tool.schema.string().describe('Hex color without #'),
          description: tool.schema.string().describe('Brief description'),
        })
      )
      .optional()
      .describe('New labels to create before applying'),
    explanation: tool.schema.string().describe('Brief explanation of label choices'),
  },
  async execute(args) {
    const { labels, newLabels, explanation } = args;

    const repo = process.env.GITHUB_REPOSITORY;
    const issueNumber = parseInt(process.env.ISSUE_NUMBER || '', 10);

    if (!repo) throw new Error('GITHUB_REPOSITORY environment variable is required');
    if (!issueNumber) throw new Error('ISSUE_NUMBER environment variable is required');

    const results: string[] = [];

    if (newLabels && newLabels.length > 0) {
      for (const label of newLabels) {
        try {
          execSync(
            `gh label create "${label.name}" --color "${label.color}" --description "${label.description}" --repo "${repo}"`,
            { encoding: 'utf-8', stdio: 'pipe' }
          );
          results.push(`Created label: ${label.name}`);
        } catch {
          results.push(`Label already exists or failed to create: ${label.name}`);
        }
      }
    }

    const allLabels = [...labels];
    if (newLabels) {
      for (const label of newLabels) {
        if (!allLabels.includes(label.name)) {
          allLabels.push(label.name);
        }
      }
    }

    const labelList = allLabels.slice(0, 3).join(',');
    execSync(`gh issue edit ${issueNumber} --add-label "${labelList}" --repo "${repo}"`, { encoding: 'utf-8' });

    results.push(`Applied labels: ${labelList}`);
    results.push(`Reason: ${explanation}`);

    return results.join('\n');
  },
});
