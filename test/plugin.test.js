import { describe, expect, it } from 'bun:test';

import defaultPlugin, { plugin as namedPlugin } from '../src/index.ts';

describe('open-workflows plugin', () => {
  it('exports plugin functions', () => {
    expect(typeof defaultPlugin).toBe('function');
    expect(typeof namedPlugin).toBe('function');
  });

  it('registers tools with explicit GitHub context args', async () => {
    const hooks = await namedPlugin({});

    expect(hooks.tool).toBeTruthy();
    expect(hooks.tool).toHaveProperty('submit_review');
    expect(hooks.tool).toHaveProperty('apply_labels');

    const submitArgs = Object.keys(hooks.tool.submit_review.args);
    expect(submitArgs).toEqual(expect.arrayContaining(['repository', 'pullNumber', 'commitSha']));

    const applyArgs = Object.keys(hooks.tool.apply_labels.args);
    expect(applyArgs).toEqual(expect.arrayContaining(['repository', 'issueNumber']));
  });
});
