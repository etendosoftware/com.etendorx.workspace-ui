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

const SearchInputWithVoice = ({ onVoiceClick, ...props }: SearchInputWithVoiceProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const theme = useTheme();

  const handleVoiceClick = useCallback(() => {
    setIsRecording(!isRecording);
    onVoiceClick?.();
  }, [isRecording, onVoiceClick]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <TextInputAutoComplete
        {...props}
        InputProps={{
          ...props.InputProps,
          startAdornment: <StartAdornment />,
          endAdornment: <EndAdornment />,
          style: { height: '2.5rem' },
        }}
      />
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton
          onClick={handleVoiceClick}
          size="medium"
          sx={{
            marginLeft: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
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
  );
};

export default memo(SearchInputWithVoice);
