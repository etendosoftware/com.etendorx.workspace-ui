import React from 'react';
import { Box, Portal, Theme } from '@mui/material';
import TextInputAutocomplete from '@workspaceui/componentlibrary/src/components/Input/TextInput/TextInputAutocomplete';
import { useStyle } from './styles';

interface Position {
  top: string;
  right: string;
}

interface SearchPortalProps {
  isOpen: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onClose: () => void;
  placeholder?: string;
  position?: Position;
  width?: string;
  autoCompleteTexts?: string[];
  theme?: Theme;
}

const SearchPortal: React.FC<SearchPortalProps> = ({
  isOpen,
  searchValue,
  onSearchChange,
  onClose,
  placeholder,
  autoCompleteTexts = [],
}) => {
  const { styles } = useStyle();

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      onClose();
      if (e.key === 'Escape') {
        onSearchChange('');
      }
    }
  };

  const handleBlur = (): void => {
    onClose();
    onSearchChange('');
  };

  return (
    <Portal>
      <Box sx={styles.portal}>
        <TextInputAutocomplete
          value={searchValue}
          setValue={onSearchChange}
          placeholder={placeholder}
          autoCompleteTexts={autoCompleteTexts}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
      </Box>
    </Portal>
  );
};

export default SearchPortal;
