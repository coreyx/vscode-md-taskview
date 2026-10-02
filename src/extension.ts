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
  const treeDataProvider = new TaskTreeDataProvider(discoveryService, configManager, context);

  // 3. Register TreeView
  const treeView = vscode.window.createTreeView('mdTaskView.tasksView', {
    treeDataProvider,
  });

  // Initialize context for collapse/expand toggle
  await vscode.commands.executeCommand('setContext', 'mdTaskView.isCollapsed', false);

  let currentFocusedNode: TaskTreeNode | undefined;

  const getActiveTarget = (node?: TaskTreeNode): TaskTreeNode | undefined => {
    if (node) {
      currentFocusedNode = node;
      return node;
    }
    if (treeView.selection.length > 0) {
      currentFocusedNode = treeView.selection[0];
      return treeView.selection[0];
    }
    if (currentFocusedNode) {
      const valid = treeDataProvider.findNodeById(currentFocusedNode.id);
      if (valid) {
        currentFocusedNode = valid;
        return valid;
      }
      currentFocusedNode = undefined;
    }
    return undefined;
  };

  const restoreFocus = async (target?: TaskTreeNode) => {
    if (!target) return;
    try {
      await treeView.reveal(target, { select: true, focus: true, expand: false });
    } catch {
      setTimeout(async () => {
        try {
          await treeView.reveal(target, { select: true, focus: true, expand: false });
        } catch {
          // ignore if element cannot be revealed
        }
      }, 50);
    }
  };

  // Track selection changes to update mdTaskView.isCollapsed context
  treeView.onDidChangeSelection((e) => {
    if (e.selection.length > 0) {
      currentFocusedNode = e.selection[0];
      const isCollapsed = treeDataProvider.areContainedChildrenCollapsed(e.selection[0]);
      vscode.commands.executeCommand('setContext', 'mdTaskView.isCollapsed', isCollapsed);
    }
  });

  // Track manual element expansion/collapse via chevrons
  treeView.onDidCollapseElement((e) => {
    treeDataProvider.setNodeCollapsedState(e.element.id, true);
    const target = getActiveTarget();
    if (target) {
      const isCollapsed = treeDataProvider.areContainedChildrenCollapsed(target);
      vscode.commands.executeCommand('setContext', 'mdTaskView.isCollapsed', isCollapsed);
    }
  });

  treeView.onDidExpandElement((e) => {
    treeDataProvider.setNodeCollapsedState(e.element.id, false);
    const target = getActiveTarget();
    if (target) {
      const isCollapsed = treeDataProvider.areContainedChildrenCollapsed(target);
      vscode.commands.executeCommand('setContext', 'mdTaskView.isCollapsed', isCollapsed);
    }
  });

  // 4. Start Live Filesystem & Buffer Watcher
  const watcherService = new FileSystemWatcherService(treeDataProvider, configManager);
  watcherService.start();

  // 5. Register Commands
  context.subscriptions.push(
    treeView,
    watcherService,
    vscode.commands.registerCommand('mdTaskView.collapseAll', async (node?: TaskTreeNode) => {
      const target = getActiveTarget(node);
      if (target) {
        treeDataProvider.collapseContained(target);
        await vscode.commands.executeCommand('setContext', 'mdTaskView.isCollapsed', true);
        await restoreFocus(target);
      } else {
        treeDataProvider.collapseAll();
        await vscode.commands.executeCommand('setContext', 'mdTaskView.isCollapsed', true);
      }
    }),
    vscode.commands.registerCommand('mdTaskView.expandAll', async (node?: TaskTreeNode) => {
      const target = getActiveTarget(node);
      if (target) {
        treeDataProvider.expandContained(target);
        await vscode.commands.executeCommand('setContext', 'mdTaskView.isCollapsed', false);
        await restoreFocus(target);
      } else {
        treeDataProvider.expandAll();
        await vscode.commands.executeCommand('setContext', 'mdTaskView.isCollapsed', false);
      }
    }),
    vscode.commands.registerCommand('mdTaskView.collapseSection', async (node?: TaskTreeNode) => {
      const target = getActiveTarget(node);
      if (target) {
        treeDataProvider.collapseContained(target);
        await vscode.commands.executeCommand('setContext', 'mdTaskView.isCollapsed', true);
        await restoreFocus(target);
      } else {
        treeDataProvider.collapseAll();
        await vscode.commands.executeCommand('setContext', 'mdTaskView.isCollapsed', true);
      }
    }),
    vscode.commands.registerCommand('mdTaskView.expandSection', async (node?: TaskTreeNode) => {
      const target = getActiveTarget(node);
      if (target) {
        treeDataProvider.expandContained(target);
        await vscode.commands.executeCommand('setContext', 'mdTaskView.isCollapsed', false);
        await restoreFocus(target);
      } else {
        treeDataProvider.expandAll();
        await vscode.commands.executeCommand('setContext', 'mdTaskView.isCollapsed', false);
      }
    }),
    vscode.commands.registerCommand('mdTaskView.collapseAllGlobal', async () => {
      treeDataProvider.collapseAll();
      await vscode.commands.executeCommand('setContext', 'mdTaskView.isCollapsed', true);
    }),
    vscode.commands.registerCommand('mdTaskView.expandAllGlobal', async () => {
      treeDataProvider.expandAll();
      await vscode.commands.executeCommand('setContext', 'mdTaskView.isCollapsed', false);
    }),
    vscode.commands.registerCommand('mdTaskView.toggleExpandCollapse', async () => {
      const target = getActiveTarget();
      if (target) {
        const isCollapsed = treeDataProvider.toggleContained(target);
        await vscode.commands.executeCommand('setContext', 'mdTaskView.isCollapsed', isCollapsed);
        await restoreFocus(target);
      } else {
        const isCollapsed = treeDataProvider.toggleExpandCollapse();
        await vscode.commands.executeCommand('setContext', 'mdTaskView.isCollapsed', isCollapsed);
      }
    }),
    vscode.commands.registerCommand('mdTaskView.refresh', async () => {
      await treeDataProvider.reloadSpecs();
      vscode.window.showInformationMessage('Markdown Tasks: Refreshed.');
    }),
    vscode.commands.registerCommand('mdTaskView.jumpToSource', async (fileUri: vscode.Uri, line: number, slug?: string) => {
      await NavigationCommands.jumpToSource(fileUri, line, slug, configManager);
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
    }),
    vscode.commands.registerCommand('mdTaskView.openSettings', async () => {
      await vscode.commands.executeCommand('workbench.action.openSettings', 'mdTaskView');
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
