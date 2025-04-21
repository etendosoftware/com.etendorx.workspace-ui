import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useStyle } from './styles';
import { type ProcessModalProps } from './types';
import DeprecatedFeatureModal from './DeprecatedFeature';

export const ProcessActionModal = memo(
  ({
    open,
    onClose,
    button,
    onConfirm,
    isExecuting,
    processResponse,
    confirmationMessage,
    cancelButtonText,
    executeButtonText,
  }: ProcessModalProps) => {
    const { styles } = useStyle();
    const [showDeprecatedFeatureModal, setShowDeprecatedFeatureModal] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(open);
    const [deprecatedMessage, setDeprecatedMessage] = useState('');

    useEffect(() => {
      setShowConfirmDialog(open);
    }, [open]);

    useEffect(() => {
      if (processResponse?.showDeprecatedFeatureModal) {
        setShowDeprecatedFeatureModal(true);
        setDeprecatedMessage(processResponse.message || '');
        setShowConfirmDialog(false);
      }
    }, [processResponse]);

    const handleCloseDeprecatedFeatureModal = useCallback(() => {
      setShowDeprecatedFeatureModal(false);
    }, []);

    const handleCombinedClose = useCallback(() => {
      handleCloseDeprecatedFeatureModal();
      onClose();
    }, [handleCloseDeprecatedFeatureModal, onClose]);

    const handleConfirmModalClose = useCallback(() => {
      if (!isExecuting) {
        setShowConfirmDialog(false);
        onClose();
      }
    }, [isExecuting, onClose]);

    const actionButtons = useMemo(
      () => (
        <>
          <Button onClick={handleConfirmModalClose} sx={styles.cancelButton}>
            {cancelButtonText}
          </Button>
          {!processResponse && (
            <Button onClick={onConfirm} disabled={isExecuting} sx={styles.executeButton}>
              {executeButtonText}
            </Button>
          )}
        </>
      ),
      [
        cancelButtonText,
        executeButtonText,
        isExecuting,
        handleConfirmModalClose,
        onConfirm,
        processResponse,
        styles.cancelButton,
        styles.executeButton,
      ],
    );

    if (!button) {
      return null;
    }

    return (
      <>
        <Dialog
          open={showConfirmDialog}
          onClose={handleConfirmModalClose}
          maxWidth="md"
          fullWidth
          sx={styles.dialog}
          closeAfterTransition>
          <DialogTitle sx={styles.dialogTitle}>{button.name}</DialogTitle>
          <DialogContent sx={styles.dialogContent}>
            <Typography sx={styles.message}>{confirmationMessage}</Typography>
          </DialogContent>
          <DialogActions sx={styles.dialogActions}>{actionButtons}</DialogActions>
        </Dialog>
        {showDeprecatedFeatureModal && (
          <DeprecatedFeatureModal
            isOpen={showDeprecatedFeatureModal}
            onClose={handleCombinedClose}
            title={button?.name || ''}
            message={deprecatedMessage}
          />
        )}
      </>
    );
  },
);

ProcessActionModal.displayName = 'ProcessActionModal';

export default ProcessActionModal;
