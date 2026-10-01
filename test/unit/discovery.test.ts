import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { SpecDiscoveryService } from '../../src/services/SpecDiscoveryService.js';
import { ConfigurationManager } from '../../src/config/ConfigurationManager.js';

describe('SpecDiscoveryService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should discover tasks.md files using fast-glob and extract spec group metadata', async () => {
    // Mock workspace folder pointing to the actual repo directory
    (vscode.workspace as any).workspaceFolders = [
      {
        uri: vscode.Uri.file(process.cwd()),
        name: 'vscode-md-taskview',
        index: 0,
      },
    ];

    const configManager = ConfigurationManager.getInstance();
    const service = new SpecDiscoveryService(configManager);

    const specs = await service.discoverSpecFiles();
    expect(specs.length).toBeGreaterThan(0);

    const ourSpec = specs.find((s) => s.specName === 'vscode-md-taskview');
    expect(ourSpec).toBeDefined();
    expect(ourSpec?.taskFileUri.fsPath.replace(/\\/g, '/')).toContain('spec/vscode-md-taskview/tasks.md');
    expect(ourSpec?.folderUri.fsPath.replace(/\\/g, '/')).toContain('spec/vscode-md-taskview');
  });
});
