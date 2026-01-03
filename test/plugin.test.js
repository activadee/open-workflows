import { describe, expect, it } from 'bun:test';

import defaultPlugin, { plugin as namedPlugin } from '../src/index.ts';

describe('open-workflows plugin', () => {
  it('exports plugin functions', () => {
    expect(typeof defaultPlugin).toBe('function');
    expect(typeof namedPlugin).toBe('function');
  });

  it('exports exactly 4 tools (v3.0)', async () => {
    const hooks = await namedPlugin({});
    const toolNames = Object.keys(hooks.tool);

    expect(toolNames).toHaveLength(4);
    expect(toolNames.sort()).toEqual([
      'apply_labels',
      'bun_release',
      'github_release',
      'submit_review',
    ]);
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

  it('registers plugin hooks (v3.0)', async () => {
    const hooks = await namedPlugin({});

    expect(hooks.event).toBeDefined();
    expect(typeof hooks.event).toBe('function');

    expect(hooks['chat.params']).toBeDefined();
    expect(typeof hooks['chat.params']).toBe('function');

    expect(hooks['tool.execute.before']).toBeDefined();
    expect(typeof hooks['tool.execute.before']).toBe('function');

    expect(hooks['tool.execute.after']).toBeDefined();
    expect(typeof hooks['tool.execute.after']).toBe('function');
  });

  it('chat.params lowers temperature for workflow patterns', async () => {
    const hooks = await namedPlugin({});
    const output = {};

    await hooks['chat.params']({ message: 'Load the pr-review skill and review this PR' }, output);
    expect(output.temperature).toBe(0.2);
  });

  it('chat.params does not modify temperature for unrelated messages', async () => {
    const hooks = await namedPlugin({});
    const output = {};

    await hooks['chat.params']({ message: 'Hello, can you help me with something?' }, output);
    expect(output.temperature).toBeUndefined();
  });
});
