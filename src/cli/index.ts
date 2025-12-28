#!/usr/bin/env bun

import * as p from '@clack/prompts';
import color from 'picocolors';
import { 
  installWorkflows, 
  createOpencodeConfig, 
  type WorkflowType 
} from '../tools/setup-workflows/installer';

// Read version from package.json
const pkg = await import('../../package.json').catch(() => ({ version: 'unknown' }));
const version = pkg.version;

p.intro(color.bgCyan(color.black(` @activadee-ai/open-workflows v${version} `)));

const results = await p.group(
  {
    workflows: () =>
      p.multiselect({
        message: 'Select workflows to install:',
        options: [
          { value: 'review', label: 'PR Review', hint: 'AI-powered code reviews' },
          { value: 'label', label: 'Issue Label', hint: 'Auto-label issues' },
          { value: 'doc-sync', label: 'Doc Sync', hint: 'Keep docs in sync' },
          { value: 'release', label: 'Release Notes', hint: 'Generate release notes' },
        ],
        required: true,
      }),
  },
  {
    onCancel: () => {
      p.cancel('Installation cancelled.');
      process.exit(0);
    },
  }
);

const s = p.spinner();
s.start('Installing open-workflows...');

// Create .opencode/opencode.json
let configResult;
try {
  configResult = createOpencodeConfig();
} catch (error) {
  s.stop('Installation failed.');
  p.cancel(`Failed to create config: ${error instanceof Error ? error.message : 'Unknown error'}`);
  process.exit(1);
}

// Install selected workflows
const selectedWorkflows = results.workflows || [];
const installResults = installWorkflows({
  workflows: selectedWorkflows as WorkflowType[]
});

const hasErrors = installResults.some((r) => r.status === 'error');
s.stop(hasErrors ? 'Installation completed with errors' : 'Installation complete!');

// Display results
const created = installResults.filter((r) => r.status === 'created');
const skipped = installResults.filter((r) => r.status === 'skipped');
const errors = installResults.filter((r) => r.status === 'error');

if (created.length > 0) {
  p.log.success(`Created ${created.length} workflow(s):`);
  for (const r of created) {
    p.log.message(`  ${color.green('✓')} ${r.path}`);
  }
}

if (skipped.length > 0) {
  p.log.warn(`Skipped ${skipped.length} workflow(s) (already exist):`);
  for (const r of skipped) {
    p.log.message(`  ${color.yellow('○')} ${r.path}`);
  }
}

if (errors.length > 0) {
  p.log.error(`Failed to install ${errors.length} workflow(s):`);
  for (const r of errors) {
    p.log.message(`  ${color.red('✗')} ${r.path}: ${r.message}`);
  }
}

if (configResult.created) {
  p.log.success(`Created ${configResult.path}`);
} else {
  p.log.info(`Updated ${configResult.path} (plugin added)`);
}

p.note(
  `${color.cyan('1.')} Add MINIMAX_API_KEY secret:\n   ${color.dim('gh secret set MINIMAX_API_KEY')}\n\n${color.cyan('2.')} Commit and push the workflow files`,
  'Next steps'
);

p.outro(color.green('✓ open-workflows installed successfully!'));
