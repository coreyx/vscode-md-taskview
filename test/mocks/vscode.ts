export const Uri = {
  file: (fsPath: string) => ({
    fsPath,
    path: fsPath,
    scheme: 'file',
    toString: () => `file://${fsPath}`,
  }),
  parse: (uriStr: string) => ({
    fsPath: uriStr.replace('file://', ''),
    path: uriStr.replace('file://', ''),
    scheme: 'file',
    toString: () => uriStr,
  }),
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

export class TreeItem {
  constructor(public label: string, public collapsibleState?: number) {}
}

export enum TreeItemCollapsibleState {
  None = 0,
  Collapsed = 1,
  Expanded = 2,
}

export const workspace = {
  getConfiguration: (_section?: string) => ({
    get: (key: string, defaultValue?: any) => defaultValue,
  }),
};
