import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  installWorkflows,
  checkExistingWorkflows,
} from '../src/cli/installer.ts';

describe('installer workflow functionality', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'open-workflows-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('installWorkflows', () => {
    it('creates new workflow files', () => {
      const results = installWorkflows({
        workflows: ['review'],
        cwd: tempDir,
        useOAuth: false,
      });

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('created');
      expect(results[0].name).toBe('review');
      expect(fs.existsSync(path.join(tempDir, '.github', 'workflows', 'pr-review.yml'))).toBe(true);
    });

    it('creates workflow with composite action reference', () => {
      installWorkflows({
        workflows: ['review'],
        cwd: tempDir,
        useOAuth: false,
      });

      const content = fs.readFileSync(
        path.join(tempDir, '.github', 'workflows', 'pr-review.yml'),
        'utf-8'
      );
      expect(content).toContain('activadee/open-workflows/actions/pr-review@main');
    });

    it('includes ANTHROPIC_API_KEY for non-OAuth', () => {
      installWorkflows({
        workflows: ['review'],
        cwd: tempDir,
        useOAuth: false,
      });

      const content = fs.readFileSync(
        path.join(tempDir, '.github', 'workflows', 'pr-review.yml'),
        'utf-8'
      );
      expect(content).toContain('ANTHROPIC_API_KEY');
      expect(content).not.toContain('OPENCODE_AUTH');
    });

    it('includes OPENCODE_AUTH for OAuth', () => {
      installWorkflows({
        workflows: ['review'],
        cwd: tempDir,
        useOAuth: true,
      });

      const content = fs.readFileSync(
        path.join(tempDir, '.github', 'workflows', 'pr-review.yml'),
        'utf-8'
      );
      expect(content).toContain('OPENCODE_AUTH');
      expect(content).not.toContain('ANTHROPIC_API_KEY');
    });

    it('does NOT include cache restore step for OAuth', () => {
      installWorkflows({
        workflows: ['review'],
        cwd: tempDir,
        useOAuth: true,
      });

      const content = fs.readFileSync(
        path.join(tempDir, '.github', 'workflows', 'pr-review.yml'),
        'utf-8'
      );
      expect(content).not.toContain('actions/cache/restore');
      expect(content).not.toContain('opencode-auth-');
    });

    it('creates all AI workflow types without cache steps', () => {
      installWorkflows({
        workflows: ['review', 'label', 'doc-sync'],
        cwd: tempDir,
        useOAuth: true,
      });

      const files = ['pr-review.yml', 'issue-label.yml', 'doc-sync.yml'];
      for (const file of files) {
        const content = fs.readFileSync(
          path.join(tempDir, '.github', 'workflows', file),
          'utf-8'
        );
        expect(content).toContain('OPENCODE_AUTH');
        expect(content).not.toContain('actions/cache/restore');
      }
    });

    it('skips existing files without override', () => {
      const workflowDir = path.join(tempDir, '.github', 'workflows');
      fs.mkdirSync(workflowDir, { recursive: true });
      fs.writeFileSync(path.join(workflowDir, 'pr-review.yml'), 'existing content');

      const results = installWorkflows({
        workflows: ['review'],
        cwd: tempDir,
        useOAuth: false,
      });

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('skipped');
      expect(fs.readFileSync(path.join(workflowDir, 'pr-review.yml'), 'utf-8')).toBe('existing content');
    });

    it('overwrites existing files with override=true', () => {
      const workflowDir = path.join(tempDir, '.github', 'workflows');
      fs.mkdirSync(workflowDir, { recursive: true });
      fs.writeFileSync(path.join(workflowDir, 'pr-review.yml'), 'existing content');

      const results = installWorkflows({
        workflows: ['review'],
        cwd: tempDir,
        useOAuth: false,
        override: true,
      });

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('overwritten');
      expect(fs.readFileSync(path.join(workflowDir, 'pr-review.yml'), 'utf-8')).not.toBe('existing content');
    });

    it('overwrites specific files with overrideNames', () => {
      const workflowDir = path.join(tempDir, '.github', 'workflows');
      fs.mkdirSync(workflowDir, { recursive: true });
      fs.writeFileSync(path.join(workflowDir, 'pr-review.yml'), 'existing review');
      fs.writeFileSync(path.join(workflowDir, 'issue-label.yml'), 'existing label');

      const results = installWorkflows({
        workflows: ['review', 'label'],
        cwd: tempDir,
        useOAuth: false,
        overrideNames: new Set(['review']),
      });

      expect(results).toHaveLength(2);
      
      const reviewResult = results.find(r => r.name === 'review');
      const labelResult = results.find(r => r.name === 'label');
      
      expect(reviewResult.status).toBe('overwritten');
      expect(labelResult.status).toBe('skipped');
    });

    it('creates all workflow types', () => {
      const results = installWorkflows({
        workflows: ['review', 'label', 'doc-sync', 'release'],
        cwd: tempDir,
        useOAuth: false,
      });

      expect(results).toHaveLength(4);
      expect(results.every(r => r.status === 'created')).toBe(true);
      expect(fs.existsSync(path.join(tempDir, '.github', 'workflows', 'pr-review.yml'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, '.github', 'workflows', 'issue-label.yml'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, '.github', 'workflows', 'doc-sync.yml'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, '.github', 'workflows', 'release.yml'))).toBe(true);
    });
  });

  describe('checkExistingWorkflows', () => {
    it('returns existing workflow files', () => {
      const workflowDir = path.join(tempDir, '.github', 'workflows');
      fs.mkdirSync(workflowDir, { recursive: true });
      fs.writeFileSync(path.join(workflowDir, 'pr-review.yml'), 'content');

      const existing = checkExistingWorkflows({ workflows: ['review', 'label'], cwd: tempDir });

      expect(existing).toHaveLength(1);
      expect(existing[0].name).toBe('review');
      expect(existing[0].type).toBe('workflow');
    });

    it('returns empty array when no files exist', () => {
      const existing = checkExistingWorkflows({ workflows: ['review', 'label'], cwd: tempDir });
      expect(existing).toHaveLength(0);
    });
  });
});
