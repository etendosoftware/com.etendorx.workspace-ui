import { useState } from 'react';
import { Menu, MenuItem, TextField, PopoverOrigin } from '@mui/material';
import { useTranslation } from '../../../../../MainUI/hooks/useTranslation';

interface ExpandMenuProps {
  anchorEl: null | HTMLElement;
  onClose: () => void;
  open: boolean;
}

const bottomRightOrigin: PopoverOrigin = {
  vertical: 'bottom',
  horizontal: 'right',
};

const transformOrigin: PopoverOrigin = {
  vertical: 'top',
  horizontal: 'left',
};

const ExpandMenu = ({ anchorEl, onClose, open }: ExpandMenuProps) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={bottomRightOrigin}
      transformOrigin={transformOrigin}>
      <MenuItem>
        <TextField
          value={inputValue}
          onChange={handleInputChange}
          placeholder={t('table.placeholders.search')}
          variant="outlined"
          size="small"
        />
      </MenuItem>
    </Menu>
  );
};

export default ExpandMenu;
