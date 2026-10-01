import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import { TaskTreeDataProvider } from '../views/TaskTreeDataProvider.js';
import { ConfigurationManager } from '../config/ConfigurationManager.js';
import { DebounceDispatcher } from '../utils/DebounceDispatcher.js';

export class FileSystemWatcherService implements vscode.Disposable {
  private watcher: vscode.FileSystemWatcher | undefined;
  private disposables: vscode.Disposable[] = [];
  private debounceDispatcher = new DebounceDispatcher();

  constructor(
    private treeDataProvider: TaskTreeDataProvider,
    private configManager: ConfigurationManager = ConfigurationManager.getInstance()
  ) {}

  public start(): void {
    this.setupDiskWatcher();
    this.setupBufferListener();

    // Reconfigure watcher when configuration changes
    this.disposables.push(
      this.configManager.onDidChangeConfig(() => {
        this.setupDiskWatcher();
      })
    );
  }

  private setupDiskWatcher(): void {
    if (this.watcher) {
      this.watcher.dispose();
      this.watcher = undefined;
    }

    const config = this.configManager.getConfig();
    if (!config.autoSyncWithDisk) {
      return;
    }

    const taskFileName = config.taskFileName;
    const rawSpecPattern = config.specPathPattern.replace(/^\.\//, '').replace(/\/+$/, '');
    const baseDir = rawSpecPattern.replace(/\/\*+$/, '');
    const globPattern = `**/${baseDir}/**/${taskFileName}`;

    this.watcher = vscode.workspace.createFileSystemWatcher(globPattern);

    this.watcher.onDidCreate((uri) => {
      this.debounceDispatcher.debounce(`fs_create_${uri.fsPath}`, 200, async () => {
        await this.treeDataProvider.reloadSpecs();
      });
    });

    this.watcher.onDidDelete((uri) => {
      this.debounceDispatcher.debounce(`fs_delete_${uri.fsPath}`, 100, () => {
        this.treeDataProvider.removeSpec(uri);
      });
    });

    this.watcher.onDidChange((uri) => {
      this.debounceDispatcher.debounce(`fs_change_${uri.fsPath}`, 250, async () => {
        try {
          const content = await fs.readFile(uri.fsPath, 'utf-8');
          this.treeDataProvider.updateSpecFromContent(uri, content);
        } catch {
          // If file is temporarily locked or deleted
          await this.treeDataProvider.reloadSpecs();
        }
      });
    });

    this.disposables.push(this.watcher);
  }

  private setupBufferListener(): void {
    const docListener = vscode.workspace.onDidChangeTextDocument((event) => {
      const config = this.configManager.getConfig();
      const fileName = config.taskFileName;

      // Only respond if the changed file matches our task file name
      if (!event.document.uri.fsPath.endsWith(fileName)) {
        return;
      }

      this.debounceDispatcher.debounce(
        `buffer_change_${event.document.uri.fsPath}`,
        150,
        () => {
          const content = event.document.getText();
          this.treeDataProvider.updateSpecFromContent(event.document.uri, content);
        }
      );
    });

    this.disposables.push(docListener);
  }

  public dispose(): void {
    this.debounceDispatcher.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}
