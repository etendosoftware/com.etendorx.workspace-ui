import { IconButtonProps } from '@mui/material';

export interface IIconButton extends IconButtonProps {
  /**
   * The URL or path of the icon to be displayed.
   * @example "/path/to/icon.png"
   */
  icon: string;

  /**
   * The alternative text for the icon. This is optional.
   * @default "icon"
   */
  alt?: string;
}