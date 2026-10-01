import { describe, it, expect } from 'vitest';
import * as vscode from 'vscode';
import { TaskTreeDataProvider } from '../../src/views/TaskTreeDataProvider.js';
import { HeadingNode, SpecGroup } from '../../src/models/types.js';

describe('TaskTreeDataProvider Heading Icons', () => {
  const dummyFileUri = vscode.Uri.file('/workspace/spec/tasks.md');

  it('should display outline bookmark icon for incomplete headings', () => {
    const provider = new TaskTreeDataProvider();
    const heading: HeadingNode = {
      type: 'heading',
      id: 'h1',
      fileUri: dummyFileUri,
      label: 'Milestone 1',
      level: 1,
      line: 0,
      children: [],
      tasks: [],
      stats: { totalCountable: 3, completedCount: 1, inProgressCount: 1, cancelledCount: 0 },
    };

    const treeItem = provider.getTreeItem(heading);
    expect(treeItem.iconPath).toBeInstanceOf(vscode.ThemeIcon);
    expect((treeItem.iconPath as vscode.ThemeIcon).id).toBe('bookmark');
  });

  it('should display filled bookmark icon for completed headings when context is provided', () => {
    const mockContext: any = {
      extensionUri: vscode.Uri.file('/extension/root'),
    };
    const provider = new TaskTreeDataProvider(undefined, undefined, mockContext);
    const heading: HeadingNode = {
      type: 'heading',
      id: 'h1',
      fileUri: dummyFileUri,
      label: 'Milestone 1: Completed',
      level: 1,
      line: 0,
      children: [],
      tasks: [],
      stats: { totalCountable: 5, completedCount: 5, inProgressCount: 0, cancelledCount: 0 },
    };

    const treeItem = provider.getTreeItem(heading);
    expect(treeItem.iconPath).not.toBeInstanceOf(vscode.ThemeIcon);
    const iconObj = treeItem.iconPath as { light: vscode.Uri; dark: vscode.Uri };
    expect(iconObj.light.path).toContain('bookmark-filled.svg');
    expect(iconObj.dark.path).toContain('bookmark-filled.svg');
    expect(iconObj.light.path).toContain('light');
    expect(iconObj.dark.path).toContain('dark');
  });

  it('should fall back to green ThemeIcon for completed headings when context is not provided', () => {
    const provider = new TaskTreeDataProvider();
    const heading: HeadingNode = {
      type: 'heading',
      id: 'h1',
      fileUri: dummyFileUri,
      label: 'Milestone 1: Completed',
      level: 1,
      line: 0,
      children: [],
      tasks: [],
      stats: { totalCountable: 2, completedCount: 2, inProgressCount: 0, cancelledCount: 0 },
    };

    const treeItem = provider.getTreeItem(heading);
    expect(treeItem.iconPath).toBeInstanceOf(vscode.ThemeIcon);
    expect((treeItem.iconPath as vscode.ThemeIcon).id).toBe('bookmark');
    expect((treeItem.iconPath as any).color).toBeDefined();
  });
});

describe('TaskTreeDataProvider Expand / Collapse All Toggle', () => {
  const dummyFileUri = vscode.Uri.file('/workspace/spec/tasks.md');

  const createSampleNodes = () => {
    const specGroup: SpecGroup = {
      type: 'specGroup',
      id: 'spec:/workspace/spec/tasks.md',
      name: 'test-spec',
      folderUri: vscode.Uri.file('/workspace/spec'),
      taskFileUri: dummyFileUri,
      headings: [],
      rootTasks: [],
      stats: { totalCountable: 2, completedCount: 0, inProgressCount: 0, cancelledCount: 0 },
    };

    const heading: HeadingNode = {
      type: 'heading',
      id: 'h1',
      fileUri: dummyFileUri,
      label: 'Section 1',
      level: 2,
      line: 1,
      children: [],
      tasks: [],
      stats: { totalCountable: 2, completedCount: 0, inProgressCount: 0, cancelledCount: 0 },
    };

    const simpleTask: any = {
      type: 'task',
      id: 't1',
      fileUri: dummyFileUri,
      line: 2,
      charCol: 3,
      char: ' ',
      rawText: '- [ ] Simple task',
      cleanText: 'Simple task',
      indent: 0,
      isCompleted: false,
      subTasks: [],
    };

    const parentTask: any = {
      type: 'task',
      id: 't2',
      fileUri: dummyFileUri,
      line: 3,
      charCol: 3,
      char: ' ',
      rawText: '- [ ] Parent task',
      cleanText: 'Parent task',
      indent: 0,
      isCompleted: false,
      subTasks: [simpleTask],
    };

    return { specGroup, heading, simpleTask, parentTask };
  };

  it('starts with isAllCollapsed = false and version 0 (Expanded by default)', () => {
    const provider = new TaskTreeDataProvider();
    expect(provider.getIsAllCollapsed()).toBe(false);

    const { specGroup, heading, simpleTask, parentTask } = createSampleNodes();

    const specItem = provider.getTreeItem(specGroup);
    expect(specItem.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Expanded);
    expect(specItem.id).toBe(`${specGroup.id}#v0`);

    const headingItem = provider.getTreeItem(heading);
    expect(headingItem.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Expanded);
    expect(headingItem.id).toBe(`${heading.id}#v0`);

    const parentTaskItem = provider.getTreeItem(parentTask);
    expect(parentTaskItem.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Expanded);
    expect(parentTaskItem.id).toBe(`${parentTask.id}#v0`);

    const simpleTaskItem = provider.getTreeItem(simpleTask);
    expect(simpleTaskItem.collapsibleState).toBe(vscode.TreeItemCollapsibleState.None);
    expect(simpleTaskItem.id).toBe(`${simpleTask.id}#v0`);
  });

  it('collapses all nodes and increments version when collapseAll() is called', () => {
    const provider = new TaskTreeDataProvider();
    let changeFired = false;
    provider.onDidChangeTreeData(() => {
      changeFired = true;
    });

    provider.collapseAll();
    expect(provider.getIsAllCollapsed()).toBe(true);
    expect(changeFired).toBe(true);

    const { specGroup, heading, simpleTask, parentTask } = createSampleNodes();

    const specItem = provider.getTreeItem(specGroup);
    expect(specItem.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Collapsed);
    expect(specItem.id).toBe(`${specGroup.id}#v1`);

    const headingItem = provider.getTreeItem(heading);
    expect(headingItem.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Collapsed);
    expect(headingItem.id).toBe(`${heading.id}#v1`);

    const parentTaskItem = provider.getTreeItem(parentTask);
    expect(parentTaskItem.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Collapsed);
    expect(parentTaskItem.id).toBe(`${parentTask.id}#v1`);

    const simpleTaskItem = provider.getTreeItem(simpleTask);
    expect(simpleTaskItem.collapsibleState).toBe(vscode.TreeItemCollapsibleState.None);
    expect(simpleTaskItem.id).toBe(`${simpleTask.id}#v1`);
  });

  it('expands all nodes and increments version when expandAll() is called', () => {
    const provider = new TaskTreeDataProvider();
    provider.collapseAll();
    expect(provider.getIsAllCollapsed()).toBe(true);

    provider.expandAll();
    expect(provider.getIsAllCollapsed()).toBe(false);

    const { specGroup, heading, simpleTask, parentTask } = createSampleNodes();

    const specItem = provider.getTreeItem(specGroup);
    expect(specItem.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Expanded);
    expect(specItem.id).toBe(`${specGroup.id}#v2`);

    const headingItem = provider.getTreeItem(heading);
    expect(headingItem.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Expanded);
    expect(headingItem.id).toBe(`${heading.id}#v2`);

    const parentTaskItem = provider.getTreeItem(parentTask);
    expect(parentTaskItem.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Expanded);
    expect(parentTaskItem.id).toBe(`${parentTask.id}#v2`);

    const simpleTaskItem = provider.getTreeItem(simpleTask);
    expect(simpleTaskItem.collapsibleState).toBe(vscode.TreeItemCollapsibleState.None);
    expect(simpleTaskItem.id).toBe(`${simpleTask.id}#v2`);
  });

  it('toggles back and forth using toggleExpandCollapse()', () => {
    const provider = new TaskTreeDataProvider();
    expect(provider.getIsAllCollapsed()).toBe(false);

    const firstToggle = provider.toggleExpandCollapse();
    expect(firstToggle).toBe(true);
    expect(provider.getIsAllCollapsed()).toBe(true);

    const secondToggle = provider.toggleExpandCollapse();
    expect(secondToggle).toBe(false);
    expect(provider.getIsAllCollapsed()).toBe(false);
  });
});

