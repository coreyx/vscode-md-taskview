import * as vscode from 'vscode';
import { TaskNode } from '../models/types.js';

export class SurgicalMutationService {
  /**
   * Non-destructively updates the character inside the checklist brackets of a task.
   *
   * @param task Target task node.
   * @param nextChar The new character to insert inside '[ ]'.
   */
  public static async mutateTaskChar(task: TaskNode, nextChar: string): Promise<boolean> {
    try {
      const edit = new vscode.WorkspaceEdit();

      // The range covers the exact character between '[' and ']'
      const range = new vscode.Range(
        new vscode.Position(task.bracketRange.line, task.bracketRange.charCol),
        new vscode.Position(task.bracketRange.line, task.bracketRange.charCol + 1)
      );

      edit.replace(task.fileUri, range, nextChar);

      const success = await vscode.workspace.applyEdit(edit);
      if (!success) {
        vscode.window.showErrorMessage('Markdown Tasks: Unable to update task. File may be locked or read-only.');
        return false;
      }

      return true;
    } catch (err) {
      vscode.window.showErrorMessage(`Markdown Tasks error: ${(err as Error).message}`);
      return false;
    }
  }
}
