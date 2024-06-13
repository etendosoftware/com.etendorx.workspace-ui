import { ChipProps as MuiChipProps } from '@mui/material';

export type TagType = 'success' | 'warning' | 'error' | 'draft' | 'primary';

export interface TagProps extends MuiChipProps {
  type: TagType;
  label: string;
  icon?: React.ReactElement;
}
