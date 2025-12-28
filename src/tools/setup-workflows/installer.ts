import * as fs from 'fs';
import * as path from 'path';
import { WORKFLOWS } from './templates';

export type WorkflowType = 'review' | 'label' | 'doc-sync' | 'release';

export interface InstallResult {
  workflow: string;
  status: 'created' | 'skipped' | 'error';
  path: string;
  message: string;
}

export interface InstallOptions {
  workflows: WorkflowType[];
  cwd?: string;
}

const WORKFLOW_FILE_MAP: Record<WorkflowType, string> = {
  review: 'pr-review',
  label: 'issue-label',
  'doc-sync': 'doc-sync',
  release: 'release',
};

export function installWorkflows(options: InstallOptions): InstallResult[] {
  const { workflows, cwd = process.cwd() } = options;
  const results: InstallResult[] = [];
  const workflowDir = path.join(cwd, '.github', 'workflows');

  // Ensure directory exists
  if (!fs.existsSync(workflowDir)) {
    fs.mkdirSync(workflowDir, { recursive: true });
  }

  for (const wf of workflows) {
    const fileName = WORKFLOW_FILE_MAP[wf];
    const content = WORKFLOWS[fileName as keyof typeof WORKFLOWS];
    const filePath = path.join(workflowDir, `${fileName}.yml`);

    if (!content) {
      results.push({
        workflow: wf,
        status: 'error',
        path: filePath,
        message: `Unknown workflow: ${wf}`,
      });
      continue;
    }

    if (fs.existsSync(filePath)) {
      results.push({
        workflow: wf,
        status: 'skipped',
        path: `.github/workflows/${fileName}.yml`,
        message: `Skipped: already exists`,
      });
      continue;
    }

    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      results.push({
        workflow: wf,
        status: 'created',
        path: `.github/workflows/${fileName}.yml`,
        message: `Created successfully`,
      });
    } catch (error) {
      results.push({
        workflow: wf,
        status: 'error',
        path: filePath,
        message: `Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  return results;
}

export function createOpencodeConfig(cwd: string = process.cwd()): { created: boolean; path: string } {
  const opencodeDir = path.join(cwd, '.opencode');
  const configPath = path.join(opencodeDir, 'opencode.json');
  const pluginEntry = '@activadee-ai/open-workflows@latest';

  if (fs.existsSync(configPath)) {
    // Merge plugin into existing config
    try {
      const existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (typeof existingConfig === 'object' && existingConfig !== null && Array.isArray(existingConfig.plugin)) {
        const plugins = existingConfig.plugin;
        if (!plugins.includes(pluginEntry)) {
          plugins.push(pluginEntry);
          existingConfig.plugin = plugins;
          fs.writeFileSync(configPath, JSON.stringify(existingConfig, null, 2), 'utf-8');
        }
      } else {
        // Invalid config structure, overwrite with new config
        const config = {
          $schema: 'https://opencode.ai/config.json',
          plugin: [pluginEntry],
        };
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        return { created: true, path: '.opencode/opencode.json' };
      }
      return { created: false, path: '.opencode/opencode.json' };
    } catch (error) {
      // If parsing fails, overwrite with new config
      const config = {
        $schema: 'https://opencode.ai/config.json',
        plugin: [pluginEntry],
      };
      try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        return { created: true, path: '.opencode/opencode.json' };
      } catch (writeError) {
        throw new Error(`Failed to write config: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`);
      }
    }
  }

  if (!fs.existsSync(opencodeDir)) {
    fs.mkdirSync(opencodeDir, { recursive: true });
  }

  const config = {
    $schema: 'https://opencode.ai/config.json',
    plugin: [pluginEntry],
  };

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    return { created: true, path: '.opencode/opencode.json' };
  } catch (error) {
    throw new Error(`Failed to write config: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
