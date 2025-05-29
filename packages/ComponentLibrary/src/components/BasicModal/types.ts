import type { ModalProps } from '@mui/material';
import type { ReactNode } from 'react';

export interface ModalIProps extends Omit<ModalProps, 'children' | 'open'> {
  height?: string | number;
  width?: string | number;
  posX?: string | number;
  posY?: string | number;
  children: ReactNode;
  customTrigger?: ReactNode;
  onClose?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  tittleHeader?: string | undefined;
  descriptionText?: string | undefined;
  HeaderIcon?: React.ElementType;
  SaveIcon?: React.ElementType;
  secondaryButtonLabel?: string | undefined;
  saveButtonLabel?: string | undefined;
  showHeader?: boolean;
  buttons?: ReactNode;
  backgroundGradient?: string;
  isFullScreenEnabled?: boolean;
  open?: boolean;
  onAfterClose?: () => void;
}
