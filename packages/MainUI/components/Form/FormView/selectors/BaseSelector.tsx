/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at  
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendimport XIcon from "../../../assets/icons/x.svg";
o_license.txt
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
import { createSmartContext } from "@/utils/expressions";
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
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import Asterisk from "../../../../../ComponentLibrary/src/assets/icons/asterisk.svg";

export const compileExpression = (expression: string) => {
  try {
    // Shim for legacy OpenBravo/Etendo functions used in expressions
    const obShim = `
      var normalize = function(val) {
        if (typeof val === "boolean") return val ? "Y" : "N";
        return val;
      };
      var OB = {
        Utilities: {
          getValue: function(obj, prop) { 
            var val = obj && obj[prop];
            return (val === null || val === undefined) ? '' : val;
          },
          PropertyStore: function(ctx, prop) { return ctx && (ctx[prop] || ctx['$'+prop] || ctx['#'+prop]); }
        },
        PropertyStore: function(ctx, prop) { return ctx && (ctx[prop] || ctx['$'+prop] || ctx['#'+prop]); },
        getExpression: function() { return true; }, // Fallback for complex expressions
        PropertyStore: {
          get: (key) => {
            // 1. Check context (session attributes with #/$ prefixes)
            const fromContext = context[key] ?? context['#' + key] ?? context['$' + key];
            if (fromContext !== undefined && fromContext !== null) return normalize(fromContext);
            // 2. Check preferences loaded from backend (stored in localStorage at login)
            try {
              const prefs = JSON.parse(localStorage.getItem('etendo_preferences') || '{}');
              if (prefs[key] !== undefined) return normalize(prefs[key]);
              // Case-insensitive fallback
              const lowerKey = key.toLowerCase();
              for (const k of Object.keys(prefs)) {
                if (k.toLowerCase() === lowerKey) return normalize(prefs[k]);
              }
            } catch (e) { /* ignore parse errors */ }
            return undefined;
          }
        },
        getSession: function() {
            return {
                getAttribute: function(prop) { 
                    var val = context[prop] || context['$'+prop] || context['#'+prop];
                    if (val === undefined && typeof currentValues !== 'undefined') {
                        val = currentValues[prop] || currentValues['$'+prop] || currentValues['#'+prop];
                    }
                    return val;
                }
            };
        },
        getFilterExpression: () => null
      };
    `;

    // Security: Shadow global objects to prevent access from within the expression
    // This provides depth-in-defense for the trusted metadata model
    const securityShim = `
      var window = undefined;
      var document = undefined;
      var fetch = undefined;
      var XMLHttpRequest = undefined;
      var alert = undefined;
    `;

    // NOSONAR: This dynamic execution is required to evaluate business logic defined in the Application Dictionary.
    // The Input 'expression' comes from the system metadata (trusted source) and is not user-supplied.
    return new Function(
      "context",
      "currentValues",
      `${securityShim} ${obShim} return ${parseDynamicExpression(expression)};`
    );
  } catch (error) {
    logger.error("Error compiling expression:", expression, error);
    return () => true;
  }
};

const BaseSelectorComp = ({
  field,
  formMode = FormMode.EDIT,
  forceReadOnly,
}: { field: Field; formMode?: FormMode; forceReadOnly?: boolean }) => {
  // Field type mapping corrected - reference "10" now properly maps to TEXT

  const formMethods = useFormContext();
  const { watch, getValues, setValue, register, formState } = formMethods;
  const { isFormInitializing, isSettingInitialValues, setIsSettingInitialValues } = useFormInitializationContext();
  const { tab, record, parentRecord, parentTab } = useTabContext();
  const fieldsByColumnName = useMemo(() => getFieldsByColumnName(tab), [tab]);

  // Lookup map for property field keys returned by FIC in columnValues.
  // FIC CHANGE/EDIT responses use "_propertyField_{propertyPath}_{columnName}" as the key.
  // e.g. "_propertyField_type_Type" → the "Type" field (hqlName = "type").
  const fieldsByPropertyFieldKey = useMemo(() => {
    return Object.values(tab.fields).reduce(
      (acc, f) => {
        if (f.column?.propertyPath && f.inputName) {
          // inputName is "inp_propertyField_type_Type" → strip "inp" → "_propertyField_type_Type"
          acc[f.inputName.replace(/^inp/, "")] = f;
        }
        return acc;
      },
      {} as Record<string, Field>
    );
  }, [tab.fields]);
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

  // Find all property fields that derive their value from this FK field.
  // e.g., if this field is "file" (hqlName) and another tab field has
  // column.propertyPath = "file.type", that field depends on this one.
  const dependentPropertyFields = useMemo(
    () =>
      Object.values(tab.fields).filter((f) => {
        if (!f.column?.propertyPath) return false;
        return f.column.propertyPath.startsWith(`${field.hqlName}.`);
      }),
    [tab.fields, field.hqlName]
  );

  const isSettingFromCallout = useRef(false);

  const isDisplayed = useDisplayLogic({ field });

  const isReadOnly = useMemo(() => {
    if (forceReadOnly) return true;
    if (field.isReadOnly) return true;
    // Property fields (column.propertyPath, e.g. "file.type") are always read-only.
    // They display a derived property of a related entity and cannot be edited directly
    // in this form — the value is auto-populated by the FIC when the related entity is
    // selected, exactly matching Etendo Classic behaviour.
    if (field.column?.propertyPath) return true;
    if (!field.isUpdatable) return FormMode.NEW !== formMode;
    if (!field.readOnlyLogicExpression) return false;
    const compiledExpr = compileExpression(field.readOnlyLogicExpression);

    try {
      const smartContext = createSmartContext({
        values: { ...record, ...values },
        fields: tab.fields,
        parentValues: parentRecord || undefined,
        parentFields: parentTab?.fields,
        context: session,
      });
      return compiledExpr(smartContext, smartContext);
    } catch (error) {
      logger.warn("Error executing expression:", compiledExpr, error);
      return true;
    }
  }, [field, formMode, session, values, forceReadOnly, record, parentRecord, parentTab, tab]);

  const applyColumnValues = useCallback(
    (columnValues: FormInitializationResponse["columnValues"]) => {
      for (const [column, { value, identifier }] of Object.entries(columnValues ?? {})) {
        // Regular column lookup first; fall back to property-field key lookup so that
        // FIC responses with "_propertyField_{path}_{col}" keys correctly update the field.
        const targetField = fieldsByColumnName[column] ?? fieldsByPropertyFieldKey[column];
        const hqlName = targetField?.hqlName ?? column;

        setValue(hqlName, value, { shouldDirty: false });

        if (targetField && identifier) {
          setValue(`${hqlName}$_identifier`, identifier, { shouldDirty: false });
        } else if (targetField && !identifier && value) {
          setValue(`${hqlName}$_identifier`, "", { shouldDirty: false });
        }

        // If the callout returned restricted entries for this field, expose them to selectors
        const withEntries = (columnValues as Record<string, { entries?: Array<{ id: string; _identifier: string }> }>)[
          column
        ]?.entries;
        if (withEntries?.length) {
          setValue(
            `${hqlName}$_entries`,
            withEntries.map((e) => ({ id: e.id, label: e._identifier })),
            { shouldDirty: false }
          );
        }
      }
    },
    [fieldsByColumnName, fieldsByPropertyFieldKey, setValue]
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
    if (!tab || (!field.column.callout && dependentPropertyFields.length === 0)) return;

    try {
      if (isDebugCallouts()) logger.debug(`[Callout] Trigger by user on field: ${field.hqlName}`);
      const entityKeyColumn = tab.fields.id.columnName;
      const payload = buildPayloadByInputName(getValues(), fieldsByHqlName);

      // Build _gridVisibleProperties so that the FIC in CHANGE mode can identify
      // property fields and compute their values from DB when a related FK field
      // changes (e.g. selecting a new "file" populates the read-only "Type" field).
      // Classic always sends this list in callout payloads.
      const gridVisibleProperties = Object.values(tab.fields)
        .filter((f) => f.displayed && f.columnName)
        .flatMap((f) => {
          const propertyPath = f.column?.propertyPath;
          if (propertyPath) {
            return [f.columnName, propertyPath.replace(/\./g, "$")];
          }
          return [f.columnName];
        });

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
        _gridVisibleProperties: gridVisibleProperties,
      } as Record<string, any>;

      //TODO: This will imply the evaluation of out fiels inside the fieldBuilder an it's implementation in metadata module
      if (field.inputName === "inpmProductId" && optionData) {
        // Pricing fields (for order/invoice windows)
        calloutData.inpmProductId_CURR =
          optionData.product$currency$id || optionData.currency || session.$C_Currency_ID;
        calloutData.inpmProductId_UOM = optionData.product$uOM$id || optionData.uOM || session["#C_UOM_ID"];
        calloutData.inpmProductId_PSTD = String(optionData.standardPrice || optionData.netListPrice || 0);
        calloutData.inpmProductId_PLIST = String(optionData.netListPrice || 0);
        calloutData.inpmProductId_PLIM = String(optionData.priceLimit || 0);

        // Inventory/warehouse fields (from ProductStockView data)
        calloutData.inpmProductId_ATR = String(optionData.attributeSetValue || optionData.attributeSetValue$id || "");
        calloutData.inpmProductId_LOC = String(optionData.storageBin || optionData.storageBin$id || "");
        calloutData.inpmProductId_QTY = String(optionData.quantityOnHand || 0);
        calloutData.inpmProductId_PUOM = "";
        calloutData.inpmProductId_PQTY = "";
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
    field.hqlName,
    tab,
    getValues,
    fieldsByHqlName,
    session,
    fieldsByColumnName,
    optionData,
    debouncedCallout,
    applyColumnValues,
    applyAuxiliaryInputValues,
    dependentPropertyFields.length,
  ]);

  const shouldExecuteCallout = useCallback((): boolean => {
    if (!field.column.callout && dependentPropertyFields.length === 0) return false;
    if (isSettingFromCallout.current) return false;
    if (globalCalloutManager.isSuppressed()) return false;

    if (isFormInitializing) return false;
    if (isSettingInitialValues) return false;

    if (formMode === FormMode.NEW) {
      const fieldState = formState.dirtyFields[field.hqlName];
      if (!fieldState) {
        if (isDebugCallouts()) {
          logger.debug(`[Callout] Skipped (field not dirty in NEW mode): ${field.hqlName}`, {
            formState: formState.dirtyFields,
            fieldState,
          });
        }
        return false;
      }
    }

    if (previousValue.current === value) return false;

    return true;
  }, [
    field.hqlName,
    field.column.callout,
    value,
    isFormInitializing,
    isSettingInitialValues,
    formMode,
    formState.dirtyFields,
    ready,
    dependentPropertyFields.length,
  ]);

  const runCallout = useCallback(async () => {
    // Prevent callout execution if component is not ready or data is still loading
    if (!ready.current) return;

    if (isDebugCallouts()) {
      logger.debug(`[Callout] Attempting to run callout for field: ${field.hqlName}`, {
        hasCallout: !!field.column.callout,
        hasDependentProperties: dependentPropertyFields.length > 0,
        value,
        previousValue: previousValue.current,
        isSettingFromCallout: isSettingFromCallout.current,
        isFormInitializing,
        isSettingInitialValues,
        fieldDirty: formState.dirtyFields[field.hqlName],
        isCalloutRunning: globalCalloutManager.isCalloutRunning(),
        isSuppressed: globalCalloutManager.isSuppressed(),
      });
    }

    if (isFormInitializing || isSettingInitialValues) {
      if (isDebugCallouts()) {
        logger.debug(`[Callout] Skipped & Synced (Init): ${field.hqlName}`, {
          value,
          isFormInitializing,
          isSettingInitialValues,
        });
      }
      previousValue.current = value;
      return;
    }

    if (!shouldExecuteCallout()) return;

    if (globalCalloutManager.isCalloutRunning()) {
      if (isDebugCallouts()) logger.debug(`[Callout] Deferred (callout running): ${field.hqlName}`);
      await globalCalloutManager.executeCallout(field.hqlName, executeCallout);
      return;
    }

    previousValue.current = value;

    if (isDebugCallouts()) logger.debug(`[Callout] Executing callout for field: ${field.hqlName}`, { value });
    await globalCalloutManager.executeCallout(field.hqlName, executeCallout);
  }, [
    field.hqlName,
    field.column.callout,
    shouldExecuteCallout,
    value,
    executeCallout,
    isFormInitializing,
    isSettingInitialValues,
    formState.dirtyFields,
  ]);

  useEffect(() => {
    if (ready.current) {
      runCallout();
    } else {
      ready.current = true;
    }
  }, [runCallout, value]);

  useEffect(() => {
    if (isFormInitializing) {
      setIsSettingInitialValues(true);
    } else {
      setIsSettingInitialValues(false);
    }
  }, [isFormInitializing, setIsSettingInitialValues]);

  if (isDisplayed) {
    const isTextLong = field.column.reference === FIELD_REFERENCE_CODES.TEXT_LONG;
    const containerClasses = isTextLong ? "row-span-3 flex items-start pt-2" : "h-12 flex items-center";

    return (
      <div
        className={`${containerClasses} title={field.helpComment || ''}`}
        aria-describedby={field.helpComment ? `${field.name}-help` : ""}>
        <div className="w-1/3 flex items-center gap-2 pr-2">
          <Label field={field} data-testid="Label__38060a" />
          {field.isMandatory && (
            <Asterisk
              className="fill-(--color-error-main) h-3 w-3 min-w-3 min-h-3"
              data-testid={`Asterisk__${field.id}`}
            />
          )}
          <div className="flex-1 self-center h-[2px] bg-[length:4px_2px] bg-repeat-x bg-[radial-gradient(circle,var(--color-transparent-neutral-20)_1px,transparent_1px)]" />
        </div>
        <div className="w-2/3">
          <GenericSelector field={field} isReadOnly={isReadOnly} data-testid="GenericSelector__38060a" />
        </div>
      </div>
    );
  }
  return <input type="hidden" {...register(field.hqlName)} />;
};

const BaseSelector = memo(BaseSelectorComp);
export { BaseSelector };
export default BaseSelector;
