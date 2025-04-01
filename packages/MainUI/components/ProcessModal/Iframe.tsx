import { useState, useEffect, FC } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface ProcessIframeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
}

const ProcessIframeModal: FC<ProcessIframeModalProps> = ({ isOpen, onClose, url, title }) => {
  const [iframeLoading, setIframeLoading] = useState(true);

  const handleIframeLoad = () => {
    setIframeLoading(false);
  };

  useEffect(() => {
    if (url) {
      setIframeLoading(true);
    }
  }, [url]);

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '0.5rem',
          overflow: 'hidden',
          maxHeight: '90vh',
          height: '90vh',
        },
      }}>
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb',
        }}>
        <span>{title || 'Proceso de Etendo'}</span>
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          padding: '0.5rem',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(90vh - 130px)',
        }}>
        {iframeLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              zIndex: 1,
            }}>
            Cargando...
          </Box>
        )}

        <iframe
          src={url}
          onLoad={handleIframeLoad}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            flexGrow: 1,
          }}
          title="Proceso de Etendo"
        />
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: '1px solid #e5e7eb',
          padding: '1rem',
          justifyContent: 'flex-end',
        }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProcessIframeModal;
