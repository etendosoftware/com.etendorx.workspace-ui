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

import { useState } from "react";
import { Button, List, useTheme } from "@mui/material";
import type { RegisterModalProps } from "./types";
import { useStyle } from "./styles";
import CloseRecordIcon from "../../assets/icons/close-record.svg";
import Modal from "../BasicModal";
import { processMock } from "@workspaceui/storybook/src/stories/Components/RegisterModal/registerMock";
import RadioButtonItem from "../RadioButton";
import CheckIcon from "../../assets/icons/check-circle.svg";

const RegisterModal: React.FC<RegisterModalProps> = ({ registerText, translations }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const theme = useTheme();
  const { sx } = useStyle();
  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  const handleOptionSelect = (id: number) => {
    setSelectedOption(id);
  };

  return (
    <Modal
      tittleHeader={translations.register}
      descriptionText={translations.descriptionText}
      saveButtonLabel={translations.save}
      secondaryButtonLabel={translations.cancel}
      SaveIcon={CheckIcon}
      HeaderIcon={CloseRecordIcon}
      showHeader
      isFullScreenEnabled
      customTrigger={
        <Button
          sx={sx.registerButton}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          startIcon={
            <CloseRecordIcon
              fill={isHovering ? theme.palette.baselineColor.neutral[0] : theme.palette.baselineColor.neutral[80]}
            />
          }>
          {registerText}
        </Button>
      }>
      <List sx={sx.itemList}>
        {processMock.map((item) => (
          <RadioButtonItem
            key={item.id}
            id={item.id}
            title={item.title}
            description={item.description}
            isSelected={selectedOption === item.id}
            onSelect={handleOptionSelect}
          />
        ))}
      </List>
    </Modal>
  );
};

export default RegisterModal;
