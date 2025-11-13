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

import { useState, useCallback } from "react";
import type { ConfirmationDialogType } from "../components/ConfirmationDialog";

interface ConfirmationDialogState {
  isOpen: boolean;
  type: ConfirmationDialogType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmDisabled?: boolean;
  showCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ConfirmationDialogOptions {
  type?: ConfirmationDialogType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmDisabled?: boolean;
  showCancel?: boolean;
}

/**
 * Hook for managing confirmation dialogs in inline editing
 * Provides methods to show different types of confirmation dialogs
 */
export function useConfirmationDialog() {
  const [dialogState, setDialogState] = useState<ConfirmationDialogState>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const showConfirmation = useCallback(
    (options: ConfirmationDialogOptions, onConfirm: () => void, onCancel?: () => void) => {
      setDialogState({
        isOpen: true,
        type: options.type || "info",
        title: options.title,
        message: options.message,
        confirmText: options.confirmText,
        cancelText: options.cancelText,
        confirmDisabled: options.confirmDisabled,
        showCancel: options.showCancel !== false,
        onConfirm: () => {
          setDialogState((prev) => ({ ...prev, isOpen: false }));
          onConfirm();
        },
        onCancel: () => {
          setDialogState((prev) => ({ ...prev, isOpen: false }));
          onCancel?.();
        },
      });
    },
    []
  );

  const hideConfirmation = useCallback(() => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Specific confirmation dialog methods
  const confirmDiscardChanges = useCallback(
    (onConfirm: () => void, onCancel?: () => void, hasUnsavedChanges = true) => {
      if (!hasUnsavedChanges) {
        onConfirm();
        return;
      }

      showConfirmation(
        {
          type: "warning",
          title: "Discard Changes",
          message: "You have unsaved changes that will be lost. Are you sure you want to continue?",
          confirmText: "Discard",
          cancelText: "Keep Editing",
        },
        onConfirm,
        onCancel
      );
    },
    [showConfirmation]
  );

  const confirmSaveWithErrors = useCallback(
    (errors: string[], onConfirm: () => void, onCancel?: () => void) => {
      const errorList = errors.join("\n• ");
      showConfirmation(
        {
          type: "warning",
          title: "Validation Errors",
          message: `The following validation errors were found:\n\n• ${errorList}\n\nPlease fix these errors before saving.`,
          confirmText: "Fix Errors",
          showCancel: false,
        },
        onCancel || (() => {}), // Use onCancel as the "fix errors" action
        onCancel
      );
    },
    [showConfirmation]
  );

  const confirmRetryAfterError = useCallback(
    (errorMessage: string, onRetry: () => void, onCancel?: () => void) => {
      showConfirmation(
        {
          type: "error",
          title: "Save Failed",
          message: `Failed to save the record:\n\n${errorMessage}\n\nWould you like to try again?`,
          confirmText: "Retry",
          cancelText: "Cancel",
        },
        onRetry,
        onCancel
      );
    },
    [showConfirmation]
  );

  const showSuccessMessage = useCallback(
    (message: string, onOk?: () => void) => {
      showConfirmation(
        {
          type: "success",
          title: "Success",
          message,
          confirmText: "OK",
          showCancel: false,
        },
        onOk || (() => {}),
        onOk
      );
    },
    [showConfirmation]
  );

  const confirmNavigateWithUnsavedChanges = useCallback(
    (onConfirm: () => void, onCancel?: () => void) => {
      showConfirmation(
        {
          type: "warning",
          title: "Unsaved Changes",
          message:
            "You have unsaved changes in the grid. Navigating away will discard these changes. Do you want to continue?",
          confirmText: "Leave Page",
          cancelText: "Stay",
        },
        onConfirm,
        onCancel
      );
    },
    [showConfirmation]
  );

  return {
    dialogState,
    showConfirmation,
    hideConfirmation,
    confirmDiscardChanges,
    confirmSaveWithErrors,
    confirmRetryAfterError,
    showSuccessMessage,
    confirmNavigateWithUnsavedChanges,
  };
}

export default useConfirmationDialog;
