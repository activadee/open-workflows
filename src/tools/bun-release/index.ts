import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';
import { BunReleaseSchema } from './schema';
import { withRetry, checkAborted } from '../utils/retry';

function extractVersion(tag: string): string {
  return tag.startsWith('v') ? tag.slice(1) : tag;
}

export const bunReleaseTool: ToolDefinition = tool({
  description: 'Release a package: bump version with bun pm version, push to repo with tags, and publish to npm.',
  args: BunReleaseSchema.shape,
  async execute(args, ctx) {
    const { version } = BunReleaseSchema.parse(args);
    const signal = ctx?.abort;

    checkAborted(signal);

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

    checkAborted(signal);

    try {
      await withRetry(() => Bun.$`git push`.quiet(), { signal });
      await withRetry(() => Bun.$`git push --tags`.quiet(), { signal });
      results.push('Pushed changes and tags to remote');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.push(`Failed to push to remote: ${errorMsg}`);
      return results.join('\n');
    }

    checkAborted(signal);

    try {
      const packOutput = await Bun.$`bun pm pack`.text();
      const tarballMatch = packOutput.match(/([^\s]+\.tgz)/);
      if (!tarballMatch) {
        results.push('Failed to find tarball from bun pm pack output');
        return results.join('\n');
      }
      const tarball = tarballMatch[1];
      results.push(`Packed ${tarball}`);

      checkAborted(signal);
      await withRetry(() => Bun.$`npm config set registry https://registry.npmjs.org`.quiet(), { signal });
      await withRetry(() => Bun.$`npm install -g npm@latest`.quiet(), { signal });
      await withRetry(() => Bun.$`npm publish ${tarball} --access public --provenance`.quiet(), { signal });
      await Bun.$`rm ${tarball}`.quiet();
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
