import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { Modal } from '..';
import SaveIcon from '../../assets/icons/save.svg';
import { statusConfig } from './states';
import { useStyle } from './styles';
import { StatusModalProps } from './types';

const StatusModal: React.FC<StatusModalProps> = ({
  statusText,
  statusType,
  errorMessage,
  saveLabel,
  secondaryButtonLabel,
}) => {
  const { gradientColor, iconBackgroundColor, icon: StatusIcon } = statusConfig[statusType];
  const theme = useTheme();
  const { sx } = useStyle();

  const backgroundGradient = `linear-gradient(to bottom, ${gradientColor}, rgba(255, 255, 255, 0))`;

  return (
    <Modal
      showHeader={false}
      saveButtonLabel={saveLabel}
      secondaryButtonLabel={secondaryButtonLabel}
      SaveIcon={SaveIcon}
      backgroundGradient={backgroundGradient}>
      <Box sx={sx.statusModalContainer}>
        <Box
          sx={{
            ...sx.statusIcon,
            background: iconBackgroundColor,
          }}>
          <StatusIcon fill={theme.palette.baselineColor.neutral[0]} />
        </Box>
        {statusType === 'error' && errorMessage && <Typography sx={sx.errorMessage}>{errorMessage}</Typography>}
        <Typography sx={sx.statusText}>{statusText}</Typography>
      </Box>
    </Modal>
  );
};

export default StatusModal;
