import { review } from '../prompts/review.js';
import { label } from '../prompts/label.js';
import { docSync } from '../prompts/doc-sync.js';
import { release } from '../prompts/release.js';

const promptCache: Record<string, string> = {};

export function loadPrompt(
  name: 'review' | 'label' | 'doc-sync' | 'release',
  variables: Record<string, string | number | undefined> = {}
): string {
  // Load from cache or bundle
  if (!promptCache[name]) {
    const prompts: Record<string, string> = {
      review,
      label,
      'doc-sync': docSync,
      release,
    };
    promptCache[name] = prompts[name];
  }

  let prompt = promptCache[name];

  // Replace variables: ${VAR_NAME} or $VAR_NAME
  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined) {
      const regex = new RegExp(`\\$\\{?${key}\\}?`, 'g');
      prompt = prompt.replace(regex, String(value));
    }
  }

  return prompt;
}
