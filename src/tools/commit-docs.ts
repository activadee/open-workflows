import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';

export const commitDocsTool: ToolDefinition = tool({
  description: 'Commit documentation updates to the PR branch.',
  args: {
    files: tool.schema
      .array(
        tool.schema.object({
          path: tool.schema.string().describe('File path relative to repo root'),
          content: tool.schema.string().describe('New file content'),
        })
      )
      .describe('Files to update'),
    message: tool.schema.string().describe('Commit message (will be prefixed with [skip ci] docs:)'),
  },
  async execute(args) {
    const { files, message } = args;

    if (!files || files.length === 0) {
      return 'No files to update';
    }

    const results: string[] = [];

    for (const file of files) {
      const filePath = path.join(process.cwd(), file.path);
      const dir = path.dirname(filePath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, file.content, 'utf-8');
      results.push(`Updated: ${file.path}`);
    }

    const filePaths = files.map((f) => f.path).join(' ');

    execSync(`git add ${filePaths}`, { encoding: 'utf-8' });
    execSync(`git commit -m "[skip ci] docs: ${message}"`, { encoding: 'utf-8' });
    execSync('git push', { encoding: 'utf-8' });

    results.push(`Committed and pushed: [skip ci] docs: ${message}`);

    return results.join('\n');
  },
});
