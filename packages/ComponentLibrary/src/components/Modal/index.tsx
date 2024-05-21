import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import styles from './styles';
import { useState } from 'react';
import { Container, Position } from '../enums';
import { calculateTransform } from '../../utils/transformUtil';

interface ModalCustomProps {
  height?: string | number;
  width?: string | number;
  posX?: string | number;
  posY?: string | number;
  children: React.ReactNode;
}

const ModalMUI: React.FC<ModalCustomProps> = ({
  height = Container.Auto,
  width = Container.Auto,
  posX = Position.Center,
  posY = Position.Center,
  children,
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
      <Button onClick={handleOpen} variant="contained">
        Modal
      </Button>
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
