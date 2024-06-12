import React, { useState } from 'react';
import List from '@mui/material/List';
import Modal from '../Modal';
import { people as initialPeople } from './mock';
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
import { Person } from './DragModal.types';
import ModalDivider from '../ModalDivider';
import { containerStyles, showAllStyles } from './DragModal.styles';
import { DragIndicator } from '@mui/icons-material';

const DragModal: React.FC = () => {
  const [people, setPeople] = useState<Person[]>(initialPeople);

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
      setPeople(items => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        logState(newItems);
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
    <Modal width={240}>
      <p>Volver</p>
      <ModalDivider />
      <div style={containerStyles}>
        <p>Botones</p>
        <button style={showAllStyles} onClick={handleToggleAll}>
          Activar todo
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
