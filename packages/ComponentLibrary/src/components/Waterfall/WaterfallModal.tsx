"use client";

import { Box, Button, List, MenuItem, styled, useTheme } from "@mui/material";
import { useCallback, useState } from "react";
import NavigateNext from "../../assets/icons/chevron-right.svg";
import Edit from "../../assets/icons/edit.svg";
import type { Person } from "../DragModal/DragModal.types";
import DragModalContent from "../DragModal/DragModalContent";
import IconButton from "../IconButton";
import Menu from "../Menu";
import ModalDivider from "../ModalDivider";
import { useStyle } from "./styles";
import type { WaterfallModalProps } from "./types";

const WaterfallDropdown: React.FC<WaterfallModalProps> = ({
  menuItems,
  initialPeople,
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
  const [people, setPeople] = useState<Person[]>(initialPeople);
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
              people={people}
              setPeople={setPeople}
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
