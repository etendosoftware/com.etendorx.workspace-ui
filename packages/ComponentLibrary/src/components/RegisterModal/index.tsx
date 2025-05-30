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
