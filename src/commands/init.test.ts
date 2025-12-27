import { describe, it, expect } from 'vitest';
import { validateWorkflowSelection, parseWorkflowSelection, AVAILABLE_WORKFLOWS, loadWorkflowTemplate } from './init.js';

describe('init command', () => {
  describe('validateWorkflowSelection', () => {
    it('should validate empty selection', () => {
      const result = validateWorkflowSelection([], [], false);
      expect(result.valid).toBe(true);
    });

    it('should reject --all with --select', () => {
      const result = validateWorkflowSelection(['doc-sync'], [], true);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Cannot use --all with --select');
    });

    it('should allow --all with --skip (meaning "all except X")', () => {
      const result = validateWorkflowSelection([], ['doc-sync'], true);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid workflow in --select', () => {
      const result = validateWorkflowSelection(['invalid-workflow'] as any, [], false);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid workflow');
    });

    it('should reject invalid workflow in --skip', () => {
      const result = validateWorkflowSelection([], ['invalid-workflow'] as any, false);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid workflow to skip');
    });

    it('should reject workflow that is both selected and skipped', () => {
      const result = validateWorkflowSelection(['doc-sync'], ['doc-sync'], false);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be both selected and skipped');
    });

    it('should accept valid selection', () => {
      const result = validateWorkflowSelection(['doc-sync', 'label'], [], false);
      expect(result.valid).toBe(true);
    });

    it('should accept valid skip selection', () => {
      const result = validateWorkflowSelection(
        ['doc-sync', 'label', 'release', 'review'],
        ['release'],
        false
      );
      expect(result.valid).toBe(true);
    });
  });

  describe('parseWorkflowSelection', () => {
    it('should parse --all flag', () => {
      const options = { all: true } as any;
      const result = parseWorkflowSelection(options);
      expect(result.selected).toEqual(AVAILABLE_WORKFLOWS.map((w) => w.id));
      expect(result.skipped).toEqual([]);
    });

    it('should parse --select flags', () => {
      const options = { select: ['doc-sync', 'label'], all: false } as any;
      const result = parseWorkflowSelection(options);
      expect(result.selected).toEqual(['doc-sync', 'label']);
    });

    it('should parse --skip flags', () => {
      const options = { skip: ['release'], all: false } as any;
      const result = parseWorkflowSelection(options);
      expect(result.skipped).toEqual(['release']);
    });

    it('should handle empty options', () => {
      const options = {} as any;
      const result = parseWorkflowSelection(options);
      expect(result.selected).toEqual([]);
      expect(result.skipped).toEqual([]);
    });
  });

  describe('workflow templates', () => {
    it('should have all required workflows', () => {
      const workflowIds = AVAILABLE_WORKFLOWS.map((w) => w.id);
      expect(workflowIds).toContain('doc-sync');
      expect(workflowIds).toContain('label');
      expect(workflowIds).toContain('release');
      expect(workflowIds).toContain('review');
    });

    it('should have unique workflow files', () => {
      const files = AVAILABLE_WORKFLOWS.map((w) => w.file);
      const uniqueFiles = new Set(files);
      expect(files.length).toBe(uniqueFiles.size);
    });

    it('should have workflow descriptions', () => {
      for (const workflow of AVAILABLE_WORKFLOWS) {
        expect(workflow.id).toBeTruthy();
        expect(workflow.name).toBeTruthy();
        expect(workflow.description).toBeTruthy();
        expect(workflow.file).toBeTruthy();
        expect(workflow.file.endsWith('.yml')).toBe(true);
      }
    });

    it('should throw error for unknown workflow', () => {
      expect(() => loadWorkflowTemplate('unknown' as any)).toThrow('Unknown workflow');
    });
  });
});
