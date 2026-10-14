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
  milestoneKeywords: string[];
  animateTaskIcons: boolean;
  showTaskActions: boolean;
}

export class ConfigurationManager {
  private static _instance: ConfigurationManager;
  private _onDidChangeConfig = new vscode.EventEmitter<TaskViewConfig>();
  public readonly onDidChangeConfig = this._onDidChangeConfig.event;

  private constructor(context?: vscode.ExtensionContext) {
    if (context && vscode.workspace?.onDidChangeConfiguration) {
      context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
          if (e.affectsConfiguration('mdTaskView') || e.affectsConfiguration('workbench.reduceMotion')) {
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
      milestoneKeywords: config?.get<string[]>('milestoneKeywords', ['Milestone']) ?? ['Milestone'],
      animateTaskIcons: config?.get<boolean>('animateTaskIcons', true) ?? true,
      showTaskActions: config?.get<boolean>('showTaskActions', true) ?? true,
    };
  }

  /**
   * Whether animated task icons may be shown. Motion is off when mdTaskView.animateTaskIcons is disabled
   * or VS Code's workbench.reduceMotion is 'on' ('auto' follows the OS, which extensions cannot read).
   */
  public isMotionEnabled(): boolean {
    if (!this.getConfig().animateTaskIcons) {
      return false;
    }
    const reduceMotion = vscode.workspace?.getConfiguration
      ? vscode.workspace.getConfiguration('workbench').get<string>('reduceMotion', 'auto')
      : 'auto';
    return reduceMotion !== 'on';
  }
}
