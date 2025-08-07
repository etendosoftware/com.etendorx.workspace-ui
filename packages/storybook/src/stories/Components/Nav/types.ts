/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at  
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type { ReactElement } from 'react';
import type { Inotifications } from '@workspaceui/componentlibrary/src/commons';
import type { Section } from '@/components/ProfileModal/ToggleButton/types';
import type { WaterfallModalProps } from '@workspaceui/componentlibrary/src/components/Waterfall/types';

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
