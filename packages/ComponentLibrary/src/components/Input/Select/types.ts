import { AutocompleteProps } from '@mui/material';

export interface ISelectInput
  extends Omit<AutocompleteProps<any, false, false, false>, 'renderInput'> {
  helperText?: { label?: string; icon?: React.ReactNode | string };
  title?: string;
  iconLeft?: React.ReactNode | string;
  options: Array<any>;
  value?: any;
  onChange?: (event: React.SyntheticEvent, value: any) => void;
}
