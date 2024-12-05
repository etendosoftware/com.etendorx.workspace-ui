import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';
import { ProcessButton, ProcessResponse } from '@workspaceui/mainui/components/Toolbar/types';
import { useStyle } from './styles';

interface ProcessModalProps {
  open: boolean;
  onClose: () => void;
  button: ProcessButton;
  onConfirm: () => void;
  isExecuting: boolean;
  processResponse: ProcessResponse | null;
  confirmationMessage: string;
  cancelButtonText: string;
  executeButtonText: string;
}

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
