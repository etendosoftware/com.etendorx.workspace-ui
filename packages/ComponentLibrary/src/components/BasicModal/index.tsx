'use client';

import React, { useState } from 'react';
import { Typography, Button, Box } from '@mui/material';
import ModalMUI from '@mui/material/Modal';
import IconButton from '../IconButton';
import { Container, Position } from '../enums';
import { ModalIProps } from './types';
import { IconSize, styles, sx } from './styles';
import { theme } from '../../theme';
import CloseIcon from '../../../public/icons/x.svg';
import MaximizeIcon from '../../../public/icons/maximize-2.svg';
import MinimizeIcon from '../../../public/icons/minimize-2.svg';
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
  secondaryButtonLabel,
  saveButtonLabel,
  showHeader,
  buttons,
  SaveIcon,
  backgroundGradient,
  isFullScreenEnabled = false,
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  const handleOpen = () => setOpen(true);

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
    setOpen(false);
    setIsFullScreen(false);
  };

  const gradientStyles = !backgroundGradient
    ? {}
    : {
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-2px',
          left: '-2px',
          right: '-2px',
          height: '50%',
          background: backgroundGradient,
          borderTopLeftRadius: '1rem',
          borderTopRightRadius: '1rem',
          zIndex: 0,
        },
      };

  const toggleFullScreen = () => {
    setIsFullScreen(prev => !prev);
  };

  const modalStyles = isFullScreen ? sx.fullScreenStyles : calculateModalStyles({ height, width, posX, posY });

  const contentStyles = isFullScreen
    ? {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        overflowY: 'auto',
      }
    : {};

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
      <ModalMUI open={open} onClose={handleClose}>
        <Box
          sx={{
            ...styles.boxStyles,
            ...modalStyles,
            ...gradientStyles,
          }}>
          <Box sx={sx.modalContainer}>
            {showHeader && (
              <Box sx={sx.headerContainer}>
                <Box sx={sx.titleContainer}>
                  {HeaderIcon && (
                    <Box sx={sx.closeRecordButton}>
                      <HeaderIcon
                        fill={theme.palette.baselineColor.etendoPrimary.main}
                        width={IconSize}
                        height={IconSize}
                      />
                    </Box>
                  )}
                  <Typography sx={sx.registerText}>{tittleHeader}</Typography>
                </Box>
              </Box>
            )}
            {descriptionText && <Typography sx={sx.descriptionText}>{descriptionText}</Typography>}
            <Box sx={sx.actionButtons}>
              {isFullScreenEnabled && (
                <IconButton
                  aria-label="fullscreen"
                  size="small"
                  hoverFill={theme.palette.baselineColor.neutral[80]}
                  width={IconSize}
                  height={IconSize}
                  onClick={toggleFullScreen}
                  sx={sx.actionButton}>
                  {isFullScreen ? <MinimizeIcon /> : <MaximizeIcon />}
                </IconButton>
              )}
              <IconButton
                aria-label="close"
                size="small"
                hoverFill={theme.palette.baselineColor.neutral[80]}
                width={IconSize}
                height={IconSize}
                onClick={handleClose}
                sx={sx.actionButton}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Box sx={contentStyles}>{children}</Box>
            {buttons ? (
              <Box style={styles.buttonContainerStyles}>{buttons}</Box>
            ) : (
              secondaryButtonLabel &&
              saveButtonLabel &&
              SaveIcon && (
                <Box style={styles.buttonContainerStyles}>
                  <Button sx={sx.cancelButton}>{secondaryButtonLabel}</Button>
                  <Button
                    startIcon={
                      <SaveIcon fill={theme.palette.baselineColor.neutral[0]} width={IconSize} height={IconSize} />
                    }
                    sx={sx.saveButton}>
                    {saveButtonLabel}
                  </Button>
                </Box>
              )
            )}
          </Box>
        </Box>
      </ModalMUI>
    </>
  );
};

export default Modal;
