export type IconComponent = React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>;

export interface StatusConfig {
  gradientColor: string;
  icon: IconComponent;
  iconBackgroundColor: string;
}

export type StatusType = 'success' | 'error' | 'warning' | 'info';

export interface StatusModalState {
  open: boolean;
  statusType: StatusType;
  statusText: string;
  errorMessage?: string;
  saveLabel?: string;
  secondaryButtonLabel?: string;
  isDeleteSuccess?: boolean;
}

export interface StatusModalProps {
  statusText: string;
  statusType: StatusType;
  errorMessage?: string;
  saveLabel?: string;
  secondaryButtonLabel?: string;
  onClose?: () => void;
  onAfterClose?: () => void;
  isDeleteSuccess?: boolean;
  open?: boolean;
}

export interface ConfirmModalProps {
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
  saveLabel?: string;
  secondaryButtonLabel?: string;
  onAfterClose?: () => void;
  open?: boolean;
}
