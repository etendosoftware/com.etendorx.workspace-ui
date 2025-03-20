import { Option } from '../../../Form/FormView/types';

export interface SearchBarProps {
  readOnly?: boolean;
  onClear: () => void;
  onOpen: () => void;
  hasItems: boolean;
}

export interface SelectedItemProps {
  item: Option;
  onRemove: (id: string) => void;
}

export interface SelectedItemsContainerProps {
  items: Option[];
  onRemove: (id: string) => void;
}
