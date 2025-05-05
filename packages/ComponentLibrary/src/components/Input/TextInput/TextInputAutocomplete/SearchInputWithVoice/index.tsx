'use client';

import { memo, useCallback, useState } from 'react';
import { InputAdornment, Box, useTheme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterIcon from '@mui/icons-material/FilterList';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import { TextInputProps } from '../TextInputComplete.types';
import TextInputAutoComplete from '../TextInputAutocomplete';
import IconButton from '../../../../IconButton';

export interface SearchInputWithVoiceProps extends TextInputProps {
  onVoiceClick?: () => void;
  disabled?: boolean;
}

const StartAdornment = () => {
  const theme = useTheme();

  return (
    <InputAdornment position="start">
      <SearchIcon sx={{ color: theme.palette.baselineColor.neutral[70] }} />
    </InputAdornment>
  );
};

const EndAdornment = () => {
  const theme = useTheme();

  return (
    <InputAdornment position="end">
      <IconButton size="small">
        <FilterIcon sx={{ color: theme.palette.baselineColor.neutral[70] }} />
      </IconButton>
    </InputAdornment>
  );
};

const SearchInputWithVoice = ({ onVoiceClick, disabled = false, ...props }: SearchInputWithVoiceProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const theme = useTheme();

  const handleVoiceClick = useCallback(() => {
    if (disabled) return;
    setIsRecording(!isRecording);
    onVoiceClick?.();
  }, [isRecording, onVoiceClick, disabled]);

  const wrapperStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    cursor: disabled ? 'not-allowed' : 'default',
    pointerEvents: disabled ? 'none' : 'auto',
    position: 'relative',
  };

  const overlayStyle = disabled
    ? {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
        cursor: 'not-allowed',
        zIndex: 10,
        pointerEvents: 'auto' as const,
      }
    : {};

  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={wrapperStyle}>
        <TextInputAutoComplete
          {...props}
          InputProps={{
            ...props.InputProps,
            startAdornment: <StartAdornment />,
            endAdornment: <EndAdornment />,
            style: { height: '2.5rem' },
          }}
          disabled={disabled}
        />
        <Box>
          <IconButton onClick={handleVoiceClick} size="medium" sx={{ margin: '0.25rem 0' }} disabled={disabled}>
            {isRecording ? (
              <MicOffIcon
                sx={{
                  color: theme.palette.baselineColor.neutral[70],
                  fontSize: 30,
                }}
              />
            ) : (
              <MicIcon
                sx={{
                  color: theme.palette.baselineColor.neutral[70],
                  fontSize: 30,
                }}
              />
            )}
          </IconButton>
        </Box>
      </Box>
      {disabled && <Box sx={overlayStyle} onClick={e => e.preventDefault()} />}
    </Box>
  );
};

export default memo(SearchInputWithVoice);
