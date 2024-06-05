import { IconButtonProps } from '@mui/material';

/**
 * Interface for Icon Button properties
 */
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