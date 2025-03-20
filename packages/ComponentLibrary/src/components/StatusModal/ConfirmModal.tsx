import { Box, Typography, useTheme } from '@mui/material';
import { Modal } from '..';
import SaveIcon from '../../assets/icons/aperture.svg';
import { useStyle } from '../StatusModal/styles';
import { ConfirmModalProps } from './types';

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  confirmText,
  onConfirm,
  onCancel,
  saveLabel = 'Confirm',
  secondaryButtonLabel = 'Cancel',
}) => {
  const theme = useTheme();
  const { sx } = useStyle();

  const backgroundGradient = `linear-gradient(to bottom, ${theme.palette.specificColor.warning.light}, rgba(255, 255, 255, 0))`;

  return (
    <Modal
      open={true}
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
};

export default ConfirmModal;
