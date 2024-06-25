import React, { useState } from 'react';
import { Box, Button, List, MenuItem } from '@mui/material';
import Modal from '../Modal';
import DragModalContent from './DragModalContent';
import { people as initialPeople } from '../DragModal/mock';
import { Person } from '../DragModal/DragModal.types';
import ModalDivider from '../ModalDivider';
import {
  CustomizeButton,
  EndIconStyles,
  FadeWrapper,
  MODAL_WIDTH,
  SectionContainer,
  StartIconStyles,
} from './WaterfallModal.styles';
import { Edit, NavigateNext } from '@mui/icons-material';
import { UniqueIdentifier } from '@dnd-kit/core';
import { MENU_ITEMS } from '../Modal/mock';
import { theme } from '../../theme';

const WaterfallModal: React.FC = () => {
  const [showDragModal, setShowDragModal] = useState(false);
  const [fade, setFade] = useState(false);
  const [people, setPeople] = useState<Person[]>(initialPeople);

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
    <Modal width={MODAL_WIDTH}>
      {!showDragModal ? (
        <FadeWrapper className={fade ? 'fade-out' : ''}>
          <List>
            {MENU_ITEMS.map((item, index) => (
              <MenuItem
                key={item.key}
                sx={{
                  margin: '0 0.5rem',
                  padding: '0.5rem',
                  marginBottom:
                    index !== MENU_ITEMS.length - 1 ? '0.5rem' : '0',
                  '&:hover': {
                    background: '',
                    borderRadius: '0.5rem',
                    color: theme.palette.baselineColor.neutral[80],
                  },
                }}>
                <span style={{ paddingRight: '0.5rem' }}>{item.emoji}</span>
                <span>{item.label}</span>
              </MenuItem>
            ))}
          </List>
          <ModalDivider />
          <div style={SectionContainer}>
            <Box
              sx={{
                '&:hover': { background: theme.palette.dynamicColor.contrastText, borderRadius: '0.5rem' },
              }}>
              <Button
                onClick={handleOpenDragModal}
                style={CustomizeButton}
                sx={{
                  '&:hover': {
                    color: theme.palette.baselineColor.neutral[80],
                    border: 'none',
                  },
                }}
                startIcon={<Edit style={StartIconStyles} />}>
                Customize
                <NavigateNext style={EndIconStyles} />
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
          />
        </FadeWrapper>
      )}
    </Modal>
  );
};

export default WaterfallModal;
