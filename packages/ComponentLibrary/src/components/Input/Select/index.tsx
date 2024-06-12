import React from 'react';
import {
  Autocomplete,
  AutocompleteRenderInputParams,
  TextField,
} from '@mui/material';
import dropdownIcon from '../../../assets/icons/calendar.svg';
import { styles } from './style';
import { ISelectInput, OptionType } from './types';
import ChevronDown from '../../../assets/icons/chevron-down.svg'

const Select: React.FC<ISelectInput> = ({ label, options = [], ...props }) => {
  const defaultRenderInput = (params: AutocompleteRenderInputParams) => (
    <TextField
      {...params}
      sx={styles.root}
      InputLabelProps={{
        style: styles.labelProps,
      }}
      InputProps={{
        ...params.InputProps,
        sx: styles.props,
        startAdornment: (
          <img src={dropdownIcon} style={styles.startAdornment} />
        ),
      }}
      label={label}
      variant="standard"
    />
  );

  return (
    <Autocomplete
      {...props}
      options={options}
      getOptionLabel={(option: OptionType) => option.title}
      popupIcon={<img src={ChevronDown} />}
      renderInput={defaultRenderInput}
    />
  );
};

export default Select;
