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
} from '../mocks/vscode.js';

describe('NavigationCommands', () => {
  const dummyFileUri = vscode.Uri.file('/workspace/spec/tasks.md');

  beforeEach(() => {
    resetMockConfigurations();
    resetExecutedCommands();
  });

  it('should open in text editor when no custom editor association is configured', async () => {
    setMockConfiguration('workbench', { editorAssociations: {} });
    setMockConfiguration('mdTaskView', { openEditor: 'auto' });

    const configManager = ConfigurationManager.getInstance();
    await NavigationCommands.jumpToSource(dummyFileUri, 10, configManager);

    expect(lastShownTextDocument).toBeDefined();
    expect(lastShownTextDocument?.doc.uri.fsPath).toBe('/workspace/spec/tasks.md');
    expect(executedCommands.length).toBe(0);
  });

  it('should respect workbench.editorAssociations (*.md object) and open in preview', async () => {
    setMockConfiguration('workbench', {
      editorAssociations: {
        '*.md': 'vscode.markdown.preview.editor',
      },
    });
    setMockConfiguration('mdTaskView', { openEditor: 'auto' });

    const configManager = ConfigurationManager.getInstance();
    await NavigationCommands.jumpToSource(dummyFileUri, 15, configManager);

    expect(executedCommands.length).toBe(1);
    expect(executedCommands[0].command).toBe('vscode.openWith');
    const [targetUri, viewType] = executedCommands[0].args;
    expect(viewType).toBe('vscode.markdown.preview.editor');
    expect(targetUri.fragment).toBe('L16');
  });

  it('should respect workbench.editorAssociations array format and open in preview', async () => {
    setMockConfiguration('workbench', {
      editorAssociations: [
        { filenamePattern: '*.md', viewType: 'vscode.markdown.preview.editor' },
      ],
    });
    setMockConfiguration('mdTaskView', { openEditor: 'auto' });

    const configManager = ConfigurationManager.getInstance();
    await NavigationCommands.jumpToSource(dummyFileUri, 5, configManager);

    expect(executedCommands.length).toBe(1);
    expect(executedCommands[0].command).toBe('vscode.openWith');
    const [targetUri, viewType] = executedCommands[0].args;
    expect(viewType).toBe('vscode.markdown.preview.editor');
    expect(targetUri.fragment).toBe('L6');
  });

  it('should force text editor when mdTaskView.openEditor is textEditor even with editorAssociations', async () => {
    setMockConfiguration('workbench', {
      editorAssociations: {
        '*.md': 'vscode.markdown.preview.editor',
      },
    });
    setMockConfiguration('mdTaskView', { openEditor: 'textEditor' });

    const configManager = ConfigurationManager.getInstance();
    await NavigationCommands.jumpToSource(dummyFileUri, 20, configManager);

    expect(lastShownTextDocument).toBeDefined();
    expect(executedCommands.length).toBe(0);
  });

  it('should open in preview when mdTaskView.openEditor is explicitly set to preview', async () => {
    setMockConfiguration('workbench', { editorAssociations: {} });
    setMockConfiguration('mdTaskView', { openEditor: 'preview' });

    const configManager = ConfigurationManager.getInstance();
    await NavigationCommands.jumpToSource(dummyFileUri, 25, configManager);

    expect(executedCommands.length).toBe(1);
    expect(executedCommands[0].command).toBe('vscode.openWith');
    const [targetUri, viewType] = executedCommands[0].args;
    expect(viewType).toBe('vscode.markdown.preview.editor');
    expect(targetUri.fragment).toBe('L26');
  });
});
