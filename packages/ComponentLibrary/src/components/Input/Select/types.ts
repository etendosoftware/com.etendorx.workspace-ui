import { AutocompleteProps } from '@mui/material';

export interface OptionType {
  title: string;
}

export interface ISelectInput extends Omit<AutocompleteProps<OptionType, false, false, false>, 'renderInput'> {
  label?: string;
  options: Array<OptionType>;
}