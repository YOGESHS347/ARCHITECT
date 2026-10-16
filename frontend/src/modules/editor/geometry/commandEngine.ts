/**
 * commandEngine.ts
 * ============================================================================
 * State & Command Management Engine with Reversible Undo/Redo.
 *
 * Core rule:
 * All edits are commands.
 * Candidate document → validators → commit or reject with actionable message →
 * record command for undo/redo.
 * ============================================================================
 */

import type {
  CanonicalBuildingDocument,
  Command,
  CommandResult,
} from './types';
import { validateCanonicalDocument, validateFurnitureCommand } from './validators';

export type DocumentSubscriber = (doc: CanonicalBuildingDocument) => void;

export class CommandEngine {
  private currentDoc: CanonicalBuildingDocument;
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private readonly maxHistory: number;
  private subscribers: Set<DocumentSubscriber> = new Set();

  constructor(initialDoc: CanonicalBuildingDocument, maxHistory = 50) {
    this.currentDoc = JSON.parse(JSON.stringify(initialDoc));
    this.maxHistory = maxHistory;
  }

  public getDocument(): CanonicalBuildingDocument {
    return this.currentDoc;
  }

  public setDocument(newDoc: CanonicalBuildingDocument, clearHistory = false): void {
    this.currentDoc = JSON.parse(JSON.stringify(newDoc));
    if (clearHistory) {
      this.undoStack = [];
      this.redoStack = [];
    }
    this.notify();
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public getUndoStackSize(): number {
    return this.undoStack.length;
  }

  public getRedoStackSize(): number {
    return this.redoStack.length;
  }

  /**
   * Executes a command:
   *   1. Computes candidate document.
   *   2. Runs command-specific validators (furniture operations validate placement
   *      constraints without mutating or re-validating unrelated walls; structural
   *      operations strictly validate wall integrity, non-crossing and geometry).
   *   3. Rejects with actionable message if invalid without altering document or history.
   *   4. Commits and records on undo stack if valid.
   */
  public execute(command: Command): CommandResult {
    const candidate = command.execute(this.currentDoc);

    const isFurnitureOp = command.category === 'furniture' ||
      command.name.includes('Item') ||
      command.id.startsWith('place_item') ||
      command.id.startsWith('del_item') ||
      command.id.startsWith('resize_item') ||
      command.id.startsWith('transform_item');

    let validation;
    if (command.validate) {
      validation = command.validate(candidate);
    } else if (isFurnitureOp) {
      validation = validateFurnitureCommand(candidate, command);
    } else {
      validation = validateCanonicalDocument(candidate);
    }

    if (!validation.valid) {
      const firstError = validation.issues.find(i => i.severity === 'error');
      const errorMsg = firstError?.message || 'Invalid architectural geometry edit.';
      return {
        success: false,
        message: errorMsg,
        issues: validation.issues,
        candidateDocument: candidate,
      };
    }

    // Commit change
    this.currentDoc = candidate;
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = []; // clear redo on new action
    this.notify();

    return {
      success: true,
      message: `Executed: ${command.name}`,
      issues: validation.issues,
      candidateDocument: candidate,
    };
  }

  /**
   * Reverts the most recent command using its inverse patch.
   */
  public undo(): CommandResult {
    if (!this.canUndo()) {
      return { success: false, message: 'Nothing to undo.', issues: [] };
    }

    const command = this.undoStack.pop()!;
    const previousDoc = command.inverse(this.currentDoc);
    this.currentDoc = previousDoc;
    this.redoStack.push(command);
    this.notify();

    return {
      success: true,
      message: `Undone: ${command.name}`,
      issues: [],
      candidateDocument: previousDoc,
    };
  }

  /**
   * Re-applies the most recently undone command.
   */
  public redo(): CommandResult {
    if (!this.canRedo()) {
      return { success: false, message: 'Nothing to redo.', issues: [] };
    }

    const command = this.redoStack.pop()!;
    const candidate = command.execute(this.currentDoc);
    this.currentDoc = candidate;
    this.undoStack.push(command);
    this.notify();

    return {
      success: true,
      message: `Redone: ${command.name}`,
      issues: [],
      candidateDocument: candidate,
    };
  }

  public subscribe(callback: DocumentSubscriber): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notify(): void {
    for (const sub of this.subscribers) {
      try {
        sub(this.currentDoc);
      } catch (err) {
        console.error('[CommandEngine] Subscriber notification error:', err);
      }
    }
  }
}
