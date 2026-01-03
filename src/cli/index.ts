#!/usr/bin/env bun

import * as p from '@clack/prompts';
import color from 'picocolors';
import {
  installWorkflows,
  installSkills,
  installAuthWorkflow,
  createOpencodeConfig,
  checkExistingWorkflows,
  checkExistingSkills,
  checkExistingAuthWorkflow,
  type InstallResult,
  type ExistingFile,
} from './installer';
import type { WorkflowType } from './templates';

const pkg = await import('../../package.json').catch(() => ({ version: 'unknown' }));
const cliVersion = pkg.version;

const args = process.argv.slice(2);
const isHelp = args.includes('--help') || args.includes('-h');
const isVersion = args.includes('--version') || args.includes('-v');
const isSkillsOnly = args.includes('--skills');
const isWorkflowsOnly = args.includes('--workflows');
const isForce = args.includes('--force') || args.includes('-f');

if (isVersion) {
  process.stdout.write(`@activade/open-workflows v${cliVersion}\n`);
  process.exit(0);
}

if (isHelp) {
  process.stdout.write(`@activade/open-workflows v${cliVersion}

AI-powered GitHub automation workflows as an OpenCode plugin.

USAGE
  $ open-workflows [OPTIONS]

OPTIONS
  --skills       Install skills only (no workflows)
  --workflows    Install workflows only (no skills)
  --force, -f    Override existing files without prompts
  --version, -v  Display version
  --help, -h     Display this help

WHAT GETS INSTALLED
  Skills:     .opencode/skill/{pr-review,issue-label,doc-sync,release-notes}/SKILL.md
  Workflows:  .github/workflows/{pr-review,issue-label,doc-sync,release}.yml
  Config:     .opencode/opencode.json

For more information: https://github.com/activadee/open-workflows
`);
  process.exit(0);
}

p.intro(color.bgCyan(color.black(` @activade/open-workflows v${cliVersion} `)));

const promptResults = await p.group(
  {
    workflows: () =>
      p.multiselect({
        message: 'Select workflows to install:',
        options: [
          { value: 'review', label: 'PR Review', hint: 'AI-powered code reviews' },
          { value: 'label', label: 'Issue Label', hint: 'Auto-label issues' },
          { value: 'doc-sync', label: 'Doc Sync', hint: 'Keep docs in sync' },
          { value: 'release', label: 'Release', hint: 'Automated releases with notes' },
        ],
        required: true,
      }),
    hasClaudeMax: () =>
      p.confirm({
        message: 'Do you have a Claude Max subscription?',
        initialValue: false,
      }),
    useOAuth: ({ results }) =>
      results.hasClaudeMax
        ? p.confirm({
            message: 'Set up OAuth token caching for GitHub Actions?',
            initialValue: true,
          })
        : Promise.resolve(false),
  },
  {
    onCancel: () => {
      p.cancel('Installation cancelled.');
      process.exit(0);
    },
  }
);

const selectedWorkflows = (promptResults.workflows || []) as WorkflowType[];
const useOAuth = Boolean(promptResults.useOAuth);

const skillOverrides = new Set<string>();
const workflowOverrides = new Set<string>();
let overrideAuth = false;

if (!isForce) {
  const existingFiles: ExistingFile[] = [];

  if (!isWorkflowsOnly) {
    existingFiles.push(...checkExistingSkills({}));
  }

  if (!isSkillsOnly) {
    existingFiles.push(...checkExistingWorkflows({ workflows: selectedWorkflows }));
    if (useOAuth) {
      const authFile = checkExistingAuthWorkflow({});
      if (authFile) {
        existingFiles.push(authFile);
      }
    }
  }

  if (existingFiles.length > 0) {
    p.log.warn(`Found ${existingFiles.length} existing file(s):`);

    for (const file of existingFiles) {
      const shouldOverride = await p.confirm({
        message: `Override ${file.path}?`,
        initialValue: false,
      });

      if (p.isCancel(shouldOverride)) {
        p.cancel('Installation cancelled.');
        process.exit(0);
      }

      if (shouldOverride) {
        if (file.type === 'skill') {
          skillOverrides.add(file.name);
        } else if (file.type === 'workflow') {
          workflowOverrides.add(file.name);
        } else if (file.type === 'auth') {
          overrideAuth = true;
        }
      }
    }
  }
}

const s = p.spinner();
s.start('Installing open-workflows...');

const allResults: InstallResult[] = [];

if (!isWorkflowsOnly) {
  const skillResults = installSkills({
    override: isForce,
    overrideNames: isForce ? undefined : skillOverrides,
  });
  allResults.push(...skillResults);
}

if (!isSkillsOnly) {
  const workflowResults = installWorkflows({
    workflows: selectedWorkflows,
    useOAuth,
    override: isForce,
    overrideNames: isForce ? undefined : workflowOverrides,
  });
  allResults.push(...workflowResults);

  if (useOAuth) {
    const authResult = installAuthWorkflow({ override: isForce || overrideAuth });
    allResults.push(authResult);
  }
}

let configResult;
try {
  configResult = createOpencodeConfig();
} catch (error) {
  s.stop('Installation failed.');
  p.cancel(`Failed to create config: ${error instanceof Error ? error.message : 'Unknown error'}`);
  process.exit(1);
}

const hasErrors = allResults.some((r) => r.status === 'error');
s.stop(hasErrors ? 'Installation completed with errors' : 'Installation complete!');

const created = allResults.filter((r) => r.status === 'created');
const overwritten = allResults.filter((r) => r.status === 'overwritten');
const skipped = allResults.filter((r) => r.status === 'skipped');
const errors = allResults.filter((r) => r.status === 'error');

if (created.length > 0) {
  p.log.success(`Created ${created.length} file(s):`);
  for (const r of created) {
    p.log.message(`  ${color.green('✓')} ${r.path}`);
  }
}

if (overwritten.length > 0) {
  p.log.success(`Overwritten ${overwritten.length} file(s):`);
  for (const r of overwritten) {
    p.log.message(`  ${color.cyan('◆')} ${r.path}`);
  }
}

if (skipped.length > 0) {
  p.log.warn(`Skipped ${skipped.length} file(s) (already exist):`);
  for (const r of skipped) {
    p.log.message(`  ${color.yellow('○')} ${r.path}`);
  }
}

if (errors.length > 0) {
  p.log.error(`Failed ${errors.length} file(s):`);
  for (const r of errors) {
    p.log.message(`  ${color.red('✗')} ${r.path}: ${r.message}`);
  }
}

if (configResult.created) {
  p.log.success(`Created ${configResult.path}`);
} else {
  p.log.info(`Updated ${configResult.path}`);
}

if (useOAuth) {
  p.note(
    `${color.cyan('1.')} Export your OpenCode auth file as a secret:\n   ${color.dim('gh secret set OPENCODE_AUTH < ~/.local/share/opencode/auth.json')}\n\n${color.cyan('2.')} Commit and push the changes\n\n${color.cyan('3.')} Run the auth workflow to initialize the cache:\n   ${color.dim('gh workflow run opencode-auth.yml')}`,
    'Next steps (OAuth)'
  );
} else {
  p.note(
    `${color.cyan('1.')} Add your Anthropic API key:\n   ${color.dim('gh secret set ANTHROPIC_API_KEY')}\n\n${color.cyan('2.')} Commit and push the changes`,
    'Next steps'
  );
}

p.outro(color.green('✓ open-workflows installed successfully!'));
