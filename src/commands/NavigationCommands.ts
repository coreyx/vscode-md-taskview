import * as vscode from 'vscode';
import { ConfigurationManager } from '../config/ConfigurationManager.js';

export class NavigationCommands {
  /**
   * Navigates to the source task or heading location, respecting workbench editor associations or extension configuration.
   * If opening in Markdown Preview, uses the heading slug fragment so the preview webview scrolls to the target section.
   */
  public static async jumpToSource(
    fileUri: vscode.Uri,
    line: number,
    slugOrConfig?: string | ConfigurationManager,
    configManager?: ConfigurationManager
  ): Promise<void> {
    try {
      let slug: string | undefined;
      let actualConfigManager: ConfigurationManager;

      if (slugOrConfig instanceof ConfigurationManager) {
        slug = undefined;
        actualConfigManager = slugOrConfig;
      } else {
        slug = slugOrConfig;
        actualConfigManager = configManager || ConfigurationManager.getInstance();
      }

      const config = actualConfigManager.getConfig();
      const customEditor = this.getCustomEditorForMarkdown();

      const shouldOpenPreview =
        config.openEditor === 'preview' ||
        (config.openEditor === 'auto' && Boolean(customEditor));

      if (shouldOpenPreview) {
        const targetUri = slug
          ? fileUri.with({ fragment: slug })
          : fileUri.with({ fragment: `L${line + 1}` });
        const viewType = customEditor || 'vscode.markdown.preview.editor';

        // If a preview tab for this file is already open, close it so vscode.openWith re-resolves with the new fragment
        if (vscode.window.tabGroups?.all) {
          for (const group of vscode.window.tabGroups.all) {
            for (const tab of group.tabs) {
              const input = tab.input;
              if (
                input &&
                typeof input === 'object' &&
                'viewType' in input &&
                'uri' in input &&
                ((input as any).viewType === viewType || (input as any).viewType === 'markdown.preview') &&
                (input as any).uri?.fsPath === fileUri.fsPath
              ) {
                await vscode.window.tabGroups.close(tab);
              }
            }
          }
        }

        try {
          await vscode.commands.executeCommand('vscode.openWith', targetUri, viewType);
          return;
        } catch {
          try {
            await vscode.commands.executeCommand('markdown.showPreview', targetUri);
            return;
          } catch {
            // Fall through to text editor below if preview fails
          }
        }
      }

      // Default: Open in Text Editor and highlight/center the line
      const doc = await vscode.workspace.openTextDocument(fileUri);
      const editor = await vscode.window.showTextDocument(doc, {
        preserveFocus: false,
        preview: false,
      });

      const lineText = doc.lineAt ? doc.lineAt(line).text : '';
      const targetRange = new vscode.Range(
        new vscode.Position(line, 0),
        new vscode.Position(line, lineText.length)
      );

      if (editor.revealRange) {
        editor.revealRange(targetRange, vscode.TextEditorRevealType.InCenter);
      }
      editor.selection = new vscode.Selection(targetRange.start, targetRange.end);
    } catch (err) {
      vscode.window.showErrorMessage(`Failed to open task location: ${(err as Error).message}`);
    }
  }

  /**
   * Inspects workbench.editorAssociations for *.md custom editor configurations.
   */
  public static getCustomEditorForMarkdown(): string | undefined {
    const associations = vscode.workspace?.getConfiguration
      ? vscode.workspace.getConfiguration('workbench').get<any>('editorAssociations')
      : undefined;
    if (!associations) return undefined;

    if (Array.isArray(associations)) {
      const match = associations.find(
        (a: any) =>
          (a.filenamePattern === '*.md' || a.filenamePattern === '**/*.md' || a.filenamePattern?.endsWith('.md')) &&
          a.viewType &&
          a.viewType !== 'default'
      );
      return match?.viewType;
    }

    if (typeof associations === 'object') {
      for (const [pattern, viewType] of Object.entries(associations)) {
        if (
          (pattern === '*.md' || pattern === '**/*.md' || pattern.endsWith('.md')) &&
          typeof viewType === 'string' &&
          viewType !== 'default'
        ) {
          return viewType;
        }
      }
    }

    return undefined;
  }
}
