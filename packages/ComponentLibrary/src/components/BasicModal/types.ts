import { ReactNode } from 'react';

export interface ModalIProps {
  height?: string | number;
  width?: string | number;
  posX?: string | number;
  posY?: string | number;
  children: ReactNode;
  customTrigger?: ReactNode;
  onClose?: () => void;
  tittleHeader: string;
  descriptionText: string;
  HeaderIcon: React.ElementType;
}
