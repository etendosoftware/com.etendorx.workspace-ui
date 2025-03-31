import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';
import { useStyle } from './styles';
import { ProcessButtonType, type ProcessModalProps } from './types';
import ProcessIframeModal from './Iframe';

const ProcessModal = memo(
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
    const [showIframeModal, setShowIframeModal] = useState(false);
    const [iframeUrl, setIframeUrl] = useState('');

    const type = useMemo(
      () =>
        ProcessButtonType.PROCESS_DEFINITION in button
          ? ProcessButtonType.PROCESS_DEFINITION
          : ProcessButtonType.PROCESS_ACTION,
      [button],
    );

    const responseMessage = useMemo(
      () => processResponse?.responseActions?.[0]?.showMsgInProcessView,
      [processResponse?.responseActions],
    );

    const isError = useMemo(() => responseMessage?.msgType === 'error', [responseMessage?.msgType]);

    useEffect(() => {
      if (processResponse?.showInIframe && processResponse?.iframeUrl) {
        setIframeUrl(processResponse.iframeUrl);
        setShowIframeModal(true);
      }
    }, [processResponse]);

    const handleCloseIframeModal = useCallback(() => {
      setShowIframeModal(false);
      setIframeUrl('');
    }, []);

    const handleCombinedClose = useCallback(() => {
      handleCloseIframeModal();
      onClose();
    }, [handleCloseIframeModal, onClose]);

    const responseElement = useMemo(() => {
      if (!processResponse) return null;

      return (
        <Box sx={styles.messageBox}>
          {responseMessage && (
            <Typography sx={isError ? styles.errorMessage : styles.successMessage}>
              {`${responseMessage.msgTitle}: ${responseMessage.msgText}`}
            </Typography>
          )}
          <pre style={styles.responseBox as React.CSSProperties}>{JSON.stringify(processResponse, null, 2)}</pre>
        </Box>
      );
    }, [
      processResponse,
      responseMessage,
      isError,
      styles.messageBox,
      styles.errorMessage,
      styles.successMessage,
      styles.responseBox,
    ]);

    const actionButtons = useMemo(
      () => (
        <>
          <Button onClick={onClose} sx={styles.cancelButton}>
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
        onClose,
        onConfirm,
        processResponse,
        styles.cancelButton,
        styles.executeButton,
      ],
    );

    return (
      <>
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth sx={styles.dialog} closeAfterTransition>
          <DialogTitle sx={styles.dialogTitle}>
            {button.name} ({type})
          </DialogTitle>
          <DialogContent sx={styles.dialogContent}>
            <Typography sx={styles.message}>{confirmationMessage}</Typography>
            {responseElement}
          </DialogContent>
          <DialogActions sx={styles.dialogActions}>{actionButtons}</DialogActions>
        </Dialog>

        {showIframeModal && (
          <ProcessIframeModal
            isOpen={showIframeModal}
            onClose={handleCombinedClose}
            url={iframeUrl}
            title={button?.name || 'Proceso de Etendo'}
          />
        )}
      </>
    );
  },
);

ProcessModal.displayName = 'ProcessModal';

export default ProcessModal;
