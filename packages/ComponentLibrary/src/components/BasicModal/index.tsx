import React, { useState } from 'react';
import { Typography, Button, Box } from '@mui/material';
import ModalMUI from '@mui/material/Modal';
import IconButton from '../IconButton';
import { Container, Position } from '../enums';
import { ModalIProps } from './types';
import { IconSize, styles, sx } from './styles';
import { theme } from '../../theme';
import CloseIcon from '../../assets/icons/x.svg';
import { calculateModalStyles } from '../../helpers/updateModal';

const Modal: React.FC<ModalIProps> = ({
  height = Container.Auto,
  width = Container.Auto,
  posX = Position.Center,
  posY = Position.Center,
  children,
  customTrigger,
  onClose,
  tittleHeader,
  descriptionText,
  HeaderIcon,
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const handleOpen = () => setOpen(true);

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
    setOpen(false);
  };

  const modalStyles = calculateModalStyles({ height, width, posX, posY });

  return (
    <>
      {customTrigger ? (
        React.cloneElement(customTrigger as React.ReactElement, {
          onClick: handleOpen,
        })
      ) : (
        <Button onClick={handleOpen} variant="contained">
          Modal
        </Button>
      )}
      <ModalMUI open={open} onClose={handleClose} style={styles.modalStyles}>
        <Box
          sx={{
            ...styles.boxStyles,
            ...modalStyles,
          }}>
          <Box sx={sx.modalContainer}>
            <Box sx={sx.headerContainer}>
              <Box sx={sx.titleContainer}>
                <Box sx={sx.closeRecordButton}>
                  <HeaderIcon
                    fill={theme.palette.baselineColor.etendoPrimary.main}
                    width={20}
                    height={20}
                  />
                </Box>
                <Typography sx={sx.registerText}>{tittleHeader}</Typography>
              </Box>
            </Box>
            <Typography sx={sx.descriptionText}>{descriptionText}</Typography>
            <IconButton
              aria-label="close"
              size="small"
              hoverFill={theme.palette.baselineColor.neutral[80]}
              width={IconSize}
              height={IconSize}
              onClick={handleClose}
              sx={sx.closeButton}>
              <CloseIcon />
            </IconButton>
            {children}
          </Box>
        </Box>
      </ModalMUI>
    </>
  );
};

export default Modal;
