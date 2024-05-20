import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import styles from './styles';
import { useState } from 'react';

interface ModalCustomProps {
  height?: string | number;
  width?: string | number;
  posX?: string | number;
  posY?: string | number;
  children: React.ReactNode;
}

const ModalMUI: React.FC<ModalCustomProps> = ({
  height = 'auto',
  width = 'auto',
  posX = 'center',
  posY = 'center',
  children,
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const calculateTop = (posY: string | number): string => {
    if (typeof posY === 'number') {
      return posY + '%';
    }
    if (posY === 'center') {
      return '50%';
    }
    return posY;
  };

  const calculateLeft = (posX: string | number): string => {
    if (typeof posX === 'number') {
      return posX + '%';
    }
    if (posX === 'center') {
      return '50%';
    }
    return posX;
  };

  const calculateTransform = (
    posX: string | number,
    posY: string | number,
  ): string => {
    return posX === 'center' && posY === 'center'
      ? 'translate(-50%, -50%)'
      : 'none';
  };

  return (
    <>
      <Button onClick={handleOpen}>Modal</Button>
      <Modal open={open} onClose={handleClose} style={styles.modalStyles}>
        <Box
          sx={{
            ...styles.boxStyles,
            height: height,
            width: width,
            top: calculateTop(posY),
            left: calculateLeft(posX),
            transform: calculateTransform(posX, posY),
          }}>
          {children}
        </Box>
      </Modal>
    </>
  );
};

export default ModalMUI;
