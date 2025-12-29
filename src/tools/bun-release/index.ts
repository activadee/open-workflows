import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';
import { BunReleaseSchema } from './schema';

function extractVersion(tag: string): string {
  return tag.startsWith('v') ? tag.slice(1) : tag;
}

export const bunReleaseTool: ToolDefinition = tool({
  description: 'Release a package: bump version with bun pm version, push to repo with tags, and publish to npm.',
  args: BunReleaseSchema.shape,
  async execute(args) {
    const { version } = BunReleaseSchema.parse(args);

    const results: string[] = [];
    const versionArg = extractVersion(version);

    try {
      await Bun.$`bun pm version ${versionArg}`.quiet();
      results.push(`Bumped version to ${versionArg}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.push(`Failed to bump version: ${errorMsg}`);
      return results.join('\n');
    }

    try {
      await Bun.$`git push`.quiet();
      await Bun.$`git push --tags`.quiet();
      results.push('Pushed changes and tags to remote');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.push(`Failed to push to remote: ${errorMsg}`);
      return results.join('\n');
    }

    try {
      await Bun.$`bun publish --access public`.quiet();
      results.push(`Published ${versionArg} to npm`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.push(`Failed to publish to npm: ${errorMsg}`);
      return results.join('\n');
    }

    results.push(`Release ${versionArg} complete`);
    return results.join('\n');
  },
});
