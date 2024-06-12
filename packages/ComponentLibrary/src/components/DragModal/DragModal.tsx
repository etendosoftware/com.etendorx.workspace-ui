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
<<<<<<< Updated upstream
=======
  UniqueIdentifier,
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======
import { DragIndicator } from '@mui/icons-material';
>>>>>>> Stashed changes

const DragModal: React.FC = () => {
  const [people, setPeople] = useState<Person[]>(initialPeople);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } }),
  );

<<<<<<< Updated upstream
=======
  const logState = (updatedPeople: Person[]) => {
    updatedPeople.forEach(person => {
      console.log(`${person.id}: ${person.label} = ${person.isActive}`);
    });
  };

>>>>>>> Stashed changes
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPeople(items => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
<<<<<<< Updated upstream
        return arrayMove(items, oldIndex, newIndex);
=======
        const newItems = arrayMove(items, oldIndex, newIndex);
        logState(newItems);
        return newItems;
>>>>>>> Stashed changes
      });
    }
  };

<<<<<<< Updated upstream
  return (
    <Modal height={300} width={240}>
=======
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
>>>>>>> Stashed changes
      <p>Volver</p>
      <ModalDivider />
      <div style={containerStyles}>
        <p>Botones</p>
<<<<<<< Updated upstream
        <a href="#" style={showAllStyles}>
          Mostrar Todo
        </a>
=======
        <button style={showAllStyles} onClick={handleToggleAll}>
          Activar todo
        </button>
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
              <SortableItem key={person.id} id={person.id} person={person} />
=======
              <SortableItem
                key={person.id}
                id={person.id}
                person={person}
                icon={<DragIndicator />}
                onToggle={() => handleToggle(person.id)}
                isActive={false}
              />
>>>>>>> Stashed changes
            ))}
          </List>
        </SortableContext>
      </DndContext>
    </Modal>
  );
};

export default DragModal;
