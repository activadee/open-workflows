import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  installWorkflows,
  installSkills,
  installAuthWorkflow,
  checkExistingWorkflows,
  checkExistingSkills,
  checkExistingAuthWorkflow,
} from '../src/cli/installer.ts';

describe('installer override functionality', () => {
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
  });

  describe('installSkills', () => {
    it('creates new skill files', () => {
      const results = installSkills({ cwd: tempDir });

      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.status === 'created')).toBe(true);
    });

    it('skips existing files without override', () => {
      const skillDir = path.join(tempDir, '.opencode', 'skill', 'pr-review');
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), 'existing content');

      const results = installSkills({ cwd: tempDir });

      const prReviewResult = results.find(r => r.name === 'pr-review');
      expect(prReviewResult.status).toBe('skipped');
    });

    it('overwrites existing files with override=true', () => {
      const skillDir = path.join(tempDir, '.opencode', 'skill', 'pr-review');
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), 'existing content');

      const results = installSkills({ cwd: tempDir, override: true });

      const prReviewResult = results.find(r => r.name === 'pr-review');
      expect(prReviewResult.status).toBe('overwritten');
    });

    it('overwrites specific files with overrideNames', () => {
      const skillDir1 = path.join(tempDir, '.opencode', 'skill', 'pr-review');
      const skillDir2 = path.join(tempDir, '.opencode', 'skill', 'issue-label');
      fs.mkdirSync(skillDir1, { recursive: true });
      fs.mkdirSync(skillDir2, { recursive: true });
      fs.writeFileSync(path.join(skillDir1, 'SKILL.md'), 'existing review');
      fs.writeFileSync(path.join(skillDir2, 'SKILL.md'), 'existing label');

      const results = installSkills({
        cwd: tempDir,
        overrideNames: new Set(['pr-review']),
      });

      const prReviewResult = results.find(r => r.name === 'pr-review');
      const issueLabelResult = results.find(r => r.name === 'issue-label');
      
      expect(prReviewResult.status).toBe('overwritten');
      expect(issueLabelResult.status).toBe('skipped');
    });
  });

  describe('installAuthWorkflow', () => {
    it('creates new auth workflow file', () => {
      const result = installAuthWorkflow({ cwd: tempDir });

      expect(result.status).toBe('created');
      expect(fs.existsSync(path.join(tempDir, '.github', 'workflows', 'opencode-auth.yml'))).toBe(true);
    });

    it('skips existing file without override', () => {
      const workflowDir = path.join(tempDir, '.github', 'workflows');
      fs.mkdirSync(workflowDir, { recursive: true });
      fs.writeFileSync(path.join(workflowDir, 'opencode-auth.yml'), 'existing content');

      const result = installAuthWorkflow({ cwd: tempDir });

      expect(result.status).toBe('skipped');
      expect(fs.readFileSync(path.join(workflowDir, 'opencode-auth.yml'), 'utf-8')).toBe('existing content');
    });

    it('overwrites existing file with override=true', () => {
      const workflowDir = path.join(tempDir, '.github', 'workflows');
      fs.mkdirSync(workflowDir, { recursive: true });
      fs.writeFileSync(path.join(workflowDir, 'opencode-auth.yml'), 'existing content');

      const result = installAuthWorkflow({ cwd: tempDir, override: true });

      expect(result.status).toBe('overwritten');
      expect(fs.readFileSync(path.join(workflowDir, 'opencode-auth.yml'), 'utf-8')).not.toBe('existing content');
    });
  });

  describe('checkExisting* functions', () => {
    it('checkExistingWorkflows returns existing workflow files', () => {
      const workflowDir = path.join(tempDir, '.github', 'workflows');
      fs.mkdirSync(workflowDir, { recursive: true });
      fs.writeFileSync(path.join(workflowDir, 'pr-review.yml'), 'content');

      const existing = checkExistingWorkflows({ workflows: ['review', 'label'], cwd: tempDir });

      expect(existing).toHaveLength(1);
      expect(existing[0].name).toBe('review');
      expect(existing[0].type).toBe('workflow');
    });

    it('checkExistingSkills returns existing skill files', () => {
      const skillDir = path.join(tempDir, '.opencode', 'skill', 'pr-review');
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), 'content');

      const existing = checkExistingSkills({ cwd: tempDir });

      expect(existing).toHaveLength(1);
      expect(existing[0].name).toBe('pr-review');
      expect(existing[0].type).toBe('skill');
    });

    it('checkExistingAuthWorkflow returns existing auth workflow', () => {
      const workflowDir = path.join(tempDir, '.github', 'workflows');
      fs.mkdirSync(workflowDir, { recursive: true });
      fs.writeFileSync(path.join(workflowDir, 'opencode-auth.yml'), 'content');

      const existing = checkExistingAuthWorkflow({ cwd: tempDir });

      expect(existing).not.toBeNull();
      expect(existing.name).toBe('opencode-auth');
      expect(existing.type).toBe('auth');
    });

    it('checkExistingAuthWorkflow returns null when file does not exist', () => {
      const existing = checkExistingAuthWorkflow({ cwd: tempDir });
      expect(existing).toBeNull();
    });
  });
});
