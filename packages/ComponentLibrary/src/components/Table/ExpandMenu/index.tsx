import { RefObject, useState } from 'react';
import { MenuItem, TextField } from '@mui/material';
import Menu from '../../Menu';

interface ExpandMenuProps {
  anchorRef: RefObject<HTMLElement> | null;
  onClose: () => void;
  open: boolean;
  placeholderTranslation: string;
}

const ExpandMenu = ({ anchorRef, onClose, open, placeholderTranslation }: ExpandMenuProps) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  return (
    <Menu anchorRef={anchorRef} open={open} onClose={onClose}>
      <MenuItem>
        <TextField
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholderTranslation}
          variant="outlined"
          size="small"
        />
      </MenuItem>
    </Menu>
  );
};

export default ExpandMenu;
