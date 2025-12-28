import * as fs from 'fs';
import * as path from 'path';

import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';
import { CommitDocsSchema } from './schema';

export const commitDocsTool: ToolDefinition = tool({
  description: 'Commit documentation updates to the PR branch.',
  args: CommitDocsSchema.shape,
  async execute(args) {
    const { files, message } = CommitDocsSchema.parse(args);

    const results: string[] = [];

    for (const file of files) {
      const filePath = path.join(process.cwd(), file.path);
      const resolvedPath = path.normalize(filePath);

      // Prevent path traversal attacks - ensure path stays within repository
      if (!resolvedPath.startsWith(process.cwd())) {
        results.push(`Security error: Path "${file.path}" escapes repository root`);
        return results.join('\n');
      }

      const dir = path.dirname(resolvedPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      try {
        fs.writeFileSync(filePath, file.content, 'utf-8');
        results.push(`Updated: ${file.path}`);
      } catch (error) {
        results.push(`Failed to write ${file.path}: ${error instanceof Error ? error.message : String(error)}`);
        // Continue with remaining files instead of aborting
      }
    }

    const filePaths = files.map((f) => f.path);
    const commitMessage = `[skip ci] docs: ${message}`;

    // Git operations: add -> commit -> push (stop on first error)
    try {
      await Bun.$`git add -- ${filePaths}`.quiet();
    } catch (error) {
      results.push(`Git add failed: ${error instanceof Error ? error.message : String(error)}`);
      return results.join('\n');
    }

    try {
      await Bun.$`git commit -m ${commitMessage}`.quiet();
    } catch (error) {
      results.push(`Git commit failed: ${error instanceof Error ? error.message : String(error)}`);
      return results.join('\n');
    }

    try {
      await Bun.$`git push`.quiet();
    } catch (error) {
      results.push(`Git push failed: ${error instanceof Error ? error.message : String(error)}`);
      return results.join('\n');
    }

    results.push(`Committed and pushed: ${commitMessage}`);

    return results.join('\n');
  },
});
