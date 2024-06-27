import React, { useState } from 'react';
import List from '@mui/material/List';
import Modal from '../Modal';
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
import SortableItem from './SortableItem';
import { DragModalProps, Person } from './DragModal.types';
import ModalDivider from '../ModalDivider';
import { MODAL_WIDTH, styles } from './DragModal.styles';
import { DragIndicator, NavigateBefore } from '@mui/icons-material';
import { Button } from '..';
import { sx } from '../Waterfall/WaterfallModal.styles';

const DragModal: React.FC<DragModalProps> = ({
  initialPeople = [],
  onBack,
  backButtonText = 'Volver',
  activateAllText = 'Activar Todo',
  deactivateAllText = 'Desactivar Todo',
}) => {
  const [people, setPeople] = useState<Person[]>(initialPeople);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPeople(items => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems;
      });
    }
  };

  const handleToggleAll = () => {
    const allActivated = people.every(person => person.isActive);
    const newPeople = people.map(person => ({
      ...person,
      isActive: !allActivated,
    }));
    setPeople(newPeople);
  };

  const handleToggle = (id: UniqueIdentifier) => {
    const newPeople = people.map(person =>
      person.id === id ? { ...person, isActive: !person.isActive } : person,
    );
    setPeople(newPeople);
  };

  return (
    <Modal width={MODAL_WIDTH}>
      <Button
        onClick={onBack}
        startIcon={<NavigateBefore style={styles.StartIconStyles} />}
        style={styles.CustomizeButton}
        sx={sx.customizeButton}>
        {backButtonText}
      </Button>
      <ModalDivider />
      <div style={styles.containerStyles}>
        <p>Botones</p>
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
    </Modal>
  );
};

export default DragModal;
