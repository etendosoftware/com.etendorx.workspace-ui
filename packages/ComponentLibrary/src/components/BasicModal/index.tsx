import React, { useState } from 'react';
import { Typography, Button, Box } from '@mui/material';
import ModalMUI from '@mui/material/Modal';
import IconButton from '../IconButton';
import { Container, Position } from '../enums';
import { calculateTransform } from '../../utils/transformUtil';
import { ModalIProps } from './types';
import { styles, sx } from './styles';
import { theme } from '../../theme';
import CloseIcon from '../../assets/icons/x.svg';

const Modal: React.FC<ModalIProps> = ({
  height = Container.Auto,
  width = Container.Auto,
  posX = Position.Center,
  posY = Position.Center,
  children,
  customTrigger,
  onClose,
  tittleHeader = '',
  descriptionText = '',
  headerIcon,
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const handleOpen = () => setOpen(true);

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
    setOpen(false);
  };

  const calculateTop = (posY: string | number): number | string => {
    if (posY === Position.Center) return '50%';
    if (posY === Position.Bottom) return '65%';
    if (posY === Position.Top) return '5%';
    return posY;
  };

  const calculateLeft = (posX: string | number): number | string => {
    if (posX === Position.Center) return '50%';
    if (posX === Position.Left) return '5%';
    if (posX === Position.Right) return '75%';
    return posX;
  };

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
            height: `${height}px`,
            width: `${width}px`,
            top: calculateTop(posY),
            left: calculateLeft(posX),
            transform: calculateTransform(posX, posY),
          }}>
          <Box sx={sx.modalContainer}>
            <Box sx={sx.headerContainer}>
              <Box sx={sx.titleContainer}>
                <Box sx={sx.closeRecordButton}>
                  {React.cloneElement(headerIcon, {
                    fill: theme.palette.baselineColor.etendoPrimary.main,
                    width: 20,
                    height: 20,
                  })}
                </Box>
                <Typography sx={sx.registerText}>{tittleHeader}</Typography>
              </Box>
            </Box>
            <Typography sx={sx.descriptionText}>{descriptionText}</Typography>
            <IconButton
              aria-label="close"
              size="small"
              hoverFill={theme.palette.baselineColor.neutral[80]}
              width={20}
              height={20}
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
