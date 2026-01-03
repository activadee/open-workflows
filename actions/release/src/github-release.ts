#!/usr/bin/env bun
/// <reference types="bun-types" />

/**
 * Usage: bun github-release.ts --repo owner/repo --tag v1.2.3 --notes '["Note 1","Note 2"]' \
 *        [--title "Release Title"] [--prerelease] [--draft]
 */

import { parseArgs } from "util";

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLast = attempt === maxRetries - 1;
      const msg = error instanceof Error ? error.message : String(error);
      const isRetryable = msg.includes('rate limit') || msg.includes('timeout') || 
                          msg.includes('503') || msg.includes('ECONNRESET');
      if (isLast || !isRetryable) throw error;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  throw new Error('Max retries exceeded');
}

function formatReleaseNotes(notes: string[]): string {
  return notes
    .map(note => {
      const trimmed = note.trim();
      return trimmed.startsWith('-') ? trimmed : `- ${trimmed}`;
    })
    .join('\n');
}

async function main() {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      repo: { type: 'string' },
      tag: { type: 'string' },
      notes: { type: 'string' },
      title: { type: 'string' },
      prerelease: { type: 'boolean', default: false },
      draft: { type: 'boolean', default: false },
    },
    strict: true,
  });

  const { repo, tag, notes: notesJson, title, prerelease, draft } = values;

  if (!repo || !tag || !notesJson) {
    console.error('Missing required arguments: --repo, --tag, --notes');
    process.exit(1);
  }

  let notes: string[] = [];
  try {
    notes = JSON.parse(notesJson);
  } catch {
    console.error('Invalid JSON for --notes');
    process.exit(1);
  }

  const releaseTitle = title ?? tag;
  const releaseNotes = formatReleaseNotes(notes);

  const ghArgs: string[] = ['release', 'create', tag];
  ghArgs.push('--title', releaseTitle);
  ghArgs.push('--notes', releaseNotes);
  ghArgs.push('--repo', repo);

  if (prerelease) {
    ghArgs.push('--prerelease');
  }

  if (draft) {
    ghArgs.push('--draft');
  }

  try {
    const result = await withRetry(() => Bun.$`gh ${ghArgs}`.text());
    console.log(`Created release: ${tag}`);
    
    const releaseUrl = result.trim();
    if (releaseUrl) {
      console.log(`Release URL: ${releaseUrl}`);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Failed to create release: ${msg}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
