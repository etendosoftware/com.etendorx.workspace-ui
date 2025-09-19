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

"use client";
import { Modal, Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { AboutModalProps } from "./types";

const AboutModal: React.FC<AboutModalProps> = ({ aboutUrl, title, isOpen, onClose }) => {
  const modalStyle = {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "80vw",
    height: "80vh",
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 2,
    borderRadius: 2,
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="about-modal-title"
      aria-describedby="about-modal-description">
      <Box sx={modalStyle}>
        <div className="flex justify-between items-center mb-4">
          <Typography id="about-modal-title" variant="h6" component="h2">
            {title}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}>
            <CloseIcon />
          </IconButton>
        </div>
        <Box sx={{ width: "100%", height: "calc(100% - 60px)" }}>
          <iframe
            src={aboutUrl}
            width="100%"
            height="100%"
            style={{ border: "none", borderRadius: "4px" }}
            title="About Etendo"
          />
        </Box>
      </Box>
    </Modal>
  );
};

export default AboutModal;
