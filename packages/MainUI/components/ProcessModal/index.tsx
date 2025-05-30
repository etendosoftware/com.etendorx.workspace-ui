import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";
import { useStyle } from "./styles";
import { ProcessButtonType, type ProcessModalProps } from "./types";
import ProcessIframeModal from "./Iframe";

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
    onProcessSuccess,
    tabId,
  }: ProcessModalProps) => {
    const { styles } = useStyle();
    const [showIframeModal, setShowIframeModal] = useState(false);
    const [iframeUrl, setIframeUrl] = useState("");
    const [showConfirmDialog, setShowConfirmDialog] = useState(open);

    const type = useMemo(
      () =>
        ProcessButtonType.PROCESS_DEFINITION in button
          ? ProcessButtonType.PROCESS_DEFINITION
          : ProcessButtonType.PROCESS_ACTION,
      [button],
    );

    useEffect(() => {
      setShowConfirmDialog(open);
    }, [open]);

    useEffect(() => {
      if (processResponse?.iframeUrl) {
        setIframeUrl(processResponse.iframeUrl);
        setShowIframeModal(true);
        setShowConfirmDialog(false);
      }
    }, [processResponse]);

    const handleCloseIframeModal = useCallback(() => {
      setShowIframeModal(false);
      setIframeUrl("");
    }, []);

    const handleCombinedClose = useCallback(() => {
      handleCloseIframeModal();
      onClose();
    }, [handleCloseIframeModal, onClose]);

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

    return (
      <>
        <Dialog
          open={showConfirmDialog}
          onClose={handleConfirmModalClose}
          maxWidth="md"
          fullWidth
          sx={styles.dialog}
          closeAfterTransition>
          <DialogTitle sx={styles.dialogTitle}>
            {button.name} ({type})
          </DialogTitle>
          <DialogContent sx={styles.dialogContent}>
            <Typography sx={styles.message}>{confirmationMessage}</Typography>
          </DialogContent>
          <DialogActions sx={styles.dialogActions}>{actionButtons}</DialogActions>
        </Dialog>
        {showIframeModal && (
          <ProcessIframeModal
            isOpen={showIframeModal}
            onClose={handleCombinedClose}
            url={iframeUrl}
            title={button?.name || ""}
            onProcessSuccess={onProcessSuccess}
            tabId={tabId}
          />
        )}
      </>
    );
  },
);

ProcessModal.displayName = "ProcessModal";

export default ProcessModal;
