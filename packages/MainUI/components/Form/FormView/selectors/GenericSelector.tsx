import type { Field } from "@workspaceui/api-client/src/api/types";
import { memo } from "react";
import { CUSTOM_SELECTORS_IDENTIFIERS } from "@/utils/form/constants";
import { useFormContext } from "react-hook-form";
import { BooleanSelector } from "./BooleanSelector";
import { DateSelector } from "./DateSelector";
import { ListSelector } from "./ListSelector";
import { NumericSelector } from "./NumericSelector";
import QuantitySelector from "./QuantitySelector";
import { SelectSelector } from "./SelectSelector";
import { StringSelector } from "./StringSelector";
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
    case "95E2A8B50A254B2AAE6774B8C2F28120": // Product reference to datasource
    case "19":
    case "18":
      return <TableDirSelector field={field} isReadOnly={isReadOnly} />;
    case "15":
      return <DateSelector field={field} isReadOnly={isReadOnly} />;
    case "16":
      return <DatetimeSelector field={field} isReadOnly={isReadOnly} />;
    case "20":
      return <BooleanSelector field={field} isReadOnly={isReadOnly} />;
    case "29":
    case "22":
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
    case "17":
    case "13":
      return <ListSelector field={field} isReadOnly={isReadOnly} />;
    case "30":
      if (
        field.column.referenceSearchKey === "21" ||
        field.column.referenceSearchKey$_identifier === CUSTOM_SELECTORS_IDENTIFIERS.LOCATION
      ) {
        return <LocationSelector field={field} isReadOnly={isReadOnly} />;
      }
      return <SelectSelector field={field} isReadOnly={isReadOnly} />;
    case "800008":
      return <NumericSelector field={field} type="decimal" readOnly={isReadOnly} />;
    case "11":
      return <NumericSelector field={field} type="integer" readOnly={isReadOnly} />;
    default:
      return <StringSelector field={field} readOnly={isReadOnly} />;
  }
};

const GenericSelector = memo(GenericSelectorCmp);
export { GenericSelector };
export default GenericSelector;
