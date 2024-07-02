import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ModalMUI from '@mui/material/Modal';
import styles from './Modal.styles';
import { useState } from 'react';
import { Container, Position } from '../enums';
import { calculateTransform } from '../../utils/transformUtil';
import { ModalIProps } from './types';

const Modal: React.FC<ModalIProps> = ({
  height = Container.Auto,
  width = Container.Auto,
  posX = Position.Center,
  posY = Position.Center,
  children,
  customTrigger,
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const calculateTop = (posY: string | number): number | string => {
    if (posY === Position.Center) {
      return '50%';
    }
    if (posY === Position.Bottom) {
      return '65%';
    }
    if (posY === Position.Top) {
      return '5%';
    }
    return posY;
  };

  const calculateLeft = (posX: string | number): number | string => {
    if (posX === Position.Center) {
      return '50%';
    }
    if (posX === Position.Left) {
      return '5%';
    }
    if (posX === Position.Right) {
      return '75%';
    }
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
          {children}
        </Box>
      </ModalMUI>
    </>
  );
};

export default Modal;
