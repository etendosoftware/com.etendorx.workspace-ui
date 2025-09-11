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

import ProcessIcon from "@workspaceui/componentlibrary/src/assets/icons/close-record.svg";
import ChevronDownIcon from "@workspaceui/componentlibrary/src/assets/icons/chevron-down.svg";
import type { TranslateFunction } from "@/hooks/types";
import type { ProcessAvailableButton } from "@/components/Toolbar/types";

const getProcessButtonStyles = (anchorEl: HTMLElement | null): string => {
  const baseClasses =
    "hover:bg-[var(--color-dynamic-main)] hover:text-[var(--color-dynamic-contrast-text)] disabled:bg-[var(--color-baseline-70)] disabled:opacity-20 h-8 py-1 px-4";

  const conditionalClasses = anchorEl
    ? "!bg-[var(--color-dynamic-main)] !border-none !text-[var(--color-dynamic-contrast-text)]"
    : "bg-[var(--color-transparent-neutral-0)]";

  return `${conditionalClasses} ${baseClasses}`;
};

export const createProcessMenuButton = (
  processCount: number,
  hasSelectedRecord: boolean,
  onMenuOpen: (event: React.MouseEvent<HTMLButtonElement>) => void,
  t: TranslateFunction,
  anchorEl: HTMLElement | null
): ProcessAvailableButton => ({
  key: "process-menu",
  leftIcon: <ProcessIcon width="1rem" height="1rem" data-testid="ProcessIcon__987e83" />,
  rightIcon: <ChevronDownIcon width="1rem" height="1rem" data-testid="ChevronDownIcon__987e83" />,
  text: t("common.processes"),
  anchorEl: anchorEl,
  disabled: !hasSelectedRecord,
  customContainerStyles: getProcessButtonStyles(anchorEl),
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
    if (hasSelectedRecord && event && processCount > 0) {
      onMenuOpen(event);
    }
  },
});
