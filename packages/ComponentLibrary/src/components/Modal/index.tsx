import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import modalStyles from './modal.styles';

interface ModalCustomProps {
  height?: number;
  width?: number;
  posX?: number;
  posY?: number;
  children: React.ReactNode;
}

const ModalCustom: React.FC<ModalCustomProps> = ({
  height,
  width,
  posX = 'center',
  posY = 'center',
  children,
}) => {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <div>
      <Button onClick={handleOpen}>Open modal</Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Box
          sx={{
            ...modalStyles,
            height: height ?? 'auto',
            width: width ?? 'auto',
            position: 'absolute',
            top: posY === 'center' ? '50%' : posY,
            left: posX === 'center' ? '50%' : posX,
            transform:
              posX === 'center' && posY === 'center'
                ? 'translate(-50%, -50%)'
                : 'none',
          }}>
          {children}
        </Box>
      </Modal>
    </div>
  );
};

export default ModalCustom;
