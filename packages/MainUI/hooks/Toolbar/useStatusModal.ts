import { StatusModalState, StatusType } from '@workspaceui/componentlibrary/src/components/StatusModal/types';
import { useState, useCallback } from 'react';

const initialState: StatusModalState = {
  open: false,
  statusType: 'info',
  statusText: '',
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
      },
    ) => {
      setState({
        open: true,
        statusType,
        statusText,
        ...options,
      });
    },
    [],
  );

  const showSuccessModal = useCallback(
    (
      statusText: string,
      options?: {
        saveLabel?: string;
        secondaryButtonLabel?: string;
        onAfterClose?: () => void;
      },
    ) => {
      showStatusModal('success', statusText, options);
    },
    [showStatusModal],
  );

  const showErrorModal = useCallback(
    (
      statusText: string,
      options?: {
        errorMessage?: string;
        saveLabel?: string;
        secondaryButtonLabel?: string;
        onAfterClose?: () => void;
      },
    ) => {
      showStatusModal('error', statusText, options);
    },
    [showStatusModal],
  );

  const showWarningModal = useCallback(
    (
      statusText: string,
      options?: {
        errorMessage?: string;
        saveLabel?: string;
        secondaryButtonLabel?: string;
        onAfterClose?: () => void;
      },
    ) => {
      showStatusModal('warning', statusText, options);
    },
    [showStatusModal],
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
    setState(prev => ({ ...prev, open: false }));
  }, []);

  return {
    statusModal: state,
    confirmAction,
    showStatusModal,
    showSuccessModal,
    showErrorModal,
    showWarningModal,
    showConfirmModal,
    handleConfirm,
    handleCancelConfirm,
    hideStatusModal,
  };
};
