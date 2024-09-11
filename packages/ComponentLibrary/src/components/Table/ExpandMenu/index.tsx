import React, { useState } from 'react';
import { Menu, MenuItem, TextField } from '@mui/material';

interface ExpandMenuProps {
  anchorEl: null | HTMLElement;
  onClose: () => void;
  open: boolean;
}

const ExpandMenu: React.FC<ExpandMenuProps> = ({ anchorEl, onClose, open }) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}>
      <MenuItem>
        <TextField
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Enter value"
          variant="outlined"
          size="small"
        />
      </MenuItem>
    </Menu>
  );
};

export default ExpandMenu;
