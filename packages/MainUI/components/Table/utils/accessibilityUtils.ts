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

import { useCallback, useEffect, useRef } from "react";
import { logger } from "@/utils/logger";

/**
 * ARIA live region types for screen reader announcements
 */
export type AriaLiveType = "polite" | "assertive" | "off";

/**
 * Screen reader announcement manager
 * Handles announcements for state changes and user actions
 */
export class ScreenReaderAnnouncer {
  private liveRegion: HTMLElement | null = null;
  private politeRegion: HTMLElement | null = null;
  private assertiveRegion: HTMLElement | null = null;

  constructor() {
    this.createLiveRegions();
  }

  /**
   * Create ARIA live regions for announcements
   */
  private createLiveRegions(): void {
    // Create polite live region for non-urgent announcements
    this.politeRegion = document.createElement("div");
    this.politeRegion.setAttribute("aria-live", "polite");
    this.politeRegion.setAttribute("aria-atomic", "true");
    this.politeRegion.setAttribute("class", "sr-only");
    this.politeRegion.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    document.body.appendChild(this.politeRegion);

    // Create assertive live region for urgent announcements
    this.assertiveRegion = document.createElement("div");
    this.assertiveRegion.setAttribute("aria-live", "assertive");
    this.assertiveRegion.setAttribute("aria-atomic", "true");
    this.assertiveRegion.setAttribute("class", "sr-only");
    this.assertiveRegion.style.cssText = this.politeRegion.style.cssText;
    document.body.appendChild(this.assertiveRegion);

    logger.debug("[Accessibility] Created ARIA live regions for screen reader announcements");
  }

  /**
   * Announce a message to screen readers
   */
  announce(message: string, priority: AriaLiveType = "polite"): void {
    if (!message.trim()) return;

    const region = priority === "assertive" ? this.assertiveRegion : this.politeRegion;
    if (!region) return;

    // Clear the region first to ensure the announcement is read
    region.textContent = "";

    // Use a small delay to ensure the clearing is processed
    setTimeout(() => {
      region.textContent = message;
      logger.debug(`[Accessibility] Announced (${priority}): ${message}`);
    }, 100);
  }

  /**
   * Announce editing state changes
   */
  announceEditingStateChange(rowId: string, isEditing: boolean, columnCount: number): void {
    if (isEditing) {
      this.announce(
        `Row ${rowId} is now in edit mode. Use Tab to navigate between ${columnCount} editable fields. Press Enter to save or Escape to cancel.`,
        "polite"
      );
    } else {
      this.announce(`Row ${rowId} is no longer in edit mode.`, "polite");
    }
  }

  /**
   * Announce validation errors
   */
  announceValidationErrors(fieldName: string, errorMessage: string): void {
    this.announce(`Validation error in ${fieldName}: ${errorMessage}`, "assertive");
  }

  /**
   * Announce save operations
   */
  announceSaveOperation(rowId: string, success: boolean, isNew: boolean): void {
    if (success) {
      const action = isNew ? "created" : "updated";
      this.announce(`Row ${rowId} has been successfully ${action}.`, "polite");
    } else {
      this.announce(`Failed to save row ${rowId}. Please check for errors and try again.`, "assertive");
    }
  }

  /**
   * Announce navigation changes
   */
  announceNavigation(fromCell: string, toCell: string): void {
    this.announce(`Moved from ${fromCell} to ${toCell}`, "polite");
  }

  /**
   * Announce row insertion
   */
  announceRowInsertion(rowId: string): void {
    this.announce(`New row ${rowId} has been inserted and is ready for editing.`, "polite");
  }

  /**
   * Announce row cancellation
   */
  announceRowCancellation(rowId: string, hadUnsavedChanges: boolean): void {
    if (hadUnsavedChanges) {
      this.announce(`Editing cancelled for row ${rowId}. Unsaved changes have been discarded.`, "polite");
    } else {
      this.announce(`Editing cancelled for row ${rowId}.`, "polite");
    }
  }

  /**
   * Clean up live regions
   */
  destroy(): void {
    if (this.politeRegion) {
      document.body.removeChild(this.politeRegion);
      this.politeRegion = null;
    }
    if (this.assertiveRegion) {
      document.body.removeChild(this.assertiveRegion);
      this.assertiveRegion = null;
    }
    logger.debug("[Accessibility] Destroyed ARIA live regions");
  }
}

/**
 * Global screen reader announcer instance
 */
let globalAnnouncer: ScreenReaderAnnouncer | null = null;

/**
 * Get or create the global screen reader announcer
 */
export const getScreenReaderAnnouncer = (): ScreenReaderAnnouncer => {
  if (!globalAnnouncer) {
    globalAnnouncer = new ScreenReaderAnnouncer();
  }
  return globalAnnouncer;
};

/**
 * Hook for using screen reader announcements
 */
export const useScreenReaderAnnouncer = () => {
  const announcerRef = useRef<ScreenReaderAnnouncer | null>(null);

  useEffect(() => {
    announcerRef.current = getScreenReaderAnnouncer();

    return () => {
      // Don't destroy the global announcer on unmount as it might be used by other components
    };
  }, []);

  return announcerRef.current;
};

/**
 * ARIA attributes generator for inline editing components
 */
export const generateAriaAttributes = {
  /**
   * Generate ARIA attributes for editable cells
   */
  editableCell: (
    fieldName: string,
    fieldLabel: string,
    hasError: boolean,
    isRequired: boolean,
    rowIndex: number,
    columnIndex: number
  ) => ({
    "aria-label": `${fieldLabel} for row ${rowIndex + 1}`,
    "aria-describedby": hasError ? `${fieldName}-error` : undefined,
    "aria-invalid": hasError,
    "aria-required": isRequired,
    role: "gridcell",
    "aria-rowindex": rowIndex + 1,
    "aria-colindex": columnIndex + 1,
  }),

  /**
   * Generate ARIA attributes for action buttons
   */
  actionButton: (action: string, rowId: string, disabled = false) => ({
    "aria-label": `${action} row ${rowId}`,
    "aria-disabled": disabled,
    role: "button",
    tabindex: disabled ? -1 : 0,
  }),

  /**
   * Generate ARIA attributes for error messages
   */
  errorMessage: (fieldName: string) => ({
    id: `${fieldName}-error`,
    role: "alert",
    "aria-live": "assertive" as AriaLiveType,
  }),

  /**
   * Generate ARIA attributes for the editing row
   */
  editingRow: (rowId: string, hasErrors: boolean) => ({
    "aria-label": `Row ${rowId} in edit mode${hasErrors ? " with validation errors" : ""}`,
    role: "row",
    "aria-expanded": true,
    "data-editing": "true",
  }),

  /**
   * Generate ARIA attributes for the table container
   */
  tableContainer: (totalRows: number, editingRowsCount: number) => ({
    role: "grid",
    "aria-label": `Data table with ${totalRows} rows, ${editingRowsCount} currently being edited`,
    "aria-rowcount": totalRows,
  }),
};

/**
 * Keyboard accessibility utilities
 */
export const keyboardAccessibility = {
  /**
   * Check if an element is focusable
   */
  isFocusable: (element: HTMLElement): boolean => {
    const focusableSelectors = [
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "button:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
      "a[href]",
    ];

    return focusableSelectors.some((selector) => element.matches(selector));
  },

  /**
   * Get all focusable elements within a container
   */
  getFocusableElements: (container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "button:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
      "a[href]",
    ].join(", ");

    return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
  },

  /**
   * Trap focus within a container
   */
  trapFocus: (container: HTMLElement, event: KeyboardEvent): boolean => {
    if (event.key !== "Tab") return false;

    const focusableElements = keyboardAccessibility.getFocusableElements(container);
    if (focusableElements.length === 0) return false;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement;

    if (event.shiftKey) {
      // Shift + Tab
      if (activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return true;
      }
    } else {
      // Tab
      if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
        return true;
      }
    }

    return false;
  },

  /**
   * Ensure an element is visible for screen readers
   */
  ensureVisible: (element: HTMLElement): void => {
    // Remove any screen reader hiding classes/styles
    element.classList.remove("sr-only", "visually-hidden");
    element.style.position = "";
    element.style.width = "";
    element.style.height = "";
    element.style.overflow = "";
    element.style.clip = "";
    element.style.clipPath = "";
  },
};

/**
 * Hook for managing focus within inline editing
 */
export const useFocusManagement = () => {
  const focusedElementRef = useRef<HTMLElement | null>(null);

  const setFocusedElement = useCallback((element: HTMLElement | null) => {
    focusedElementRef.current = element;
  }, []);

  const getFocusedElement = useCallback(() => {
    return focusedElementRef.current;
  }, []);

  const restoreFocus = useCallback(() => {
    if (focusedElementRef.current && document.contains(focusedElementRef.current)) {
      focusedElementRef.current.focus();
    }
  }, []);

  return {
    setFocusedElement,
    getFocusedElement,
    restoreFocus,
  };
};

/**
 * Color contrast utilities for accessibility
 */
export const colorContrast = {
  /**
   * Calculate relative luminance of a color
   */
  getLuminance: (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio: (color1: [number, number, number], color2: [number, number, number]): number => {
    const lum1 = colorContrast.getLuminance(...color1);
    const lum2 = colorContrast.getLuminance(...color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  },

  /**
   * Check if color combination meets WCAG AA standards
   */
  meetsWCAGAA: (foreground: [number, number, number], background: [number, number, number]): boolean => {
    const ratio = colorContrast.getContrastRatio(foreground, background);
    return ratio >= 4.5; // WCAG AA standard for normal text
  },

  /**
   * Check if color combination meets WCAG AAA standards
   */
  meetsWCAGAAA: (foreground: [number, number, number], background: [number, number, number]): boolean => {
    const ratio = colorContrast.getContrastRatio(foreground, background);
    return ratio >= 7; // WCAG AAA standard for normal text
  },
};

/**
 * Accessibility testing utilities
 */
export const accessibilityTesting = {
  /**
   * Check if an element has proper ARIA labels
   */
  hasProperLabeling: (element: HTMLElement): boolean => {
    return !!(
      element.getAttribute("aria-label") ||
      element.getAttribute("aria-labelledby") ||
      element.getAttribute("title") ||
      (element as HTMLInputElement).labels?.length
    );
  },

  /**
   * Check if form controls have proper error associations
   */
  hasProperErrorAssociation: (element: HTMLElement): boolean => {
    const describedBy = element.getAttribute("aria-describedby");
    const isInvalid = element.getAttribute("aria-invalid") === "true";

    if (!isInvalid) return true; // No error, so no association needed

    if (!describedBy) return false;

    // Check if the described element exists and has error content
    const errorElement = document.getElementById(describedBy);
    return !!(errorElement && errorElement.textContent?.trim());
  },

  /**
   * Validate accessibility of inline editing components
   */
  validateInlineEditingAccessibility: (container: HTMLElement): string[] => {
    const issues: string[] = [];

    // Check for proper ARIA roles
    const editableCells = container.querySelectorAll('[role="gridcell"]');
    if (editableCells.length === 0) {
      issues.push("No gridcell roles found for editable cells");
    }

    // Check for proper labeling
    const inputs = container.querySelectorAll("input, select, textarea");
    inputs.forEach((input, index) => {
      if (!accessibilityTesting.hasProperLabeling(input as HTMLElement)) {
        issues.push(`Input ${index + 1} lacks proper labeling`);
      }
    });

    // Check for proper error associations
    const invalidElements = container.querySelectorAll('[aria-invalid="true"]');
    invalidElements.forEach((element, index) => {
      if (!accessibilityTesting.hasProperErrorAssociation(element as HTMLElement)) {
        issues.push(`Invalid element ${index + 1} lacks proper error association`);
      }
    });

    return issues;
  },
};
