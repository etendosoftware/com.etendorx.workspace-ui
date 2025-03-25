import React, { useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';
import { useStyle } from './styles';
import { ProcessModalProps, ProcessButtonType } from './types';

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

  useEffect(() => {
    if (ProcessButtonType.PROCESS_DEFINITION in button) {
      console.debug('processDefinition', button.processDefintion);
    } else if (ProcessButtonType.PROCESS_ACTION in button) {
      console.debug('processAction', button.processAction);
    }
  }, [button]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth sx={styles.dialog}>
      <DialogTitle sx={styles.dialogTitle}>{button.name}</DialogTitle>
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
  );
};

export default ProcessModal;
