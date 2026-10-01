import * as vscode from 'vscode';

export class NavigationCommands {
  public static async jumpToSource(fileUri: vscode.Uri, line: number): Promise<void> {
    try {
      const doc = await vscode.workspace.openTextDocument(fileUri);
      const editor = await vscode.window.showTextDocument(doc, {
        preserveFocus: false,
        preview: false,
      });

      // Target range for the line
      const targetRange = new vscode.Range(
        new vscode.Position(line, 0),
        new vscode.Position(line, doc.lineAt(line).text.length)
      );

      // Scroll viewport so line is centered
      editor.revealRange(targetRange, vscode.TextEditorRevealType.InCenter);

      // Set selection
      editor.selection = new vscode.Selection(targetRange.start, targetRange.end);
    } catch (err) {
      vscode.window.showErrorMessage(`Failed to open task location: ${(err as Error).message}`);
    }
  }
}
