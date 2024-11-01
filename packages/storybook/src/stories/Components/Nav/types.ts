import { ReactElement } from 'react';
import { Inotifications } from '../../../../../ComponentLibrary/src/commons';
import { Section } from '../../../../../ComponentLibrary/src/components/ProfileModal/ToggleButton/types';
import { WaterfallModalProps } from '../../../../../ComponentLibrary/src/components/Waterfall/types';

export interface NavArgs extends WaterfallModalProps {
  cancelButtonText: string;
  saveButtonText: string;
  notifications: Inotifications[];
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  title: { icon: string | ReactElement; label: string };
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
  userPhotoUrl: string;
  userName: string;
  userEmail: string;
  sectionTooltip: string;
  sections: Section[];
}
