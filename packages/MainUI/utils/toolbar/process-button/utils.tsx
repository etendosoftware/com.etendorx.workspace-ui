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
import type { Field } from "@workspaceui/api-client/src/api/types";

/**
 * Tells whether the role can run the process of a button. Classic keeps the button of a process
 * the role cannot run visible but disabled, so the button is never filtered out by this flag.
 *
 * @param button - The process button field
 * @returns `false` only when the metadata flags the process as not accessible
 */
export const isProcessButtonAccessible = (button: Pick<Field, "isProcessAccessible">): boolean =>
  button.isProcessAccessible !== false;

/** Prefix the server-side expression parser gives to session attributes and auxiliary inputs. */
export const CONTEXT_EXPRESSION_PREFIX = "context.";

/**
 * Tells whether the display or read-only logic of a button reads the record context (session attributes
 * or auxiliary inputs), which only the FormInitialization of the selected record provides.
 *
 * @param button - The process button field
 * @returns `true` when either expression reads `context.*`
 */
export const buttonNeedsContext = (button: Pick<Field, "displayLogicExpression" | "readOnlyLogicExpression">) =>
  [button.displayLogicExpression, button.readOnlyLogicExpression].some((expression) =>
    expression?.includes(CONTEXT_EXPRESSION_PREFIX)
  );

/**
 * Tells whether a process button can be run: the role can run its process and its read-only logic is
 * false. Classic keeps both kinds of buttons visible but disabled.
 *
 * @param button - The process button field
 * @param readOnlyButtonIds - Ids of the buttons whose read-only logic is true for the selection
 * @returns `true` when the button can be run
 */
export const isProcessButtonEnabled = (
  button: Pick<Field, "id" | "isProcessAccessible">,
  readOnlyButtonIds?: ReadonlySet<string>
): boolean => isProcessButtonAccessible(button) && !readOnlyButtonIds?.has(button.id);

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
  anchorEl: HTMLElement | null,
  isLoading = false
): ProcessAvailableButton => ({
  key: "process-menu",
  leftIcon: <ProcessIcon width="1rem" height="1rem" data-testid="ProcessIcon__987e83" />,
  rightIcon: <ChevronDownIcon width="1rem" height="1rem" data-testid="ChevronDownIcon__987e83" />,
  text: isLoading ? t("common.loading") : t("common.processes"),
  anchorEl: anchorEl,
  disabled: !hasSelectedRecord || isLoading,
  customContainerStyles: getProcessButtonStyles(anchorEl),
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
    if (hasSelectedRecord && event && processCount > 0) {
      onMenuOpen(event);
    }
  },
});
