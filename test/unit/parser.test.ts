import { describe, it, expect } from 'vitest';
import * as vscode from 'vscode';
import { MarkdownASTParser } from '../../src/parser/MarkdownASTParser.js';

describe('MarkdownASTParser', () => {
  const dummyFileUri = vscode.Uri.file('/workspace/spec/auth/tasks.md');
  const dummyFolderUri = vscode.Uri.file('/workspace/spec/auth');

  it('should parse top-level unheaded checklist items', () => {
    const markdown = `- [ ] Pre-task 1\n- [x] Pre-task 2`;
    const spec = MarkdownASTParser.parse(markdown, 'auth', dummyFileUri, dummyFolderUri);

    expect(spec.name).toBe('auth');
    expect(spec.rootTasks.length).toBe(2);
    expect(spec.rootTasks[0].cleanText).toBe('Pre-task 1');
    expect(spec.rootTasks[0].isCompleted).toBe(false);
    expect(spec.rootTasks[1].cleanText).toBe('Pre-task 2');
    expect(spec.rootTasks[1].isCompleted).toBe(true);
    expect(spec.stats.totalCountable).toBe(2);
    expect(spec.stats.completedCount).toBe(1);
  });

  it('should parse hierarchical headings depth', () => {
    const markdown = `
# Section 1
- [ ] Task 1.1
## SubSection 1.1
- [x] Task 1.1.1
### SubSubSection 1.1.1
- [ ] Deep task
## SubSection 1.2
- [ ] Task 1.2.1
`;
    const spec = MarkdownASTParser.parse(markdown, 'auth', dummyFileUri, dummyFolderUri);

    expect(spec.headings.length).toBe(1); // 1 top-level heading (# Section 1)
    const h1 = spec.headings[0];
    expect(h1.label).toBe('Section 1');
    expect(h1.tasks.length).toBe(1);
    expect(h1.children.length).toBe(2); // SubSection 1.1, SubSection 1.2

    const sub1 = h1.children[0];
    expect(sub1.label).toBe('SubSection 1.1');
    expect(sub1.tasks.length).toBe(1);
    expect(sub1.children.length).toBe(1); // SubSubSection 1.1.1

    const subSub1 = sub1.children[0];
    expect(subSub1.label).toBe('SubSubSection 1.1.1');
    expect(subSub1.tasks.length).toBe(1);

    const sub2 = h1.children[1];
    expect(sub2.label).toBe('SubSection 1.2');
    expect(sub2.tasks.length).toBe(1);

    // Total stats
    expect(spec.stats.totalCountable).toBe(4);
    expect(spec.stats.completedCount).toBe(1);
    expect(h1.stats.totalCountable).toBe(4);
    expect(h1.stats.completedCount).toBe(1);
  });

  it('should accurately calculate bracket column coordinates', () => {
    const line = '  - [x] Perform user authentication';
    const spec = MarkdownASTParser.parse(line, 'auth', dummyFileUri, dummyFolderUri);

    const task = spec.rootTasks[0];
    expect(task.char).toBe('x');
    expect(task.bracketRange.line).toBe(0);
    expect(task.bracketRange.openBracketCol).toBe(4);
    expect(task.bracketRange.charCol).toBe(5);
    expect(task.bracketRange.closeBracketCol).toBe(6);
  });

  it('should parse indented sub-tasks', () => {
    const markdown = `
# Milestone 1
- [ ] Parent task
  - [x] Child task 1
  - [ ] Child task 2
    - [x] Grandchild task
`;
    const spec = MarkdownASTParser.parse(markdown, 'auth', dummyFileUri, dummyFolderUri);
    const h1 = spec.headings[0];

    expect(h1.tasks.length).toBe(1);
    const parent = h1.tasks[0];
    expect(parent.cleanText).toBe('Parent task');
    expect(parent.subTasks.length).toBe(2);

    expect(parent.subTasks[0].cleanText).toBe('Child task 1');
    expect(parent.subTasks[0].isCompleted).toBe(true);

    expect(parent.subTasks[1].cleanText).toBe('Child task 2');
    expect(parent.subTasks[1].subTasks.length).toBe(1);
    expect(parent.subTasks[1].subTasks[0].cleanText).toBe('Grandchild task');
    expect(parent.subTasks[1].subTasks[0].isCompleted).toBe(true);

    expect(h1.stats.totalCountable).toBe(4);
    expect(h1.stats.completedCount).toBe(2);
  });

  it('should gracefully handle malformed lines and non-task markdown', () => {
    const markdown = `
# Valid Heading
Some introductory paragraph text without tasks.
- Regular bullet point
- [ unclosed bracket task
* [ ] Asterisk bullet task
`;
    const spec = MarkdownASTParser.parse(markdown, 'auth', dummyFileUri, dummyFolderUri);
    const h1 = spec.headings[0];

    expect(h1.label).toBe('Valid Heading');
    expect(h1.tasks.length).toBe(1);
    expect(h1.tasks[0].cleanText).toBe('Asterisk bullet task');
  });
});
