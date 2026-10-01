import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { TaskTreeNode } from '../models/types.js';
import { StateTemplateEngine } from '../templates/StateTemplateEngine.js';
import { SurgicalMutationService } from '../services/SurgicalMutationService.js';

export class StateCommands {
  /**
   * Cycles the given task to its next state according to the active template.
   */
  public static async toggleTaskState(node: TaskTreeNode | undefined): Promise<void> {
    if (!node || node.type !== 'task') {
      return;
    }

    const stateEngine = StateTemplateEngine.getInstance();
    const nextState = stateEngine.getNextState(node.char);

    await SurgicalMutationService.mutateTaskChar(node, nextState.char);
  }

  /**
   * Explicitly sets the task to a specific state character.
   */
  public static async setTaskState(node: TaskTreeNode | undefined, targetChar: string): Promise<void> {
    if (!node || node.type !== 'task') {
      return;
    }

    await SurgicalMutationService.mutateTaskChar(node, targetChar);
  }

  /**
   * Generates a sample specification folder and task file for quick start.
   */
  public static async createSampleSpec(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showWarningMessage('Markdown Tasks: Open a workspace folder first to create a sample spec.');
      return;
    }

    const targetDir = path.join(workspaceFolders[0].uri.fsPath, 'spec', 'sample');
    const targetFile = path.join(targetDir, 'tasks.md');

    try {
      await fs.mkdir(targetDir, { recursive: true });
      const sampleContent = `# Sample Feature Specification
A sample task list demonstrating the Markdown Task View extension.

## 1. Setup & Environment
- [x] Install project dependencies
- [ ] Configure environment variables
  - [x] Database credentials
  - [ ] OAuth API secrets

## 2. Implementation
- [/] Develop core feature logic
- [?] Verify third-party rate limits
- [!] Deploy hotfix before launch
- [-] Deprecated legacy API
`;
      await fs.writeFile(targetFile, sampleContent, 'utf-8');

      const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(targetFile));
      await vscode.window.showTextDocument(doc);
      vscode.window.showInformationMessage('Markdown Tasks: Created sample spec at ./spec/sample/tasks.md');
    } catch (err) {
      vscode.window.showErrorMessage(`Failed to create sample spec: ${(err as Error).message}`);
    }
  }
}
