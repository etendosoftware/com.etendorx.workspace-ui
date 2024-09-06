import React from 'react';
import { Box, Typography } from '@mui/material';
import { Modal, theme } from '..';
import SaveIcon from '../../assets/icons/save.svg';
import { useTranslation } from '../../../../MainUI/src/hooks/useTranslation';
import { statusConfig } from './states';
import { sx } from './styles';
import { StatusModalProps } from './types';

const StatusModal: React.FC<StatusModalProps> = ({
  statusText,
  statusType,
}) => {
  const { t } = useTranslation();
  const {
    gradientColor,
    iconBackgroundColor,
    icon: StatusIcon,
  } = statusConfig[statusType];

  const backgroundGradient = `linear-gradient(to bottom, ${gradientColor}, rgba(255, 255, 255, 0))`;

  return (
    <Modal
      showHeader={false}
      saveButtonLabel={t('common.save')}
      secondaryButtonLabel={t('common.cancel')}
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
        <Typography sx={sx.statusText}>{statusText}</Typography>
      </Box>
    </Modal>
  );
};

export default StatusModal;
