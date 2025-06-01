import React, { useCallback, useState, useRef, useEffect, forwardRef, useMemo } from "react";
import { Typography, Button, Box, useTheme } from "@mui/material";
import ModalMUI from "@mui/material/Modal";
import IconButton from "../IconButton";
import { Container, Position } from "../enums";
import type { ModalIProps } from "./types";
import { IconSize, useStyles } from "./styles";
import CloseIcon from "../../assets/icons/x.svg";
import MaximizeIcon from "../../assets/icons/maximize-2.svg";
import MinimizeIcon from "../../assets/icons/minimize-2.svg";
import { calculateModalStyles } from "../../helpers/updateModal";

const Modal = forwardRef<HTMLDivElement, ModalIProps>(
  (
    {
      height = Container.Auto,
      width = Container.Auto,
      posX = Position.Center,
      posY = Position.Center,
      children,
      customTrigger,
      onClose,
      onSave,
      onCancel,
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
      open: externalOpen,
    },
    ref,
  ) => {
    const [internalOpen, setInternalOpen] = useState<boolean>(false);
    const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
    const theme = useTheme();
    const { styles, sx } = useStyles();
    const prevOpenRef = useRef(externalOpen);

    const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;

    useEffect(() => {
      if (externalOpen !== undefined && prevOpenRef.current !== externalOpen) {
        setInternalOpen(externalOpen);
        prevOpenRef.current = externalOpen;
      }
    }, [externalOpen]);

    const handleOpen = useCallback(() => {
      setInternalOpen(true);
    }, []);

    const handleClose = useCallback(() => {
      if (typeof onClose === "function") {
        onClose();
      }

      if (externalOpen === undefined) {
        setInternalOpen(false);
      }
      setIsFullScreen(false);
    }, [onClose, externalOpen]);

    const handleSave = useCallback(() => {
      if (typeof onSave === "function") {
        onSave();
      }
      if (externalOpen === undefined) {
        setInternalOpen(false);
      }
    }, [onSave, externalOpen]);

    const handleCancel = useCallback(() => {
      if (typeof onCancel === "function") {
        onCancel();
      }
      if (externalOpen === undefined) {
        setInternalOpen(false);
      }
    }, [onCancel, externalOpen]);

    const gradientStyles = useMemo(
      () =>
        !backgroundGradient
          ? {}
          : {
              "&::before": {
                content: '""',
                position: "absolute",
                top: "-2px",
                left: "-2px",
                right: "-2px",
                height: "50%",
                background: backgroundGradient,
                borderTopLeftRadius: "1rem",
                borderTopRightRadius: "1rem",
                zIndex: 0,
              },
            },
      [backgroundGradient],
    );

    const toggleFullScreen = useCallback(() => {
      setIsFullScreen((prev) => !prev);
    }, []);

    const modalStyles = useMemo(
      () => (isFullScreen ? sx.fullScreenStyles : calculateModalStyles({ height, width, posX, posY })),
      [isFullScreen, sx.fullScreenStyles, height, width, posX, posY],
    );

    const contentStyles = useMemo(
      () =>
        isFullScreen
          ? {
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              overflowY: "auto",
            }
          : {},
      [isFullScreen],
    );

    const renderTrigger = useCallback(() => {
      if (externalOpen !== undefined) {
        return null;
      }

      if (customTrigger) {
        return React.cloneElement(customTrigger as React.ReactElement, {
          onClick: handleOpen,
        });
      }

      return (
        <Button onClick={handleOpen} variant="contained">
          Modal
        </Button>
      );
    }, [customTrigger, externalOpen, handleOpen]);

    if (!isOpen) {
      return renderTrigger();
    }

    return (
      <>
        {renderTrigger()}
        <ModalMUI open={isOpen} onClose={handleClose} keepMounted={false} closeAfterTransition>
          <Box
            ref={ref}
            sx={{
              ...styles.boxStyles,
              ...modalStyles,
              ...gradientStyles,
            }}>
            <Box className={'bg-red-100'} sx={sx.modalContainer}>
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
                  <IconButton aria-label="fullscreen" className="w-4 h-4" onClick={toggleFullScreen}>
                    {isFullScreen ? <MinimizeIcon /> : <MaximizeIcon />}
                  </IconButton>
                )}
                <IconButton aria-label="close" className="w-4 h-6" onClick={handleClose}>
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
                    <Button sx={sx.cancelButton} onClick={handleCancel}>
                      {secondaryButtonLabel}
                    </Button>
                    <Button
                      startIcon={
                        <SaveIcon fill={theme.palette.baselineColor.neutral[0]} width={IconSize} height={IconSize} />
                      }
                      sx={sx.saveButton}
                      onClick={handleSave}>
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
  },
);

Modal.displayName = "Modal";

export default Modal;
