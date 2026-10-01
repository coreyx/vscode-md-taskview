import { describe, it, expect } from 'vitest';
import { Slugifier } from '../../src/parser/Slugifier.js';

describe('Slugifier', () => {
  it('should generate standard lowercased, hyphenated slugs for simple headings', () => {
    expect(Slugifier.fromHeading('Introduction')).toBe('introduction');
    expect(Slugifier.fromHeading('Getting Started')).toBe('getting-started');
    expect(Slugifier.fromHeading('User Story 1: Tree View Navigation')).toBe('user-story-1-tree-view-navigation');
  });

  it('should strip punctuation and special characters matching VS Code preview behavior', () => {
    expect(
      Slugifier.fromHeading('Milestone 1: Project Foundation & Extension Scaffolding (MVP - Part 1)')
    ).toBe('milestone-1-project-foundation--extension-scaffolding-mvp---part-1');

    expect(
      Slugifier.fromHeading('Milestone 2: Task Checkbox State Cycling & Mutex Locking (MVP - Part 2)')
    ).toBe('milestone-2-task-checkbox-state-cycling--mutex-locking-mvp---part-2');

    expect(
      Slugifier.fromHeading('Special Chars: @#$%^*()_+~`|}{[]\\:;"\'<>,.?/')
    ).toBe('special-chars-_');
  });

  it('should handle unicode characters and accents correctly', () => {
    expect(
      Slugifier.fromHeading('Über den Wolken & 100% Fun! 🚀')
    ).toBe('über-den-wolken--100-fun-');
  });

  it('should generate duplicate slug suffixes (-1, -2, etc.) using builder', () => {
    const builder = Slugifier.createBuilder();

    expect(builder.add('Milestone 1')).toBe('milestone-1');
    expect(builder.add('Tasks')).toBe('tasks');
    expect(builder.add('Tasks')).toBe('tasks-1');
    expect(builder.add('Tasks')).toBe('tasks-2');
    expect(builder.add('Milestone 1')).toBe('milestone-1-1');
  });
});
