import { IconButtonProps } from '@mui/material';

export interface IIconComponentProps extends React.PropsWithChildren<Omit<IconButtonProps, 'children'>> {
  fill?: string;
  hoverFill?: string;
  width?: number;
  height?: number;
  tooltip?: string;
  isHovered?: boolean;
  iconText?: string;
}
