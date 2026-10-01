import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import { SpecGroup, TaskNode, TaskTreeNode } from '../models/types.js';
import { SpecDiscoveryService } from '../services/SpecDiscoveryService.js';
import { MarkdownASTParser } from '../parser/MarkdownASTParser.js';
import { ConfigurationManager } from '../config/ConfigurationManager.js';
import { StateTemplateEngine } from '../templates/StateTemplateEngine.js';

export class TaskTreeDataProvider implements vscode.TreeDataProvider<TaskTreeNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TaskTreeNode | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private specGroups: Map<string, SpecGroup> = new Map();
  private isFilterCompletedActive = false;

  constructor(
    private discoveryService: SpecDiscoveryService = new SpecDiscoveryService(),
    private configManager: ConfigurationManager = ConfigurationManager.getInstance()
  ) {}

  public async refresh(targetNode?: TaskTreeNode): Promise<void> {
    if (!targetNode || targetNode.type === 'specGroup') {
      await this.reloadSpecs();
    }
    this._onDidChangeTreeData.fire(targetNode);
  }

  public async reloadSpecs(): Promise<void> {
    const discovered = await this.discoveryService.discoverSpecFiles();
    const newSpecs = new Map<string, SpecGroup>();

    for (const spec of discovered) {
      try {
        const content = await fs.readFile(spec.taskFileUri.fsPath, 'utf-8');
        const parsed = MarkdownASTParser.parse(
          content,
          spec.specName,
          spec.taskFileUri,
          spec.folderUri
        );
        newSpecs.set(spec.taskFileUri.fsPath, parsed);
      } catch (err) {
        console.error(`Failed to read or parse spec file: ${spec.taskFileUri.fsPath}`, err);
      }
    }

    this.specGroups = newSpecs;
    this._onDidChangeTreeData.fire();
  }

  public updateSpecFromContent(fileUri: vscode.Uri, content: string): void {
    const existing = this.specGroups.get(fileUri.fsPath);
    const specName = existing ? existing.name : fileUri.path.split('/').slice(-2, -1)[0] || 'spec';
    const folderUri = existing ? existing.folderUri : vscode.Uri.file(fileUri.fsPath.replace(/[/\\][^/\\]+$/, ''));

    const parsed = MarkdownASTParser.parse(content, specName, fileUri, folderUri);
    this.specGroups.set(fileUri.fsPath, parsed);
    this._onDidChangeTreeData.fire();
  }

  public removeSpec(fileUri: vscode.Uri): void {
    if (this.specGroups.delete(fileUri.fsPath)) {
      this._onDidChangeTreeData.fire();
    }
  }

  public toggleFilterCompleted(): boolean {
    this.isFilterCompletedActive = !this.isFilterCompletedActive;
    this._onDidChangeTreeData.fire();
    return this.isFilterCompletedActive;
  }

  public getTreeItem(element: TaskTreeNode): vscode.TreeItem {
    const config = this.configManager.getConfig();

    switch (element.type) {
      case 'specGroup': {
        let groupTitle = element.name;
        if (config.useH1AsGroupName && element.headings.length > 0) {
          const firstH1 = element.headings.find((h) => h.level === 1);
          if (firstH1) {
            groupTitle = firstH1.label;
          }
        }

        const item = new vscode.TreeItem(
          groupTitle,
          vscode.TreeItemCollapsibleState.Expanded
        );
        item.id = element.id;
        item.contextValue = 'specGroup';
        item.iconPath = new vscode.ThemeIcon('package');

        if (config.showProgressCount && element.stats.totalCountable > 0) {
          item.description = `(${element.stats.completedCount}/${element.stats.totalCountable})`;
        } else if (element.stats.totalCountable === 0) {
          item.description = '(No tasks)';
        }
        item.tooltip = `${element.name} - ${element.taskFileUri.fsPath}`;
        return item;
      }

      case 'heading': {
        const item = new vscode.TreeItem(
          element.label,
          vscode.TreeItemCollapsibleState.Expanded
        );
        item.id = element.id;
        item.contextValue = 'heading';
        item.iconPath = new vscode.ThemeIcon('bookmark');

        if (config.showProgressCount && element.stats.totalCountable > 0) {
          item.description = `(${element.stats.completedCount}/${element.stats.totalCountable})`;
        }

        // Navigation command
        item.command = {
          command: 'mdTaskView.jumpToSource',
          title: 'Jump to Heading',
          arguments: [element.fileUri, element.line],
        };
        return item;
      }

      case 'task': {
        const hasSubtasks = element.subTasks.length > 0;
        const collapsibleState = hasSubtasks
          ? vscode.TreeItemCollapsibleState.Expanded
          : vscode.TreeItemCollapsibleState.None;

        const stateEngine = StateTemplateEngine.getInstance();
        const stateDef = stateEngine.getState(element.char);

        let displayLabel = element.cleanText;
        if (stateDef.strikethrough && config.strikeThroughCompleted) {
          // Strikethrough using Unicode combining strike character
          displayLabel = displayLabel.split('').map((c) => c + '\u0336').join('');
        }

        const item = new vscode.TreeItem(displayLabel, collapsibleState);
        item.id = element.id;
        item.contextValue = 'taskItem';

        // Set Icon & Color based on state definition
        const themeColor = stateDef.color ? new vscode.ThemeColor(stateDef.color) : undefined;
        item.iconPath = new vscode.ThemeIcon(stateDef.icon, themeColor);

        // Tooltip with raw details and state description
        item.tooltip = new vscode.MarkdownString(`**[${element.char}] ${stateDef.label}**: ${element.cleanText}\n\n*Line ${element.line + 1}*`);

        // Navigation command
        item.command = {
          command: 'mdTaskView.jumpToSource',
          title: 'Jump to Task',
          arguments: [element.fileUri, element.line],
        };

        return item;
      }
    }
  }

  public getChildren(element?: TaskTreeNode): TaskTreeNode[] {
    if (!element) {
      return Array.from(this.specGroups.values());
    }

    switch (element.type) {
      case 'specGroup': {
        const children: TaskTreeNode[] = [...element.headings];
        const visibleTasks = this.filterTasks(element.rootTasks);
        return [...children, ...visibleTasks];
      }

      case 'heading': {
        const visibleChildren = element.children.filter((child) => {
          if (!this.isFilterCompletedActive) return true;
          return child.stats.completedCount < child.stats.totalCountable || child.stats.totalCountable === 0;
        });
        const visibleTasks = this.filterTasks(element.tasks);
        return [...visibleChildren, ...visibleTasks];
      }

      case 'task': {
        return this.filterTasks(element.subTasks);
      }
    }
  }

  private filterTasks(tasks: TaskNode[]): TaskNode[] {
    if (!this.isFilterCompletedActive) {
      return tasks;
    }
    return tasks.filter((t) => !t.isCompleted);
  }
}
