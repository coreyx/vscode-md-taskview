export const Uri = {
  file: (fsPath: string) => ({
    fsPath,
    path: fsPath,
    scheme: 'file',
    fragment: '',
    with: function(change: any) {
      return {
        fsPath: change.path || this.fsPath,
        path: change.path || this.path,
        scheme: change.scheme || this.scheme,
        fragment: change.fragment !== undefined ? change.fragment : this.fragment,
        toString: () => `file://${change.path || this.path}${change.fragment ? '#' + change.fragment : ''}`,
      };
    },
    toString: () => `file://${fsPath}`,
  }),
  parse: (uriStr: string) => ({
    fsPath: uriStr.replace('file://', '').split('#')[0],
    path: uriStr.replace('file://', '').split('#')[0],
    scheme: 'file',
    fragment: uriStr.includes('#') ? uriStr.split('#')[1] : '',
    with: function(change: any) {
      return {
        fsPath: change.path || this.fsPath,
        path: change.path || this.path,
        scheme: change.scheme || this.scheme,
        fragment: change.fragment !== undefined ? change.fragment : this.fragment,
        toString: () => `file://${change.path || this.path}${change.fragment ? '#' + change.fragment : ''}`,
      };
    },
    toString: () => uriStr,
  }),
  joinPath: (base: any, ...pathSegments: string[]) => {
    const joined = [base.fsPath || base.path, ...pathSegments].join('/').replace(/\/+/g, '/');
    return {
      fsPath: joined,
      path: joined,
      scheme: base.scheme || 'file',
      fragment: '',
      with: function(change: any) {
        return {
          fsPath: change.path || this.fsPath,
          path: change.path || this.path,
          scheme: change.scheme || this.scheme,
          fragment: change.fragment !== undefined ? change.fragment : this.fragment,
          toString: () => `${this.scheme}://${change.path || this.path}${change.fragment ? '#' + change.fragment : ''}`,
        };
      },
      toString: () => `${base.scheme || 'file'}://${joined}`,
    };
  },
};

export class EventEmitter<T = any> {
  private listeners: ((e: T) => any)[] = [];

  event = (listener: (e: T) => any) => {
    this.listeners.push(listener);
    return {
      dispose: () => {
        this.listeners = this.listeners.filter((l) => l !== listener);
      },
    };
  };

  fire(data: T): void {
    for (const listener of this.listeners) {
      listener(data);
    }
  }

  dispose(): void {
    this.listeners = [];
  }
}

export class ThemeIcon {
  constructor(public id: string, public color?: any) {}
}

export class ThemeColor {
  constructor(public id: string) {}
}

export class MarkdownString {
  constructor(public value: string = '', public isTrusted: boolean = false) {}
  appendMarkdown(value: string): MarkdownString {
    this.value += value;
    return this;
  }
  appendText(value: string): MarkdownString {
    this.value += value;
    return this;
  }
}

export class TreeItem {
  constructor(public label: string, public collapsibleState?: number) {}
}

export enum TreeItemCollapsibleState {
  None = 0,
  Collapsed = 1,
  Expanded = 2,
}

export class Position {
  constructor(public line: number, public character: number) {}
}

export class Range {
  constructor(public start: Position, public end: Position) {}
}

export class Selection {
  constructor(public start: Position, public end: Position) {}
}

export enum TextEditorRevealType {
  InCenter = 2,
}

let mockConfigurations: Record<string, any> = {};

export function setMockConfiguration(section: string, values: any) {
  mockConfigurations[section] = values;
}

export function resetMockConfigurations() {
  mockConfigurations = {};
}

export const workspace = {
  getConfiguration: (section?: string) => ({
    get: (key: string, defaultValue?: any) => {
      if (section && mockConfigurations[section] && mockConfigurations[section][key] !== undefined) {
        return mockConfigurations[section][key];
      }
      return defaultValue;
    },
  }),
  openTextDocument: async (uri: any) => ({
    uri,
    lineAt: (line: number) => ({ text: `Line content at ${line}` }),
  }),
};

export let executedCommands: { command: string; args: any[] }[] = [];

export function resetExecutedCommands() {
  executedCommands = [];
}

export const commands = {
  executeCommand: async (command: string, ...args: any[]) => {
    executedCommands.push({ command, args });
    return undefined;
  },
};

export let lastShownTextDocument: { doc: any; options?: any } | undefined;
export let lastShownErrorMessage: string | undefined;
export let closedTabs: any[] = [];

export let mockTabGroups: { all: any[]; close: (tab: any) => Promise<boolean> } = {
  all: [],
  close: async (tab: any) => {
    closedTabs.push(tab);
    return true;
  },
};

export function resetMockTabGroups() {
  mockTabGroups.all = [];
  closedTabs = [];
}

export class MockTreeView {
  selection: any[] = [];
  private onDidChangeSelectionEmitter = new EventEmitter<any>();
  onDidChangeSelection = this.onDidChangeSelectionEmitter.event;
  private onDidCollapseElementEmitter = new EventEmitter<any>();
  onDidCollapseElement = this.onDidCollapseElementEmitter.event;
  private onDidExpandElementEmitter = new EventEmitter<any>();
  onDidExpandElement = this.onDidExpandElementEmitter.event;

  reveal = async (element: any, options?: any) => {
    if (options?.select) {
      this.selection = [element];
    }
  };

  dispose() {}
}

export const window = {
  tabGroups: mockTabGroups,
  createTreeView: (id: string, options: any) => new MockTreeView(),
  showTextDocument: async (doc: any, options?: any) => {
    lastShownTextDocument = { doc, options };
    return {
      revealRange: () => {},
      selection: undefined,
    };
  },
  showErrorMessage: (msg: string) => {
    lastShownErrorMessage = msg;
  },
};
