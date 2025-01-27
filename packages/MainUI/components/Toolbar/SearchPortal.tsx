import React, { useCallback } from 'react';
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        onClose();
        if (e.key === 'Escape') {
          onSearchChange('');
        }
      }
    },
    [onClose, onSearchChange],
  );

  const handleBlur = useCallback((): void => {
    onClose();
    onSearchChange('');
  }, [onClose, onSearchChange]);

  if (!isOpen) return null;

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
