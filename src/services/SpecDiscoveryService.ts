import * as vscode from 'vscode';
import * as path from 'path';
import { ConfigurationManager } from '../config/ConfigurationManager.js';

export interface DiscoveredSpecFile {
  specName: string;
  folderUri: vscode.Uri;
  taskFileUri: vscode.Uri;
  workspaceFolder?: vscode.WorkspaceFolder;
}

export class SpecDiscoveryService {
  constructor(private configManager: ConfigurationManager = ConfigurationManager.getInstance()) {}

  /**
   * Discovers all task files matching configured patterns across all workspace folders.
   */
  public async discoverSpecFiles(): Promise<DiscoveredSpecFile[]> {
    const config = this.configManager.getConfig();
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return [];
    }

    const results: DiscoveredSpecFile[] = [];
    const excludeGlob = config.excludePatterns.length > 0 
      ? `{${config.excludePatterns.join(',')}}` 
      : '{**/node_modules/**,**/dist/**,**/.git/**}';

    // Normalize spec pattern and task file name
    const specPattern = config.specPathPattern.replace(/^\.\//, '').replace(/\/$/, '');
    const taskFileName = config.taskFileName;
    const searchPattern = `${specPattern}/${taskFileName}`;

    for (const folder of workspaceFolders) {
      const relativePattern = new vscode.RelativePattern(folder, searchPattern);
      const matches = await vscode.workspace.findFiles(relativePattern, excludeGlob);

      for (const fileUri of matches) {
        // Parent folder of tasks.md is the spec folder
        const folderPath = path.dirname(fileUri.fsPath);
        const folderUri = vscode.Uri.file(folderPath);
        let specName = path.basename(folderPath);

        // In multi-root workspaces, distinguish specs by prefixing workspace name if needed
        if (workspaceFolders.length > 1) {
          specName = `${folder.name} / ${specName}`;
        }

        results.push({
          specName,
          folderUri,
          taskFileUri: fileUri,
          workspaceFolder: folder,
        });
      }
    }

    // Sort alphabetically by specName
    return results.sort((a, b) => a.specName.localeCompare(b.specName));
  }
}
