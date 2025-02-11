import { useCallback, useEffect, useRef } from 'react';
import { Box, Portal } from '@mui/material';
import TextInputAutocomplete from '@workspaceui/componentlibrary/src/components/Input/TextInput/TextInputAutocomplete';
import { useStyle } from './styles';
import { SearchPortalProps } from './types';

const SearchPortal: React.FC<SearchPortalProps> = ({
  isOpen,
  searchValue,
  onSearchChange,
  onClose,
  placeholder,
  autoCompleteTexts = [],
}) => {
  const { styles } = useStyle();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus();
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        onClose();
        onSearchChange('');
      } else if (e.key === 'Enter') {
        onClose();
      }
    },
    [onClose, onSearchChange],
  );

  const handleBlur = useCallback((): void => {
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <Portal>
      <Box sx={styles.portal}>
        <TextInputAutocomplete
          ref={inputRef}
          value={searchValue}
          setValue={onSearchChange}
          placeholder={placeholder}
          autoCompleteTexts={autoCompleteTexts}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          autoFocus
        />
      </Box>
    </Portal>
  );
};

export default SearchPortal;
