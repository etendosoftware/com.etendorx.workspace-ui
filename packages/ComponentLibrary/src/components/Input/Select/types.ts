import type { AutocompleteProps } from "@mui/material";
import type { Option } from "@workspaceui/etendohookbinder/src/api/types";

export type { Option };

export interface ISelectInput<T extends string = string>
  extends Omit<AutocompleteProps<Option<T>, false, false, false>, "renderInput"> {
  title?: string;
  iconLeft?: React.ReactElement;
  options: Option<T>[];
  disabled?: boolean;
  helperText?: {
    label?: string;
    icon?: React.ReactElement;
  };
  value?: Option<T> | null;
  name?: string;
  onChange?: (event: React.SyntheticEvent<Element, Event>, value: Option<T> | null) => void;
}
