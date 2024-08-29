import { useState } from 'react';
import { Box, Button, List } from '@mui/material';
import { RegisterModalProps } from './types';
import { theme } from '../../theme';
import { sx, styles } from './styles';
import CloseRecordIcon from '../../assets/icons/close-record.svg';
import CheckIcon from '../../assets/icons/check-circle.svg';
import Modal from '../BasicModal';
import { processMock } from '../../../../storybook/src/stories/Components/RegisterModal/registerMock';
import RadioButtonItem from '../RadioButton';

const RegisterModal: React.FC<RegisterModalProps> = ({
  cancelButtonLabel,
  saveButtonLabel,
  registerText,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  //TODO: Create a Cancel and Save Functions
  const handleCancel = () => {};
  const handleSave = () => {};

  const handleOptionSelect = (id: number) => {
    setSelectedOption(id);
  };

  return (
    <Modal
      tittleHeader="Register"
      descriptionText="Confirm your shipment and save it in the system. 📝📦"
      HeaderIcon={CloseRecordIcon}
      customTrigger={
        <Button
          sx={sx.registerButton}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          startIcon={
            <CloseRecordIcon
              fill={
                isHovering
                  ? theme.palette.baselineColor.neutral[0]
                  : theme.palette.baselineColor.neutral[80]
              }
            />
          }>
          {registerText}
        </Button>
      }>
      <List sx={sx.itemList}>
        {processMock.map(item => (
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
      <Box style={styles.buttonContainerStyles}>
        <Button sx={sx.cancelButton} onClick={handleCancel}>
          {cancelButtonLabel}
        </Button>
        <Button
          startIcon={
            <CheckIcon fill={theme.palette.baselineColor.neutral[0]} />
          }
          sx={sx.saveButton}
          onClick={handleSave}
          disabled={selectedOption !== 3}>
          {saveButtonLabel}
        </Button>
      </Box>
    </Modal>
  );
};

export default RegisterModal;
