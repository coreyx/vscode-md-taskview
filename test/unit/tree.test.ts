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
