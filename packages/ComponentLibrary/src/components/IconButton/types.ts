import { IconButtonProps } from '@mui/material';
import { ReactElement } from 'react';

export interface IIconButton extends IconButtonProps {
  icon: ReactElement;
  alt?: string;
  styleIcon?: React.CSSProperties;
}
