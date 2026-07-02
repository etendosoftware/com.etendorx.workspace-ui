import type { ProcessParameter, Field, EntityValue } from "@workspaceui/api-client/src/api/types";
import type { ExtendedProcessParameter } from "../types/ProcessParameterExtensions";
import type { ProcessSelectorContext } from "@/hooks/types";
import { memo, useMemo } from "react";
import { useUserStore } from "@/stores/userStore";
import { useFormContext } from "react-hook-form";
import { logger } from "@/utils/logger";
import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
import Label from "@/components/Label";

// Import FormView selectors for reuse
import { PasswordSelector } from "@/components/Form/FormView/selectors/PasswordSelector";
import { BooleanSelector } from "@/components/Form/FormView/selectors/BooleanSelector";
import { NumericSelector } from "@/components/Form/FormView/selectors/NumericSelector";
import { DateSelector } from "@/components/Form/FormView/selectors/DateSelector";
import DatetimeSelector from "@/components/Form/FormView/selectors/DatetimeSelector";
import { SelectSelector } from "@/components/Form/FormView/selectors/SelectSelector";
import { TableDirSelector } from "@/components/Form/FormView/selectors/TableDirSelector";
import QuantitySelector from "@/components/Form/FormView/selectors/QuantitySelector";
import { ListSelector } from "@/components/Form/FormView/selectors/ListSelector";
import { ImageSelector } from "@/components/Form/FormView/selectors/ImageSelector";
import { MultiRecordSelector } from "@/components/Form/FormView/selectors/MultiRecordSelector";

// Import mapper
import { ProcessParameterMapper } from "../mappers/ProcessParameterMapper";

// Import existing ProcessModal selectors for fallback
import GenericSelector from "./GenericSelector";
import { UploadFileSelector } from "./UploadFileSelector";
import LegacySelectorAffix from "./LegacySelectorAffix";

interface ProcessParameterSelectorProps {
  parameter: ProcessParameter | ExtendedProcessParameter;
  logicFields?: Record<string, boolean>; // Optional logic fields from process defaults
  // Runtime label overrides set by migrated scripts (item.setTitle). Keyed by
  // parameter name; when present, the override replaces the static label.
  labelOverrides?: Record<string, string>;
  parameters?: Record<string, ProcessParameter>;
  recordValues?: Record<string, unknown>;
  parentFields?: Record<string, Field>;
  selectedRecordsCount?: number;
  onFileChange?: (paramName: string, file: File | null) => void;
  // Stabilized form values passed from the parent. Each selector previously called
  // `watch()` on its own, registering 20–30 global subscribers that re-rendered
  // every selector on every keystroke. Receiving values as a prop lets the parent
  // own the single subscription and React.memo skip re-renders of unaffected selectors.
  values?: Record<string, unknown>;
  // Process Definition id propagated from `ProcessDefinitionModal`. Combined
  // with `values`, it lets tabledir selectors build the cascading datasource
  // payload (`_processDefinitionId`, `_selectorFieldId`, raw form keys) that
  // Classic emits via `OBSelectorItem.prepareDSRequest`.
  processId?: string;
}

import { createProcessExpressionContext, isParameterDisplayed } from "../utils/processExpressionUtils";
import { toClassicBoolean } from "@/utils/toClassicBoolean";

// ... imports remain the same

/**
 * Main selector component that routes ProcessParameters to appropriate form controls
 * This component bridges ProcessParameters with FormView selectors for consistent UI
 */
const EMPTY_VALUES: Record<string, unknown> = {};

/**
 * Translates a form-values map keyed by ProcessParameter display names into a
 * map keyed by raw `dBColumnName`s. Mirrors the Classic pickList payload —
 * `OB.getParameters().get('received_in')` server-side expects raw keys, not
 * `"Received In"`. Returns `{}` when `parameters` is empty.
 */
export const mapValuesByDBColumnName = (
  values: Record<string, unknown>,
  parameters: Record<string, ProcessParameter> | undefined
): Record<string, EntityValue> => {
  const out: Record<string, EntityValue> = {};
  if (!parameters) return out;
  for (const parameter of Object.values(parameters)) {
    const dbKey = parameter.dBColumnName;
    if (!dbKey) continue;
    const value = values[parameter.name];
    if (value === undefined) continue;
    out[dbKey] = value as EntityValue;
  }
  return out;
};

const ProcessParameterSelectorImpl = ({
  parameter,
  logicFields,
  labelOverrides,
  parameters,
  recordValues,
  parentFields,
  selectedRecordsCount,
  onFileChange,
  values = EMPTY_VALUES,
  processId,
}: ProcessParameterSelectorProps) => {
  const session = useUserStore((s) => s.session);
  const { watch, register } = useFormContext();

  // Map ProcessParameter to Field interface for FormView selector compatibility
  const mappedField = useMemo(() => {
    return ProcessParameterMapper.mapToField(parameter);
  }, [parameter]);

  // Create smart context for expression evaluation using shared utility
  const evaluationContext = useMemo(() => {
    return createProcessExpressionContext({
      values,
      parameters,
      recordValues,
      parentFields,
      session,
    });
  }, [parameters, values, recordValues, parentFields, session]);

  // Evaluate display logic via the shared helper, so the script-facing
  // `item.isVisible()` proxy and the rendered field always agree on visibility.
  const isDisplayed = useMemo(
    () => isParameterDisplayed({ parameter, logicFields, values, evaluationContext }),
    [parameter, logicFields, values, evaluationContext]
  );

  // Evaluate readonly logic expression (EXACT same logic as BaseSelector lines 83-95)
  const isReadOnly = useMemo(() => {
    // Check mapped field properties first (isReadOnly from field metadata)
    if (mappedField.isReadOnly) return true;

    // Check if field is updatable (Process parameters don't have formMode, so skip this check)
    // if (!mappedField.isUpdatable) return FormMode.NEW !== formMode;

    // Check process defaults logic (takes precedence over parameter logic)
    // Try both parameter.name and dBColumnName formats
    const defaultsReadOnlyLogic =
      logicFields?.[`${parameter.name}.readonly`] ?? logicFields?.[`${parameter.dBColumnName}.readonly`];

    if (defaultsReadOnlyLogic !== undefined) {
      return defaultsReadOnlyLogic;
    }

    // Check if parameter has readOnlyLogic (not readOnlyLogicExpression)
    const readOnlyExpression = parameter.readOnlyLogicExpression || parameter.readOnlyLogic;

    // Fallback to parameter's own readonly logic
    if (!readOnlyExpression) return false;

    try {
      const compiledExpr = compileExpression(readOnlyExpression);
      return toClassicBoolean(compiledExpr(evaluationContext, evaluationContext));
    } catch (error) {
      logger.warn("Error executing readonly logic expression:", readOnlyExpression, error);
      return false; // Default to editable on error
    }
  }, [mappedField, parameter, logicFields, values, evaluationContext]);

  // Get field type for selector routing
  const fieldType = useMemo(() => {
    return ProcessParameterMapper.getFieldType(parameter);
  }, [parameter]);

  // Built only when the modal supplies a processId. The hook reads this to
  // emit the process-level cascade payload (raw param keys + meta keys) that
  // Classic injects from `OBSelectorItem.prepareDSRequest`. Stays `undefined`
  // for non-process contexts so the standard selector flow is untouched.
  //
  // The form is registered with display-name keys (e.g. "Payment Method",
  // "Invoice Organization") because that's how ProcessParameterMapper sets
  // `field.hqlName`. Classic's payload uses the raw `dBColumnName` keys
  // (`payment_method`, `ad_org_id`). We remap here by walking the parameters
  // metadata: each entry contributes `values[parameter.name]` under its
  // `dBColumnName`.
  const processContext = useMemo<ProcessSelectorContext | undefined>(() => {
    if (!processId) return undefined;
    return { processId, values: mapValuesByDBColumnName(values, parameters) };
  }, [processId, values, parameters]);

  // Don't render if display logic evaluates to false
  // EXCEPT for auxiliary logic fields (*_readonly_logic, *_display_logic) which need to be in the form
  const isAuxiliaryLogicField =
    parameter.name?.endsWith("_readonly_logic") ||
    parameter.name?.endsWith("_display_logic") ||
    parameter.dBColumnName?.endsWith("_readonly_logic") ||
    parameter.dBColumnName?.endsWith("_display_logic");

  // Don't render Button type parameters (used for defining process actions "Done", "Cancel" etc)
  if (parameter.reference === "28") {
    return null;
  }

  if (!isDisplayed && !isAuxiliaryLogicField) {
    return null;
  }

  // Render auxiliary logic fields as hidden inputs
  if (isAuxiliaryLogicField) {
    // Register with dBColumnName because readOnlyLogic expressions use that format
    const fieldName = parameter.dBColumnName || parameter.name;
    // Don't render if we don't have a valid field name
    if (!fieldName) {
      return null;
    }
    return <input type="hidden" {...register(fieldName)} />;
  }

  // Render the appropriate selector based on field type
  const renderSelector = () => {
    try {
      // Validate field mapping before rendering
      if (!mappedField.hqlName) {
        logger.warn("Missing hqlName for parameter:", parameter.name);
        return <GenericSelector parameter={parameter} readOnly={isReadOnly} data-testid="GenericSelector__dac06b" />;
      }

      switch (fieldType) {
        case "password":
          return (
            <PasswordSelector
              field={mappedField}
              disabled={isReadOnly}
              placeholder={parameter.description}
              data-testid="PasswordSelector__dac06b"
            />
          );

        case "boolean":
          return <BooleanSelector field={mappedField} isReadOnly={isReadOnly} data-testid="BooleanSelector__dac06b" />;

        case "numeric":
          return (
            <NumericSelector
              field={mappedField}
              disabled={isReadOnly}
              placeholder={parameter.description}
              data-testid="NumericSelector__dac06b"
            />
          );

        case "date":
          return <DateSelector field={mappedField} isReadOnly={isReadOnly} data-testid="DateSelector__dac06b" />;

        case "datetime":
          return (
            <DatetimeSelector field={mappedField} isReadOnly={isReadOnly} data-testid="DatetimeSelector__dac06b" />
          );

        case "select":
          return (
            <SelectSelector
              field={mappedField}
              isReadOnly={isReadOnly}
              pageSize={20}
              initialPageSize={20}
              data-testid="SelectSelector__dac06b"
            />
          );

        case "tabledir":
        case "product": {
          // Extract static options from selector.response if available
          const staticOptions = parameter.selector?.response;
          const tableDirSelector = (
            <TableDirSelector
              field={mappedField}
              isReadOnly={isReadOnly}
              isProcessModal={true}
              selectedRecordsCount={selectedRecordsCount}
              staticOptions={staticOptions}
              processContext={processContext}
              data-testid="TableDirSelector__dac06b"
            />
          );
          // When the parameter is backed by a Classic Search reference, the metadata
          // carries the legacy info-window URL: render a search button that opens that
          // popup (delegated to the legacy UI) and writes the picked record back.
          const legacySearchUrl = mappedField.selector?.legacySearchUrl;
          if (typeof legacySearchUrl === "string" && legacySearchUrl.length > 0) {
            return (
              <LegacySelectorAffix
                field={mappedField}
                legacySearchUrl={legacySearchUrl}
                isReadOnly={isReadOnly}
                data-testid="LegacySelectorAffix__dac06b">
                {tableDirSelector}
              </LegacySelectorAffix>
            );
          }
          return tableDirSelector;
        }

        case "quantity":
          return <QuantitySelector allowNegative={true} field={mappedField} data-testid="QuantitySelector__dac06b" />;

        case "image":
          return <ImageSelector field={mappedField} isReadOnly={isReadOnly} data-testid="ImageSelector__dac06b" />;

        case "multiselect":
          return (
            <MultiRecordSelector
              field={mappedField}
              isReadOnly={isReadOnly}
              data-testid="MultiRecordSelector__dac06b"
            />
          );

        case "list":
          if (!mappedField.refList || mappedField.refList.length === 0) {
            logger.warn("List field without options, falling back to GenericSelector:", parameter.name);
            return (
              <GenericSelector parameter={parameter} readOnly={isReadOnly} data-testid="GenericSelector__dac06b" />
            );
          }
          return <ListSelector field={mappedField} isReadOnly={isReadOnly} data-testid="ListSelector__dac06b" />;

        case "uploadfile":
          return (
            <UploadFileSelector
              field={mappedField}
              disabled={isReadOnly}
              onFileChange={onFileChange}
              data-testid="UploadFileSelector__dac06b"
            />
          );

        default:
          // Fallback to GenericSelector for text, window references, and unknown types
          return <GenericSelector parameter={parameter} readOnly={isReadOnly} data-testid="GenericSelector__dac06b" />;
      }
    } catch (error) {
      logger.error("Error rendering selector for parameter:", parameter.name, error);
      // Fallback to GenericSelector on error
      return <GenericSelector parameter={parameter} readOnly={isReadOnly} data-testid="GenericSelector__dac06b" />;
    }
  };

  return (
    <div className="h-12 flex items-center" title={parameter.description}>
      <div className="w-1/3 flex items-center gap-2 pr-2">
        <Label
          htmlFor={parameter.name}
          name={labelOverrides?.[parameter.name] ?? parameter.name}
          data-testid="Label__dac06b"
        />
        {parameter.mandatory && (
          <span className="text-[#DC143C] font-bold min-w-[12px]" aria-required>
            *
          </span>
        )}
        <div className="flex-1 self-center h-[2px] bg-[length:4px_2px] bg-repeat-x bg-[radial-gradient(circle,var(--color-transparent-neutral-20)_1px,transparent_1px)]" />
      </div>
      <div className="w-2/3">{renderSelector()}</div>
    </div>
  );
};

export const ProcessParameterSelector = memo(ProcessParameterSelectorImpl);

export default ProcessParameterSelector;
