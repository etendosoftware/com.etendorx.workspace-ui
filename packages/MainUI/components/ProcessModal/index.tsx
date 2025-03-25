import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';
import { useStyle } from './styles';
import { ProcessButtonType, type ProcessModalProps } from './types';

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
    ProcessButtonType.PROCESS_ACTION in button
      ? ProcessButtonType.PROCESS_ACTION
      : ProcessButtonType.PROCESS_DEFINITION;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth sx={styles.dialog}>
      <DialogTitle sx={styles.dialogTitle}>{button.name}</DialogTitle>
      <DialogContent sx={styles.dialogContent}>
        <Typography sx={styles.message}>{confirmationMessage}</Typography>
        <div className="text-sm hidden">
          <b>{type}</b>
          <pre className="code w-full h-full p-2 rounded-lg border">
            <code>{JSON.stringify(button, null, 2)}</code>
          </pre>
        </div>

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
