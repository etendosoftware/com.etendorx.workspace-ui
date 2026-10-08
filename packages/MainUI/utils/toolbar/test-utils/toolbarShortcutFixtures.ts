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

import type { ToolbarButton } from "@/components/Toolbar/types";

/** Shared fixtures for the toolbar keyboard shortcut tests. */

export const makeToolbarButton = (action: string, disabled = false): ToolbarButton & { onClick: jest.Mock } => ({
  key: action,
  action,
  icon: null,
  disabled,
  onClick: jest.fn(),
});

export const buildToolbarSections = (
  left: ToolbarButton[] = [],
  center: ToolbarButton[] = [],
  right: ToolbarButton[] = []
) => ({
  leftSection: { buttons: left },
  centerSection: { buttons: center },
  rightSection: { buttons: right },
});
