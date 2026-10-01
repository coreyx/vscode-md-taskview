import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as jsonc from 'jsonc-parser';
import { StateDefinition } from '../models/types.js';
import { ConfigurationManager } from '../config/ConfigurationManager.js';

export interface StateTemplate {
  name: string;
  description: string;
  defaultState: string;
  states: StateDefinition[];
}

export const STANDARD_TEMPLATE: StateTemplate = {
  name: 'Standard (GFM)',
  description: 'Standard GitHub-Flavored Markdown checklist states',
  defaultState: ' ',
  states: [
    {
      char: ' ',
      id: 'pending',
      label: 'Not Started',
      icon: 'circle-large-outline',
      strikethrough: false,
      countsAsCompleted: false,
      nextState: 'x',
    },
    {
      char: 'x',
      id: 'done',
      label: 'Done',
      icon: 'pass-filled',
      color: 'charts.green',
      strikethrough: true,
      countsAsCompleted: true,
      nextState: ' ',
    },
  ],
};

export const OBSIDIAN_TEMPLATE: StateTemplate = {
  name: 'Obsidian Tasks',
  description: 'Obsidian Tasks plugin multi-state task conventions',
  defaultState: ' ',
  states: [
    {
      char: ' ',
      id: 'not_started',
      label: 'Not Started',
      icon: 'circle-large-outline',
      strikethrough: false,
      countsAsCompleted: false,
      nextState: '/',
    },
    {
      char: '/',
      id: 'in_progress',
      label: 'In Progress',
      icon: 'sync',
      color: 'charts.yellow',
      strikethrough: false,
      countsAsCompleted: false,
      nextState: 'x',
    },
    {
      char: 'x',
      id: 'done',
      label: 'Done',
      icon: 'pass-filled',
      color: 'charts.green',
      strikethrough: true,
      countsAsCompleted: true,
      nextState: ' ',
    },
    {
      char: '-',
      id: 'cancelled',
      label: 'Cancelled',
      icon: 'circle-slash',
      color: 'disabledForeground',
      strikethrough: true,
      countsAsCompleted: false,
      nextState: ' ',
    },
    {
      char: '?',
      id: 'clarification',
      label: 'Needs Clarification',
      icon: 'question',
      color: 'charts.purple',
      strikethrough: false,
      countsAsCompleted: false,
      nextState: ' ',
    },
    {
      char: '!',
      id: 'important',
      label: 'Important',
      icon: 'warning',
      color: 'charts.red',
      strikethrough: false,
      countsAsCompleted: false,
      nextState: ' ',
    },
  ],
};

export class StateTemplateEngine {
  private static _instance: StateTemplateEngine;
  private currentTemplate: StateTemplate = STANDARD_TEMPLATE;
  private stateByChar: Map<string, StateDefinition> = new Map();

  constructor(private configManager: ConfigurationManager = ConfigurationManager.getInstance()) {
    this.reloadTemplate();
  }

  public static getInstance(): StateTemplateEngine {
    if (!this._instance) {
      this._instance = new StateTemplateEngine();
    }
    return this._instance;
  }

  public async reloadTemplate(): Promise<void> {
    const config = this.configManager.getConfig();

    if (config.stateTemplate === 'Obsidian Tasks') {
      this.currentTemplate = OBSIDIAN_TEMPLATE;
    } else if (config.stateTemplate === 'Custom' && config.customTemplatePath) {
      try {
        const custom = await this.loadCustomTemplate(config.customTemplatePath);
        if (custom) {
          this.currentTemplate = custom;
        } else {
          this.currentTemplate = STANDARD_TEMPLATE;
        }
      } catch (err) {
        console.error('Failed to load custom state template:', err);
        vscode.window.showWarningMessage('Markdown Tasks: Invalid custom template, falling back to Standard (GFM).');
        this.currentTemplate = STANDARD_TEMPLATE;
      }
    } else {
      this.currentTemplate = STANDARD_TEMPLATE;
    }

    this.rebuildIndex();
  }

  private rebuildIndex(): void {
    this.stateByChar.clear();
    for (const state of this.currentTemplate.states) {
      this.stateByChar.set(state.char.toLowerCase(), state);
      // Ensure 'X' maps to 'x'
      if (state.char.toLowerCase() === 'x') {
        this.stateByChar.set('X', state);
      }
    }
  }

  public getState(char: string): StateDefinition {
    const found = this.stateByChar.get(char.toLowerCase()) || this.stateByChar.get(char);
    if (found) {
      return found;
    }

    // Fallback for unmapped bracket character
    return {
      char,
      id: 'unknown',
      label: `Custom [${char}]`,
      icon: 'circle-small-filled',
      strikethrough: false,
      countsAsCompleted: false,
      nextState: this.currentTemplate.defaultState,
    };
  }

  public getNextState(char: string): StateDefinition {
    const currentState = this.getState(char);
    const nextChar = currentState.nextState ?? this.currentTemplate.defaultState;
    return this.getState(nextChar);
  }

  public getAllStates(): StateDefinition[] {
    return this.currentTemplate.states;
  }

  public getActiveTemplate(): StateTemplate {
    return this.currentTemplate;
  }

  private async loadCustomTemplate(filePath: string): Promise<StateTemplate | null> {
    let resolvedPath = filePath;
    if (!filePath.startsWith('/') && !filePath.includes(':') && vscode.workspace.workspaceFolders?.[0]) {
      resolvedPath = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, filePath).fsPath;
    }

    const content = await fs.readFile(resolvedPath, 'utf-8');
    const errors: jsonc.ParseError[] = [];
    const parsed = jsonc.parse(content, errors) as StateTemplate;

    if (errors.length > 0 || !parsed || !Array.isArray(parsed.states)) {
      return null;
    }

    return parsed;
  }
}
