import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';
import { ApplyLabelsSchema } from './schema';
import { withRetry, checkAborted } from '../utils/retry';

export const applyLabelsTool: ToolDefinition = tool({
  description: 'Apply labels to a GitHub issue.',
  args: ApplyLabelsSchema.shape,
  async execute(args, ctx) {
    const { repository, issueNumber, labels, newLabels, explanation } = ApplyLabelsSchema.parse(args);
    const signal = ctx?.abort;

    checkAborted(signal);

    const results: string[] = [];

    if (newLabels && newLabels.length > 0) {
      for (const label of newLabels) {
        checkAborted(signal);
        try {
          await withRetry(
            () =>
              Bun.$`gh label create ${label.name} --color ${label.color} --description ${label.description} --repo ${repository}`.quiet(),
            { signal }
          );
          results.push(`Created label: ${label.name}`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
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

    checkAborted(signal);

    const labelList = allLabels.slice(0, 3).join(',');
    try {
      await withRetry(
        () => Bun.$`gh issue edit ${issueNumber} --add-label ${labelList} --repo ${repository}`.quiet(),
        { signal }
      );
    } catch {
      results.push(`Failed to apply labels: ${labelList}`);
      return results.join('\n');
    }

    results.push(`Applied labels: ${labelList}`);
    results.push(`Reason: ${explanation}`);

    return results.join('\n');
  },
});
