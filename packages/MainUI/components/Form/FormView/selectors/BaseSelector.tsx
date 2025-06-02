import { useTabContext } from "@/contexts/tab";
import { useCallout } from "@/hooks/useCallout";
import useDebounce from "@/hooks/useDebounce";
import { useUserContext } from "@/hooks/useUserContext";
import { buildPayloadByInputName, parseDynamicExpression } from "@/utils";
import { logger } from "@/utils/logger";
import { type Field, type FormInitializationResponse, FormMode } from "@workspaceui/etendohookbinder/src/api/types";
import { getFieldsByColumnName } from "@workspaceui/etendohookbinder/src/utils/metadata";
import { useParams } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { useFormContext } from "react-hook-form";
import Label from "../Label";
import { GenericSelector } from "./GenericSelector";

export const compileExpression = (expression: string) => {
  try {
    return new Function("context", "currentValues", `return ${parseDynamicExpression(expression)};`);
  } catch (error) {
    logger.warn("Error compiling expression:", expression, error);

    return () => true;
  }
};

const BaseSelectorComp = ({ field, formMode = FormMode.EDIT }: { field: Field; formMode?: FormMode }) => {
  const { watch, getValues, setValue, register } = useFormContext();
  const { tab, parentRecord } = useTabContext();
  const fieldsByColumnName = useMemo(() => getFieldsByColumnName(tab), [tab]);
  const { recordId } = useParams<{ recordId: string }>();
  const { session } = useUserContext();
  const parentId = parentRecord?.id?.toString();
  const executeCalloutBase = useCallout({ field, rowId: recordId, parentId });
  const debouncedCallout = useDebounce(executeCalloutBase, 300);
  const value = watch(field.hqlName);
  const values = watch();
  const previousValue = useRef(value);
  const ready = useRef(false);
  const fieldsByHqlName = useMemo(() => tab?.fields || {}, [tab?.fields]);
  const optionData = watch(`${field.hqlName}_data`);

  const isDisplayed = useMemo(() => {
    if (!field.displayed) return false;
    if (!field.displayLogicExpression) return true;

    const compiledExpr = compileExpression(field.displayLogicExpression);

    try {
      return compiledExpr(session, values);
    } catch (error) {
      logger.warn("Error executing expression:", compiledExpr, error);

      return true;
    }
  }, [field, values, session]);

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
        const isDate = ["15", "16"].includes(targetField?.column?.reference);
        setValue(targetField.hqlName, isDate ? column : value);

        if (targetField && identifier) {
          setValue(`${targetField.hqlName}$_identifier`, identifier);
        }
      }
    },
    [fieldsByColumnName, setValue],
  );

  const applyAuxiliaryInputValues = useCallback(
    (auxiliaryInputValues: FormInitializationResponse["auxiliaryInputValues"]) => {
      for (const [column, { value }] of Object.entries(auxiliaryInputValues ?? {})) {
        const targetField = fieldsByColumnName[column];

        setValue(targetField?.hqlName || column, value);
      }
    },
    [fieldsByColumnName, setValue],
  );

  const runCallout = useCallback(async () => {
    previousValue.current = value;

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
      logger.warn("Callout execution failed:", err);
    }
  }, [
    value,
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

  useEffect(() => {
    if (ready.current && previousValue.current !== value) {
      runCallout();
    } else {
      ready.current = true;
    }
  }, [runCallout, value]);

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
