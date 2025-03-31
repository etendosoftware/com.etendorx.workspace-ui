import { useMemo, memo } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { Modal } from '..';
import SaveIcon from '../../assets/icons/trash.svg';
import { useStyle } from '../StatusModal/styles';
import { ConfirmModalProps } from './types';

const ConfirmModal = memo(
  ({
    confirmText,
    onConfirm,
    onCancel,
    saveLabel = 'Confirm',
    secondaryButtonLabel = 'Cancel',
    open = true,
  }: ConfirmModalProps) => {
    const theme = useTheme();
    const { sx } = useStyle();

    const backgroundGradient = useMemo(
      () => `linear-gradient(to bottom, ${theme.palette.specificColor.warning.light}, rgba(255, 255, 255, 0))`,
      [theme.palette.specificColor.warning.light],
    );
    return (
      <Modal
        open={open}
        showHeader={false}
        saveButtonLabel={saveLabel}
        secondaryButtonLabel={secondaryButtonLabel}
        SaveIcon={SaveIcon}
        backgroundGradient={backgroundGradient}
        onSave={onConfirm}
        onCancel={onCancel}>
        <Box sx={sx.statusModalContainer}>
          <Typography sx={sx.statusText}>{confirmText}</Typography>
        </Box>
      </Modal>
    );
  },
);

ConfirmModal.displayName = 'ConfirmModal';

export default ConfirmModal;
