import type { Field } from "@workspaceui/api-client/src/api/types";
import { memo } from "react";
import { CUSTOM_SELECTORS_IDENTIFIERS, FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import { useFormContext } from "react-hook-form";
import { BooleanSelector } from "./BooleanSelector";
import { DateSelector } from "./DateSelector";
import { ListSelector } from "./ListSelector";
import { NumericSelector } from "./NumericSelector";
import QuantitySelector from "./QuantitySelector";
import { SelectSelector } from "./SelectSelector";
import { StringSelector } from "./StringSelector";
import { PasswordSelector } from "./PasswordSelector";
import { TableDirSelector } from "./TableDirSelector";
import DatetimeSelector from "./DatetimeSelector";
import LocationSelector from "./LocationSelector";

export type GenericSelectorProps = {
  field: Field;
  isReadOnly: boolean;
};

const GenericSelectorCmp = ({ field, isReadOnly }: GenericSelectorProps) => {
  const { watch } = useFormContext();
  const value = watch(field.hqlName);
  const { reference } = field.column;

  switch (reference) {
    case FIELD_REFERENCE_CODES.PASSWORD:
      return <PasswordSelector field={field} readOnly={isReadOnly} />;
    case FIELD_REFERENCE_CODES.PRODUCT: // Product reference to datasource
    case FIELD_REFERENCE_CODES.TABLE_DIR_19:
    case FIELD_REFERENCE_CODES.TABLE_DIR_18:
      return <TableDirSelector field={field} isReadOnly={isReadOnly} />;
    case FIELD_REFERENCE_CODES.DATE:
      return <DateSelector field={field} isReadOnly={isReadOnly} />;
    case FIELD_REFERENCE_CODES.DATETIME:
      return <DatetimeSelector field={field} isReadOnly={isReadOnly} />;
    case FIELD_REFERENCE_CODES.BOOLEAN:
      return <BooleanSelector field={field} isReadOnly={isReadOnly} />;
    case FIELD_REFERENCE_CODES.QUANTITY_29:
    case FIELD_REFERENCE_CODES.QUANTITY_22:
      return (
        <QuantitySelector
          field={field}
          name={field.hqlName}
          value={value}
          min={field.column.minValue}
          max={field.column.maxValue}
          readOnly={isReadOnly}
          maxLength={field.column.length}
        />
      );
    case FIELD_REFERENCE_CODES.LIST_17:
    case FIELD_REFERENCE_CODES.LIST_13:
      return <ListSelector field={field} isReadOnly={isReadOnly} />;
    case FIELD_REFERENCE_CODES.SELECT_30:
      if (
        field.column.referenceSearchKey === FIELD_REFERENCE_CODES.LOCATION_21 ||
        field.column.referenceSearchKey$_identifier === CUSTOM_SELECTORS_IDENTIFIERS.LOCATION
      ) {
        return <LocationSelector field={field} isReadOnly={isReadOnly} />;
      }
      return <SelectSelector field={field} isReadOnly={isReadOnly} />;
    case FIELD_REFERENCE_CODES.DECIMAL:
      return <NumericSelector field={field} type="decimal" readOnly={isReadOnly} />;
    case FIELD_REFERENCE_CODES.INTEGER:
      return <NumericSelector field={field} type="integer" readOnly={isReadOnly} />;
    default:
      return <StringSelector field={field} readOnly={isReadOnly} />;
  }
};

const GenericSelector = memo(GenericSelectorCmp);
export { GenericSelector };
export default GenericSelector;
