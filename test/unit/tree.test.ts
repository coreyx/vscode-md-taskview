import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as vscode from 'vscode';
import { TaskTreeDataProvider, isMilestoneHeading } from '../../src/views/TaskTreeDataProvider.js';
import { HeadingNode, SpecGroup, TaskNode } from '../../src/models/types.js';
import { StateTemplateEngine, OBSIDIAN_TEMPLATE, STANDARD_TEMPLATE } from '../../src/templates/StateTemplateEngine.js';
import { setMockConfiguration, resetMockConfigurations } from '../mocks/vscode.js';
import { ConfigurationManager } from '../../src/config/ConfigurationManager.js';

describe('isMilestoneHeading', () => {
  // Several keywords, to exercise matching beyond the single default
  const keywords = ['Milestone', 'Release', 'Alpha', 'Beta'];

  it('defaults mdTaskView.milestoneKeywords to Milestone only', () => {
    resetMockConfigurations();
    expect(ConfigurationManager.getInstance().getConfig().milestoneKeywords).toEqual(['Milestone']);
  });

  it('detects milestone keywords at the start of the heading, as whole words, in any case', () => {
    expect(isMilestoneHeading('Milestone 1: Project Setup', keywords)).toBe(true);
    expect(isMilestoneHeading('milestone 2', keywords)).toBe(true);
    expect(isMilestoneHeading('MILESTONE', keywords)).toBe(true);
    expect(isMilestoneHeading('Release 1.0.0', keywords)).toBe(true);
    expect(isMilestoneHeading('Release-1 Checklist', keywords)).toBe(true);
    expect(isMilestoneHeading('Alpha 1', keywords)).toBe(true);
    expect(isMilestoneHeading('Beta Testing', keywords)).toBe(true);
    expect(isMilestoneHeading('  Milestone 3', keywords)).toBe(true);
  });

  it('does not match a keyword that appears later in the heading', () => {
    expect(isMilestoneHeading('Notes on Milestone 1', keywords)).toBe(false);
    expect(isMilestoneHeading('Phase 2 milestone', keywords)).toBe(false);
    expect(isMilestoneHeading('Pre-release Checklist', keywords)).toBe(false);
    expect(isMilestoneHeading('Bookmark: Release process', keywords)).toBe(false);
    expect(isMilestoneHeading('1. Milestone', keywords)).toBe(false);
  });

  it('does not match a keyword in the plural', () => {
    expect(isMilestoneHeading('Milestones', keywords)).toBe(false);
    expect(isMilestoneHeading('Milestones overview', keywords)).toBe(false);
    expect(isMilestoneHeading('Releases', keywords)).toBe(false);
    expect(isMilestoneHeading('Betas', keywords)).toBe(false);
  });

  it('does not falsely match normal headings or partial words', () => {
    expect(isMilestoneHeading('Database Setup', keywords)).toBe(false);
    expect(isMilestoneHeading('Architecture & Design', keywords)).toBe(false);
    expect(isMilestoneHeading('Alphabetical Index', keywords)).toBe(false);
    expect(isMilestoneHeading('Betatron Device', keywords)).toBe(false);
    expect(isMilestoneHeading('Overview', keywords)).toBe(false);
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

describe('TaskTreeDataProvider In-Progress Task Icons', () => {
  const dummyFileUri = vscode.Uri.file('/workspace/spec/tasks.md');
  const engine = StateTemplateEngine.getInstance();

  const inProgressTask: TaskNode = {
    type: 'task',
    id: 't1',
    fileUri: dummyFileUri,
    rawText: '- [/] Build feature',
    cleanText: 'Build feature',
    char: '/',
    bracketRange: { line: 0, openBracketCol: 2, charCol: 3, closeBracketCol: 4 },
    line: 0,
    indentation: 0,
    subTasks: [],
    isCompleted: false,
  };

  beforeEach(() => {
    resetMockConfigurations();
    (engine as any).currentTemplate = OBSIDIAN_TEMPLATE;
    (engine as any).rebuildIndex();
  });

  afterEach(() => {
    resetMockConfigurations();
    (engine as any).currentTemplate = STANDARD_TEMPLATE;
    (engine as any).rebuildIndex();
  });

  it('should display a rotating spinner for in-progress tasks by default', () => {
    const icon = new TaskTreeDataProvider().getTreeItem(inProgressTask).iconPath as vscode.ThemeIcon;
    expect(icon.id).toBe('loading~spin');
    expect((icon as any).color.id).toBe('charts.blue');
  });

  it('should display a static circular arrow icon when mdTaskView.animateTaskIcons is disabled', () => {
    setMockConfiguration('mdTaskView', { animateTaskIcons: false });
    const icon = new TaskTreeDataProvider().getTreeItem(inProgressTask).iconPath as vscode.ThemeIcon;
    expect(icon.id).toBe('sync');
    expect((icon as any).color.id).toBe('charts.blue');
  });

  it('should display a static circular arrow icon when workbench.reduceMotion is on', () => {
    setMockConfiguration('workbench', { reduceMotion: 'on' });
    const icon = new TaskTreeDataProvider().getTreeItem(inProgressTask).iconPath as vscode.ThemeIcon;
    expect(icon.id).toBe('sync');
  });

  it('should keep the spinner when workbench.reduceMotion is off or auto', () => {
    for (const reduceMotion of ['off', 'auto']) {
      setMockConfiguration('workbench', { reduceMotion });
      const icon = new TaskTreeDataProvider().getTreeItem(inProgressTask).iconPath as vscode.ThemeIcon;
      expect(icon.id).toBe('loading~spin');
    }
  });

  it('should not animate states without an animated icon', () => {
    const doneTask: TaskNode = { ...inProgressTask, id: 't2', char: 'x', isCompleted: true };
    const icon = new TaskTreeDataProvider().getTreeItem(doneTask).iconPath as vscode.ThemeIcon;
    expect(icon.id).toBe('pass-filled');
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

