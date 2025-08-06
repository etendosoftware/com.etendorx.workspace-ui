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

import { Box, Button, List, MenuItem, styled, useTheme } from "@mui/material";
import { useCallback, useState } from "react";
import NavigateNext from "../../assets/icons/chevron-right.svg";
import Edit from "../../assets/icons/edit.svg";
import DragModalContent from "../DragModal/DragModalContent";
import IconButton from "../IconButton";
import Menu from "../Menu";
import ModalDivider from "../ModalDivider";
import { useStyle } from "./styles";
import type { WaterfallModalProps } from "./types";

const WaterfallDropdown: React.FC<WaterfallModalProps> = ({
  menuItems,
  items,
  setItems,
  backButtonText,
  activateAllText,
  deactivateAllText,
  buttonText,
  customizeText,
  tooltipWaterfallButton,
  icon,
}) => {
  const FadeWrapper = styled("div")({
    transition: "opacity 0.2s ease-in-out",
    opacity: 1,
    "&.fade-out": {
      opacity: 0,
    },
  });

  const theme = useTheme();
  const { sx, styles } = useStyle();
  const [showDragModal, setShowDragModal] = useState(false);
  const [fade, setFade] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = () => {
    setAnchorEl(null);
    setShowDragModal(false);
  };

  const handleOpenDragModal = () => {
    setFade(true);
    setTimeout(() => {
      setShowDragModal(true);
      setFade(false);
    }, 200);
  };

  const handleBack = () => {
    setFade(true);
    setTimeout(() => {
      setShowDragModal(false);
      setFade(false);
    }, 200);
  };

  return (
    <>
      <IconButton tooltip={tooltipWaterfallButton} onClick={handleClick} className="w-10 h-10" disabled={true}>
        {icon}
      </IconButton>
      <Menu anchorEl={anchorEl} onClose={handleClose}>
        <FadeWrapper className={fade ? "fade-out" : ""}>
          {!showDragModal ? (
            <>
              <List>
                {menuItems.map((item, index) => (
                  <MenuItem
                    key={item.key}
                    sx={{
                      ...sx.menuItemStyles,
                      marginBottom: index !== menuItems.length - 1 ? "0.5rem" : "0",
                    }}>
                    <span style={styles.SpanStyles}>{item.emoji}</span>
                    <span>{item.label}</span>
                  </MenuItem>
                ))}
              </List>
              <ModalDivider />
              <div style={styles.SectionContainer}>
                <Box sx={sx.headerBox}>
                  <Button
                    onClick={handleOpenDragModal}
                    sx={sx.customizeButton}
                    startIcon={<Edit fill={theme.palette.baselineColor.neutral[60]} style={styles.StartIconStyles} />}>
                    {customizeText}
                    <NavigateNext fill={theme.palette.baselineColor.neutral[60]} style={styles.EndIconStyles} />
                  </Button>
                </Box>
              </div>
            </>
          ) : (
            <DragModalContent
              items={items}
              setItems={setItems}
              onBack={handleBack}
              backButtonText={backButtonText}
              activateAllText={activateAllText}
              deactivateAllText={deactivateAllText}
              buttonText={buttonText}
            />
          )}
        </FadeWrapper>
      </Menu>
    </>
  );
};

export default WaterfallDropdown;
