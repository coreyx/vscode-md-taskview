import { describe, it, expect } from 'vitest';
import * as vscode from 'vscode';
import { TaskTreeDataProvider, isMilestoneHeading } from '../../src/views/TaskTreeDataProvider.js';
import { HeadingNode, SpecGroup } from '../../src/models/types.js';

describe('isMilestoneHeading', () => {
  const defaultKeywords = ['Milestone', 'Release', 'Alpha', 'Beta'];

  it('detects milestone keywords with word boundaries and case insensitivity', () => {
    expect(isMilestoneHeading('Milestone 1: Project Setup', defaultKeywords)).toBe(true);
    expect(isMilestoneHeading('milestone 2', defaultKeywords)).toBe(true);
    expect(isMilestoneHeading('Milestones', defaultKeywords)).toBe(true);
    expect(isMilestoneHeading('Release 1.0.0', defaultKeywords)).toBe(true);
    expect(isMilestoneHeading('Pre-release Checklist', defaultKeywords)).toBe(true);
    expect(isMilestoneHeading('Alpha 1', defaultKeywords)).toBe(true);
    expect(isMilestoneHeading('Beta Testing', defaultKeywords)).toBe(true);
  });

  it('does not falsely match normal headings or partial words', () => {
    expect(isMilestoneHeading('Database Setup', defaultKeywords)).toBe(false);
    expect(isMilestoneHeading('Architecture & Design', defaultKeywords)).toBe(false);
    expect(isMilestoneHeading('Alphabetical Index', defaultKeywords)).toBe(false);
    expect(isMilestoneHeading('Betatron Device', defaultKeywords)).toBe(false);
    expect(isMilestoneHeading('Overview', defaultKeywords)).toBe(false);
  });

  it('supports custom configured milestone keywords', () => {
    const customKeywords = ['Sprint', 'Phase'];
    expect(isMilestoneHeading('Sprint 4', customKeywords)).toBe(true);
    expect(isMilestoneHeading('Phase 1', customKeywords)).toBe(true);
    expect(isMilestoneHeading('Milestone 1', customKeywords)).toBe(false);
  });
});

describe('TaskTreeDataProvider Heading Icons', () => {
  const dummyFileUri = vscode.Uri.file('/workspace/spec/tasks.md');

  it('should display outline flag icon for incomplete milestones', () => {
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
    expect((treeItem.iconPath as vscode.ThemeIcon).id).toBe('flag');
  });

  it('should display filled flag icon for completed milestones when context is provided', () => {
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
    expect(iconObj.light.path).toContain('milestone-filled.svg');
    expect(iconObj.dark.path).toContain('milestone-filled.svg');
    expect(iconObj.light.path).toContain('light');
    expect(iconObj.dark.path).toContain('dark');
  });

  it('should fall back to green ThemeIcon for completed milestones when context is not provided', () => {
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
    expect((treeItem.iconPath as vscode.ThemeIcon).id).toBe('flag');
    expect((treeItem.iconPath as any).color).toBeDefined();
  });

  it('should display outline bookmark icon for normal headings without tasks', () => {
    const provider = new TaskTreeDataProvider();
    const heading: HeadingNode = {
      type: 'heading',
      id: 'h2',
      fileUri: dummyFileUri,
      label: 'Database Schema',
      level: 2,
      line: 10,
      children: [],
      tasks: [],
      stats: { totalCountable: 0, completedCount: 0, inProgressCount: 0, cancelledCount: 0 },
    };

    const treeItem = provider.getTreeItem(heading);
    expect(treeItem.iconPath).toBeInstanceOf(vscode.ThemeIcon);
    expect((treeItem.iconPath as vscode.ThemeIcon).id).toBe('bookmark');
  });

  it('should display outline bookmark icon for normal headings even when all tasks are complete', () => {
    const mockContext: any = {
      extensionUri: vscode.Uri.file('/extension/root'),
    };
    const provider = new TaskTreeDataProvider(undefined, undefined, mockContext);
    const heading: HeadingNode = {
      type: 'heading',
      id: 'h3',
      fileUri: dummyFileUri,
      label: 'API Endpoints',
      level: 2,
      line: 20,
      children: [],
      tasks: [],
      stats: { totalCountable: 4, completedCount: 4, inProgressCount: 0, cancelledCount: 0 },
    };

    const treeItem = provider.getTreeItem(heading);
    expect(treeItem.iconPath).toBeInstanceOf(vscode.ThemeIcon);
    expect((treeItem.iconPath as vscode.ThemeIcon).id).toBe('bookmark');
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

  it('collapses only the targeted subtree without affecting siblings', () => {
    const provider = new TaskTreeDataProvider();
    const { specGroup, heading, simpleTask, parentTask } = createSampleNodes();

    const heading2: HeadingNode = {
      type: 'heading',
      id: 'h2',
      fileUri: dummyFileUri,
      label: 'Section 2',
      level: 2,
      line: 10,
      children: [],
      tasks: [],
      stats: { totalCountable: 0, completedCount: 0, inProgressCount: 0, cancelledCount: 0 },
    };
    specGroup.headings = [heading, heading2];
    provider.addSpecGroup(specGroup);

    // Collapse only heading 1
    provider.collapseSubtree(heading);

    expect(provider.isNodeCollapsed(heading)).toBe(true);
    expect(provider.isNodeCollapsed(heading2)).toBe(false);

    const h1Item = provider.getTreeItem(heading);
    expect(h1Item.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Collapsed);
    expect(h1Item.id).toBe(`${heading.id}#v1`);

    const h2Item = provider.getTreeItem(heading2);
    expect(h2Item.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Expanded);
    expect(h2Item.id).toBe(`${heading2.id}#v0`);
  });

  it('expands a collapsed subtree without affecting siblings', () => {
    const provider = new TaskTreeDataProvider();
    const { specGroup, heading } = createSampleNodes();
    specGroup.headings = [heading];
    provider.addSpecGroup(specGroup);

    provider.collapseSubtree(heading);
    expect(provider.isNodeCollapsed(heading)).toBe(true);

    provider.expandSubtree(heading);
    expect(provider.isNodeCollapsed(heading)).toBe(false);

    const h1Item = provider.getTreeItem(heading);
    expect(h1Item.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Expanded);
    expect(h1Item.id).toBe(`${heading.id}#v2`);
  });

  it('correctly identifies target sections and parents', () => {
    const provider = new TaskTreeDataProvider();
    const { specGroup, heading, simpleTask, parentTask } = createSampleNodes();
    heading.tasks = [parentTask];
    specGroup.headings = [heading];
    provider.addSpecGroup(specGroup);

    // Spec group section is itself
    expect(provider.getTargetSection(specGroup).id).toBe(specGroup.id);
    // Heading section is itself
    expect(provider.getTargetSection(heading).id).toBe(heading.id);
    // Parent task with subtasks is itself
    expect(provider.getTargetSection(parentTask).id).toBe(parentTask.id);
    // Simple leaf subtask resolves to parentTask
    expect(provider.getTargetSection(simpleTask).id).toBe(parentTask.id);

    // getParent checks
    expect(provider.getParent(specGroup)).toBeUndefined();
    expect(provider.getParent(heading)?.id).toBe(specGroup.id);
    expect(provider.getParent(parentTask)?.id).toBe(heading.id);
    expect(provider.getParent(simpleTask)?.id).toBe(parentTask.id);
  });

  it('keeps container expanded and collapses contained milestones when collapseContained() is called', () => {
    const provider = new TaskTreeDataProvider();
    const { specGroup, heading, parentTask } = createSampleNodes();
    const heading2: HeadingNode = {
      type: 'heading',
      id: 'h2',
      fileUri: dummyFileUri,
      label: 'Milestone 2',
      level: 2,
      line: 20,
      children: [],
      tasks: [],
      stats: { totalCountable: 0, completedCount: 0, inProgressCount: 0, cancelledCount: 0 },
    };
    heading.tasks = [parentTask];
    specGroup.headings = [heading, heading2];
    provider.addSpecGroup(specGroup);

    expect(provider.hasCollapsibleChildren(specGroup)).toBe(true);
    expect(provider.areContainedChildrenCollapsed(specGroup)).toBe(false);

    // Collapse level contained within specGroup
    provider.collapseContained(specGroup);

    // Spec group remains expanded so milestones are visible
    const specItem = provider.getTreeItem(specGroup);
    expect(specItem.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Expanded);

    // Milestones contained within it are collapsed so their tasks are hidden
    const h1Item = provider.getTreeItem(heading);
    expect(h1Item.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Collapsed);

    const h2Item = provider.getTreeItem(heading2);
    expect(h2Item.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Collapsed);

    expect(provider.areContainedChildrenCollapsed(specGroup)).toBe(true);
  });

  it('expands contained milestones when expandContained() is called on container', () => {
    const provider = new TaskTreeDataProvider();
    const { specGroup, heading } = createSampleNodes();
    specGroup.headings = [heading];
    provider.addSpecGroup(specGroup);

    provider.collapseContained(specGroup);
    expect(provider.areContainedChildrenCollapsed(specGroup)).toBe(true);

    provider.expandContained(specGroup);
    expect(provider.areContainedChildrenCollapsed(specGroup)).toBe(false);

    const specItem = provider.getTreeItem(specGroup);
    expect(specItem.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Expanded);

    const h1Item = provider.getTreeItem(heading);
    expect(h1Item.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Expanded);
  });

  it('finds nodes by id in spec groups, headings, tasks, and subtasks', () => {
    const provider = new TaskTreeDataProvider();
    const { specGroup, heading, simpleTask, parentTask } = createSampleNodes();
    heading.tasks = [parentTask];
    specGroup.headings = [heading];
    provider.addSpecGroup(specGroup);

    expect(provider.findNodeById(specGroup.id)).toBe(specGroup);
    expect(provider.findNodeById(heading.id)).toBe(heading);
    expect(provider.findNodeById(parentTask.id)).toBe(parentTask);
    expect(provider.findNodeById(simpleTask.id)).toBe(simpleTask);
    expect(provider.findNodeById('non-existent')).toBeUndefined();
  });
});

