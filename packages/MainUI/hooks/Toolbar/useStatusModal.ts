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

import type { StatusModalState, StatusType } from "@workspaceui/componentlibrary/src/components/StatusModal/types";
import { useState, useCallback } from "react";

const initialState: StatusModalState = {
  open: false,
  statusType: "info",
  statusText: "",
  isDeleteSuccess: false,
};

interface ConfirmOptions {
  confirmText: string;
  onConfirm: () => void;
  saveLabel?: string;
  secondaryButtonLabel?: string;
}

export const useStatusModal = () => {
  const [state, setState] = useState<StatusModalState>(initialState);
  const [confirmAction, setConfirmAction] = useState<ConfirmOptions | null>(null);

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
      }
    ) => {
      setState({
        open: true,
        statusType,
        statusText,
        isDeleteSuccess: options?.isDeleteSuccess || false,
        ...options,
      });
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
        saveLabel: options?.saveLabel || "Close",
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
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  return {
    statusModal: state,
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
