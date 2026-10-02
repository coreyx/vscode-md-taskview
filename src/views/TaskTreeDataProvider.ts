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
  private defaultIsCollapsed = false;
  private globalVersion = 0;
  private nodeStates: Map<string, { isCollapsed: boolean; version: number }> = new Map();

  constructor(
    private discoveryService: SpecDiscoveryService = new SpecDiscoveryService(),
    private configManager: ConfigurationManager = ConfigurationManager.getInstance(),
    private context?: vscode.ExtensionContext
  ) {}

  public addSpecGroup(specGroup: SpecGroup): void {
    this.specGroups.set(specGroup.taskFileUri.fsPath, specGroup);
  }

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

  public collapseAll(): void {
    this.defaultIsCollapsed = true;
    this.globalVersion++;
    this.nodeStates.clear();
    this._onDidChangeTreeData.fire();
  }

  public expandAll(): void {
    this.defaultIsCollapsed = false;
    this.globalVersion++;
    this.nodeStates.clear();
    this._onDidChangeTreeData.fire();
  }

  public toggleExpandCollapse(): boolean {
    if (this.defaultIsCollapsed) {
      this.expandAll();
    } else {
      this.collapseAll();
    }
    return this.defaultIsCollapsed;
  }

  public getIsAllCollapsed(): boolean {
    return this.defaultIsCollapsed;
  }

  public collapseSubtree(node: TaskTreeNode): void {
    const ids = this.collectSubtreeIds(node);
    for (const id of ids) {
      const existing = this.nodeStates.get(id);
      const currentVer = existing ? existing.version : 0;
      this.nodeStates.set(id, { isCollapsed: true, version: currentVer + 1 });
    }
    this._onDidChangeTreeData.fire();
  }

  public expandSubtree(node: TaskTreeNode): void {
    const ids = this.collectSubtreeIds(node);
    for (const id of ids) {
      const existing = this.nodeStates.get(id);
      const currentVer = existing ? existing.version : 0;
      this.nodeStates.set(id, { isCollapsed: false, version: currentVer + 1 });
    }
    this._onDidChangeTreeData.fire();
  }

  public toggleSubtree(node: TaskTreeNode): boolean {
    const currentlyCollapsed = this.isNodeCollapsed(node);
    if (currentlyCollapsed) {
      this.expandSubtree(node);
      return false;
    } else {
      this.collapseSubtree(node);
      return true;
    }
  }

  public getContainedCollapsibleIds(node: TaskTreeNode): string[] {
    const ids: string[] = [];
    switch (node.type) {
      case 'specGroup':
        for (const h of node.headings) {
          ids.push(h.id);
          ids.push(...this.collectSubtreeIds(h));
        }
        for (const t of node.rootTasks) {
          if (t.subTasks.length > 0) {
            ids.push(t.id);
            ids.push(...this.collectSubtreeIds(t));
          }
        }
        break;
      case 'heading':
        for (const ch of node.children) {
          ids.push(ch.id);
          ids.push(...this.collectSubtreeIds(ch));
        }
        for (const t of node.tasks) {
          if (t.subTasks.length > 0) {
            ids.push(t.id);
            ids.push(...this.collectSubtreeIds(t));
          }
        }
        break;
      case 'task':
        for (const st of node.subTasks) {
          if (st.subTasks.length > 0) {
            ids.push(st.id);
            ids.push(...this.collectSubtreeIds(st));
          }
        }
        break;
    }
    return Array.from(new Set(ids));
  }

  public hasCollapsibleChildren(node: TaskTreeNode): boolean {
    return this.getContainedCollapsibleIds(node).length > 0;
  }

  public isNodeIdCollapsed(id: string): boolean {
    const state = this.nodeStates.get(id);
    if (state !== undefined) {
      return state.isCollapsed;
    }
    return this.defaultIsCollapsed;
  }

  public areContainedChildrenCollapsed(node: TaskTreeNode): boolean {
    if (!this.hasCollapsibleChildren(node)) {
      return this.isNodeCollapsed(node);
    }
    const containedIds = this.getContainedCollapsibleIds(node);
    return containedIds.every((id) => this.isNodeIdCollapsed(id));
  }

  public collapseContained(node: TaskTreeNode): void {
    if (this.hasCollapsibleChildren(node)) {
      // Keep the selected container node expanded so user sees the level below it
      const nodeExisting = this.nodeStates.get(node.id);
      const nodeVer = nodeExisting ? nodeExisting.version : 0;
      this.nodeStates.set(node.id, { isCollapsed: false, version: nodeVer + 1 });

      // Collapse all collapsible children contained within node
      const containedIds = this.getContainedCollapsibleIds(node);
      for (const id of containedIds) {
        const existing = this.nodeStates.get(id);
        const ver = existing ? existing.version : 0;
        this.nodeStates.set(id, { isCollapsed: true, version: ver + 1 });
      }
    } else {
      // If node has no collapsible children, collapse node itself
      const existing = this.nodeStates.get(node.id);
      const ver = existing ? existing.version : 0;
      this.nodeStates.set(node.id, { isCollapsed: true, version: ver + 1 });
    }
    this._onDidChangeTreeData.fire();
  }

  public expandContained(node: TaskTreeNode): void {
    if (this.hasCollapsibleChildren(node)) {
      // Keep container node expanded
      const nodeExisting = this.nodeStates.get(node.id);
      const nodeVer = nodeExisting ? nodeExisting.version : 0;
      this.nodeStates.set(node.id, { isCollapsed: false, version: nodeVer + 1 });

      // Expand all collapsible children contained within node
      const containedIds = this.getContainedCollapsibleIds(node);
      for (const id of containedIds) {
        const existing = this.nodeStates.get(id);
        const ver = existing ? existing.version : 0;
        this.nodeStates.set(id, { isCollapsed: false, version: ver + 1 });
      }
    } else {
      // If node has no collapsible children, expand node itself
      const existing = this.nodeStates.get(node.id);
      const ver = existing ? existing.version : 0;
      this.nodeStates.set(node.id, { isCollapsed: false, version: ver + 1 });
    }
    this._onDidChangeTreeData.fire();
  }

  public toggleContained(node: TaskTreeNode): boolean {
    const isCollapsed = this.areContainedChildrenCollapsed(node);
    if (isCollapsed) {
      this.expandContained(node);
      return false;
    } else {
      this.collapseContained(node);
      return true;
    }
  }

  public setNodeCollapsedState(id: string, isCollapsed: boolean): void {
    const existing = this.nodeStates.get(id);
    const currentVer = existing ? existing.version : 0;
    this.nodeStates.set(id, { isCollapsed, version: currentVer });
  }

  public isNodeCollapsed(node: TaskTreeNode): boolean {
    const state = this.nodeStates.get(node.id);
    if (state !== undefined) {
      return state.isCollapsed;
    }
    return this.defaultIsCollapsed;
  }

  public getNodeVersion(id: string): number {
    const state = this.nodeStates.get(id);
    return this.globalVersion + (state ? state.version : 0);
  }

  public collectSubtreeIds(node: TaskTreeNode): string[] {
    const ids: string[] = [node.id];
    switch (node.type) {
      case 'specGroup':
        for (const h of node.headings) {
          ids.push(...this.collectSubtreeIds(h));
        }
        for (const t of node.rootTasks) {
          ids.push(...this.collectSubtreeIds(t));
        }
        break;
      case 'heading':
        for (const ch of node.children) {
          ids.push(...this.collectSubtreeIds(ch));
        }
        for (const t of node.tasks) {
          ids.push(...this.collectSubtreeIds(t));
        }
        break;
      case 'task':
        for (const st of node.subTasks) {
          ids.push(...this.collectSubtreeIds(st));
        }
        break;
    }
    return ids;
  }

  public getParent(element: TaskTreeNode): TaskTreeNode | undefined {
    if (element.type === 'specGroup') {
      return undefined;
    }
    for (const specGroup of this.specGroups.values()) {
      const parent = this.findParentInSubtree(specGroup, element.id);
      if (parent) return parent;
    }
    return undefined;
  }

  private findParentInSubtree(current: TaskTreeNode, targetId: string): TaskTreeNode | undefined {
    switch (current.type) {
      case 'specGroup':
        for (const h of current.headings) {
          if (h.id === targetId) return current;
          const res = this.findParentInSubtree(h, targetId);
          if (res) return res;
        }
        for (const t of current.rootTasks) {
          if (t.id === targetId) return current;
          const res = this.findParentInSubtree(t, targetId);
          if (res) return res;
        }
        break;
      case 'heading':
        for (const ch of current.children) {
          if (ch.id === targetId) return current;
          const res = this.findParentInSubtree(ch, targetId);
          if (res) return res;
        }
        for (const t of current.tasks) {
          if (t.id === targetId) return current;
          const res = this.findParentInSubtree(t, targetId);
          if (res) return res;
        }
        break;
      case 'task':
        for (const st of current.subTasks) {
          if (st.id === targetId) return current;
          const res = this.findParentInSubtree(st, targetId);
          if (res) return res;
        }
        break;
    }
    return undefined;
  }

  public getTargetSection(node: TaskTreeNode): TaskTreeNode {
    if (node.type === 'specGroup' || node.type === 'heading') {
      return node;
    }
    if (node.type === 'task' && node.subTasks.length > 0) {
      return node;
    }
    const parent = this.getParent(node);
    if (parent) {
      return this.getTargetSection(parent);
    }
    return node;
  }

  public getTreeItem(element: TaskTreeNode): vscode.TreeItem {
    const config = this.configManager.getConfig();
    const isCollapsed = this.isNodeCollapsed(element);
    const version = this.getNodeVersion(element.id);

    switch (element.type) {
      case 'specGroup': {
        let groupTitle = element.name;
        if (config.useH1AsGroupName && element.headings.length > 0) {
          const firstH1 = element.headings.find((h) => h.level === 1);
          if (firstH1) {
            groupTitle = firstH1.label;
          }
        }

        const collapsibleState = isCollapsed
          ? vscode.TreeItemCollapsibleState.Collapsed
          : vscode.TreeItemCollapsibleState.Expanded;

        const item = new vscode.TreeItem(groupTitle, collapsibleState);
        item.id = `${element.id}#v${version}`;
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
        const collapsibleState = isCollapsed
          ? vscode.TreeItemCollapsibleState.Collapsed
          : vscode.TreeItemCollapsibleState.Expanded;

        const item = new vscode.TreeItem(element.label, collapsibleState);
        item.id = `${element.id}#v${version}`;
        item.contextValue = 'heading';

        const isComplete =
          element.stats.totalCountable > 0 &&
          element.stats.completedCount === element.stats.totalCountable;

        if (isComplete) {
          if (this.context) {
            item.iconPath = {
              light: vscode.Uri.joinPath(this.context.extensionUri, 'resources', 'icons', 'light', 'bookmark-filled.svg'),
              dark: vscode.Uri.joinPath(this.context.extensionUri, 'resources', 'icons', 'dark', 'bookmark-filled.svg'),
            };
          } else {
            item.iconPath = new vscode.ThemeIcon('bookmark', new vscode.ThemeColor('charts.green'));
          }
        } else {
          item.iconPath = new vscode.ThemeIcon('bookmark');
        }

        if (config.showProgressCount && element.stats.totalCountable > 0) {
          item.description = `(${element.stats.completedCount}/${element.stats.totalCountable})`;
        }

        item.tooltip = isComplete
          ? `${element.label} (Complete: ${element.stats.completedCount}/${element.stats.totalCountable})`
          : element.stats.totalCountable > 0
          ? `${element.label} (${element.stats.completedCount}/${element.stats.totalCountable} completed)`
          : element.label;

        // Navigation command
        item.command = {
          command: 'mdTaskView.jumpToSource',
          title: 'Jump to Heading',
          arguments: [element.fileUri, element.line, element.slug],
        };
        return item;
      }

      case 'task': {
        const hasSubtasks = element.subTasks.length > 0;
        let collapsibleState = vscode.TreeItemCollapsibleState.None;
        if (hasSubtasks) {
          collapsibleState = isCollapsed
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.Expanded;
        }

        const stateEngine = StateTemplateEngine.getInstance();
        const stateDef = stateEngine.getState(element.char);

        let displayLabel = element.cleanText;
        if (stateDef.strikethrough && config.strikeThroughCompleted) {
          // Strikethrough using Unicode combining strike character
          displayLabel = displayLabel.split('').map((c) => c + '\u0336').join('');
        }

        const item = new vscode.TreeItem(displayLabel, collapsibleState);
        item.id = `${element.id}#v${version}`;
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
          arguments: [element.fileUri, element.line, element.parentHeadingSlug],
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
