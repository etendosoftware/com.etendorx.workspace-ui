import { EntityData, Field } from '@workspaceui/etendohookbinder/src/api/types';

export interface TextInputProps
  extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftIconClick?: () => void;
  onRightIconClick?: () => void;
  label?: string;
  setValue?: (value: string) => void;
  field: Field;
}

export interface Option {
  id: string;
  label: string;
}

export interface SelectProps {
  name: string;
  options: Array<{ id: string; label: string; data?: EntityData }>;
  onFocus?: () => void;
  onSearch?: (term: string) => void;
  isReadOnly?: boolean;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  field: Field;
}
