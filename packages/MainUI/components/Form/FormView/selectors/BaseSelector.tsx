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

import { useTabContext } from "@/contexts/tab";
import { useCallout } from "@/hooks/useCallout";
import { useDebounce } from "@/hooks/useDebounce";
import { useUserContext } from "@/hooks/useUserContext";
import { globalCalloutManager } from "@/services/callouts";
import { buildPayloadByInputName, parseDynamicExpression } from "@/utils";
import { logger } from "@/utils/logger";
import { isDebugCallouts } from "@/utils/debug";
import { type Field, type FormInitializationResponse, FormMode } from "@workspaceui/api-client/src/api/types";
import { getFieldsByColumnName } from "@workspaceui/api-client/src/utils/metadata";
import { useParams } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { useFormContext } from "react-hook-form";
import Label from "../Label";
import { GenericSelector } from "./GenericSelector";
import useDisplayLogic from "@/hooks/useDisplayLogic";
import { useFormInitializationContext } from "@/contexts/FormInitializationContext";
import useFormParent from "@/hooks/useFormParent";

export const compileExpression = (expression: string) => {
  try {
    return new Function("context", "currentValues", `return ${parseDynamicExpression(expression)};`);
  } catch (error) {
    logger.error("Error compiling expression:", expression, error);
    return () => true;
  }
};

const BaseSelectorComp = ({ field, formMode = FormMode.EDIT }: { field: Field; formMode?: FormMode }) => {
  const { watch, getValues, setValue, register } = useFormContext();
  const { isFormInitializing } = useFormInitializationContext();
  const { tab } = useTabContext();
  const fieldsByColumnName = useMemo(() => getFieldsByColumnName(tab), [tab]);
  const { recordId } = useParams<{ recordId: string }>();
  const { session } = useUserContext();
  const parentData = useFormParent();

  const getParentId = useCallback(() => {
    const parentIds = Object.values(parentData)
      .filter((value) => value && value !== "null" && value !== null)
      .map((value) => String(value));
    return parentIds.length > 0 ? parentIds[0] : "null";
  }, [parentData]);

  const executeCalloutBase = useCallout({
    field,
    rowId: recordId,
    parentId: getParentId(),
  });
  const debouncedCallout = useDebounce(executeCalloutBase, 300);
  const value = watch(field.hqlName);
  const values = watch();
  const previousValue = useRef(value);
  const ready = useRef(false);
  const fieldsByHqlName = useMemo(() => tab?.fields || {}, [tab?.fields]);
  const optionData = watch(`${field.hqlName}_data`);

  const isSettingFromCallout = useRef(false);

  const isDisplayed = useDisplayLogic({ field });

  const isReadOnly = useMemo(() => {
    if (field.isReadOnly) return true;
    if (!field.isUpdatable) return FormMode.NEW !== formMode;
    if (!field.readOnlyLogicExpression) return false;
    const compiledExpr = compileExpression(field.readOnlyLogicExpression);

    try {
      return compiledExpr(session, values);
    } catch (error) {
      logger.warn("Error executing expression:", compiledExpr, error);
      return true;
    }
  }, [field, formMode, session, values]);

  const applyColumnValues = useCallback(
    (columnValues: FormInitializationResponse["columnValues"]) => {
      for (const [column, { value, identifier }] of Object.entries(columnValues ?? {})) {
        const targetField = fieldsByColumnName[column];
        const hqlName = targetField?.hqlName ?? column;

        setValue(hqlName, value, { shouldDirty: false });

        if (targetField && identifier) {
          setValue(`${hqlName}$_identifier`, identifier, { shouldDirty: false });

          if (value && String(value) !== identifier) {
            logger.debug(`Field ${hqlName}: value=${value}, identifier=${identifier}`);
          }
        } else if (targetField && !identifier && value) {
          setValue(`${hqlName}$_identifier`, "", { shouldDirty: false });
        }

        // If the callout returned restricted entries for this field, expose them to selectors
        const withEntries = (columnValues as any)[column]?.entries as Array<{ id: string; _identifier: string }> | undefined;
        if (withEntries && withEntries.length) {
          setValue(
            `${hqlName}$_entries`,
            withEntries.map((e) => ({ id: e.id, label: e._identifier })),
            { shouldDirty: false }
          );
        }
      }
    },
    [fieldsByColumnName, setValue]
  );

  const applyAuxiliaryInputValues = useCallback(
    (auxiliaryInputValues: FormInitializationResponse["auxiliaryInputValues"]) => {
      for (const [column, { value }] of Object.entries(auxiliaryInputValues ?? {})) {
        const targetField = fieldsByColumnName[column];
        setValue(targetField?.hqlName || column, value, { shouldDirty: false });
      }
    },
    [fieldsByColumnName, setValue]
  );

  const executeCallout = useCallback(async () => {
    if (!tab || !field.column.callout) return;

    try {
      if (isDebugCallouts()) logger.debug(`[Callout] Trigger by user on field: ${field.hqlName}`);
      const entityKeyColumn = tab.fields.id.columnName;
      const payload = buildPayloadByInputName(getValues(), fieldsByHqlName);

      const calloutData = {
        ...session,
        ...payload,
        inpKeyName: fieldsByColumnName[entityKeyColumn].inputName,
        inpTabId: tab.id,
        inpTableId: tab.table,
        inpkeyColumnId: entityKeyColumn,
        keyColumnName: entityKeyColumn,
        _entityName: tab.entityName,
        inpwindowId: tab.window,
      } as Record<string, string>;

      //TODO: This will imply the evaluation of out fiels inside the fieldBuilder an it's implementation in metadata module
      if (field.inputName === "inpmProductId" && optionData) {
        calloutData.inpmProductId_CURR = optionData.currency || session.$C_Currency_ID;
        calloutData.inpmProductId_UOM = optionData.uOM || session["#C_UOM_ID"];
        calloutData.inpmProductId_PSTD = String(optionData.standardPrice || optionData.netListPrice || 0);
        calloutData.inpmProductId_PLIST = String(optionData.netListPrice || 0);
        calloutData.inpmProductId_PLIM = String(optionData.priceLimit || 0);
      }

      const data = await debouncedCallout(calloutData);

      if (data) {
        // Prevent cascading callouts across fields while applying server-driven values
        globalCalloutManager.suppress();
        isSettingFromCallout.current = true;
        try {
          if (isDebugCallouts()) logger.debug(`[Callout] Applying values for field: ${field.hqlName}`, data);
          applyColumnValues(data.columnValues);
          applyAuxiliaryInputValues(data.auxiliaryInputValues);
        } finally {
          // Resume after react-hook-form state updates flush
          setTimeout(() => {
            isSettingFromCallout.current = false;
            globalCalloutManager.resume();
          }, 0);
        }
      }
    } catch (err) {
      logger.error("Callout execution failed:", err);
      throw err;
    }
  }, [
    field.column.callout,
    field.inputName,
    tab,
    getValues,
    fieldsByHqlName,
    session,
    fieldsByColumnName,
    optionData,
    debouncedCallout,
    applyColumnValues,
    applyAuxiliaryInputValues,
  ]);

  const runCallout = useCallback(async () => {
    if (isSettingFromCallout.current) {
      if (isDebugCallouts()) logger.debug(`[Callout] Skipped (setting from callout): ${field.hqlName}`);
      return;
    }

    if (isFormInitializing) {
      if (isDebugCallouts()) logger.debug(`[Callout] Skipped (form initializing): ${field.hqlName}`);
      return;
    }

    if (globalCalloutManager.isCalloutRunning() || globalCalloutManager.isSuppressed()) {
      if (isDebugCallouts()) logger.debug(`[Callout] Skipped (global busy/suppressed): ${field.hqlName}`);
      return;
    }

    previousValue.current = value;

    await globalCalloutManager.executeCallout(field.hqlName, executeCallout);
  }, [field.hqlName, value, executeCallout, isFormInitializing]);

  useEffect(() => {
    if (ready.current) {
      runCallout();
    } else {
      ready.current = true;
    }
  }, [runCallout, value]);

  useEffect(() => {
    return () => {
      globalCalloutManager.clearPendingCallouts();
    };
  }, []);

  if (isDisplayed) {
    return (
      <div
        className="h-12 grid grid-cols-3 auto-rows-auto gap-4 items-center"
        title={field.helpComment || ""}
        aria-describedby={field.helpComment ? `${field.name}-help` : ""}>
        <div className="relative">
          {field.isMandatory && (
            <span className="absolute -top-4 right-0 text-[#DC143C] text-xs font-bold" aria-required>
              *
            </span>
          )}
          <Label field={field} />
        </div>
        <div className="col-span-2">
          <GenericSelector field={field} isReadOnly={isReadOnly} />
        </div>
      </div>
    );
  }
  return <input type="hidden" {...register(field.hqlName)} />;
};

const BaseSelector = memo(BaseSelectorComp);
export { BaseSelector };
export default BaseSelector;
