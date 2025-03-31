import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';
import { useStyle } from './styles';
import { ProcessButtonType, type ProcessModalProps } from './types';
import { useEffect, useState } from 'react';
import ProcessIframeModal from './Iframe';

const ProcessModal: React.FC<ProcessModalProps> = ({
  open,
  onClose,
  button,
  onConfirm,
  isExecuting,
  processResponse,
  confirmationMessage,
  cancelButtonText,
  executeButtonText,
}) => {
  const { styles } = useStyle();
  const responseMessage = processResponse?.responseActions?.[0]?.showMsgInProcessView;
  const isError = responseMessage?.msgType === 'error';
  const type =
    ProcessButtonType.PROCESS_DEFINITION in button
      ? ProcessButtonType.PROCESS_DEFINITION
      : ProcessButtonType.PROCESS_ACTION;

  const [showIframeModal, setShowIframeModal] = useState(false);
  const [iframeUrl, setIframeUrl] = useState('');

  useEffect(() => {
    if (open) {
      console.debug('ProcessModal opened');
      console.debug('Button process info:', button.processInfo);

      if (ProcessButtonType.PROCESS_DEFINITION in button) {
        console.debug('Process definition:', button.processDefintion);
      } else if (ProcessButtonType.PROCESS_ACTION in button) {
        console.debug('Process action:', button.processAction);
      } else {
        console.debug('Unsupported process type:', button);
      }
    }
  }, [button, open]);

  useEffect(() => {
    if (processResponse?.showInIframe && processResponse?.iframeUrl) {
      setIframeUrl(processResponse.iframeUrl);
      setShowIframeModal(true);
    }
  }, [processResponse]);

  const handleCloseIframeModal = () => {
    setShowIframeModal(false);
    setIframeUrl('');
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth sx={styles.dialog}>
        <DialogTitle sx={styles.dialogTitle}>
          {button.name} ({type})
        </DialogTitle>
        <DialogContent sx={styles.dialogContent}>
          <Typography sx={styles.message}>{confirmationMessage}</Typography>

          {processResponse && (
            <Box sx={styles.messageBox}>
              {responseMessage && (
                <Typography sx={isError ? styles.errorMessage : styles.successMessage}>
                  {`${responseMessage.msgTitle}: ${responseMessage.msgText}`}
                </Typography>
              )}
              <pre style={styles.responseBox as React.CSSProperties}>{JSON.stringify(processResponse, null, 2)}</pre>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={styles.dialogActions}>
          <Button onClick={onClose} sx={styles.cancelButton}>
            {cancelButtonText}
          </Button>
          {!processResponse && (
            <Button onClick={onConfirm} disabled={isExecuting} sx={styles.executeButton}>
              {executeButtonText}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <ProcessIframeModal
        isOpen={showIframeModal}
        onClose={() => {
          handleCloseIframeModal();
          onClose();
        }}
        url={iframeUrl}
        title={button?.name || 'Proceso de Etendo'}
      />
    </>
  );
};

export default ProcessModal;
