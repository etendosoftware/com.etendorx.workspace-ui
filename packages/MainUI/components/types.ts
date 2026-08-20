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

import type { ReactNode } from "react";

export interface ErrorDisplayProps {
  title: string;
  description?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  showHomeButton?: boolean;
}

export interface AccessDeniedDisplayProps {
  /** Overrides the default window-level wording (e.g. with the table-level one). */
  description?: string;
  children?: ReactNode;
}

export interface AccessDeniedScreenProps {
  /** Dismisses the screen and lands the user on the dashboard. */
  onGoHome: () => void;
}
