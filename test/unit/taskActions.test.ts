import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as vscode from 'vscode';
import { TASK_ACTION_COMMANDS, TaskActionCommands, getTaskActions } from '../../src/commands/TaskActionCommands.js';
import { TaskCodeLensProvider } from '../../src/views/TaskCodeLensProvider.js';
import { TaskTreeDataProvider } from '../../src/views/TaskTreeDataProvider.js';
import { MarkdownASTParser } from '../../src/parser/MarkdownASTParser.js';
import { StateTemplateEngine, OBSIDIAN_TEMPLATE, STANDARD_TEMPLATE } from '../../src/templates/StateTemplateEngine.js';
import {
  appliedEdits,
  lastShownTextDocument,
  lastShownWarningMessage,
  resetAppliedEdits,
  resetMockConfigurations,
  resetShownMessages,
  setMockConfiguration,
  setMockDocumentText,
} from '../mocks/vscode.js';

const engine = StateTemplateEngine.getInstance();

function useTemplate(template: typeof STANDARD_TEMPLATE) {
  (engine as any).currentTemplate = template;
  (engine as any).rebuildIndex();
}

const fileUri = vscode.Uri.file('/workspace/spec/auth/tasks.md');
const folderUri = vscode.Uri.file('/workspace/spec/auth');

const MARKDOWN = [
  '## Milestone 1',
  '- [ ] Not started',
  '- [/] Started',
  '  - [x] Done sub-task',
  '### - [X] Done heading task',
  '- [?] Odd',
].join('\n');

beforeEach(() => {
  resetMockConfigurations();
  resetAppliedEdits();
  resetShownMessages();
  setMockDocumentText(MARKDOWN);
  useTemplate(OBSIDIAN_TEMPLATE);
});

afterEach(() => {
  useTemplate(STANDARD_TEMPLATE);
});

describe('getTaskActions', () => {
  it('offers Start and Mark done on a task that is not started', () => {
    expect(getTaskActions(' ')).toEqual(['start', 'markDone']);
  });

  it('offers Continue, Mark done and Mark not started on a started task', () => {
    expect(getTaskActions('/')).toEqual(['continue', 'markDone', 'markNotStarted']);
  });

  it('offers Mark not done on a done task, whatever the case of its marker', () => {
    expect(getTaskActions('x')).toEqual(['markNotDone']);
    expect(getTaskActions('X')).toEqual(['markNotDone']);
  });

  it('offers either end on a task in any other state', () => {
    expect(getTaskActions('-')).toEqual(['markDone', 'markNotStarted']);
    expect(getTaskActions('?')).toEqual(['markDone', 'markNotStarted']);
    expect(getTaskActions('~')).toEqual(['markDone', 'markNotStarted']);
  });

  it('offers only Mark done and Mark not done under the Standard (GFM) template, which has no in-progress state', () => {
    useTemplate(STANDARD_TEMPLATE);
    expect(getTaskActions(' ')).toEqual(['markDone']);
    expect(getTaskActions('x')).toEqual(['markNotDone']);
    expect(getTaskActions('X')).toEqual(['markNotDone']);
    // A marker GFM does not define can be set to either end
    expect(getTaskActions('/')).toEqual(['markDone', 'markNotDone']);
    expect(getTaskActions('?')).toEqual(['markDone', 'markNotDone']);
  });

  it('treats [/] as started in a custom template that maps it under another id', () => {
    useTemplate({
      name: 'Custom',
      description: '',
      defaultState: ' ',
      states: [
        { char: ' ', id: 'todo', label: 'To Do', icon: 'circle-large-outline' },
        { char: '/', id: 'progress', label: 'In Progress', icon: 'sync' },
        { char: 'x', id: 'done', label: 'Done', icon: 'pass-filled', countsAsCompleted: true },
      ],
    });
    expect(getTaskActions(' ')).toEqual(['start', 'markDone']);
    expect(getTaskActions('/')).toEqual(['continue', 'markDone', 'markNotStarted']);
  });

  it("uses a custom template's own in-progress and done characters", () => {
    useTemplate({
      name: 'Custom',
      description: '',
      defaultState: ' ',
      states: [
        { char: ' ', id: 'todo', label: 'To Do', icon: 'circle-large-outline' },
        { char: '~', id: 'in_progress', label: 'Doing', icon: 'sync' },
        { char: 'd', id: 'done', label: 'Done', icon: 'pass-filled', countsAsCompleted: true },
      ],
    });
    expect(getTaskActions('~')).toEqual(['continue', 'markDone', 'markNotStarted']);
    expect(getTaskActions('d')).toEqual(['markNotDone']);
    expect(getTaskActions('/')).toEqual(['markDone', 'markNotStarted']);
  });
});

describe('TaskCodeLensProvider', () => {
  const document: any = { uri: fileUri, getText: () => MARKDOWN };

  function providerFor(...specFiles: string[]) {
    const tree = new TaskTreeDataProvider();
    for (const fsPath of specFiles) {
      tree.addSpecGroup(MarkdownASTParser.parse(MARKDOWN, 'auth', vscode.Uri.file(fsPath), folderUri));
    }
    return new TaskCodeLensProvider(tree);
  }

  function titlesByLine(lenses: vscode.CodeLens[]): Record<number, string[]> {
    const byLine: Record<number, string[]> = {};
    for (const lens of lenses) {
      (byLine[lens.range.start.line] ??= []).push(lens.command!.title);
    }
    return byLine;
  }

  it('offers the actions of each task above its line, sub-tasks and heading tasks included', () => {
    const lenses = providerFor(fileUri.fsPath).provideCodeLenses(document);
    expect(titlesByLine(lenses)).toEqual({
      1: ['Start', 'Mark done'],
      2: ['Continue', 'Mark done', 'Mark not started'],
      3: ['Mark not done'],
      4: ['Mark not done'],
      5: ['Mark done', 'Mark not started'],
    });
  });

  it('names the task by document and line, and runs the matching command', () => {
    const lenses = providerFor(fileUri.fsPath).provideCodeLenses(document);
    const start = lenses.find((lens) => lens.command!.title === 'Start')!;
    expect(start.command!.command).toBe(TASK_ACTION_COMMANDS.start);
    expect(start.command!.arguments).toEqual([{ uri: fileUri, line: 1 }]);
  });

  it('matches the task file whatever the case of its path', () => {
    const lenses = providerFor('/Workspace/Spec/auth/TASKS.md').provideCodeLenses(document);
    expect(lenses.length).toBeGreaterThan(0);
  });

  it('offers no Start, Continue or Mark not started under the Standard (GFM) template', () => {
    useTemplate(STANDARD_TEMPLATE);
    const lenses = providerFor(fileUri.fsPath).provideCodeLenses(document);
    expect(titlesByLine(lenses)).toEqual({
      1: ['Mark done'],
      2: ['Mark done', 'Mark not done'],
      3: ['Mark not done'],
      4: ['Mark not done'],
      5: ['Mark done', 'Mark not done'],
    });
  });

  it('offers nothing in a markdown file that is not a task file', () => {
    expect(providerFor('/workspace/spec/other/tasks.md').provideCodeLenses(document)).toEqual([]);
  });

  it('offers nothing when mdTaskView.showTaskActions is disabled', () => {
    setMockConfiguration('mdTaskView', { showTaskActions: false });
    expect(providerFor(fileUri.fsPath).provideCodeLenses(document)).toEqual([]);
  });
});

describe('TaskActionCommands', () => {
  /** The single character written by the last action, with where it was written. */
  function lastReplacement() {
    expect(appliedEdits.length).toBe(1);
    const { range, text } = appliedEdits[0].replacements[0];
    return { line: range.start.line, col: range.start.character, text };
  }

  it('Start marks the task in progress, changing only its marker', async () => {
    await TaskActionCommands.run('start', { uri: fileUri, line: 1 });
    expect(lastReplacement()).toEqual({ line: 1, col: 3, text: '/' });
  });

  it('Mark done marks a started task done', async () => {
    await TaskActionCommands.run('markDone', { uri: fileUri, line: 2 });
    expect(lastReplacement()).toEqual({ line: 2, col: 3, text: 'x' });
  });

  it('Mark not started and Mark not done both leave the task not started', async () => {
    await TaskActionCommands.run('markNotStarted', { uri: fileUri, line: 2 });
    expect(lastReplacement()).toEqual({ line: 2, col: 3, text: ' ' });

    resetAppliedEdits();
    await TaskActionCommands.run('markNotDone', { uri: fileUri, line: 3 });
    expect(lastReplacement()).toEqual({ line: 3, col: 5, text: ' ' });
  });

  it('marks a task written as a heading', async () => {
    await TaskActionCommands.run('markNotDone', { uri: fileUri, line: 4 });
    expect(lastReplacement()).toEqual({ line: 4, col: 7, text: ' ' });
  });

  it('acts on a tree view row directly', async () => {
    const spec = MarkdownASTParser.parse(MARKDOWN, 'auth', fileUri, folderUri);
    await TaskActionCommands.run('start', spec.headings[0].tasks[0]);
    expect(lastReplacement()).toEqual({ line: 1, col: 3, text: '/' });
  });

  it('changes nothing when the task is already as wanted', async () => {
    await TaskActionCommands.run('start', { uri: fileUri, line: 2 });
    expect(appliedEdits).toEqual([]);
  });

  it('Start changes nothing and says why under the Standard (GFM) template', async () => {
    useTemplate(STANDARD_TEMPLATE);
    await TaskActionCommands.run('start', { uri: fileUri, line: 1 });
    expect(appliedEdits).toEqual([]);
    expect(lastShownWarningMessage).toContain('has no in-progress state');
  });

  it('Mark done and Mark not done work under the Standard (GFM) template', async () => {
    useTemplate(STANDARD_TEMPLATE);
    await TaskActionCommands.run('markDone', { uri: fileUri, line: 1 });
    expect(lastReplacement()).toEqual({ line: 1, col: 3, text: 'x' });

    resetAppliedEdits();
    await TaskActionCommands.run('markNotDone', { uri: fileUri, line: 2 });
    expect(lastReplacement()).toEqual({ line: 2, col: 3, text: ' ' });
  });

  it('Continue opens the task in the text editor without changing it', async () => {
    await TaskActionCommands.run('continue', { uri: fileUri, line: 2 });
    expect(appliedEdits).toEqual([]);
    expect(lastShownTextDocument?.doc.uri).toBe(fileUri);
  });

  it('warns when the line is no longer a task', async () => {
    await TaskActionCommands.run('markDone', { uri: fileUri, line: 0 });
    expect(appliedEdits).toEqual([]);
    expect(lastShownWarningMessage).toContain('Put the cursor on a task');
  });

  it('warns when run with no task and no editor', async () => {
    await TaskActionCommands.run('markDone');
    expect(appliedEdits).toEqual([]);
    expect(lastShownWarningMessage).toContain('Put the cursor on a task');
  });
});
