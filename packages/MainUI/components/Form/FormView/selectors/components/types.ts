export interface TextInputProps extends React.HTMLProps<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftIconClick?: () => void;
  onRightIconClick?: () => void;
  label?: string;
  setValue?: (value: string) => void;
}

export interface Option {
  id: string;
  label: string;
}

export interface SelectProps {
  name: string;
  options: Option[];
  onFocus?: (value: unknown) => unknown;
  isReadOnly?: boolean;
  required?: boolean;
}
