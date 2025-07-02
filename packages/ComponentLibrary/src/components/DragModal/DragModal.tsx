import type React from "react";
import { useState } from "react";
import Modal from "../BasicModal";
import DragModalContent from "./DragModalContent";
import type { DragModalProps, Person } from "./DragModal.types";
import ModalDivider from "../ModalDivider";
import { MODAL_WIDTH } from "./styles";
import CloseRecordIcon from "../../assets/icons/close-record.svg";

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
    <Modal width={MODAL_WIDTH} HeaderIcon={CloseRecordIcon}>
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
