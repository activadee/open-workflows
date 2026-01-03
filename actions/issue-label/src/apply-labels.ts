#!/usr/bin/env bun
/// <reference types="bun-types" />

/**
 * Usage: bun apply-labels.ts --repo owner/repo --issue 123 --labels "bug,enhancement" \
 *        --explanation "Why these labels" [--new-labels '[{"name":"x","color":"fff","description":"..."}]']
 */

import { parseArgs } from "util";

interface NewLabel {
  name: string;
  color: string;
  description: string;
}

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

async function main() {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      repo: { type: 'string' },
      issue: { type: 'string' },
      labels: { type: 'string' },
      explanation: { type: 'string' },
      'new-labels': { type: 'string' },
    },
    strict: true,
  });

  const { repo, issue, labels, explanation, 'new-labels': newLabelsJson } = values;

  if (!repo || !issue || !labels || !explanation) {
    console.error('Missing required arguments: --repo, --issue, --labels, --explanation');
    process.exit(1);
  }

  const issueNumber = parseInt(issue, 10);
  if (isNaN(issueNumber)) {
    console.error('Invalid issue number');
    process.exit(1);
  }

  const labelList = labels.split(',').map(l => l.trim()).filter(Boolean);
  if (labelList.length === 0) {
    console.error('No labels provided');
    process.exit(1);
  }

  if (labelList.length > 3) {
    console.error('Maximum 3 labels allowed');
    process.exit(1);
  }

  const results: string[] = [];

  if (newLabelsJson) {
    let newLabels: NewLabel[] = [];
    try {
      newLabels = JSON.parse(newLabelsJson);
    } catch {
      console.error('Invalid JSON for --new-labels');
      process.exit(1);
    }

    for (const label of newLabels) {
      try {
        await withRetry(() =>
          Bun.$`gh label create ${label.name} --color ${label.color} --description ${label.description} --repo ${repo}`.quiet()
        );
        results.push(`Created label: ${label.name}`);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes('already exists') || msg.includes('Conflict')) {
          results.push(`Label already exists: ${label.name}`);
        } else {
          results.push(`Failed to create label "${label.name}": ${msg}`);
        }
      }
    }
  }

  const labelArg = labelList.join(',');
  try {
    await withRetry(() =>
      Bun.$`gh issue edit ${issueNumber} --add-label ${labelArg} --repo ${repo}`.quiet()
    );
    results.push(`Applied labels: ${labelArg}`);
    results.push(`Reason: ${explanation}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    results.push(`Failed to apply labels: ${msg}`);
    console.error(results.join('\n'));
    process.exit(1);
  }

  console.log(results.join('\n'));
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
