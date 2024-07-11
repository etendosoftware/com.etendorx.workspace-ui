import { AutocompleteProps } from '@mui/material';

export interface Option {
  title: string;
  value: string;
}
export interface ISelectInput
  extends Omit<AutocompleteProps<any, false, false, false>, 'renderInput'> {
  title: string;
  iconLeft?: React.ReactElement;
  options: Option[];
  disabled?: boolean;
  helperText?: {
    label?: string;
    icon?: React.ReactElement;
  };
  value?: string;
  onChange?: (
    event: React.SyntheticEvent<Element, Event>,
    value: Option | null,
  ) => void;
}
