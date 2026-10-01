import * as vscode from 'vscode';

export interface TaskViewConfig {
  specPathPattern: string;
  taskFileName: string;
  includePatterns: string[];
  excludePatterns: string[];
  stateTemplate: 'Standard (GFM)' | 'Obsidian Tasks' | 'Custom';
  customTemplatePath: string;
  strikeThroughCompleted: boolean;
  showProgressCount: boolean;
  autoSyncWithDisk: boolean;
  hideCompletedByDefault: boolean;
  useH1AsGroupName: boolean;
  openEditor: 'auto' | 'textEditor' | 'preview';
}

export class ConfigurationManager {
  private static _instance: ConfigurationManager;
  private _onDidChangeConfig = new vscode.EventEmitter<TaskViewConfig>();
  public readonly onDidChangeConfig = this._onDidChangeConfig.event;

  private constructor(context?: vscode.ExtensionContext) {
    if (context && vscode.workspace?.onDidChangeConfiguration) {
      context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
          if (e.affectsConfiguration('mdTaskView')) {
            this._onDidChangeConfig.fire(this.getConfig());
          }
        })
      );
    }
  }

  public static initialize(context: vscode.ExtensionContext): ConfigurationManager {
    if (!this._instance) {
      this._instance = new ConfigurationManager(context);
    }
    return this._instance;
  }

  public static getInstance(): ConfigurationManager {
    if (!this._instance) {
      this._instance = new ConfigurationManager();
    }
    return this._instance;
  }

  public getConfig(): TaskViewConfig {
    const config = vscode.workspace?.getConfiguration ? vscode.workspace.getConfiguration('mdTaskView') : undefined;
    return {
      specPathPattern: config?.get<string>('specPathPattern', 'spec/*') ?? 'spec/*',
      taskFileName: config?.get<string>('taskFileName', 'tasks.md') ?? 'tasks.md',
      includePatterns: config?.get<string[]>('includePatterns', ['spec/*/tasks.md']) ?? ['spec/*/tasks.md'],
      excludePatterns: config?.get<string[]>('excludePatterns', ['**/node_modules/**', '**/dist/**', '**/.git/**']) ?? ['**/node_modules/**', '**/dist/**', '**/.git/**'],
      stateTemplate: config?.get<'Standard (GFM)' | 'Obsidian Tasks' | 'Custom'>('stateTemplate', 'Standard (GFM)') ?? 'Standard (GFM)',
      customTemplatePath: config?.get<string>('customTemplatePath', '') ?? '',
      strikeThroughCompleted: config?.get<boolean>('strikeThroughCompleted', true) ?? true,
      showProgressCount: config?.get<boolean>('showProgressCount', true) ?? true,
      autoSyncWithDisk: config?.get<boolean>('autoSyncWithDisk', true) ?? true,
      hideCompletedByDefault: config?.get<boolean>('hideCompletedByDefault', false) ?? false,
      useH1AsGroupName: config?.get<boolean>('useH1AsGroupName', false) ?? false,
      openEditor: config?.get<'auto' | 'textEditor' | 'preview'>('openEditor', 'auto') ?? 'auto',
    };
  }
}
