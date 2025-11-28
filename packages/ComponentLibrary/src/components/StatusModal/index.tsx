/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { Box, Typography, useTheme } from "@mui/material";
import { useCallback, useMemo } from "react";
import { Modal } from "..";
import { statusConfig } from "./states";
import { useStyle } from "./styles";
import type { StatusModalProps } from "./types";
import CheckIcon from "../../assets/icons/check.svg";

const StatusModal: React.FC<StatusModalProps> = ({
  statusText,
  statusType,
  errorMessage,
  saveLabel,
  secondaryButtonLabel,
  onClose,
  onAfterClose,
  onSave,
  onCancel,
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
      backgroundGradient={backgroundGradient}
      onSave={onSave || handleClose}
      onAfterClose={handleAfterClose}
      onCancel={onCancel || handleClose}
      onClose={handleClose}
      SaveIcon={CheckIcon}
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
