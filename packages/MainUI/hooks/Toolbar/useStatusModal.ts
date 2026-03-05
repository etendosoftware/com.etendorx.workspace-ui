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

import type { StatusType } from "@workspaceui/componentlibrary/src/components/StatusModal/types";
import React, { useState, useCallback } from "react";
import { toast } from "sonner";
import { ToastContent } from "@/components/ToastContent";

interface ConfirmOptions {
  confirmText: string;
  onConfirm: () => void;
  saveLabel?: string;
  secondaryButtonLabel?: string;
}

export const useStatusModal = () => {
  // We keep state for ConfirmModal as it requires user interaction
  const [confirmAction, setConfirmAction] = useState<ConfirmOptions | null>(null);

  // Dummy state to avoid breaking consumers that read statusModal.open
  const statusModal = { open: false, statusType: "info" as StatusType, statusText: "", isDeleteSuccess: false };

  const showStatusModal = useCallback(
    (
      statusType: StatusType,
      statusText: string,
      options?: {
        errorMessage?: string;
        saveLabel?: string;
        secondaryButtonLabel?: string;
        onAfterClose?: () => void;
        isDeleteSuccess?: boolean;
        isProcessResult?: boolean; // Used to make toast persistent
      }
    ) => {
      const isPersistent = options?.isProcessResult || false;
      const description = options?.errorMessage
        ? React.createElement(ToastContent, { message: options.errorMessage })
        : undefined;
      const duration = isPersistent ? Number.POSITIVE_INFINITY : 4000;

      const toastOptions = {
        description,
        duration,
        onDismiss: () => {
          if (options?.onAfterClose) options.onAfterClose();
        },
        onAutoClose: () => {
          if (options?.onAfterClose) options.onAfterClose();
        },
      };

      const titleNode = React.createElement(ToastContent, { message: statusText });

      if (statusType === "success") {
        toast.success(titleNode, toastOptions);
      } else if (statusType === "error") {
        toast.error(titleNode, toastOptions);
      } else if (statusType === "warning") {
        toast.warning(titleNode, toastOptions);
      } else {
        toast.info(titleNode, toastOptions);
      }
    },
    []
  );

  const showSuccessModal = useCallback(
    (
      statusText: string,
      options?: {
        saveLabel?: string;
        secondaryButtonLabel?: string;
        onAfterClose?: () => void;
        isDeleteSuccess?: boolean;
        isProcessResult?: boolean;
      }
    ) => {
      showStatusModal("success", statusText, options);
    },
    [showStatusModal]
  );

  const showDeleteSuccessModal = useCallback(
    (
      statusText: string,
      options?: {
        saveLabel?: string;
        onAfterClose?: () => void;
      }
    ) => {
      showStatusModal("success", statusText, {
        ...options,
        isDeleteSuccess: true,
      });
    },
    [showStatusModal]
  );

  const showErrorModal = useCallback(
    (
      statusText: string,
      options?: {
        errorMessage?: string;
        saveLabel?: string;
        secondaryButtonLabel?: string;
        onAfterClose?: () => void;
        isProcessResult?: boolean;
      }
    ) => {
      showStatusModal("error", statusText, options);
    },
    [showStatusModal]
  );

  const showWarningModal = useCallback(
    (
      statusText: string,
      options?: {
        errorMessage?: string;
        saveLabel?: string;
        secondaryButtonLabel?: string;
        onAfterClose?: () => void;
        isProcessResult?: boolean;
      }
    ) => {
      showStatusModal("warning", statusText, options);
    },
    [showStatusModal]
  );

  const showConfirmModal = useCallback((options: ConfirmOptions) => {
    setConfirmAction(options);
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmAction) {
      const { onConfirm } = confirmAction;
      setConfirmAction(null);
      onConfirm();
    }
  }, [confirmAction]);

  const handleCancelConfirm = useCallback(() => {
    setConfirmAction(null);
  }, []);

  const hideStatusModal = useCallback(() => {
    // No-op for toasts
  }, []);

  return {
    statusModal,
    confirmAction,
    showStatusModal,
    showSuccessModal,
    showDeleteSuccessModal,
    showErrorModal,
    showWarningModal,
    showConfirmModal,
    handleConfirm,
    handleCancelConfirm,
    hideStatusModal,
  };
};
