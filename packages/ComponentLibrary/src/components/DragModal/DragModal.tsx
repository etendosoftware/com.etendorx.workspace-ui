/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

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
  const [items, setItems] = useState<Item[]>(initialItems);

  return (
    <Modal width={MODAL_WIDTH} HeaderIcon={CloseRecordIcon}>
      <ModalDivider />
      <DragModalContent
        items={items}
        setItems={setItems}
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
