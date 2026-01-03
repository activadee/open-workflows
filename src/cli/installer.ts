import * as fs from 'fs';
import * as path from 'path';
import {
  PR_REVIEW,
  ISSUE_LABEL,
  DOC_SYNC,
  RELEASE,
  OPENCODE_AUTH,
  WORKFLOW_FILE_MAP,
  type WorkflowType,
} from './templates';

const WORKFLOW_GENERATORS: Record<string, (useOAuth: boolean) => string> = {
  'pr-review': PR_REVIEW,
  'issue-label': ISSUE_LABEL,
  'doc-sync': DOC_SYNC,
  release: RELEASE,
  'opencode-auth': OPENCODE_AUTH,
};

export interface ExistingFile {
  type: 'workflow';
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

export interface InstallResult {
  type: 'workflow';
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
