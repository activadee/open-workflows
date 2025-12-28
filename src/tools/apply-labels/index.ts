import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';
import { ApplyLabelsSchema } from './schema';

export const applyLabelsTool: ToolDefinition = tool({
  description: 'Apply labels to a GitHub issue.',
  args: ApplyLabelsSchema.shape,
  async execute(args) {
    const { repository, issueNumber, labels, newLabels, explanation } = ApplyLabelsSchema.parse(args);

    const results: string[] = [];

    if (newLabels && newLabels.length > 0) {
      for (const label of newLabels) {
        try {
          await Bun.$`gh label create ${label.name} --color ${label.color} --description ${label.description} --repo ${repository}`.quiet();
          results.push(`Created label: ${label.name}`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          // Check if it's a "already exists" error vs other failures
          if (errorMsg.includes('already exists') || errorMsg.includes('Conflict')) {
            results.push(`Label already exists: ${label.name}`);
          } else {
            results.push(`Failed to create label "${label.name}": ${errorMsg}`);
          }
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
    try {
      await Bun.$`gh issue edit ${issueNumber} --add-label ${labelList} --repo ${repository}`.quiet();
    } catch {
      results.push(`Failed to apply labels: ${labelList}`);
      return results.join('\n');
    }

    results.push(`Applied labels: ${labelList}`);
    results.push(`Reason: ${explanation}`);

    return results.join('\n');
  },
});
