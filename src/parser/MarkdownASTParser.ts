import * as vscode from 'vscode';
import { BracketRange, HeadingNode, SpecGroup, TaskNode, TaskStats } from '../models/types.js';
import { StateTemplateEngine } from '../templates/StateTemplateEngine.js';
import { Slugifier } from './Slugifier.js';

export class MarkdownASTParser {
  /**
   * Parses markdown text into a structured SpecGroup model.
   *
   * @param content Full text content of the markdown file.
   * @param specName Name of the spec folder/group.
   * @param fileUri URI of the task markdown file.
   * @param folderUri URI of the parent spec folder.
   */
  public static parse(
    content: string,
    specName: string,
    fileUri: vscode.Uri,
    folderUri: vscode.Uri
  ): SpecGroup {
    const lines = content.split(/\r?\n/);
    const rootTasks: TaskNode[] = [];
    const headings: HeadingNode[] = [];
    const slugBuilder = Slugifier.createBuilder();

    // Heading stack to manage depth hierarchy (levels 1-6)
    const headingStack: HeadingNode[] = [];

    // Task stack within the current heading to manage indented sub-tasks
    let taskStack: TaskNode[] = [];
    let currentHeading: HeadingNode | undefined = undefined;

    // Slug of the nearest preceding heading line (section or heading task), used as the preview anchor
    let currentSlug: string | undefined = undefined;

    // Regular expressions for ATX headings and checklist items
    const headingRegex = /^(\#{1,6})\s+(.+)$/;
    const taskRegex = /^(\s*)[-*+]\s+\[(.*?)\]\s*(.*)$/;

    const addTask = (lineIndex: number, lineStr: string, indentLevel: number, char: string, text: string): void => {
      const cleanText = this.stripMarkdownFormatting(text.trim());

      // Calculate bracket range columns
      const openBracketCol = lineStr.indexOf('[');
      const closeBracketCol = lineStr.indexOf(']', openBracketCol);
      const bracketRange: BracketRange = {
        line: lineIndex,
        openBracketCol,
        charCol: openBracketCol + 1,
        closeBracketCol,
      };

      const stateDef = StateTemplateEngine.getInstance().getState(char);
      const isCompleted = stateDef.countsAsCompleted ?? (char.toLowerCase() === 'x');

      const taskNode: TaskNode = {
        type: 'task',
        id: `${fileUri.fsPath}#T${lineIndex}`,
        fileUri,
        rawText: lineStr,
        cleanText: cleanText || '(Empty task)',
        char,
        bracketRange,
        line: lineIndex,
        indentation: indentLevel,
        subTasks: [],
        isCompleted,
        parentHeadingId: currentHeading?.id,
        parentHeadingSlug: currentSlug,
      };

      // Find parent task in taskStack with lower indentation
      while (taskStack.length > 0 && taskStack[taskStack.length - 1].indentation >= indentLevel) {
        taskStack.pop();
      }

      if (taskStack.length > 0) {
        // Indented subtask
        taskStack[taskStack.length - 1].subTasks.push(taskNode);
      } else {
        // Top-level task in current heading scope
        this.attachTaskToScope(taskNode, currentHeading, rootTasks);
      }

      taskStack.push(taskNode);
    };

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const lineStr = lines[lineIndex];

      // 1. Check for ATX Heading (# ... ######)
      const headingMatch = lineStr.match(headingRegex);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const label = this.stripMarkdownFormatting(headingMatch[2].trim());
        const slug = slugBuilder.add(label);
        currentSlug = slug;

        // Pop headingStack until we find a parent with a strictly lower level
        while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
          headingStack.pop();
        }

        // Heading written as a checklist item (### - [x] Task 1.1) is a task, not a section
        const headingTaskMatch = headingMatch[2].trim().match(taskRegex);
        if (headingTaskMatch) {
          currentHeading = headingStack[headingStack.length - 1];
          // Negative indentation: list items below nest under it, deeper heading tasks nest under shallower ones
          addTask(lineIndex, lineStr, level - 7, headingTaskMatch[2], headingTaskMatch[3]);
          continue;
        }

        const newHeading: HeadingNode = {
          type: 'heading',
          id: `${fileUri.fsPath}#H${lineIndex}_L${level}`,
          fileUri,
          label,
          level,
          line: lineIndex,
          slug,
          children: [],
          tasks: [],
          stats: { totalCountable: 0, completedCount: 0, inProgressCount: 0, cancelledCount: 0 },
        };

        // Reset task stack for the new heading
        taskStack = [];
        currentHeading = newHeading;

        if (headingStack.length === 0) {
          // Top-level heading within this spec document
          headings.push(newHeading);
        } else {
          // Child heading of the top of the stack
          headingStack[headingStack.length - 1].children.push(newHeading);
        }

        headingStack.push(newHeading);
        continue;
      }

      // 2. Check for Checklist Item (- [ ] ...)
      const taskMatch = lineStr.match(taskRegex);
      if (taskMatch) {
        const indentLevel = this.calculateIndentation(taskMatch[1]);
        addTask(lineIndex, lineStr, indentLevel, taskMatch[2], taskMatch[3]);
      }
    }

    // Calculate recursive statistics
    const stats = this.calculateAggregateStats(rootTasks, headings);

    return {
      type: 'specGroup',
      id: fileUri.fsPath,
      name: specName,
      folderUri,
      taskFileUri: fileUri,
      headings,
      rootTasks,
      stats,
    };
  }

  private static calculateIndentation(indentStr: string): number {
    let count = 0;
    for (const ch of indentStr) {
      if (ch === '\t') {
        count += 2;
      } else {
        count += 1;
      }
    }
    return count;
  }

  private static attachTaskToScope(
    task: TaskNode,
    heading: HeadingNode | undefined,
    rootTasks: TaskNode[]
  ): void {
    if (heading) {
      heading.tasks.push(task);
    } else {
      rootTasks.push(task);
    }
  }

  private static calculateAggregateStats(
    rootTasks: TaskNode[],
    headings: HeadingNode[]
  ): TaskStats {
    const totalStats: TaskStats = {
      totalCountable: 0,
      completedCount: 0,
      inProgressCount: 0,
      cancelledCount: 0,
    };

    // Count root tasks
    const rootTaskStats = this.computeTasksStats(rootTasks);
    this.addStats(totalStats, rootTaskStats);

    // Count heading trees recursively
    for (const heading of headings) {
      const headingStats = this.computeHeadingStats(heading);
      this.addStats(totalStats, headingStats);
    }

    return totalStats;
  }

  private static computeHeadingStats(heading: HeadingNode): TaskStats {
    const headingStats = this.computeTasksStats(heading.tasks);

    for (const child of heading.children) {
      const childStats = this.computeHeadingStats(child);
      this.addStats(headingStats, childStats);
    }

    heading.stats = { ...headingStats };
    return headingStats;
  }

  private static computeTasksStats(tasks: TaskNode[]): TaskStats {
    const stats: TaskStats = {
      totalCountable: 0,
      completedCount: 0,
      inProgressCount: 0,
      cancelledCount: 0,
    };

    const stateEngine = StateTemplateEngine.getInstance();
    for (const task of tasks) {
      stats.totalCountable++;
      const state = stateEngine.getState(task.char);
      if (state.countsAsCompleted) {
        stats.completedCount++;
      } else if (state.id === 'in_progress') {
        stats.inProgressCount++;
      } else if (state.id === 'cancelled') {
        stats.cancelledCount++;
      }

      if (task.subTasks.length > 0) {
        const subStats = this.computeTasksStats(task.subTasks);
        this.addStats(stats, subStats);
      }
    }

    return stats;
  }

  private static addStats(target: TaskStats, source: TaskStats): void {
    target.totalCountable += source.totalCountable;
    target.completedCount += source.completedCount;
    target.inProgressCount += source.inProgressCount;
    target.cancelledCount += source.cancelledCount;
  }

  /**
   * Strips bold and italic markdown delimiters from text (e.g. `**text**`, `*text*`, `__text__`, `_text_`).
   * Preserves identifiers containing underscores (snake_case) and math operators.
   */
  public static stripMarkdownFormatting(text: string): string {
    if (!text) return '';

    let clean = text;

    // 1. Triple delimiters: ***text*** or ___text___ (bold + italic)
    clean = clean.replace(/\*\*\*([^\*\s](?:.*?[^\*\s])?)\*\*\*/g, '$1');
    clean = clean.replace(/(?:^|(?<=[\s\p{P}\p{S}]))___([^_\s](?:.*?[^_\s])?)___(?=$|[\s\p{P}\p{S}])/gu, '$1');

    // 2. Double delimiters: **text** or __text__ (bold)
    clean = clean.replace(/\*\*([^\*\s](?:.*?[^\*\s])?)\*\*/g, '$1');
    clean = clean.replace(/(?:^|(?<=[\s\p{P}\p{S}]))__([^_\s](?:.*?[^_\s])?)__(?=$|[\s\p{P}\p{S}])/gu, '$1');

    // 3. Single delimiter: *text* (italic with asterisks)
    clean = clean.replace(/(?<!\*)\*([^\*\s](?:.*?[^\*\s])?)\*(?!\*)/g, '$1');

    // 4. Single delimiter: _text_ (italic with underscores - CommonMark word boundary rules)
    clean = clean.replace(/(?:^|(?<=[\s\p{P}\p{S}]))_([^_\s](?:.*?[^_\s])?)_(?=$|[\s\p{P}\p{S}])/gu, '$1');

    return clean.trim();
  }
}
