import { execSync } from 'child_process';
import { Command } from 'commander';
import { getContext, requireRepo } from '../lib/context.js';
import { ensureGhCli, ensureGhAuth, getLatestReleaseTag } from '../lib/github.js';
import { ensureOpenCode, startServer, runOpenCode, stopServer } from '../lib/opencode.js';
import { loadPrompt } from '../lib/prompts.js';
import { log, banner, formatMessage } from '../lib/logger.js';
import type { CommandOptions } from '../types.js';

interface ReleaseOptions extends CommandOptions {
  fromTag?: string;
  toTag?: string;
}

export const releaseCommand = new Command('release')
  .description('Prepare a new version by bumping package.json and tagging')
  .option('--from-tag <tag>', 'Starting tag (defaults to latest GitHub release)')
  .option('--to-tag <tag>', 'Ending ref (defaults to current HEAD)')
  .option('-r, --repo <owner/repo>', 'Repository (owner/repo)')
  .option('-m, --model <model>', 'AI model to use', 'minimax/MiniMax-M2.1')
  .option('--dry-run', 'Preview planned version bump and changes without modifying git or npm')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (options: ReleaseOptions) => {
    banner();

    try {
      const ctx = getContext(options);

      ensureGhCli();
      if (ctx.mode === 'manual') ensureGhAuth();

      const repo = requireRepo(ctx, options);

      let fromTag = options.fromTag;
      let toTag = options.toTag;

      if (!fromTag) {
        fromTag = getLatestReleaseTag(repo) || '';
      }

      if (!toTag) {
        toTag = ctx.commitSha || 'HEAD';
      }

      if (!fromTag) {
        log.info('No previous release tag found, including all commits');
      }

      log.info(`Preparing release from ${fromTag || 'beginning'} to ${toTag}`);

      await ensureOpenCode();
      await startServer();

      const prompt = loadPrompt('release', {
        REPO: repo,
        FROM_TAG: fromTag || 'beginning',
        TO_TAG: toTag,
        BRANCH: ctx.branch || '',
        DRY_RUN: options.dryRun ? 'true' : 'false',
      });

      const bashPerms: Record<string, 'allow' | 'deny'> = options.dryRun
        ? { 'gh api*': 'allow', '*': 'deny' }
        : {
            'gh api*': 'allow',
            'git*': 'allow',
            'npm version*': 'allow',
            '*': 'deny',
          };

      const result = await runOpenCode({
        model: options.model || 'minimax/MiniMax-M2.1',
        prompt,
        permissions: { bash: bashPerms },
        onMessage: formatMessage,
      });

      const trimmedResult = (result || '').trim();

      if (options.dryRun) {
        console.log('\n--- RELEASE PREVIEW ---\n');
        if (trimmedResult) console.log(trimmedResult);
        console.log('\n--- END PREVIEW ---\n');
      } else {
        if (trimmedResult === 'No noteworthy changes in this release.') {
          log.info('No noteworthy changes detected; skipping GitHub release.');
        } else {
          let latestTag: string | null = null;

          try {
            latestTag = execSync('git describe --tags --abbrev=0', {
              encoding: 'utf-8',
            })
              .toString()
              .trim();
          } catch {
            log.warn('No git tag found after version bump; skipping GitHub release.');
          }

          if (latestTag) {
            log.step(`Creating GitHub release ${latestTag} with generated notes...`);
            try {
              execSync(`gh release create "${latestTag}" --repo ${repo} --generate-notes`, {
                stdio: 'inherit',
              });
              log.success(`GitHub release ${latestTag} created.`);
            } catch (e) {
              log.error('Failed to create GitHub release');
              throw e;
            }
          }
        }
      }
    } catch (error) {
      log.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    } finally {
      await stopServer();
    }
  });
