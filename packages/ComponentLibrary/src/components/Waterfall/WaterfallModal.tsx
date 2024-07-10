import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  List,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import DragModalContent from './DragModalContent';
import { Person } from '../DragModal/DragModal.types';
import ModalDivider from '../ModalDivider';
import { FadeWrapper, menuSyle, styles, sx } from './WaterfallModal.styles';
import { Edit, NavigateNext, Add } from '@mui/icons-material';
import { UniqueIdentifier } from '@dnd-kit/core';
import { WaterfallModalProps } from './WaterfallModal.types';

const WaterfallDropdown: React.FC<WaterfallModalProps> = ({
  menuItems,
  initialPeople,
  backButtonText,
  activateAllText,
  deactivateAllText,
  buttonText,
  customizeText,
  tooltipWaterfallButton,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showDragModal, setShowDragModal] = useState(false);
  const [fade, setFade] = useState(false);
  const [people, setPeople] = useState<Person[]>(initialPeople);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

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

  const handleToggleAll = () => {
    const allActivated = people.every(person => person.isActive);
    setPeople(prev =>
      prev.map(person => ({ ...person, isActive: !allActivated })),
    );
  };

  const handleToggle = (id: UniqueIdentifier) => {
    setPeople(prev =>
      prev.map(person =>
        person.id === id ? { ...person, isActive: !person.isActive } : person,
      ),
    );
  };

  return (
    <>
      <Tooltip title={tooltipWaterfallButton} arrow>
        <IconButton
          onClick={handleClick}
          style={styles.iconButtonStyles}
          sx={sx.hoverStyles}>
          <Add sx={sx.iconStyles} />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        MenuListProps={{ sx: menuSyle }}
        slotProps={{
          paper: { sx: styles.paperStyleMenu },
        }}>
        {!showDragModal ? (
          <FadeWrapper className={fade ? 'fade-out' : ''}>
            <List>
              {menuItems.map((item, index) => (
                <MenuItem
                  key={item.key}
                  sx={{
                    ...sx.menuItemStyles,
                    marginBottom:
                      index !== menuItems.length - 1 ? '0.5rem' : '0',
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
                  style={styles.CustomizeButton}
                  sx={sx.customizeButton}
                  startIcon={<Edit style={styles.StartIconStyles} />}>
                  {customizeText}
                  <NavigateNext style={styles.EndIconStyles} />
                </Button>
              </Box>
            </div>
          </FadeWrapper>
        ) : (
          <FadeWrapper className={fade ? 'fade-out' : ''}>
            <DragModalContent
              people={people}
              onBack={handleBack}
              onToggleAll={handleToggleAll}
              onToggle={handleToggle}
              setPeople={setPeople}
              menuItems={[]}
              initialPeople={[]}
              backButtonText={backButtonText}
              activateAllText={activateAllText}
              deactivateAllText={deactivateAllText}
              buttonText={buttonText}
            />
          </FadeWrapper>
        )}
      </Menu>
    </>
  );
};

export default WaterfallDropdown;
