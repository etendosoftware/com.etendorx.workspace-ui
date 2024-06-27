import React from 'react';
import List from '@mui/material/List';
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableItem from '../DragModal/SortableItem';
import { Person } from '../DragModal/DragModal.types';
import ModalDivider from '../ModalDivider';
import { DragIndicator, NavigateBefore } from '@mui/icons-material';
import { styles, sx } from './WaterfallModal.styles';
import { Box, Button } from '@mui/material';
import { WaterfallModalProps } from './WaterfallModal.types';

const DragModalContent: React.FC<WaterfallModalProps> = ({
  people,
  onBack,
  setPeople,
  backButtonText,
  activateAllText,
  deactivateAllText,
  buttonText,
}) => {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } }),
  );

  const logState = (updatedPeople: Person[]) => {
    updatedPeople.forEach(person => {
      console.log(`${person.id}: ${person.label} = ${person.isActive}`);
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = people.findIndex(item => item.id === active.id);
      const newIndex = people.findIndex(item => item.id === over.id);
      const newPeople = arrayMove(people, oldIndex, newIndex);
      setPeople(newPeople);
      logState(newPeople);
    }
  };

  const handleToggleAll = () => {
    const allActivated = people.every(person => person.isActive);
    const newPeople = people.map(person => ({
      ...person,
      isActive: !allActivated,
    }));
    setPeople(newPeople);
    logState(newPeople);
  };

  const handleToggle = (id: UniqueIdentifier) => {
    const newPeople = people.map(person =>
      person.id === id ? { ...person, isActive: !person.isActive } : person,
    );
    setPeople(newPeople);
    logState(newPeople);
  };

  return (
    <>
      <div style={styles.SectionContainer}>
        <Box sx={sx.headerBox}>
          <Button
            onClick={onBack}
            startIcon={<NavigateBefore style={styles.StartIconStyles} />}
            style={styles.CustomizeButton}
            sx={sx.customizeButton}>
            {backButtonText}
          </Button>
        </Box>
      </div>
      <ModalDivider />
      <div style={styles.containerStyles}>
        <p>{buttonText}</p>
        <button style={styles.showAllStyles} onClick={handleToggleAll}>
          {people.every(person => person.isActive)
            ? deactivateAllText
            : activateAllText}
        </button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}>
        <SortableContext
          items={people.map(person => person.id)}
          strategy={verticalListSortingStrategy}>
          <List>
            {people.map(person => (
              <SortableItem
                key={person.id}
                id={person.id}
                person={person}
                icon={<DragIndicator />}
                onToggle={() => handleToggle(person.id)}
                isActive={false}
              />
            ))}
          </List>
        </SortableContext>
      </DndContext>
    </>
  );
};

export default DragModalContent;
