import { useState } from 'react';
import { Button, List } from '@mui/material';
import { RegisterModalProps } from './types';
import { theme } from '../../theme';
import { cancelLabel, confirmLabel, sx } from './styles';
import CloseRecordIcon from '../../assets/icons/close-record.svg';
import Modal from '../BasicModal';
import { processMock } from '../../../../storybook/src/stories/Components/RegisterModal/registerMock';
import RadioButtonItem from '../RadioButton';

const RegisterModal: React.FC<RegisterModalProps> = ({ registerText }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  const handleOptionSelect = (id: number) => {
    setSelectedOption(id);
  };

  return (
    <Modal
      tittleHeader="Register"
      descriptionText="Confirm your shipment and save it in the system. 📝📦"
      saveButtonLabel={confirmLabel}
      secondaryButtonLabel={cancelLabel}
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
    </Modal>
  );
};

export default RegisterModal;
