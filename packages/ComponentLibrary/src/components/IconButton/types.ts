import { IconButtonProps } from '@mui/material';

export interface TextIconButtonProps extends IIconComponentProps {
  iconText?: string;
  containerIcon?: React.ReactNode;
  containerOnClick?: () => void;
  containerTooltip?: string;
}

export interface IIconComponentProps
  extends React.PropsWithChildren<Omit<IconButtonProps, 'children'>> {
  fill?: string;
  hoverFill?: string;
  width?: number;
  height?: number;
  tooltip?: string;
  isHovered?: boolean;
}
