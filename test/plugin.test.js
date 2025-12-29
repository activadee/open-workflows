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
    expect(hooks.tool).toHaveProperty('github_release');
    expect(hooks.tool).toHaveProperty('bun_release');

    const submitArgs = Object.keys(hooks.tool.submit_review.args);
    expect(submitArgs).toEqual(expect.arrayContaining(['repository', 'pullNumber', 'commitSha']));

    const applyArgs = Object.keys(hooks.tool.apply_labels.args);
    expect(applyArgs).toEqual(expect.arrayContaining(['repository', 'issueNumber']));

    const githubReleaseArgs = Object.keys(hooks.tool.github_release.args);
    expect(githubReleaseArgs).toEqual(expect.arrayContaining(['repository', 'tag', 'notes']));

    const bunReleaseArgs = Object.keys(hooks.tool.bun_release.args);
    expect(bunReleaseArgs).toEqual(expect.arrayContaining(['version']));
  });
});
