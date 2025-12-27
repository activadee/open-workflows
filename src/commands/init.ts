import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import pc from 'picocolors';
import { log, banner } from '../lib/logger.js';

// Available workflows with their metadata
const AVAILABLE_WORKFLOWS = [
  {
    id: 'doc-sync',
    name: 'Doc Sync',
    description: 'Automatically sync documentation with code changes',
    file: 'doc-sync.yml',
  },
  {
    id: 'label',
    name: 'Issue Label',
    description: 'Automatically label GitHub issues',
    file: 'issue-label.yml',
  },
  {
    id: 'release',
    name: 'Release',
    description: 'Generate release notes and manage releases',
    file: 'release.yml',
  },
  {
    id: 'review',
    name: 'PR Review',
    description: 'AI-powered pull request reviews',
    file: 'pr-review.yml',
  },
] as const;

type WorkflowId = (typeof AVAILABLE_WORKFLOWS)[number]['id'];

interface InitOptions {
  select?: string[];
  skip?: string[];
  all?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
}

// Load workflow template content
function loadWorkflowTemplate(workflowId: WorkflowId): string {
  const workflow = AVAILABLE_WORKFLOWS.find(w => w.id === workflowId);
  if (!workflow) {
    throw new Error(`Unknown workflow: ${workflowId}`);
  }

  // Try loading from local src/workflows first
  const templatePath = path.join(process.cwd(), 'src', 'workflows', workflow.file);
  if (fs.existsSync(templatePath)) {
    return fs.readFileSync(templatePath, 'utf-8');
  }

  // Try loading from installed package location
  try {
    const packageTemplatePath = path.join(path.dirname(require.resolve('@activadee-ai/open-workflows')), 'src', 'workflows', workflow.file);
    if (fs.existsSync(packageTemplatePath)) {
      return fs.readFileSync(packageTemplatePath, 'utf-8');
    }
  } catch {
    // Package not installed or template not found
  }

  throw new Error(`Template not found for workflow: ${workflowId}`);
}

// Check if a workflow file already exists
function workflowFileExists(workflowId: WorkflowId, targetDir: string): boolean {
  const fileName = AVAILABLE_WORKFLOWS.find(w => w.id === workflowId)?.file;
  if (!fileName) return false;

  const filePath = path.join(targetDir, '.github', 'workflows', fileName);
  return fs.existsSync(filePath);
}

// Get list of existing workflow files in target directory
function getExistingWorkflows(targetDir: string): WorkflowId[] {
  const workflowsDir = path.join(targetDir, '.github', 'workflows');

  if (!fs.existsSync(workflowsDir)) {
    return [];
  }

  const existing: WorkflowId[] = [];
  const files = fs.readdirSync(workflowsDir);

  for (const workflow of AVAILABLE_WORKFLOWS) {
    if (files.includes(workflow.file)) {
      existing.push(workflow.id);
    }
  }

  return existing;
}

// Validate workflow selection
function validateWorkflowSelection(
  selected: WorkflowId[],
  skipped: WorkflowId[],
  allFlag: boolean
): { valid: boolean; error?: string } {
  // Check for conflicts between --all and --select
  if (allFlag && selected.length > 0) {
    return { valid: false, error: 'Cannot use --all with --select flags' };
  }

  // Check for invalid workflow names in --select
  const validIds = new Set(AVAILABLE_WORKFLOWS.map(w => w.id));
  for (const sel of selected) {
    if (!validIds.has(sel)) {
      return { valid: false, error: `Invalid workflow: ${sel}. Valid options: ${AVAILABLE_WORKFLOWS.map(w => w.id).join(', ')}` };
    }
  }

  // Check for invalid workflow names in --skip
  for (const skip of skipped) {
    if (!validIds.has(skip)) {
      return { valid: false, error: `Invalid workflow to skip: ${skip}. Valid options: ${AVAILABLE_WORKFLOWS.map(w => w.id).join(', ')}` };
    }
  }

  const allWorkflows = AVAILABLE_WORKFLOWS.map(w => w.id);
  const isSelectingAll = allFlag || (selected.length === allWorkflows.length && selected.every(s => allWorkflows.includes(s)));

  if (!isSelectingAll) {
    for (const sel of selected) {
      if (skipped.includes(sel)) {
        return { valid: false, error: `Workflow ${sel} cannot be both selected and skipped` };
      }
    }
  }

  return { valid: true };
}

// Parse workflow selection from options
function parseWorkflowSelection(options: InitOptions): { selected: WorkflowId[]; skipped: WorkflowId[] } {
  let selected: WorkflowId[] = [];
  let skipped: WorkflowId[] = [];

  if (options.all) {
    selected = [...AVAILABLE_WORKFLOWS.map(w => w.id)];
  } else {
    selected = (options.select || []) as WorkflowId[];
  }

  skipped = (options.skip || []) as WorkflowId[];

  return { selected, skipped };
}

// Arrow-key based checkbox selection for interactive mode
async function interactiveSelect(): Promise<WorkflowId[]> {
  // Verify we have a real TTY - exit if not
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Interactive mode requires a terminal. Use --select, --skip, or --all flags.');
  }

  const selected: WorkflowId[] = [];
  let allSelected = true;
  let cursorIndex = 0;
  const totalItems = AVAILABLE_WORKFLOWS.length + 3;

  const calculateMenuLines = (): string[] => {
    const lines: string[] = [];
    lines.push('');
    lines.push(pc.dim('═'.repeat(50)));
    lines.push('  Select workflows (↑/↓ to navigate, SPACE to toggle, ENTER to confirm)');
    lines.push(pc.dim('═'.repeat(50)));

    for (let i = 0; i < AVAILABLE_WORKFLOWS.length; i++) {
      const wf = AVAILABLE_WORKFLOWS[i];
      const isSelected = selected.includes(wf.id);
      const prefix = isSelected ? '[✓]' : '[ ]';
      const name = isSelected ? pc.green(wf.name) : wf.name;
      const marker = i === cursorIndex ? pc.cyan('▶') : ' ';
      lines.push(`  ${marker} ${prefix} ${i + 1}. ${name}`);
      lines.push(pc.dim(`     ${wf.description}`));
    }

    lines.push(pc.dim('─'.repeat(50)));
    
    const allMarker = AVAILABLE_WORKFLOWS.length === cursorIndex ? pc.cyan('▶') : ' ';
    const allText = allSelected ? '◉ Select All' : '○ Select All';
    lines.push(`  ${allMarker} ${allText}`);
    
    const confirmMarker = AVAILABLE_WORKFLOWS.length + 1 === cursorIndex ? pc.cyan('▶') : ' ';
    const confirmText = selected.length > 0 ? '● Confirm' : '○ Confirm (select workflows)';
    lines.push(`  ${confirmMarker} ${confirmText}`);
    
    const cancelMarker = AVAILABLE_WORKFLOWS.length + 2 === cursorIndex ? pc.cyan('▶') : ' ';
    lines.push(`  ${cancelMarker} ✕ Cancel`);
    
    lines.push(pc.dim('─'.repeat(50)));
    lines.push(`  Selected: ${selected.length}/${AVAILABLE_WORKFLOWS.length}`);
    
    return lines;
  };

  let lastLines = 0;

  // Import readline early for cursor management
  const readline = await import('readline');

  const displayMenu = (): void => {
    const lines = calculateMenuLines();
    const stdout = process.stdout;
    
    // Move cursor back to start of menu
    if (lastLines > 0) {
      // Cursor is on last menu line, so move up (lastLines - 1) to get to first line
      readline.default.moveCursor(stdout, 0, -(lastLines - 1));
      readline.default.cursorTo(stdout, 0);
      // Clear from cursor to bottom of screen
      readline.default.clearScreenDown(stdout);
    }
    
    // Write all lines joined with newlines
    stdout.write(lines.join('\n'));
    
    lastLines = lines.length;
  };

  return new Promise(async (resolve) => {
    // Hide cursor during interaction
    process.stdout.write('\x1b[?25l');
    
    const cleanup = () => {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      // Show cursor and move to new line
      process.stdout.write('\x1b[?25h\r\n');
    };

    // Set up keypress decoding for arrow keys
    readline.default.emitKeypressEvents(process.stdin);
    
    const handleKeypress = (str: string, key: { name: string; ctrl: boolean }): void => {
      // Handle Ctrl+C
      if (key.ctrl && key.name === 'c') {
        process.exit(0);
      }

      if (key.name === 'up' || key.name === 'k') {
        cursorIndex = (cursorIndex - 1 + totalItems) % totalItems;
        displayMenu();
      } else if (key.name === 'down' || key.name === 'j') {
        cursorIndex = (cursorIndex + 1) % totalItems;
        displayMenu();
      } else if (key.name === 'return' || key.name === 'enter') {
        if (cursorIndex === AVAILABLE_WORKFLOWS.length + 1) {
          if (selected.length === 0) {
            process.stdout.write('\x07'); // Bell sound
            return;
          }
          cleanup();
          resolve(selected);
        } else if (cursorIndex === AVAILABLE_WORKFLOWS.length + 2) {
          cleanup();
          resolve([]);
        }
      } else if (key.name === ' ' || key.name === 'space') {
        if (cursorIndex < AVAILABLE_WORKFLOWS.length) {
          const wf = AVAILABLE_WORKFLOWS[cursorIndex];
          const index = selected.indexOf(wf.id);
          if (index === -1) {
            selected.push(wf.id);
          } else {
            selected.splice(index, 1);
          }
          allSelected = selected.length === AVAILABLE_WORKFLOWS.length;
          displayMenu();
        } else if (cursorIndex === AVAILABLE_WORKFLOWS.length) {
          if (allSelected) {
            selected.length = 0;
            allSelected = false;
          } else {
            selected.push(...AVAILABLE_WORKFLOWS.map(w => w.id));
            allSelected = true;
          }
          displayMenu();
        }
      } else if (key.name === 'escape') {
        cleanup();
        resolve([]);
      }
    };
    
    // Set up raw mode for keypress handling
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('keypress', handleKeypress);

    displayMenu();
  });
}

// Confirm action with user
async function confirmAction(message: string): Promise<boolean> {
  const readline = await import('readline');

  const rl = readline.default.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`\n${message} [y/N] `, (answer) => {
      rl.close();
      const trimmed = answer.trim().toLowerCase();
      resolve(trimmed === 'y' || trimmed === 'yes');
    });
  });
}

// Generate workflow file content
function generateWorkflowContent(workflowId: WorkflowId): string {
  return loadWorkflowTemplate(workflowId);
}

// Write workflow file
function writeWorkflowFile(workflowId: WorkflowId, targetDir: string): { success: boolean; path: string; error?: string } {
  const fileName = AVAILABLE_WORKFLOWS.find(w => w.id === workflowId)?.file;
  if (!fileName) {
    return { success: false, path: '', error: 'Unknown workflow' };
  }

  const workflowsDir = path.join(targetDir, '.github', 'workflows');
  const filePath = path.join(workflowsDir, fileName);

  // Create .github/workflows directory if it doesn't exist
  if (!fs.existsSync(workflowsDir)) {
    fs.mkdirSync(workflowsDir, { recursive: true });
  }

  try {
    const content = generateWorkflowContent(workflowId);
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true, path: filePath };
  } catch (error) {
    return { success: false, path: filePath, error: String(error) };
  }
}

// Display preview of what will be created
function displayPreview(selected: WorkflowId[], targetDir: string): void {
  log.dim('═'.repeat(50));
  log.info('Preview: Files to be created/modified');
  log.dim('═'.repeat(50));

  const existingWorkflows = getExistingWorkflows(targetDir);

  for (const workflowId of selected) {
    const workflow = AVAILABLE_WORKFLOWS.find(w => w.id === workflowId);
    if (!workflow) continue;

    const filePath = path.join(targetDir, '.github', 'workflows', workflow.file);
    const exists = fs.existsSync(filePath);

    if (exists) {
      log.info(`${pc.yellow('MODIFY')} ${workflow.file}`);
      log.dim(`     ${filePath}`);
    } else {
      log.info(`${pc.green('CREATE')} ${workflow.file}`);
      log.dim(`     ${filePath}`);
    }
  }

  // Show existing files that won't be touched
  const existingNotSelected = existingWorkflows.filter(w => !selected.includes(w));
  if (existingNotSelected.length > 0) {
    log.dim('─'.repeat(50));
    log.info('Existing files (will be preserved):');
    for (const workflowId of existingNotSelected) {
      const workflow = AVAILABLE_WORKFLOWS.find(w => w.id === workflowId);
      if (!workflow) continue;
      log.dim(`  • ${workflow.file}`);
    }
  }
}

// Main init command
export const initCommand = new Command('init')
  .description('Initialize GitHub workflow files in your repository')
  .option('-s, --select <workflow>', 'Select a workflow to install (can be used multiple times)', (val) => {
    // Allow multiple --select flags
    return val;
  })
  .option('--skip <workflow>', 'Skip a workflow (can be used multiple times)', (val) => {
    return val;
  })
  .option('--all', 'Select all available workflows')
  .option('--dry-run', 'Preview what will be created without making changes')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (options: InitOptions) => {
    banner();

    // Handle non-interactive mode (when any flags are provided)
    const isInteractive = !options.select && !options.skip && !options.all;

    // Determine target directory
    const targetDir = process.cwd();

    // Check if we're in a git repository
    const gitDir = path.join(targetDir, '.git');
    if (!fs.existsSync(gitDir)) {
      log.warn('Not in a git repository. Workflow files will be created in the current directory.');
    }

    let selectedWorkflows: WorkflowId[] = [];

    // Interactive mode only works locally (no TTY in CI)
    if (isInteractive) {
      if (process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true' || !process.stdin.isTTY) {
        log.warn('Interactive mode requires a terminal. Use --all, --select, or --skip flags.');
        process.exit(1);
      }

      try {
        log.info('Welcome to open-workflows init!');
        log.info('This command will help you set up GitHub Actions workflows.');
        log.info('');

        selectedWorkflows = await interactiveSelect();

        if (selectedWorkflows.length === 0) {
          log.info('No workflows selected. Exiting.');
          return;
        }
      } catch (error) {
        log.error(error instanceof Error ? error.message : 'Failed to start interactive mode');
        log.info('Use --all, --select, or --skip flags for non-interactive usage.');
        process.exit(1);
      }
    } else {
      // Non-interactive mode
      const { selected, skipped } = parseWorkflowSelection(options);

      // Apply --all or use explicit selection
      if (options.all) {
        selectedWorkflows = [...AVAILABLE_WORKFLOWS.map(w => w.id)];
      } else {
        selectedWorkflows = selected;
      }

      // Apply skips
      selectedWorkflows = selectedWorkflows.filter(w => !skipped.includes(w));

      // Validate selection
      const validation = validateWorkflowSelection(selectedWorkflows, skipped, options.all ?? false);
      if (!validation.valid) {
        log.error(validation.error ?? 'Invalid selection');
        process.exit(1);
      }
    }

    // Display preview
    if (options.verbose || options.dryRun) {
      displayPreview(selectedWorkflows, targetDir);
    }

    // Dry run mode
    if (options.dryRun) {
      log.dim('═'.repeat(50));
      log.info('DRY RUN - No files were created');
      log.dim('═'.repeat(50));

      if (!options.verbose) {
        displayPreview(selectedWorkflows, targetDir);
      }

      log.success('Dry run complete. Run without --dry-run to create files.');
      return;
    }

    // Confirm before proceeding (unless in CI)
    if (!process.env.CI && !process.env.GITHUB_ACTIONS) {
      const confirmed = await confirmAction(`Create ${selectedWorkflows.length} workflow file(s) in ${targetDir}/.github/workflows/?`);

      if (!confirmed) {
        log.info('Cancelled.');
        return;
      }
    }

    // Create workflow files
    log.dim('═'.repeat(50));
    log.info('Creating workflow files...');
    log.dim('═'.repeat(50));

    let successCount = 0;
    let failCount = 0;

    for (const workflowId of selectedWorkflows) {
      const workflow = AVAILABLE_WORKFLOWS.find(w => w.id === workflowId);
      if (!workflow) continue;

      const exists = workflowFileExists(workflowId, targetDir);
      const result = writeWorkflowFile(workflowId, targetDir);

      if (result.success) {
        if (exists) {
          log.success(`Updated ${workflow.file}`);
        } else {
          log.success(`Created ${workflow.file}`);
        }
        successCount++;
      } else {
        log.error(`Failed to create ${workflow.file}: ${result.error}`);
        failCount++;
      }
    }

    // Summary
    log.dim('─'.repeat(50));
    log.success(`${successCount} workflow(s) created/updated`);
    if (failCount > 0) {
      log.error(`${failCount} workflow(s) failed`);
    }
    log.dim('─'.repeat(50));

    // Next steps
    log.info('Next steps:');
    log.info('  1. Review the created workflow files');
    log.info('  2. Add MINIMAX_API_KEY secret to your repository');
    log.info('  3. Commit and push the workflow files');
    log.info('');
    log.info('  To add the secret, run:');
    log.info('    gh secret set MINIMAX_API_KEY -b"your-api-key"');
    log.info('');

    if (failCount > 0) {
      process.exit(1);
    }
  });

// Export types and functions for testing
export type { InitOptions };
export { AVAILABLE_WORKFLOWS, validateWorkflowSelection, parseWorkflowSelection, loadWorkflowTemplate };
