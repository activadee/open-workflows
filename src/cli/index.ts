#!/usr/bin/env bun

import * as p from '@clack/prompts';
import color from 'picocolors';
import {
  installWorkflows,
  checkExistingWorkflows,
  type InstallResult,
  type ExistingFile,
} from './installer';
import type { WorkflowType } from './templates';

const pkg = await import('../../package.json').catch(() => ({ version: 'unknown' }));
const cliVersion = pkg.version;

const args = process.argv.slice(2);
const isHelp = args.includes('--help') || args.includes('-h');
const isVersion = args.includes('--version') || args.includes('-v');
const isForce = args.includes('--force') || args.includes('-f');

if (isVersion) {
  process.stdout.write(`@activade/open-workflows v${cliVersion}\n`);
  process.exit(0);
}

if (isHelp) {
  process.stdout.write(`@activade/open-workflows v${cliVersion}

AI-powered GitHub automation workflows.

USAGE
  $ bunx open-workflows [OPTIONS]

OPTIONS
  --force, -f    Override existing files without prompts
  --version, -v  Display version
  --help, -h     Display this help

WHAT GETS INSTALLED
  Workflow files that use composite actions from this repository:
  .github/workflows/pr-review.yml
  .github/workflows/issue-label.yml
  .github/workflows/doc-sync.yml
  .github/workflows/release.yml

REQUIRED SECRETS
  For Claude Max (OAuth):
    OPENCODE_AUTH - Your auth.json (use opencode-auth-sync plugin to keep it updated)

  For API Key:
    ANTHROPIC_API_KEY - Your Anthropic API key

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
    useOAuth: () =>
      p.confirm({
        message: 'Use Claude Max subscription (OAuth)? (No = API key)',
        initialValue: false,
      }),
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

let installPlugin = false;
if (useOAuth) {
  const pluginPrompt = await p.confirm({
    message: 'Install opencode-auth-sync plugin? (keeps OAuth tokens synced)',
    initialValue: true,
  });

  if (p.isCancel(pluginPrompt)) {
    p.cancel('Installation cancelled.');
    process.exit(0);
  }

  installPlugin = Boolean(pluginPrompt);
}

const workflowOverrides = new Set<string>();

if (!isForce) {
  const existingFiles: ExistingFile[] = checkExistingWorkflows({ workflows: selectedWorkflows });

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
        workflowOverrides.add(file.name);
      }
    }
  }
}

const s = p.spinner();
s.start('Installing workflows...');

const results: InstallResult[] = installWorkflows({
  workflows: selectedWorkflows,
  useOAuth,
  override: isForce,
  overrideNames: isForce ? undefined : workflowOverrides,
});

const hasErrors = results.some((r) => r.status === 'error');
s.stop(hasErrors ? 'Installation completed with errors' : 'Installation complete!');

const created = results.filter((r) => r.status === 'created');
const overwritten = results.filter((r) => r.status === 'overwritten');
const skipped = results.filter((r) => r.status === 'skipped');
const errors = results.filter((r) => r.status === 'error');

if (created.length > 0) {
  p.log.success(`Created ${created.length} file(s):`);
  for (const r of created) {
    p.log.message(`  ${color.green('+')} ${r.path}`);
  }
}

if (overwritten.length > 0) {
  p.log.success(`Overwritten ${overwritten.length} file(s):`);
  for (const r of overwritten) {
    p.log.message(`  ${color.cyan('~')} ${r.path}`);
  }
}

if (skipped.length > 0) {
  p.log.warn(`Skipped ${skipped.length} file(s) (already exist):`);
  for (const r of skipped) {
    p.log.message(`  ${color.yellow('-')} ${r.path}`);
  }
}

if (errors.length > 0) {
  p.log.error(`Failed ${errors.length} file(s):`);
  for (const r of errors) {
    p.log.message(`  ${color.red('x')} ${r.path}: ${r.message}`);
  }
}

if (useOAuth) {
  if (installPlugin) {
    p.note(
      `${color.cyan('1.')} Setup the auth sync plugin:\n   ${color.dim('bunx @activade/opencode-auth-sync')}\n\n${color.cyan('2.')} Commit and push the workflow files`,
      'Next steps (OAuth with plugin)'
    );
  } else {
    p.note(
      `${color.cyan('1.')} Export your OpenCode auth as a secret:\n   ${color.dim('gh secret set OPENCODE_AUTH < ~/.local/share/opencode/auth.json')}\n\n${color.cyan('2.')} Commit and push the workflow files`,
      'Next steps (OAuth)'
    );
  }
} else {
  p.note(
    `${color.cyan('1.')} Add your Anthropic API key:\n   ${color.dim('gh secret set ANTHROPIC_API_KEY')}\n\n${color.cyan('2.')} Commit and push the workflow files`,
    'Next steps'
  );
}

p.outro(color.green('Done!'));
