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

import type { Field } from "@workspaceui/api-client/src/api/types";
import { memo } from "react";
import { CUSTOM_SELECTORS_IDENTIFIERS, FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import { BooleanSelector } from "./BooleanSelector";
import { DateSelector } from "./DateSelector";
import { ListSelector } from "./ListSelector";
import { NumericSelector } from "./NumericSelector";
import QuantitySelector from "./QuantitySelector";
import { SelectSelector } from "./SelectSelector";
import { StringSelector } from "./StringSelector";
import { TextLongSelector } from "./TextLongSelector";
import { PasswordSelector } from "./PasswordSelector";
import { TableDirSelector } from "./TableDirSelector";
import DatetimeSelector from "./DatetimeSelector";
import LocationSelector from "./LocationSelector";
import { TimeSelector } from "./TimeSelector";

export type GenericSelectorProps = {
  field: Field;
  isReadOnly: boolean;
};

const GenericSelectorCmp = ({ field, isReadOnly }: GenericSelectorProps) => {
  // Reference mapping corrected - "10" now properly handled as STRING

  const { reference } = field.column;
  switch (reference) {
    case FIELD_REFERENCE_CODES.PASSWORD:
      return <PasswordSelector field={field} readOnly={isReadOnly} data-testid="PasswordSelector__6e80fa" />;
    case FIELD_REFERENCE_CODES.PRODUCT: // Product reference to datasource
    case FIELD_REFERENCE_CODES.SELECTOR: // Generic selector (includes Product)
    case FIELD_REFERENCE_CODES.TABLE_DIR_19:
    case FIELD_REFERENCE_CODES.TABLE_DIR_18:
      return <TableDirSelector field={field} isReadOnly={isReadOnly} data-testid="TableDirSelector__6e80fa" />;
    case FIELD_REFERENCE_CODES.DATE:
      return <DateSelector field={field} isReadOnly={isReadOnly} data-testid="DateSelector__6e80fa" />;
    case FIELD_REFERENCE_CODES.DATETIME:
      return <DatetimeSelector field={field} isReadOnly={isReadOnly} data-testid="DatetimeSelector__6e80fa" />;
    case FIELD_REFERENCE_CODES.BOOLEAN:
      return <BooleanSelector field={field} isReadOnly={isReadOnly} data-testid="BooleanSelector__6e80fa" />;
    case FIELD_REFERENCE_CODES.QUANTITY_29:
    case FIELD_REFERENCE_CODES.QUANTITY_22:
      return (
        <QuantitySelector
          allowNegative={true}
          field={field}
          min={field.column.minValue}
          max={field.column.maxValue}
          data-testid="QuantitySelector__6e80fa"
        />
      );
    case FIELD_REFERENCE_CODES.TIME:
      return <TimeSelector field={field} isReadOnly={isReadOnly} data-testid={"TimeSelector__" + field.id} />;
    case FIELD_REFERENCE_CODES.LIST_17:
    case FIELD_REFERENCE_CODES.LIST_13:
      return <ListSelector field={field} isReadOnly={isReadOnly} data-testid="ListSelector__6e80fa" />;
    case FIELD_REFERENCE_CODES.SELECT_30:
      if (
        field.column.referenceSearchKey === FIELD_REFERENCE_CODES.LOCATION_21 ||
        field.column.referenceSearchKey$_identifier === CUSTOM_SELECTORS_IDENTIFIERS.LOCATION
      ) {
        return <LocationSelector field={field} isReadOnly={isReadOnly} data-testid="LocationSelector__6e80fa" />;
      }
      return <SelectSelector field={field} isReadOnly={isReadOnly} data-testid="SelectSelector__6e80fa" />;
    case FIELD_REFERENCE_CODES.DECIMAL:
    case FIELD_REFERENCE_CODES.NUMERIC:
    case FIELD_REFERENCE_CODES.RATE:
      return (
        <NumericSelector field={field} type="decimal" readOnly={isReadOnly} data-testid="NumericSelector__6e80fa" />
      );
    case FIELD_REFERENCE_CODES.INTEGER:
      return (
        <NumericSelector field={field} type="integer" readOnly={isReadOnly} data-testid="NumericSelector__6e80fa" />
      );
    case FIELD_REFERENCE_CODES.TEXT_LONG:
      return <TextLongSelector field={field} readOnly={isReadOnly} data-testid="TextLongSelector__6e80fa" />;
    default:
      return <StringSelector field={field} readOnly={isReadOnly} data-testid="StringSelector__6e80fa" />;
  }
};

const GenericSelector = memo(GenericSelectorCmp);
export { GenericSelector };
export default GenericSelector;
