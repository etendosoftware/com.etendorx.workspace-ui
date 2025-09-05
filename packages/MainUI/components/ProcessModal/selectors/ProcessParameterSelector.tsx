import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";
import type { ExtendedProcessParameter } from "../types/ProcessParameterExtensions";
import { useMemo } from "react";
import { useUserContext } from "@/hooks/useUserContext";
import { useFormContext } from "react-hook-form";
import { logger } from "@/utils/logger";
import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
import Label from "@/components/Label";

// Import FormView selectors for reuse
import { PasswordSelector } from "@/components/Form/FormView/selectors/PasswordSelector";
import { BooleanSelector } from "@/components/Form/FormView/selectors/BooleanSelector";
import { NumericSelector } from "@/components/Form/FormView/selectors/NumericSelector";
import { DateSelector } from "@/components/Form/FormView/selectors/DateSelector";
import { DatetimeSelector } from "@/components/Form/FormView/selectors/DatetimeSelector";
import { SelectSelector } from "@/components/Form/FormView/selectors/SelectSelector";
import { TableDirSelector } from "@/components/Form/FormView/selectors/TableDirSelector";
import QuantitySelector from "@/components/Form/FormView/selectors/QuantitySelector";
import { ListSelector } from "@/components/Form/FormView/selectors/ListSelector";

// Import mapper
import { ProcessParameterMapper } from "../mappers/ProcessParameterMapper";

// Import existing ProcessModal selectors for fallback
import GenericSelector from "./GenericSelector";

interface ProcessParameterSelectorProps {
  parameter: ProcessParameter | ExtendedProcessParameter;
  logicFields?: Record<string, boolean>; // Optional logic fields from process defaults
}

/**
 * Main selector component that routes ProcessParameters to appropriate form controls
 * This component bridges ProcessParameters with FormView selectors for consistent UI
 */
export const ProcessParameterSelector = ({ parameter, logicFields }: ProcessParameterSelectorProps) => {
  const { session } = useUserContext();
  const { getValues } = useFormContext();

  // Map ProcessParameter to Field interface for FormView selector compatibility
  const mappedField = useMemo(() => {
    return ProcessParameterMapper.mapToField(parameter);
  }, [parameter]);

  // Evaluate display logic expression (combine parameter logic with process defaults logic)
  const isDisplayed = useMemo(() => {
    // Check process defaults logic first (takes precedence)
    const defaultsDisplayLogic = logicFields?.[`${parameter.name}.display`];
    if (defaultsDisplayLogic !== undefined) {
      return defaultsDisplayLogic;
    }

    // Fallback to parameter's own display logic
    if (!parameter.displayLogic) return true;

    // Skip compilation if display logic looks like a field name (contains underscores and ends with _logic)
    if (parameter.displayLogic.includes("_logic") && !parameter.displayLogic.includes("@")) {
      logger.warn("Invalid display logic expression - looks like field name:", parameter.displayLogic);
      return true; // Default to visible for malformed expressions
    }

    // WAIT for form data to be available before evaluating expressions
    const currentValues = getValues();
    if (!currentValues || Object.keys(currentValues).length === 0) {
      // Form data not loaded yet, default to visible to avoid errors
      return true;
    }

    try {
      const compiledExpr = compileExpression(parameter.displayLogic);
      return compiledExpr(session, currentValues);
    } catch (error) {
      logger.warn("Error executing display logic expression:", parameter.displayLogic, error);
      return true; // Default to visible on error
    }
  }, [parameter.displayLogic, parameter.name, logicFields, session, getValues]);

  // Evaluate readonly logic expression (combine parameter logic with process defaults logic)
  const isReadOnly = useMemo(() => {
    // Check process defaults logic first (takes precedence)
    const defaultsReadOnlyLogic = logicFields?.[`${parameter.name}.readonly`];
    if (defaultsReadOnlyLogic !== undefined) {
      return defaultsReadOnlyLogic;
    }

    // Fallback to parameter's own readonly logic
    if (!parameter.readOnlyLogicExpression) return false;

    try {
      const compiledExpr = compileExpression(parameter.readOnlyLogicExpression);
      return compiledExpr(session, getValues());
    } catch (error) {
      logger.warn("Error executing readonly logic expression:", parameter.readOnlyLogicExpression, error);
      return false; // Default to editable on error
    }
  }, [parameter.readOnlyLogicExpression, parameter.name, logicFields, session, getValues]);

  // Get field type for selector routing
  const fieldType = useMemo(() => {
    return ProcessParameterMapper.getFieldType(parameter);
  }, [parameter]);

  // Don't render if display logic evaluates to false
  if (!isDisplayed) {
    return null;
  }

  // Render the appropriate selector based on field type
  const renderSelector = () => {
    try {
      // Validate field mapping before rendering
      if (!mappedField.hqlName) {
        logger.warn("Missing hqlName for parameter:", parameter.name);
        return <GenericSelector parameter={parameter} readOnly={isReadOnly} />;
      }

      switch (fieldType) {
        case "password":
          return <PasswordSelector field={mappedField} disabled={isReadOnly} placeholder={parameter.description} />;

        case "boolean":
          return <BooleanSelector field={mappedField} isReadOnly={isReadOnly} />;

        case "numeric":
          return <NumericSelector field={mappedField} disabled={isReadOnly} placeholder={parameter.description} />;

        case "date":
          return <DateSelector field={mappedField} isReadOnly={isReadOnly} />;

        case "datetime":
          return <DatetimeSelector field={mappedField} isReadOnly={isReadOnly} />;

        case "select":
          return <SelectSelector field={mappedField} isReadOnly={isReadOnly} pageSize={20} initialPageSize={20} />;

        case "tabledir":
        case "product":
          return <TableDirSelector field={mappedField} isReadOnly={isReadOnly} />;

        case "quantity":
          return <QuantitySelector field={mappedField} />;

        case "list":
          if (!mappedField.refList || mappedField.refList.length === 0) {
            logger.warn("List field without options, falling back to GenericSelector:", parameter.name);
            return <GenericSelector parameter={parameter} readOnly={isReadOnly} />;
          }
          return <ListSelector field={mappedField} isReadOnly={isReadOnly} />;

        default:
          // Fallback to GenericSelector for text, window references, and unknown types
          return <GenericSelector parameter={parameter} readOnly={isReadOnly} />;
      }
    } catch (error) {
      logger.error("Error rendering selector for parameter:", parameter.name, error);
      // Fallback to GenericSelector on error
      return <GenericSelector parameter={parameter} readOnly={isReadOnly} />;
    }
  };

  return (
    <div className="flex flex-col gap-4 items-start justify-start" title={parameter.description}>
      <div className="relative pr-2">
        {parameter.mandatory && (
          <span className="absolute -top-1 right-0 text-[#DC143C] font-bold" aria-required>
            *
          </span>
        )}
        <Label htmlFor={parameter.name} name={parameter.name} />
      </div>
      <div className="w-full pb-8">{renderSelector()}</div>
    </div>
  );
};

export default ProcessParameterSelector;
