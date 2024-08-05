import React, { useState } from 'react';
import Modal from '../Modal';
import DragModalContent from './DragModalContent';
import { DragModalProps, Person } from './DragModal.types';
import ModalDivider from '../ModalDivider';
import { MODAL_WIDTH } from './DragModal.styles';

const DragModal: React.FC<DragModalProps> = ({
  initialPeople = [],
  onClose,
  activateAllText,
  deactivateAllText,
  buttonText,
  backButtonText,
}) => {
  const [people, setPeople] = useState<Person[]>(initialPeople);

  return (
    <Modal width={MODAL_WIDTH}>
      <ModalDivider />
      <DragModalContent
        people={people}
        setPeople={setPeople}
        onBack={onClose}
        activateAllText={activateAllText}
        deactivateAllText={deactivateAllText}
        buttonText={buttonText}
        backButtonText={backButtonText}
      />
    </Modal>
  );
};

export default DragModal;
