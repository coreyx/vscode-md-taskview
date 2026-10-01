import { describe, it, expect } from 'vitest';
import * as vscode from 'vscode';
import { MarkdownASTParser } from '../../src/parser/MarkdownASTParser.js';

describe('Surgical Mutation Range & Preservation', () => {
  const dummyFileUri = vscode.Uri.file('/workspace/spec/auth/tasks.md');
  const dummyFolderUri = vscode.Uri.file('/workspace/spec/auth');

  it('should calculate exact character coordinates for in-place mutation', () => {
    const originalText = '  - [ ] Implement OAuth provider';
    const spec = MarkdownASTParser.parse(originalText, 'auth', dummyFileUri, dummyFolderUri);
    const task = spec.rootTasks[0];

    expect(task.bracketRange.openBracketCol).toBe(4);
    expect(task.bracketRange.charCol).toBe(5);
    expect(task.bracketRange.closeBracketCol).toBe(6);

    // Simulate surgical single-character replacement at charCol
    const before = originalText.substring(0, task.bracketRange.charCol);
    const after = originalText.substring(task.bracketRange.charCol + 1);
    const mutated = `${before}x${after}`;

    expect(mutated).toBe('  - [x] Implement OAuth provider');

    // Parse mutated text and verify new state
    const mutatedSpec = MarkdownASTParser.parse(mutated, 'auth', dummyFileUri, dummyFolderUri);
    expect(mutatedSpec.rootTasks[0].char).toBe('x');
    expect(mutatedSpec.rootTasks[0].isCompleted).toBe(true);
  });

  it('should preserve multi-state Obsidian characters precisely', () => {
    const originalText = '- [/] Active feature in progress';
    const spec = MarkdownASTParser.parse(originalText, 'auth', dummyFileUri, dummyFolderUri);
    const task = spec.rootTasks[0];

    expect(task.char).toBe('/');

    // Cycle to 'x'
    const before = originalText.substring(0, task.bracketRange.charCol);
    const after = originalText.substring(task.bracketRange.charCol + 1);
    const mutated = `${before}x${after}`;

    expect(mutated).toBe('- [x] Active feature in progress');
  });
});
