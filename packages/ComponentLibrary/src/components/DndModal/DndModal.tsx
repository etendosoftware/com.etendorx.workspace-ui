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
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableItem from './SortableItem';
import { Person } from './types';
import ModalDivider from '../ModalDivider';
import { containerStyles, showAllStyles } from './DragModal.styles';

const DragModal: React.FC = () => {
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
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <Modal height={300} width={240}>
      <p>Volver</p>
      <ModalDivider />
      <div style={containerStyles}>
        <p>Botones</p>
        <a href="#" style={showAllStyles}>
          Mostrar Todo
        </a>
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
              <SortableItem key={person.id} id={person.id} person={person} />
            ))}
          </List>
        </SortableContext>
      </DndContext>
    </Modal>
  );
};

export default DragModal;
