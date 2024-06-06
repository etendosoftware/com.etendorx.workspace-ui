import { IconButtonProps } from '@mui/material';

export interface IIconButton extends IconButtonProps {
  icon: string;
  alt?: string;
  styleIcon?: React.CSSProperties;
}
