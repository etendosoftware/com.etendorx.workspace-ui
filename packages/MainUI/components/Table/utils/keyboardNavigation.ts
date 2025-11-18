/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type { MRT_TableInstance } from "material-react-table";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import { logger } from "@/utils/logger";

export interface KeyboardNavigationOptions {
  onSaveRow: (rowId: string) => Promise<void>;
  onCancelRow: (rowId: string) => Promise<void>;
  isRowEditing: (rowId: string) => boolean;
  getEditingRowIds: () => string[];
  table: MRT_TableInstance<EntityData>;
  getColumnOrder?: () => string[];
}

/**
 * Keyboard navigation utilities for inline editing
 * Handles Tab/Shift+Tab navigation between editable cells, Enter to save, and Escape to cancel
 */
export class KeyboardNavigationManager {
  private options: KeyboardNavigationOptions;
  private currentFocusedCell: { rowId: string; columnId: string } | null = null;

  constructor(options: KeyboardNavigationOptions) {
    this.options = options;
  }

  /**
   * Get all editable cells in the table
   */
  private getEditableCells(): Array<{ rowId: string; columnId: string; element: HTMLElement }> {
    const editableCells: Array<{ rowId: string; columnId: string; element: HTMLElement }> = [];
    const editingRowIds = this.options.getEditingRowIds();

    // Find all input elements that have data-row-id and data-column-id attributes
    for (const rowId of editingRowIds) {
      const inputElements = document.querySelectorAll(
        `input[data-row-id="${rowId}"][data-column-id], select[data-row-id="${rowId}"][data-column-id], textarea[data-row-id="${rowId}"][data-column-id]`
      );

      for (const element of inputElements) {
        const htmlElement = element as HTMLElement;
        const columnId = htmlElement.getAttribute("data-column-id");

        if (columnId && !htmlElement.hasAttribute("disabled")) {
          editableCells.push({
            rowId,
            columnId,
            element: htmlElement,
          });
        }
      }
    }

    // Sort cells by row order and then column order for consistent navigation
    const columnOrder = this.options.getColumnOrder?.() || [];

    return editableCells.sort((a, b) => {
      // First sort by row (editing rows should maintain their visual order)
      const rowComparison = a.rowId.localeCompare(b.rowId);
      if (rowComparison !== 0) return rowComparison;

      // Then sort by column order using the actual table column order
      if (columnOrder.length > 0) {
        const aIndex = columnOrder.indexOf(a.columnId);
        const bIndex = columnOrder.indexOf(b.columnId);

        // If both columns are in the order array, use their indices
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        // If only one is in the array, prioritize it
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
      }

      // Fallback to alphabetical if no column order provided
      return a.columnId.localeCompare(b.columnId);
    });
  }

  /**
   * Navigate to the next editable cell
   */
  public async navigateToNextCell(currentRowId: string, currentColumnId: string): Promise<boolean> {
    const editableCells = this.getEditableCells();
    const currentIndex = editableCells.findIndex(
      (cell) => cell.rowId === currentRowId && cell.columnId === currentColumnId
    );
    if (currentIndex >= 0 && currentIndex < editableCells.length - 1) {
      const nextCell = editableCells[currentIndex + 1];
      await this.focusCell(nextCell.element);
      this.currentFocusedCell = { rowId: nextCell.rowId, columnId: nextCell.columnId };
      return true;
    }
    return false;
  }

  /**
   * Navigate to the previous editable cell
   */
  public async navigateToPreviousCell(currentRowId: string, currentColumnId: string): Promise<boolean> {
    const editableCells = this.getEditableCells();
    const currentIndex = editableCells.findIndex(
      (cell) => cell.rowId === currentRowId && cell.columnId === currentColumnId
    );

    if (currentIndex > 0) {
      const previousCell = editableCells[currentIndex - 1];
      await this.focusCell(previousCell.element);
      this.currentFocusedCell = { rowId: previousCell.rowId, columnId: previousCell.columnId };
      logger.debug(`[KeyboardNavigation] Navigated to previous cell: ${previousCell.rowId}:${previousCell.columnId}`);
      return true;
    }

    return false;
  }

  /**
   * Navigate to the first editable cell in the next row
   */
  public async navigateToNextRow(currentRowId: string): Promise<boolean> {
    const editableCells = this.getEditableCells();
    const currentRowCells = editableCells.filter((cell) => cell.rowId === currentRowId);

    if (currentRowCells.length === 0) return false;

    // Find the next row that has editable cells
    const allRowIds = [...new Set(editableCells.map((cell) => cell.rowId))];
    const currentRowIndex = allRowIds.indexOf(currentRowId);

    if (currentRowIndex >= 0 && currentRowIndex < allRowIds.length - 1) {
      const nextRowId = allRowIds[currentRowIndex + 1];
      const nextRowFirstCell = editableCells.find((cell) => cell.rowId === nextRowId);

      if (nextRowFirstCell) {
        await this.focusCell(nextRowFirstCell.element);
        this.currentFocusedCell = { rowId: nextRowFirstCell.rowId, columnId: nextRowFirstCell.columnId };
        logger.debug(
          `[KeyboardNavigation] Navigated to next row: ${nextRowFirstCell.rowId}:${nextRowFirstCell.columnId}`
        );
        return true;
      }
    }

    return false;
  }

  /**
   * Navigate to the first editable cell in the previous row
   */
  public async navigateToPreviousRow(currentRowId: string): Promise<boolean> {
    const editableCells = this.getEditableCells();
    const allRowIds = [...new Set(editableCells.map((cell) => cell.rowId))];
    const currentRowIndex = allRowIds.indexOf(currentRowId);

    if (currentRowIndex > 0) {
      const previousRowId = allRowIds[currentRowIndex - 1];
      const previousRowFirstCell = editableCells.find((cell) => cell.rowId === previousRowId);

      if (previousRowFirstCell) {
        await this.focusCell(previousRowFirstCell.element);
        this.currentFocusedCell = { rowId: previousRowFirstCell.rowId, columnId: previousRowFirstCell.columnId };
        logger.debug(
          `[KeyboardNavigation] Navigated to previous row: ${previousRowFirstCell.rowId}:${previousRowFirstCell.columnId}`
        );
        return true;
      }
    }

    return false;
  }

  /**
   * Focus on a specific cell element
   */
  private async focusCell(element: HTMLElement): Promise<void> {
    // Small delay to allow React Suspense to resolve if needed
    await new Promise((resolve) => setTimeout(resolve, 10));

    element.focus();

    // Select all text for input elements
    if (element instanceof HTMLInputElement && element.type === "text") {
      element.select();
    }
  }

  /**
   * Handle keyboard events for navigation
   */
  public handleKeyDown = async (event: KeyboardEvent, rowId: string, columnId: string): Promise<boolean> => {
    const { key, shiftKey, ctrlKey, metaKey } = event;

    // Don't handle keyboard shortcuts if modifier keys are pressed (except Shift for Tab)
    if ((ctrlKey || metaKey) && key !== "Tab") {
      return false;
    }

    switch (key) {
      case "Tab":
        event.preventDefault();
        if (shiftKey) {
          return this.navigateToPreviousCell(rowId, columnId);
        }
        return this.navigateToNextCell(rowId, columnId);

      case "Enter":
        event.preventDefault();
        if (shiftKey) {
          // Shift+Enter: Navigate to previous row
          return this.navigateToPreviousRow(rowId);
        }
        // Enter: Save current row and navigate to next row or save
        try {
          await this.options.onSaveRow(rowId);
          logger.info(`[KeyboardNavigation] Saved row via Enter key: ${rowId}`);

          // Try to navigate to next row, if no next row, stay on current
          this.navigateToNextRow(rowId);
          return true;
        } catch (error) {
          logger.error(`[KeyboardNavigation] Failed to save row via Enter key: ${rowId}`, error);
          return false;
        }

      case "Escape":
        event.preventDefault();
        try {
          await this.options.onCancelRow(rowId);
          logger.info(`[KeyboardNavigation] Cancelled row via Escape key: ${rowId}`);
          return true;
        } catch (error) {
          logger.error(`[KeyboardNavigation] Failed to cancel row via Escape key: ${rowId}`, error);
          return false;
        }

      case "ArrowUp":
        if (ctrlKey || metaKey) {
          event.preventDefault();
          return this.navigateToPreviousRow(rowId);
        }
        break;

      case "ArrowDown":
        if (ctrlKey || metaKey) {
          event.preventDefault();
          return this.navigateToNextRow(rowId);
        }
        break;

      case "ArrowLeft":
        // Only handle if at the beginning of input
        if (event.target instanceof HTMLInputElement) {
          const input = event.target;
          if (input.selectionStart === 0 && input.selectionEnd === 0) {
            event.preventDefault();
            return this.navigateToPreviousCell(rowId, columnId);
          }
        }
        break;

      case "ArrowRight":
        // Only handle if at the end of input
        if (event.target instanceof HTMLInputElement) {
          const input = event.target;
          if (input.selectionStart === input.value.length && input.selectionEnd === input.value.length) {
            event.preventDefault();
            return this.navigateToNextCell(rowId, columnId);
          }
        }
        break;

      default:
        return false;
    }

    return false;
  };

  /**
   * Update the current focused cell
   */
  public setCurrentFocusedCell(rowId: string, columnId: string): void {
    this.currentFocusedCell = { rowId, columnId };
  }

  /**
   * Get the current focused cell
   */
  public getCurrentFocusedCell(): { rowId: string; columnId: string } | null {
    return this.currentFocusedCell;
  }

  /**
   * Focus on the first editable cell in a row
   */
  public async focusFirstCellInRow(rowId: string): Promise<boolean> {
    const editableCells = this.getEditableCells();
    const firstCellInRow = editableCells.find((cell) => cell.rowId === rowId);

    if (firstCellInRow) {
      await this.focusCell(firstCellInRow.element);
      this.currentFocusedCell = { rowId: firstCellInRow.rowId, columnId: firstCellInRow.columnId };
      logger.debug(`[KeyboardNavigation] Focused first cell in row: ${rowId}:${firstCellInRow.columnId}`);
      return true;
    }

    return false;
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.currentFocusedCell = null;
  }
}

/**
 * Create a keyboard navigation manager instance
 */
export const createKeyboardNavigationManager = (options: KeyboardNavigationOptions): KeyboardNavigationManager => {
  return new KeyboardNavigationManager(options);
};

/**
 * Hook to use keyboard navigation in cell editors
 */
export const useKeyboardNavigation = (
  rowId: string,
  columnId: string,
  navigationManager: KeyboardNavigationManager | null
) => {
  const handleKeyDown = async (event: KeyboardEvent): Promise<boolean> => {
    if (!navigationManager) return false;

    return await navigationManager.handleKeyDown(event, rowId, columnId);
  };

  const setFocused = () => {
    if (navigationManager) {
      navigationManager.setCurrentFocusedCell(rowId, columnId);
    }
  };

  return {
    handleKeyDown,
    setFocused,
  };
};
