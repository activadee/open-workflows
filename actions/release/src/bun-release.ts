#!/usr/bin/env bun
/// <reference types="bun-types" />

/**
 * Usage: bun bun-release.ts --version 1.2.3
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

function extractVersion(tag: string): string {
  return tag.startsWith('v') ? tag.slice(1) : tag;
}

async function main() {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      version: { type: 'string' },
    },
    strict: true,
  });

  const { version } = values;

  if (!version) {
    console.error('Missing required argument: --version');
    process.exit(1);
  }

  const results: string[] = [];
  const versionArg = extractVersion(version);

  try {
    await Bun.$`bun pm version ${versionArg}`.quiet();
    results.push(`Bumped version to ${versionArg}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Failed to bump version: ${msg}`);
    process.exit(1);
  }

  try {
    await withRetry(() => Bun.$`git push`.quiet());
    await withRetry(() => Bun.$`git push --tags`.quiet());
    results.push('Pushed changes and tags to remote');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Failed to push to remote: ${msg}`);
    process.exit(1);
  }

  try {
    const packOutput = await Bun.$`bun pm pack`.text();
    const tarballMatch = packOutput.match(/([^\s]+\.tgz)/);
    if (!tarballMatch) {
      console.error('Failed to find tarball from bun pm pack output');
      process.exit(1);
    }
    const tarball = tarballMatch[1];
    results.push(`Packed ${tarball}`);

    await withRetry(() => Bun.$`npm publish ${tarball} --access public --provenance`.quiet());
    await Bun.$`rm ${tarball}`.quiet();
    results.push(`Published ${versionArg} to npm`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Failed to publish to npm: ${msg}`);
    process.exit(1);
  }

  results.push(`Release ${versionArg} complete`);
  console.log(results.join('\n'));
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
