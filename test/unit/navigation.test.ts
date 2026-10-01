import { describe, it, expect, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { NavigationCommands } from '../../src/commands/NavigationCommands.js';
import { ConfigurationManager } from '../../src/config/ConfigurationManager.js';
import {
  setMockConfiguration,
  resetMockConfigurations,
  executedCommands,
  resetExecutedCommands,
  lastShownTextDocument,
  mockTabGroups,
  resetMockTabGroups,
  closedTabs,
} from '../mocks/vscode.js';

describe('NavigationCommands', () => {
  const dummyFileUri = vscode.Uri.file('/workspace/spec/tasks.md');

  beforeEach(() => {
    resetMockConfigurations();
    resetExecutedCommands();
    resetMockTabGroups();
  });

  it('should open in text editor when no custom editor association is configured', async () => {
    setMockConfiguration('workbench', { editorAssociations: {} });
    setMockConfiguration('mdTaskView', { openEditor: 'auto' });

    const configManager = ConfigurationManager.getInstance();
    await NavigationCommands.jumpToSource(dummyFileUri, 10, undefined, configManager);

    expect(lastShownTextDocument).toBeDefined();
    expect(lastShownTextDocument?.doc.uri.fsPath).toBe('/workspace/spec/tasks.md');
    expect(executedCommands.length).toBe(0);
  });

  it('should respect workbench.editorAssociations (*.md object) and open in preview with slug fragment', async () => {
    setMockConfiguration('workbench', {
      editorAssociations: {
        '*.md': 'vscode.markdown.preview.editor',
      },
    });
    setMockConfiguration('mdTaskView', { openEditor: 'auto' });

    const configManager = ConfigurationManager.getInstance();
    const slug = 'milestone-1-project-foundation--extension-scaffolding-mvp---part-1';
    await NavigationCommands.jumpToSource(dummyFileUri, 15, slug, configManager);

    expect(executedCommands.length).toBe(1);
    expect(executedCommands[0].command).toBe('vscode.openWith');
    const [targetUri, viewType] = executedCommands[0].args;
    expect(viewType).toBe('vscode.markdown.preview.editor');
    expect(targetUri.fragment).toBe(slug);
  });

  it('should fallback to line number fragment if slug is not provided in preview mode', async () => {
    setMockConfiguration('workbench', {
      editorAssociations: {
        '*.md': 'vscode.markdown.preview.editor',
      },
    });
    setMockConfiguration('mdTaskView', { openEditor: 'auto' });

    const configManager = ConfigurationManager.getInstance();
    await NavigationCommands.jumpToSource(dummyFileUri, 15, undefined, configManager);

    expect(executedCommands.length).toBe(1);
    expect(executedCommands[0].command).toBe('vscode.openWith');
    const [targetUri, viewType] = executedCommands[0].args;
    expect(viewType).toBe('vscode.markdown.preview.editor');
    expect(targetUri.fragment).toBe('L16');
  });

  it('should respect workbench.editorAssociations array format and open in preview with slug', async () => {
    setMockConfiguration('workbench', {
      editorAssociations: [
        { filenamePattern: '*.md', viewType: 'vscode.markdown.preview.editor' },
      ],
    });
    setMockConfiguration('mdTaskView', { openEditor: 'auto' });

    const configManager = ConfigurationManager.getInstance();
    await NavigationCommands.jumpToSource(dummyFileUri, 5, 'task-section', configManager);

    expect(executedCommands.length).toBe(1);
    expect(executedCommands[0].command).toBe('vscode.openWith');
    const [targetUri, viewType] = executedCommands[0].args;
    expect(viewType).toBe('vscode.markdown.preview.editor');
    expect(targetUri.fragment).toBe('task-section');
  });

  it('should force text editor when mdTaskView.openEditor is textEditor even with editorAssociations', async () => {
    setMockConfiguration('workbench', {
      editorAssociations: {
        '*.md': 'vscode.markdown.preview.editor',
      },
    });
    setMockConfiguration('mdTaskView', { openEditor: 'textEditor' });

    const configManager = ConfigurationManager.getInstance();
    await NavigationCommands.jumpToSource(dummyFileUri, 20, 'some-slug', configManager);

    expect(lastShownTextDocument).toBeDefined();
    expect(executedCommands.length).toBe(0);
  });

  it('should open in preview when mdTaskView.openEditor is explicitly set to preview', async () => {
    setMockConfiguration('workbench', { editorAssociations: {} });
    setMockConfiguration('mdTaskView', { openEditor: 'preview' });

    const configManager = ConfigurationManager.getInstance();
    await NavigationCommands.jumpToSource(dummyFileUri, 25, 'explicit-preview-slug', configManager);

    expect(executedCommands.length).toBe(1);
    expect(executedCommands[0].command).toBe('vscode.openWith');
    const [targetUri, viewType] = executedCommands[0].args;
    expect(viewType).toBe('vscode.markdown.preview.editor');
    expect(targetUri.fragment).toBe('explicit-preview-slug');
  });

  it('should close existing open preview tab before vscode.openWith so preview re-resolves and scrolls', async () => {
    setMockConfiguration('workbench', {
      editorAssociations: {
        '*.md': 'vscode.markdown.preview.editor',
      },
    });
    setMockConfiguration('mdTaskView', { openEditor: 'auto' });

    const existingTab = {
      input: {
        viewType: 'vscode.markdown.preview.editor',
        uri: dummyFileUri,
      },
    };
    mockTabGroups.all = [
      {
        tabs: [existingTab],
      },
    ];

    const configManager = ConfigurationManager.getInstance();
    await NavigationCommands.jumpToSource(dummyFileUri, 30, 'second-heading-slug', configManager);

    expect(closedTabs.length).toBe(1);
    expect(closedTabs[0]).toBe(existingTab);
    expect(executedCommands.length).toBe(1);
    expect(executedCommands[0].command).toBe('vscode.openWith');
    expect(executedCommands[0].args[0].fragment).toBe('second-heading-slug');
  });
});
