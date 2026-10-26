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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { type ReactNode, useCallback, useMemo, useState } from "react";
import { type FieldValues, type UseFormSetValue, useFormContext } from "react-hook-form";
import SearchIcon from "@workspaceui/componentlibrary/src/assets/icons/search.svg";
import PlusIcon from "@workspaceui/componentlibrary/src/assets/icons/plus.svg";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";
import type { EntityData, Field, Tab } from "@workspaceui/api-client/src/api/types";
import SelectorModal from "@/components/Form/FormView/selectors/SelectorModal";
import type { ProcessSelectorContext } from "@/hooks/types";
import { buildProcessSelectorOverlay } from "@/hooks/datasource/useTableDirDatasource";
import { useTranslation } from "@/hooks/useTranslation";
import { getSelectorFieldName, updateSelectorValue, writeCallerRecord } from "@/utils/form/selectors/utils";
import { NOT_TABBABLE } from "@/utils/form/focus";
import { getSelectorPopupShortcutId, isEventFromDropdownPortal, isSelectorPopupShortcut } from "@/utils/form/keyboard";
import type { OpenProcessParams } from "@/utils/processes/definition/scriptProxies";

interface ProcessSelectorActionsProps {
  field: Field;
  isReadOnly: boolean;
  /** Tab the process runs in, for the selector context of the search popup. */
  currentTab?: Tab;
  /** Process context the combo sends; the search popup and the "+" process reuse it. */
  processContext?: ProcessSelectorContext;
  /** Opens a process on top of the current one (the modal's `view.openProcess`). */
  onOpenProcess?: (params: OpenProcessParams) => void;
  /** The selector control (combo) the buttons go next to. */
  children: ReactNode;
}

/**
 * Writes a record picked in the search popup into the selector: its id comes from
 * the selector's `valueField` (the record id when there is none).
 */
export const writePickedRecord = (setValue: UseFormSetValue<FieldValues>, field: Field, record: EntityData): void => {
  const valueField = field.selector?.valueField as string | undefined;
  const id = valueField ? record[valueField] : record.id;
  if (!id) return;
  const displayField = field.selector?.displayField as string | undefined;
  updateSelectorValue(setValue, getSelectorFieldName(field), id, record, displayField);
};

/**
 * The search (magnifier) and add ("+") buttons of a process-parameter selector, as
 * in forms and in Classic (`OBSelectorItem` icons):
 * - the magnifier shows when the selector has grid columns (`hasTableRelated`) and
 *   opens the selector popup, filtered with the same process context as the combo;
 * - the "+" shows when the selector has a process (`hasProcessDefinitionRelated`)
 *   and opens it on top, with this process' values in its defaults context; the
 *   record it creates comes back into the selector.
 * Neither shows on a read-only parameter.
 */
const ProcessSelectorActions = ({
  field,
  isReadOnly,
  currentTab,
  processContext,
  onOpenProcess,
  children,
}: ProcessSelectorActionsProps) => {
  const { getValues, setValue } = useFormContext();
  const { t } = useTranslation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const fieldName = getSelectorFieldName(field);
  const { hasTableRelated, hasProcessDefinitionRelated, processDefinitionId } = field.selector ?? {};
  const canSearch = Boolean(hasTableRelated) && !isReadOnly;
  const canAdd = Boolean(hasProcessDefinitionRelated && processDefinitionId && onOpenProcess) && !isReadOnly;
  const popupShortcutId = getSelectorPopupShortcutId(field.column?.reference);

  const searchParams = useMemo(
    () => (processContext ? buildProcessSelectorOverlay(field, processContext) : undefined),
    [field, processContext]
  );

  // Ctrl+Enter opens the search popup, as in forms (Classic `Selector_ShowPopup`).
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!canSearch || !isSelectorPopupShortcut(event, popupShortcutId)) return;
      if (isEventFromDropdownPortal(event)) return;
      event.preventDefault();
      setIsSearchOpen(true);
    },
    [canSearch, popupShortcutId]
  );

  const handleAdd = useCallback(() => {
    onOpenProcess?.({
      processId: processDefinitionId as string,
      // Titled after the field, as Classic `OBUISEL_AddNewRecord` ("Add Payment").
      windowTitle: t("process.addNewRecord").replace("%0", () => field.name),
      callerField: {
        id: field.id,
        name: field.name,
        setValueFromRecord: (record) => writeCallerRecord(setValue, field, record),
      },
      callerContext: processContext?.values,
    });
  }, [onOpenProcess, processDefinitionId, field, setValue, processContext, t]);

  if (!canSearch && !canAdd) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="flex w-full items-center gap-1" onKeyDown={handleKeyDown}>
        <div className="min-w-0 flex-grow">{children}</div>
        {canSearch && (
          <IconButton
            onClick={() => setIsSearchOpen(true)}
            className="h-8 w-8 flex-shrink-0"
            tooltip="Search"
            tooltipPosition="top"
            tabIndex={NOT_TABBABLE}
            data-testid={`IconButton__${field.id}`}>
            <SearchIcon className="h-5 w-5 fill-current" data-testid={`SearchIcon__${field.id}`} />
          </IconButton>
        )}
        {canAdd && (
          <IconButton
            onClick={handleAdd}
            className="h-8 w-8 flex-shrink-0"
            tooltip="Add"
            tooltipPosition="top"
            tabIndex={NOT_TABBABLE}
            data-testid={`IconButton__${field.id}`}>
            <PlusIcon className="h-5 w-5 fill-current" data-testid={`PlusIcon__${field.id}`} />
          </IconButton>
        )}
      </div>
      {isSearchOpen && (
        <SelectorModal
          field={field}
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSelect={(record) => writePickedRecord(setValue, field, record)}
          currentDisplayValue={getValues(`${fieldName}$_identifier`)}
          currentTab={currentTab ?? null}
          extraParams={searchParams}
          data-testid={`SelectorModal__${field.id}`}
        />
      )}
    </>
  );
};

export default ProcessSelectorActions;
