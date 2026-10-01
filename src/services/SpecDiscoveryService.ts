import * as vscode from 'vscode';
import * as path from 'path';
import fg from 'fast-glob';
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
    const seenPaths = new Set<string>();

    const rawSpecPattern = config.specPathPattern.replace(/^\.\//, '').replace(/\/+$/, '');
    const taskFileName = config.taskFileName;

    // Build search patterns covering direct specs (spec/tasks.md) and subfolder specs (spec/*/tasks.md, spec/**/tasks.md)
    const baseDir = rawSpecPattern.replace(/\/\*+$/, '');
    const globPatterns: string[] = [
      `${baseDir}/${taskFileName}`,           // e.g. spec/tasks.md
      `${baseDir}/*/${taskFileName}`,         // e.g. spec/vscode-md-taskview/tasks.md
      `${baseDir}/**/${taskFileName}`,        // e.g. spec/nested/sub/tasks.md
      `${rawSpecPattern}/${taskFileName}`,    // fallback to exact configured pattern
    ];

    // Include custom include patterns if configured
    if (config.includePatterns && config.includePatterns.length > 0) {
      for (const p of config.includePatterns) {
        globPatterns.push(p.replace(/^\.\//, ''));
      }
    }

    const uniqueGlobPatterns = Array.from(new Set(globPatterns));
    const ignorePatterns = config.excludePatterns && config.excludePatterns.length > 0
      ? config.excludePatterns
      : ['**/node_modules/**', '**/dist/**', '**/.git/**'];

    for (const folder of workspaceFolders) {
      const folderFsPath = folder.uri.fsPath;
      const normalizedCwd = folderFsPath.replace(/\\/g, '/');

      // 1. Fast-glob discovery (ultra-reliable direct filesystem search)
      try {
        const matches = await fg(uniqueGlobPatterns, {
          cwd: normalizedCwd,
          absolute: true,
          ignore: ignorePatterns,
          onlyFiles: true,
          caseSensitiveMatch: false,
        });

        for (const filePath of matches) {
          const normalizedPath = path.normalize(filePath);
          if (seenPaths.has(normalizedPath.toLowerCase())) {
            continue;
          }
          seenPaths.add(normalizedPath.toLowerCase());

          const fileUri = vscode.Uri.file(normalizedPath);
          const folderPath = path.dirname(normalizedPath);
          const folderUri = vscode.Uri.file(folderPath);

          let specName = path.basename(folderPath);
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
      } catch (err) {
        console.error('[SpecDiscoveryService] fast-glob search failed:', err);
      }

      // 2. VS Code findFiles fallback (for remote/virtual filesystems or if fast-glob returned nothing)
      if (results.length === 0) {
        try {
          const excludeGlob = ignorePatterns.length > 0
            ? `{${ignorePatterns.join(',')}}`
            : undefined;

          for (const pattern of uniqueGlobPatterns) {
            const relativePattern = new vscode.RelativePattern(folder, pattern);
            const vsMatches = await vscode.workspace.findFiles(relativePattern, excludeGlob);

            for (const fileUri of vsMatches) {
              const normalizedPath = path.normalize(fileUri.fsPath);
              if (seenPaths.has(normalizedPath.toLowerCase())) {
                continue;
              }
              seenPaths.add(normalizedPath.toLowerCase());

              const folderPath = path.dirname(normalizedPath);
              const folderUri = vscode.Uri.file(folderPath);
              let specName = path.basename(folderPath);
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
        } catch (err) {
          console.error('[SpecDiscoveryService] vscode.workspace.findFiles failed:', err);
        }
      }
    }

    return results.sort((a, b) => a.specName.localeCompare(b.specName));
  }
}
