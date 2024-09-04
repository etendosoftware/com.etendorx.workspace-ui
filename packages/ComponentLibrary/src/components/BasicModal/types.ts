import { ReactNode } from 'react';

export interface ModalIProps {
  height?: string | number;
  width?: string | number;
  posX?: string | number;
  posY?: string | number;
  children: ReactNode;
  customTrigger?: ReactNode;
  onClose?: () => void;
  tittleHeader?: string | undefined;
  descriptionText?: string | undefined;
  HeaderIcon?: React.ElementType;
  secondaryButtonLabel?: string | undefined;
  saveButtonLabel?: string | undefined;
  showHeader?: boolean;
  buttons?: ReactNode;
}
