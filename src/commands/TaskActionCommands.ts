import * as vscode from 'vscode';
import { TaskNode, TaskTreeNode } from '../models/types.js';
import { MarkdownASTParser } from '../parser/MarkdownASTParser.js';
import { StateTemplateEngine } from '../templates/StateTemplateEngine.js';
import { SurgicalMutationService } from '../services/SurgicalMutationService.js';
import { NavigationCommands } from './NavigationCommands.js';

export type TaskAction = 'start' | 'continue' | 'markDone' | 'markNotDone' | 'markNotStarted';

export const TASK_ACTION_LABELS: Readonly<Record<TaskAction, string>> = {
  start: 'Start',
  continue: 'Continue',
  markDone: 'Mark done',
  markNotDone: 'Mark not done',
  markNotStarted: 'Mark not started',
};

export const TASK_ACTION_COMMANDS: Readonly<Record<TaskAction, string>> = {
  start: 'mdTaskView.startTask',
  continue: 'mdTaskView.continueTask',
  markDone: 'mdTaskView.markTaskDone',
  markNotDone: 'mdTaskView.markTaskNotDone',
  markNotStarted: 'mdTaskView.markTaskNotStarted',
};

/** A task named by where it is: the document and its line. */
export interface TaskRef {
  uri: vscode.Uri;
  line: number;
}

/** Where a task action was run from: a tree view row, an editor CodeLens, or neither (the cursor). */
export type TaskOrigin = TaskTreeNode | TaskRef | undefined;

/**
 * The actions a task offers, by the state its bracket character stands for.
 * A character that is neither not started, started, nor done can be set to either end.
 *
 * A template with no in-progress state, as Standard (GFM), has nothing to start or continue,
 * so its tasks offer only "Mark done" and "Mark not done".
 */
export function getTaskActions(
  char: string,
  stateEngine: StateTemplateEngine = StateTemplateEngine.getInstance()
): TaskAction[] {
  if (stateEngine.getState(char).countsAsCompleted) {
    return ['markNotDone'];
  }

  const inProgressChar = stateEngine.getInProgressChar();
  const isNotStarted = char === stateEngine.getDefaultChar();

  if (inProgressChar === undefined) {
    return isNotStarted ? ['markDone'] : ['markDone', 'markNotDone'];
  }
  if (char === inProgressChar) {
    return ['continue', 'markDone', 'markNotStarted'];
  }
  return isNotStarted ? ['start', 'markDone'] : ['markDone', 'markNotStarted'];
}

export class TaskActionCommands {
  /**
   * Carries out a task action on the task it was run from, or on the task under the cursor.
   */
  public static async run(action: TaskAction, origin?: TaskOrigin): Promise<void> {
    const task = await this.resolveTask(origin);
    if (!task) {
      vscode.window.showWarningMessage('Markdown Tasks: Put the cursor on a task, or choose one in the tree view.');
      return;
    }

    if (action === 'continue') {
      if (origin && 'type' in origin) {
        await NavigationCommands.jumpToSource(task.fileUri, task.line, task.parentHeadingSlug);
      } else {
        await this.revealInTextEditor(task);
      }
      return;
    }

    const stateEngine = StateTemplateEngine.getInstance();
    const targetChar =
      action === 'start'
        ? stateEngine.getInProgressChar()
        : action === 'markDone'
        ? stateEngine.getDoneChar()
        : stateEngine.getDefaultChar();

    if (targetChar === undefined) {
      vscode.window.showWarningMessage(
        `Markdown Tasks: The ${stateEngine.getActiveTemplate().name} state template has no in-progress state, so tasks cannot be started.`
      );
      return;
    }

    // Nothing to change when the task is already as wanted
    if (task.char === targetChar) {
      return;
    }

    await SurgicalMutationService.mutateTaskChar(task, targetChar);
  }

  /**
   * Finds the task an action is about. A tree view row is the task itself; a CodeLens or the cursor
   * names a line, which is looked up in the document as it reads now.
   */
  private static async resolveTask(origin: TaskOrigin): Promise<TaskNode | undefined> {
    if (origin && 'type' in origin) {
      return origin.type === 'task' ? origin : undefined;
    }

    const editor = vscode.window.activeTextEditor;
    const uri = origin?.uri ?? editor?.document.uri;
    const line = origin?.line ?? editor?.selection.active.line;
    if (!uri || line === undefined) {
      return undefined;
    }

    const doc = await vscode.workspace.openTextDocument(uri);
    const spec = MarkdownASTParser.parse(doc.getText(), '', uri, uri);
    return MarkdownASTParser.collectTasks(spec).find((t) => t.line === line);
  }

  private static async revealInTextEditor(task: TaskNode): Promise<void> {
    const doc = await vscode.workspace.openTextDocument(task.fileUri);
    const editor = await vscode.window.showTextDocument(doc, { preserveFocus: false, preview: false });

    const endOfLine = new vscode.Position(task.line, doc.lineAt(task.line).text.length);
    editor.selection = new vscode.Selection(endOfLine, endOfLine);
    editor.revealRange(new vscode.Range(endOfLine, endOfLine), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
  }
}
