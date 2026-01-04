import { tool } from "@opencode-ai/plugin"

const z = tool.schema;

const ArgsSchema = z.object({
  repository: z.string().regex(/^[^/]+\/[^/]+$/).describe('GitHub repository in owner/repo format'),
  issueNumber: z.number().int().positive().describe('Issue number'),
  labels: z.array(z.string()).describe('Array of existing label names to apply (max 3)'),
  newLabels: z.array(
    z.object({
      name: z.string().describe('Label name'),
      color: z.string().describe('Hex color without #'),
      description: z.string().describe('Brief description'),
    })
  ).optional().describe('New labels to create before applying'),
  explanation: z.string().describe('Brief explanation of label choices'),
}).superRefine((value, ctx) => {
  const labelCount = value.labels.length + (value.newLabels?.length ?? 0);

  if (labelCount === 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['labels'],
      message: 'At least one label or new label must be provided.',
    });
  }

  if (labelCount > 3) {
    ctx.addIssue({
      code: 'custom',
      path: ['labels'],
      message: 'You may apply at most three labels in total.',
    });
  }
});

export default {
  description: "Apply labels to a GitHub issue. Can create new labels if needed.",
  args: ArgsSchema.shape,
  async execute(args: unknown) {
    const validated = ArgsSchema.parse(args);
    const { repository, issueNumber, labels, newLabels, explanation } = validated;

    const results: string[] = [];

    if (newLabels && newLabels.length > 0) {
      for (const label of newLabels) {
        try {
          await Bun.$`gh label create ${label.name} --color ${label.color} --description ${label.description} --repo ${repository}`.quiet();
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
};
