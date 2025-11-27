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
import type { StatusType } from "@workspaceui/componentlibrary/src/components/StatusModal/types";

interface ConfirmationState {
  isOpen: boolean;
  statusType: StatusType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmDisabled?: boolean;
  showCancel: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ConfirmationOptions {
  type?: StatusType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmDisabled?: boolean;
  showCancel?: boolean;
}

/**
 * Hook for managing confirmation modals in Table component using StatusModal
 * Replaces the old useConfirmationDialog hook with StatusModal-based confirmations
 */
export function useTableConfirmation() {
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>({
    isOpen: false,
    statusType: "info",
    title: "",
    message: "",
    showCancel: true,
    onConfirm: () => {},
    onCancel: () => {},
  });

  const showConfirmation = useCallback((options: ConfirmationOptions, onConfirm: () => void, onCancel?: () => void) => {
    setConfirmationState({
      isOpen: true,
      statusType: options.type || "info",
      title: options.title,
      message: options.message,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      confirmDisabled: options.confirmDisabled,
      showCancel: options.showCancel !== false,
      onConfirm: () => {
        setConfirmationState((prev) => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      onCancel: () => {
        setConfirmationState((prev) => ({ ...prev, isOpen: false }));
        onCancel?.();
      },
    });
  }, []);

  const hideConfirmation = useCallback(() => {
    setConfirmationState((prev) => ({ ...prev, isOpen: false }));
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
    confirmationState,
    showConfirmation,
    hideConfirmation,
    confirmDiscardChanges,
    confirmSaveWithErrors,
    confirmRetryAfterError,
    showSuccessMessage,
    confirmNavigateWithUnsavedChanges,
  };
}

export default useTableConfirmation;
