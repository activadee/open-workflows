import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';
import { GithubReleaseSchema } from './schema';
import { withRetry, checkAborted } from '../utils/retry';

function formatReleaseNotes(notes: string[]): string {
  return notes
    .map((note) => {
      const trimmed = note.trim();
      if (trimmed.startsWith('-')) {
        return trimmed;
      }
      return `- ${trimmed}`;
    })
    .join('\n');
}

export const githubReleaseTool: ToolDefinition = tool({
  description: 'Create a GitHub release with release notes.',
  args: GithubReleaseSchema.shape,
  async execute(args, ctx) {
    const { repository, tag, notes, title, prerelease, draft } = GithubReleaseSchema.parse(args);
    const signal = ctx?.abort;

    checkAborted(signal);

    const results: string[] = [];
    const releaseTitle = title ?? tag;
    const releaseNotes = formatReleaseNotes(notes);

    const ghArgs: string[] = ['release', 'create', tag];

    ghArgs.push('--title', releaseTitle);
    ghArgs.push('--notes', releaseNotes);
    ghArgs.push('--repo', repository);

    if (prerelease) {
      ghArgs.push('--prerelease');
    }

    if (draft) {
      ghArgs.push('--draft');
    }

    try {
      const result = await withRetry(() => Bun.$`gh ${ghArgs}`.text(), { signal });
      results.push(`Created release: ${tag}`);

      const releaseUrl = result.trim();
      if (releaseUrl) {
        results.push(`Release URL: ${releaseUrl}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.push(`Failed to create release: ${errorMsg}`);
      return results.join('\n');
    }

    return results.join('\n');
  },
});
