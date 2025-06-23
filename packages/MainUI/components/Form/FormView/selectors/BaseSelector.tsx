import { useTabContext } from "@/contexts/tab";
import { useCallout } from "@/hooks/useCallout";
import { useDebounce } from "@/hooks/useDebounce";
import { useUserContext } from "@/hooks/useUserContext";
import { globalCalloutManager } from "@/services/callouts";
import { buildPayloadByInputName, parseDynamicExpression } from "@/utils";
import { logger } from "@/utils/logger";
import { type Field, type FormInitializationResponse, FormMode } from "@workspaceui/api-client/src/api/types";
import { getFieldsByColumnName } from "@workspaceui/api-client/src/utils/metadata";
import { useParams } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { useFormContext } from "react-hook-form";
import Label from "../Label";
import { GenericSelector } from "./GenericSelector";
import useDisplayLogic from "@/hooks/useDisplayLogic";

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
  const { tab } = useTabContext();
  const fieldsByColumnName = useMemo(() => getFieldsByColumnName(tab), [tab]);
  const { recordId } = useParams<{ recordId: string }>();
  const { session } = useUserContext();
  const executeCalloutBase = useCallout({ field, rowId: recordId });
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
        setValue(targetField?.hqlName ?? column, value);

        if (targetField && identifier) {
          setValue(`${targetField.hqlName}$_identifier`, identifier);
        }
      }
    },
    [fieldsByColumnName, setValue]
  );

  const applyAuxiliaryInputValues = useCallback(
    (auxiliaryInputValues: FormInitializationResponse["auxiliaryInputValues"]) => {
      for (const [column, { value }] of Object.entries(auxiliaryInputValues ?? {})) {
        const targetField = fieldsByColumnName[column];

        setValue(targetField?.hqlName || column, value);
      }
    },
    [fieldsByColumnName, setValue]
  );

  const executeCallout = useCallback(async () => {
    if (!tab || !field.column.callout) return;

    try {
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
        inpmProductId_CURR: session.$C_Currency_ID,
        inpmProductId_UOM: session["#C_UOM_ID"],
      } as Record<string, string>;

      if (optionData) {
        calloutData.inpmProductId_PSTD = String(optionData.netListPrice);
        calloutData.inpmProductId_PLIST = String(optionData.netListPrice);
      }

      const data = await debouncedCallout(calloutData);

      if (data) {
        applyColumnValues(data.columnValues);
        applyAuxiliaryInputValues(data.auxiliaryInputValues);
      }
    } catch (err) {
      logger.error("Callout execution failed:", err);
      throw err;
    }
  }, [
    field.column.callout,
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
      return;
    }

    if (globalCalloutManager.isCalloutRunning()) {
      return;
    }

    previousValue.current = value;

    await globalCalloutManager.executeCallout(field.hqlName, executeCallout);
  }, [field.hqlName, value, executeCallout]);

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
      <div className="grid grid-cols-3 auto-rows-auto gap-4 items-center" title={field.helpComment}>
        <div className="relative">
          {field.isMandatory && (
            <span className="absolute -top-4 right-0 text-[#DC143C] font-bold" aria-required>
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
