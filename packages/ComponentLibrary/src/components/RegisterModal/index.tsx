import { useState } from 'react';
import { Button, List } from '@mui/material';
import { RegisterModalProps } from './types';
import { theme } from '../../theme';
import { sx } from './styles';
import CloseRecordIcon from '../../assets/icons/close-record.svg';
import Modal from '../BasicModal';
import { processMock } from '../../../../storybook/src/stories/Components/RegisterModal/registerMock';
import RadioButtonItem from '../RadioButton';
import CheckIcon from '../../assets/icons/check-circle.svg';
import { useTranslation } from '../../../../MainUI/src/hooks/useTranslation';

const RegisterModal: React.FC<RegisterModalProps> = ({ registerText }) => {
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  const handleOptionSelect = (id: number) => {
    setSelectedOption(id);
  };

  return (
    <Modal
      tittleHeader={t('common.register')}
      descriptionText={t('registerModal.descriptionText')}
      saveButtonLabel={t('common.save')}
      secondaryButtonLabel={t('common.cancel')}
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
