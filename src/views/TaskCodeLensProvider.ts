import * as vscode from 'vscode';
import { ConfigurationManager } from '../config/ConfigurationManager.js';
import { MarkdownASTParser } from '../parser/MarkdownASTParser.js';
import { TaskTreeDataProvider } from './TaskTreeDataProvider.js';
import { TASK_ACTION_COMMANDS, TASK_ACTION_LABELS, TaskRef, getTaskActions } from '../commands/TaskActionCommands.js';

/**
 * Clickable actions above each task of a task file open in the text editor
 * (Start | Mark done, Continue | Mark done | Mark not started, Mark not done).
 */
export class TaskCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  constructor(
    private treeDataProvider: TaskTreeDataProvider,
    private configManager: ConfigurationManager = ConfigurationManager.getInstance()
  ) {}

  public refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }

  public provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    if (!this.configManager.getConfig().showTaskActions || !this.treeDataProvider.hasSpecFile(document.uri)) {
      return [];
    }

    // Parsed from the buffer itself so each lens sits on the task's line as the document reads now
    const spec = MarkdownASTParser.parse(document.getText(), '', document.uri, document.uri);
    const lenses: vscode.CodeLens[] = [];

    for (const task of MarkdownASTParser.collectTasks(spec)) {
      const start = new vscode.Position(task.line, 0);
      const range = new vscode.Range(start, start);
      const ref: TaskRef = { uri: document.uri, line: task.line };

      for (const action of getTaskActions(task.char)) {
        lenses.push(
          new vscode.CodeLens(range, {
            title: TASK_ACTION_LABELS[action],
            command: TASK_ACTION_COMMANDS[action],
            arguments: [ref],
          })
        );
      }
    }

    return lenses;
  }
}
