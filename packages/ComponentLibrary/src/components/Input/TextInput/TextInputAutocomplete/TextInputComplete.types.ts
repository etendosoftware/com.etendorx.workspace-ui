import type { StandardTextFieldProps, FormControlOwnProps } from '@mui/material';

export interface TextInputProps extends StandardTextFieldProps {
  value: string;
  setValue?: (value: string) => void;
  label?: string;
  autoCompleteTexts?: string[];
  fetchSuggestions?: (query: string) => Promise<void>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftIconClick?: () => void;
  onRightIconClick?: () => void;
  placeholder?: string | undefined;
  margin?: FormControlOwnProps['margin'];
  disabled?: boolean;
  readOnly?: boolean;
}
