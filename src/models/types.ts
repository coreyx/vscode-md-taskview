import * as vscode from 'vscode';

export interface BracketRange {
  line: number;            // Zero-indexed line in document
  openBracketCol: number;  // Column index of '['
  charCol: number;         // Column index of the character inside '[ ]'
  closeBracketCol: number; // Column index of ']'
}

export interface StateDefinition {
  char: string;
  id: string;
  label: string;
  icon: string;
  color?: string;
  strikethrough?: boolean;
  countsAsCompleted?: boolean;
  nextState?: string;
}

export interface TaskStats {
  totalCountable: number;
  completedCount: number;
  inProgressCount: number;
  cancelledCount: number;
}

export interface TaskNode {
  type: 'task';
  id: string;
  fileUri: vscode.Uri;
  rawText: string;
  cleanText: string;
  char: string;
  bracketRange: BracketRange;
  line: number;
  indentation: number;
  subTasks: TaskNode[];
  isCompleted: boolean;
  parentHeadingId?: string;
  parentHeadingSlug?: string;
}

export interface HeadingNode {
  type: 'heading';
  id: string;
  fileUri: vscode.Uri;
  label: string;
  level: number;
  line: number;
  slug?: string;
  children: HeadingNode[];
  tasks: TaskNode[];
  stats: TaskStats;
}

export interface SpecGroup {
  type: 'specGroup';
  id: string;
  name: string;
  folderUri: vscode.Uri;
  taskFileUri: vscode.Uri;
  headings: HeadingNode[];
  rootTasks: TaskNode[];
  stats: TaskStats;
}

export type TaskTreeNode = SpecGroup | HeadingNode | TaskNode;
