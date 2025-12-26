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

export type IconComponent = React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>;

export interface StatusConfig {
  gradientColor: string;
  icon: IconComponent;
  iconBackgroundColor: string;
}

export type StatusType = "success" | "error" | "warning" | "info";

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
  onSave?: () => void;
  onCancel?: () => void;
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
