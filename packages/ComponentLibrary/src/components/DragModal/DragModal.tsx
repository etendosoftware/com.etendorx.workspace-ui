import type React from "react";
import { useState } from "react";
import Modal from "../BasicModal";
import DragModalContent from "./DragModalContent";
import type { DragModalProps, Item } from "./DragModal.types";
import ModalDivider from "../ModalDivider";
import { MODAL_WIDTH } from "./styles";
import CloseRecordIcon from "../../assets/icons/close-record.svg";

const DragModal: React.FC<DragModalProps> = ({
  initialItems = [],
  onClose,
  activateAllText,
  deactivateAllText,
  buttonText,
  backButtonText,
}) => {
  const [people, setPeople] = useState<Item[]>(initialItems);

  return (
    <Modal width={MODAL_WIDTH} HeaderIcon={CloseRecordIcon}>
      <ModalDivider />
      <DragModalContent
        items={people}
        setItems={setPeople}
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
