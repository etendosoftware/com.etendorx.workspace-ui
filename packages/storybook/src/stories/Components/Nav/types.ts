import { WaterfallModalProps } from '../../../../../ComponentLibrary/src/components/Waterfall/WaterfallModal.types';

export interface NavArgs extends WaterfallModalProps {
  cancelButtonText: string;
  saveButtonText: string;
  notifications: [];
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  title: { icon: string; label: string };
  linkTitle: { label: string; url: string };
  emptyStateImageAlt: string;
  emptyStateMessage: string;
  emptyStateDescription: string;
  actionButtonLabel: string;
  backButtonText: string;
  activateAllText: string;
  deactivateAllText: string;
  buttonText: string;
  customizeText: string;
  passwordLabel: string;
  newPasswordLabel: string;
  confirmPasswordLabel: string;
  tooltipButtonProfile: string;
  tooltipWaterfallButton: string;
  section: string;
}
