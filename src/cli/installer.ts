import * as fs from 'fs';
import * as path from 'path';
import {
  AUTH_WORKFLOW,
  PR_REVIEW,
  ISSUE_LABEL,
  DOC_SYNC,
  RELEASE,
  WORKFLOW_FILE_MAP,
  type WorkflowType,
} from './templates';
import { SKILLS, SKILL_NAMES } from '../skills';

const WORKFLOW_GENERATORS: Record<string, (useOAuth: boolean) => string> = {
  'pr-review': PR_REVIEW,
  'issue-label': ISSUE_LABEL,
  'doc-sync': DOC_SYNC,
  release: RELEASE,
};

export interface ExistingFile {
  type: 'workflow' | 'skill' | 'auth';
  name: string;
  path: string;
}

export function checkExistingWorkflows(options: { workflows: WorkflowType[]; cwd?: string }): ExistingFile[] {
  const { workflows, cwd = process.cwd() } = options;
  const workflowDir = path.join(cwd, '.github', 'workflows');
  const existing: ExistingFile[] = [];

  for (const wf of workflows) {
    const fileName = WORKFLOW_FILE_MAP[wf];
    const filePath = path.join(workflowDir, `${fileName}.yml`);
    if (fs.existsSync(filePath)) {
      existing.push({
        type: 'workflow',
        name: wf,
        path: `.github/workflows/${fileName}.yml`,
      });
    }
  }

  return existing;
}

export function checkExistingSkills(options: { cwd?: string }): ExistingFile[] {
  const { cwd = process.cwd() } = options;
  const targetDir = path.join(cwd, '.opencode', 'skill');
  const existing: ExistingFile[] = [];

  for (const name of SKILL_NAMES) {
    const destPath = path.join(targetDir, name, 'SKILL.md');
    if (fs.existsSync(destPath)) {
      existing.push({
        type: 'skill',
        name,
        path: `.opencode/skill/${name}/SKILL.md`,
      });
    }
  }

  return existing;
}

export function checkExistingAuthWorkflow(options: { cwd?: string }): ExistingFile | null {
  const { cwd = process.cwd() } = options;
  const filePath = path.join(cwd, '.github', 'workflows', 'opencode-auth.yml');
  if (fs.existsSync(filePath)) {
    return {
      type: 'auth',
      name: 'opencode-auth',
      path: '.github/workflows/opencode-auth.yml',
    };
  }
  return null;
}

export interface InstallResult {
  type: 'workflow' | 'skill' | 'config' | 'auth';
  name: string;
  status: 'created' | 'skipped' | 'overwritten' | 'error';
  path: string;
  message: string;
}

export interface InstallOptions {
  workflows: WorkflowType[];
  cwd?: string;
  useOAuth?: boolean;
  override?: boolean;
  overrideNames?: Set<string>;
}

export function installWorkflows(options: InstallOptions): InstallResult[] {
  const { workflows, cwd = process.cwd(), useOAuth = false, override = false, overrideNames } = options;
  const results: InstallResult[] = [];
  const workflowDir = path.join(cwd, '.github', 'workflows');

  if (!fs.existsSync(workflowDir)) {
    fs.mkdirSync(workflowDir, { recursive: true });
  }

  for (const wf of workflows) {
    const fileName = WORKFLOW_FILE_MAP[wf];
    const generator = WORKFLOW_GENERATORS[fileName];
    const filePath = path.join(workflowDir, `${fileName}.yml`);

    if (!generator) {
      results.push({
        type: 'workflow',
        name: wf,
        status: 'error',
        path: filePath,
        message: `Unknown workflow: ${wf}`,
      });
      continue;
    }

    const content = generator(useOAuth);

    if (!content) {
      results.push({
        type: 'workflow',
        name: wf,
        status: 'error',
        path: filePath,
        message: `Unknown workflow: ${wf}`,
      });
      continue;
    }

    const fileExists = fs.existsSync(filePath);
    const shouldOverride = override || overrideNames?.has(wf);
    
    if (fileExists && !shouldOverride) {
      results.push({
        type: 'workflow',
        name: wf,
        status: 'skipped',
        path: `.github/workflows/${fileName}.yml`,
        message: `Skipped: already exists`,
      });
      continue;
    }

    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      results.push({
        type: 'workflow',
        name: wf,
        status: fileExists ? 'overwritten' : 'created',
        path: `.github/workflows/${fileName}.yml`,
        message: fileExists ? 'Overwritten successfully' : 'Created successfully',
      });
    } catch (error) {
      results.push({
        type: 'workflow',
        name: wf,
        status: 'error',
        path: filePath,
        message: `Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  return results;
}

export function installAuthWorkflow(options: { cwd?: string; override?: boolean }): InstallResult {
  const { cwd = process.cwd(), override = false } = options;
  const workflowDir = path.join(cwd, '.github', 'workflows');
  const filePath = path.join(workflowDir, 'opencode-auth.yml');

  if (!fs.existsSync(workflowDir)) {
    fs.mkdirSync(workflowDir, { recursive: true });
  }

  const fileExists = fs.existsSync(filePath);
  if (fileExists && !override) {
    return {
      type: 'auth',
      name: 'opencode-auth',
      status: 'skipped',
      path: '.github/workflows/opencode-auth.yml',
      message: 'Skipped: already exists',
    };
  }

  try {
    fs.writeFileSync(filePath, AUTH_WORKFLOW, 'utf-8');
    return {
      type: 'auth',
      name: 'opencode-auth',
      status: fileExists ? 'overwritten' : 'created',
      path: '.github/workflows/opencode-auth.yml',
      message: fileExists ? 'Overwritten successfully' : 'Created successfully',
    };
  } catch (error) {
    return {
      type: 'auth',
      name: 'opencode-auth',
      status: 'error',
      path: filePath,
      message: `Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export function installSkills(options: { cwd?: string; override?: boolean; overrideNames?: Set<string> }): InstallResult[] {
  const { cwd = process.cwd(), override = false, overrideNames } = options;
  const results: InstallResult[] = [];
  const targetDir = path.join(cwd, '.opencode', 'skill');

  for (const name of SKILL_NAMES) {
    const skill = SKILLS[name];
    const destPath = path.join(targetDir, name, 'SKILL.md');

    const fileExists = fs.existsSync(destPath);
    const shouldOverride = override || overrideNames?.has(name);
    
    if (fileExists && !shouldOverride) {
      results.push({
        type: 'skill',
        name,
        status: 'skipped',
        path: `.opencode/skill/${name}/SKILL.md`,
        message: `Skipped: already exists`,
      });
      continue;
    }

    try {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.writeFileSync(destPath, skill.content, 'utf-8');
      results.push({
        type: 'skill',
        name,
        status: fileExists ? 'overwritten' : 'created',
        path: `.opencode/skill/${name}/SKILL.md`,
        message: fileExists ? 'Overwritten successfully' : 'Created successfully',
      });
    } catch (error) {
      results.push({
        type: 'skill',
        name,
        status: 'error',
        path: destPath,
        message: `Failed to write: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  return results;
}

export function createOpencodeConfig(cwd: string = process.cwd()): { created: boolean; path: string } {
  const opencodeDir = path.join(cwd, '.opencode');
  const configPath = path.join(opencodeDir, 'opencode.json');
  const pluginEntry = '@activade/open-workflows';

  const defaultConfig = {
    $schema: 'https://opencode.ai/config.json',
    model: 'anthropic/claude-sonnet-4-5',
    small_model: 'anthropic/claude-haiku-4-5',
    plugin: [pluginEntry],
    permission: {
      "external_directory": "allow",
      skill: {
        'pr-review': 'allow',
        'issue-label': 'allow',
        'doc-sync': 'allow',
        'release-notes': 'allow',
      },
    },
  };

  if (fs.existsSync(configPath)) {
    try {
      const existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (typeof existingConfig === 'object' && existingConfig !== null) {
        if (!Array.isArray(existingConfig.plugin)) {
          existingConfig.plugin = [];
        }
        if (!existingConfig.plugin.includes(pluginEntry)) {
          existingConfig.plugin.push(pluginEntry);
        }
        if (!existingConfig.model) {
          existingConfig.model = defaultConfig.model;
        }
        if (!existingConfig.small_model) {
          existingConfig.small_model = defaultConfig.small_model;
        }
        if (!existingConfig.permission?.skill) {
          existingConfig.permission = {
            ...existingConfig.permission,
            skill: defaultConfig.permission.skill,
          };
        }
        fs.writeFileSync(configPath, JSON.stringify(existingConfig, null, 2), 'utf-8');
        return { created: false, path: '.opencode/opencode.json' };
      }
    } catch {}
  }

  if (!fs.existsSync(opencodeDir)) {
    fs.mkdirSync(opencodeDir, { recursive: true });
  }

  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
  return { created: true, path: '.opencode/opencode.json' };
}
