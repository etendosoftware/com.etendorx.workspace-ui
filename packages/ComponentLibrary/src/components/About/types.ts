export interface AboutButtonProps {
  onClick: () => void;
  tooltip?: string;
  disabled?: boolean;
  iconButtonClassName?: string;
}

export interface AboutModalProps {
  aboutUrl: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}
