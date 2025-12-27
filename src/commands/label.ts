import { Command } from 'commander';
import { getContext, requireRepo, requireIssue } from '../lib/context.js';
import { getIssueDetails, getRepoLabels, ensureGhCli, ensureGhAuth } from '../lib/github.js';
import { ensureOpenCode, startServer, runOpenCode, stopServer } from '../lib/opencode.js';
import { loadPrompt } from '../lib/prompts.js';
import { log, banner, formatMessage } from '../lib/logger.js';
import type { CommandOptions, OpenCodePermission } from '../types.js';

export const labelCommand = new Command('label')
  .description('Automatically label a GitHub issue')
  .option('-i, --issue <number>', 'Issue number to label')
  .option('-r, --repo <owner/repo>', 'Repository (owner/repo)')
  .option('-m, --model <model>', 'AI model to use', 'minimax/MiniMax-M2.1')
  .option('--dry-run', 'Print suggested labels without applying')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (options: CommandOptions) => {
    banner();

    try {
      const ctx = getContext(options);

      ensureGhCli();
      if (ctx.mode === 'manual') ensureGhAuth();

      const repo = requireRepo(ctx, options);
      const issueNumber = requireIssue(ctx, options);

      const permission: OpenCodePermission = options.dryRun
        ? { bash: { '*': 'deny' } }
        : { bash: { 'gh issue*': 'allow', 'gh label*': 'allow', '*': 'deny' } };

      await ensureOpenCode();
      await startServer(permission);

      const issue = getIssueDetails(repo, issueNumber);
      const availableLabels = getRepoLabels(repo);

      const prompt = loadPrompt('label', {
        ISSUE_NUMBER: issueNumber,
        REPO: repo,
      }) + `

## Issue Details

**Title:** ${issue.title}

**Body:**
${issue.body}

**Current Labels:** ${issue.labels.join(', ') || 'None'}

## Available Repository Labels

${availableLabels.join(', ')}
`;

      const result = await runOpenCode({
        model: options.model || 'minimax/MiniMax-M2.1',
        prompt,
        onMessage: formatMessage,
      });

      if (options.dryRun) {
        console.log('\n--- DRY RUN OUTPUT ---\n');
        console.log(result);
      } else {
        log.success(`Issue #${issueNumber} labeled!`);
      }
    } catch (error) {
      log.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    } finally {
      await stopServer();
    }
  });
