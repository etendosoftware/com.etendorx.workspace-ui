'use client';

import { useState } from 'react';
import { InputAdornment, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterIcon from '@mui/icons-material/FilterList';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import { TextInputProps } from '../TextInputComplete.types';
import TextInputAutoComplete from '../TextInputAutocomplete';
import { theme } from '../../../../../theme';
import IconButton from '../../../../IconButton';

export interface SearchInputWithVoiceProps extends TextInputProps {
  onVoiceClick: () => void;
}

const SearchInputWithVoice = (props: SearchInputWithVoiceProps) => {
  const { onVoiceClick, ...otherProps } = props;
  const [isRecording, setIsRecording] = useState(false);

  const handleVoiceClick = () => {
    setIsRecording(!isRecording);
    onVoiceClick();
  };

  const startAdornment = (
    <InputAdornment position="start">
      <SearchIcon sx={{ color: theme.palette.baselineColor.neutral[70] }} />
    </InputAdornment>
  );

  const endAdornment = (
    <InputAdornment position="end">
      <IconButton size="small">
        <FilterIcon sx={{ color: theme.palette.baselineColor.neutral[70] }} />
      </IconButton>
    </InputAdornment>
  );

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <TextInputAutoComplete
        {...otherProps}
        InputProps={{
          ...otherProps.InputProps,
          startAdornment,
          endAdornment,
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

export default SearchInputWithVoice;
