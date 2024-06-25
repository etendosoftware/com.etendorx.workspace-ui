import { AutocompleteProps } from '@mui/material';

export interface ISelectInput
  extends Omit<AutocompleteProps<any, false, false, false>, 'renderInput'> {
  helperText?: { label?: string; icon?: string };
  title?: string;
  iconLeft?: string;
  options: Array<any>;
  value?: any;
  onChange?: (event: React.SyntheticEvent, value: any) => void;
}
