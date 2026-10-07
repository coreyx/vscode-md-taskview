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

  it('should strip markdown bold and italic from task items and headings without literal asterisks or underscores', () => {
    const markdown = `
# **Milestone 1**: *Scaffolding*
- [x] **TASK-1.1: Extension Project Scaffolding & Build Tooling**
- [ ] *TASK-1.2: Italic task title*
- [ ] ***TASK-1.3: Bold and italic task title***
- [x] __TASK-1.4: Underscore bold task__
- [ ] _TASK-1.5: Underscore italic task_
- [ ] ___TASK-1.6: Underscore bold and italic task___
- [ ] **_TASK-1.7: Nested bold italic_**
- [ ] Combine **bold** with *italic* words in a single line
- [ ] Maintain snake_case_identifier and math 2 * 3 = 6 intact
`;
    const spec = MarkdownASTParser.parse(markdown, 'auth', dummyFileUri, dummyFolderUri);
    const h1 = spec.headings[0];

    expect(h1.label).toBe('Milestone 1: Scaffolding');
    expect(h1.tasks[0].cleanText).toBe('TASK-1.1: Extension Project Scaffolding & Build Tooling');
    expect(h1.tasks[1].cleanText).toBe('TASK-1.2: Italic task title');
    expect(h1.tasks[2].cleanText).toBe('TASK-1.3: Bold and italic task title');
    expect(h1.tasks[3].cleanText).toBe('TASK-1.4: Underscore bold task');
    expect(h1.tasks[4].cleanText).toBe('TASK-1.5: Underscore italic task');
    expect(h1.tasks[5].cleanText).toBe('TASK-1.6: Underscore bold and italic task');
    expect(h1.tasks[6].cleanText).toBe('TASK-1.7: Nested bold italic');
    expect(h1.tasks[7].cleanText).toBe('Combine bold with italic words in a single line');
    expect(h1.tasks[8].cleanText).toBe('Maintain snake_case_identifier and math 2 * 3 = 6 intact');
  });

  it('should generate heading slugs and associate parentHeadingSlug on child tasks', () => {
    const markdown = `
# Milestone 1: Project Foundation & Extension Scaffolding (MVP - Part 1)
- [ ] TASK-1.1: Extension Scaffolding
  - [ ] Subtask 1.1.1
## Milestone 2: Task Checkbox State Cycling
- [x] TASK-2.1: State cycling
`;
    const spec = MarkdownASTParser.parse(markdown, 'auth', dummyFileUri, dummyFolderUri);

    expect(spec.headings.length).toBe(1);
    const h1 = spec.headings[0];
    expect(h1.slug).toBe('milestone-1-project-foundation--extension-scaffolding-mvp---part-1');
    expect(h1.tasks[0].parentHeadingSlug).toBe('milestone-1-project-foundation--extension-scaffolding-mvp---part-1');
    expect(h1.tasks[0].subTasks[0].parentHeadingSlug).toBe('milestone-1-project-foundation--extension-scaffolding-mvp---part-1');

    const h2 = h1.children[0];
    expect(h2.slug).toBe('milestone-2-task-checkbox-state-cycling');
    expect(h2.tasks[0].parentHeadingSlug).toBe('milestone-2-task-checkbox-state-cycling');
  });

  it('should parse checklist items written as headings as tasks', () => {
    const markdown = `
## Milestone 1: Setup
### - [x] Task 1.1: Scaffolding
- **Concrete Steps**:
  1. Initialize the project.
### - [ ] Task 1.2: Styling
- [x] Install dependencies
  - [ ] Configure theme
#### - [x] Task 1.2.1: Nested heading task
## Milestone 2: Done
### - [x] Task 2.1: Only task
`;
    const spec = MarkdownASTParser.parse(markdown, 'auth', dummyFileUri, dummyFolderUri);

    expect(spec.headings.length).toBe(2);
    const m1 = spec.headings[0];
    expect(m1.children.length).toBe(0);
    expect(m1.tasks.length).toBe(2);

    const t11 = m1.tasks[0];
    expect(t11.cleanText).toBe('Task 1.1: Scaffolding');
    expect(t11.char).toBe('x');
    expect(t11.isCompleted).toBe(true);
    expect(t11.subTasks.length).toBe(0);
    expect(t11.line).toBe(2);
    expect(t11.bracketRange.openBracketCol).toBe(6);
    expect(t11.bracketRange.charCol).toBe(7);
    expect(t11.bracketRange.closeBracketCol).toBe(8);
    expect(t11.parentHeadingId).toBe(m1.id);

    const t12 = m1.tasks[1];
    expect(t12.cleanText).toBe('Task 1.2: Styling');
    expect(t12.isCompleted).toBe(false);
    expect(t12.subTasks.map((t) => t.cleanText)).toEqual(['Install dependencies', 'Task 1.2.1: Nested heading task']);
    expect(t12.subTasks[0].subTasks[0].cleanText).toBe('Configure theme');
    expect(t12.subTasks[0].parentHeadingSlug).toBe(t12.parentHeadingSlug);

    expect(m1.stats.totalCountable).toBe(5);
    expect(m1.stats.completedCount).toBe(3);

    const m2 = spec.headings[1];
    expect(m2.tasks.length).toBe(1);
    expect(m2.stats.totalCountable).toBe(1);
    expect(m2.stats.completedCount).toBe(1);
  });
});
