import * as vscode from 'vscode';
import { ConfigurationManager } from './config/ConfigurationManager.js';
import { SpecDiscoveryService } from './services/SpecDiscoveryService.js';
import { TaskTreeDataProvider } from './views/TaskTreeDataProvider.js';
import { NavigationCommands } from './commands/NavigationCommands.js';
import { StateCommands } from './commands/StateCommands.js';
import { FileSystemWatcherService } from './services/FileSystemWatcherService.js';
import { StateTemplateEngine } from './templates/StateTemplateEngine.js';
import { TaskTreeNode } from './models/types.js';

export async function activate(context: vscode.ExtensionContext) {
  console.log('[vscode-md-taskview] Activating extension...');

  // 1. Initialize Configuration & Template Engine
  const configManager = ConfigurationManager.initialize(context);
  const stateEngine = StateTemplateEngine.getInstance();
  await stateEngine.reloadTemplate();

  // 2. Initialize Services & TreeDataProvider
  const discoveryService = new SpecDiscoveryService(configManager);
  const treeDataProvider = new TaskTreeDataProvider(discoveryService, configManager);

  // 3. Register TreeView
  const treeView = vscode.window.createTreeView('mdTaskView.tasksView', {
    treeDataProvider,
    showCollapseAll: true,
  });

  // 4. Start Live Filesystem & Buffer Watcher
  const watcherService = new FileSystemWatcherService(treeDataProvider, configManager);
  watcherService.start();

  // 5. Register Commands
  context.subscriptions.push(
    treeView,
    watcherService,
    vscode.commands.registerCommand('mdTaskView.refresh', async () => {
      await treeDataProvider.reloadSpecs();
      vscode.window.showInformationMessage('Markdown Tasks: Refreshed.');
    }),
    vscode.commands.registerCommand('mdTaskView.jumpToSource', async (fileUri: vscode.Uri, line: number) => {
      await NavigationCommands.jumpToSource(fileUri, line);
    }),
    vscode.commands.registerCommand('mdTaskView.toggleState', async (node?: TaskTreeNode) => {
      await StateCommands.toggleTaskState(node);
    }),
    vscode.commands.registerCommand('mdTaskView.setTaskState', async (node: TaskTreeNode | undefined, targetChar: string) => {
      await StateCommands.setTaskState(node, targetChar);
    }),
    vscode.commands.registerCommand('mdTaskView.setStateNotStarted', async (node?: TaskTreeNode) => {
      await StateCommands.setTaskState(node, ' ');
    }),
    vscode.commands.registerCommand('mdTaskView.setStateInProgress', async (node?: TaskTreeNode) => {
      await StateCommands.setTaskState(node, '/');
    }),
    vscode.commands.registerCommand('mdTaskView.setStateDone', async (node?: TaskTreeNode) => {
      await StateCommands.setTaskState(node, 'x');
    }),
    vscode.commands.registerCommand('mdTaskView.setStateCancelled', async (node?: TaskTreeNode) => {
      await StateCommands.setTaskState(node, '-');
    }),
    vscode.commands.registerCommand('mdTaskView.setStateClarification', async (node?: TaskTreeNode) => {
      await StateCommands.setTaskState(node, '?');
    }),
    vscode.commands.registerCommand('mdTaskView.setStateImportant', async (node?: TaskTreeNode) => {
      await StateCommands.setTaskState(node, '!');
    }),
    vscode.commands.registerCommand('mdTaskView.toggleFilterCompleted', () => {
      const active = treeDataProvider.toggleFilterCompleted();
      vscode.window.showInformationMessage(`Markdown Tasks: Filter completed tasks ${active ? 'enabled' : 'disabled'}.`);
    }),
    vscode.commands.registerCommand('mdTaskView.createSampleSpec', async () => {
      await StateCommands.createSampleSpec();
      await treeDataProvider.reloadSpecs();
    })
  );

  // 6. React to Configuration Changes
  configManager.onDidChangeConfig(async () => {
    console.log('[vscode-md-taskview] Configuration modified. Reloading templates and specs...');
    await stateEngine.reloadTemplate();
    await treeDataProvider.reloadSpecs();
  });

  // 7. Initial Load
  await treeDataProvider.reloadSpecs();

  console.log('[vscode-md-taskview] Extension activated successfully.');
}

export function deactivate() {
  console.log('[vscode-md-taskview] Extension deactivated.');
}
