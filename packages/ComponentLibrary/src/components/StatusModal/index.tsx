import { Box, Typography, useTheme } from "@mui/material";
import { useCallback, useMemo } from "react";
import { Modal } from "..";
import SaveIcon from "../../assets/icons/save.svg";
import { statusConfig } from "./states";
import { useStyle } from "./styles";
import type { StatusModalProps } from "./types";

const StatusModal: React.FC<StatusModalProps> = ({
  statusText,
  statusType,
  errorMessage,
  saveLabel,
  secondaryButtonLabel,
  onClose,
  onAfterClose,
  isDeleteSuccess,
  open = true,
}) => {
  const { gradientColor, iconBackgroundColor, icon: StatusIcon } = statusConfig[statusType];
  const theme = useTheme();
  const { sx } = useStyle();

  const backgroundGradient = useMemo(
    () => `linear-gradient(to bottom, ${gradientColor}, rgba(255, 255, 255, 0))`,
    [gradientColor]
  );
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  const handleAfterClose = useCallback(() => {
    if (onAfterClose) {
      onAfterClose();
    }
  }, [onAfterClose]);

  const secondaryLabel = isDeleteSuccess ? "" : secondaryButtonLabel;

  return (
    <Modal
      open={open}
      showHeader={false}
      saveButtonLabel={!isDeleteSuccess ? saveLabel : undefined}
      secondaryButtonLabel={secondaryLabel}
      SaveIcon={!isDeleteSuccess ? SaveIcon : undefined}
      backgroundGradient={backgroundGradient}
      onSave={handleClose}
      onAfterClose={handleAfterClose}
      onCancel={handleClose}
      onClose={handleClose}
      buttons={isDeleteSuccess ? null : undefined}>
      <Box sx={sx.statusModalContainer}>
        <Box
          sx={{
            ...sx.statusIcon,
            background: iconBackgroundColor,
          }}>
          <StatusIcon fill={theme.palette.baselineColor.neutral[0]} />
        </Box>
        {statusType === "error" && errorMessage && <Typography sx={sx.errorMessage}>{errorMessage}</Typography>}
        <Typography sx={sx.statusText}>{statusText}</Typography>
      </Box>
    </Modal>
  );
};

export default StatusModal;
