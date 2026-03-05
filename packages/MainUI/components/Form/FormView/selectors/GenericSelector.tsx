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

import type { Field, EntityData } from "@workspaceui/api-client/src/api/types";
import SearchIcon from "@workspaceui/componentlibrary/src/assets/icons/search.svg";
import PlusIcon from "@workspaceui/componentlibrary/src/assets/icons/plus.svg";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";
import { memo, useState } from "react";
import {
  CUSTOM_SELECTORS_IDENTIFIERS,
  FIELD_REFERENCE_CODES,
  PRODUCT_STOCK_VIEW_REFERENCE_IDS,
} from "@/utils/form/constants";
import { getSelectorFieldName, updateSelectorValue } from "@/utils/form/selectors/utils";
import { toCamelCase } from "@/utils/commons";
import { BooleanSelector } from "./BooleanSelector";
import { DateSelector } from "./DateSelector";
import { ListSelector } from "./ListSelector";
import { NumericSelector } from "./NumericSelector";
import QuantitySelector from "./QuantitySelector";
import { SelectSelector } from "./SelectSelector";

import { ProductStockModalSelector } from "./ProductStockModalSelector";
import { StringSelector } from "./StringSelector";
import { TextLongSelector } from "./TextLongSelector";
import { PasswordSelector } from "./PasswordSelector";
import { TableDirSelector } from "./TableDirSelector";
import DatetimeSelector from "./DatetimeSelector";
import LocationSelector from "./LocationSelector";
import { TimeSelector } from "./TimeSelector";
import SelectorModal from "./SelectorModal";
import AttributeSetInstanceSelector from "./AttributeSetInstance";

import { useFormContext } from "react-hook-form";

export type GenericSelectorProps = {
  field: Field;
  isReadOnly: boolean;
};

const GenericSelectorCmp = ({ field, isReadOnly }: GenericSelectorProps) => {
  const { getValues, setValue } = useFormContext();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // if hqlName data is missing, try camelCase version
  let effectiveField = field;
  if (field.hqlName) {
    const values = getValues();
    const directValue = values[field.hqlName];

    if (directValue === undefined) {
      const camelKey = toCamelCase(field.hqlName);
      if (values[camelKey] !== undefined) {
        effectiveField = { ...field, hqlName: camelKey };
      }
    }
  }

  const { reference } = effectiveField.column;

  const isProductStockModal =
    effectiveField.selector?.datasourceName === "ProductStockView" ||
    (PRODUCT_STOCK_VIEW_REFERENCE_IDS as readonly string[]).includes(effectiveField.column.referenceSearchKey);

  if (isProductStockModal) {
    return (
      <ProductStockModalSelector
        field={effectiveField}
        isReadOnly={isReadOnly}
        data-testid={`ProductStockModalSelector__${field.id}`}
      />
    );
  }

  const SelectorComponent = (() => {
    switch (reference) {
      case FIELD_REFERENCE_CODES.PASSWORD:
        return <PasswordSelector field={effectiveField} readOnly={isReadOnly} data-testid="PasswordSelector__6e80fa" />;
      case FIELD_REFERENCE_CODES.PRODUCT: // Product reference to datasource
      case FIELD_REFERENCE_CODES.SELECTOR: // Generic selector (includes Product)
      case FIELD_REFERENCE_CODES.TABLE_DIR_19:
      case FIELD_REFERENCE_CODES.TABLE_DIR_18:
        return (
          <TableDirSelector field={effectiveField} isReadOnly={isReadOnly} data-testid="TableDirSelector__6e80fa" />
        );
      case FIELD_REFERENCE_CODES.DATE:
        return <DateSelector field={effectiveField} isReadOnly={isReadOnly} data-testid="DateSelector__6e80fa" />;
      case FIELD_REFERENCE_CODES.DATETIME:
        return (
          <DatetimeSelector field={effectiveField} isReadOnly={isReadOnly} data-testid="DatetimeSelector__6e80fa" />
        );
      case FIELD_REFERENCE_CODES.BOOLEAN:
        return <BooleanSelector field={effectiveField} isReadOnly={isReadOnly} data-testid="BooleanSelector__6e80fa" />;
      case FIELD_REFERENCE_CODES.QUANTITY_29:
      case FIELD_REFERENCE_CODES.QUANTITY_22:
        return (
          <QuantitySelector
            allowNegative={true}
            field={effectiveField}
            min={effectiveField.column.minValue}
            max={effectiveField.column.maxValue}
            isReadOnly={isReadOnly}
            data-testid="QuantitySelector__6e80fa"
          />
        );
      case FIELD_REFERENCE_CODES.TIME:
        return <TimeSelector field={field} isReadOnly={isReadOnly} data-testid={`TimeSelector__${field.id}`} />;
      case FIELD_REFERENCE_CODES.LIST_17:
      case FIELD_REFERENCE_CODES.LIST_13:
        return <ListSelector field={effectiveField} isReadOnly={isReadOnly} data-testid="ListSelector__6e80fa" />;
      case FIELD_REFERENCE_CODES.SELECT_30:
        if (
          effectiveField.column.referenceSearchKey === FIELD_REFERENCE_CODES.LOCATION_21 ||
          effectiveField.column.referenceSearchKey$_identifier === CUSTOM_SELECTORS_IDENTIFIERS.LOCATION
        ) {
          return (
            <LocationSelector field={effectiveField} isReadOnly={isReadOnly} data-testid="LocationSelector__6e80fa" />
          );
        }
        return <SelectSelector field={effectiveField} isReadOnly={isReadOnly} data-testid="SelectSelector__6e80fa" />;
      case FIELD_REFERENCE_CODES.DECIMAL:
      case FIELD_REFERENCE_CODES.NUMERIC:
      case FIELD_REFERENCE_CODES.RATE:
        return (
          <NumericSelector
            field={effectiveField}
            type="decimal"
            readOnly={isReadOnly}
            data-testid="NumericSelector__6e80fa"
          />
        );
      case FIELD_REFERENCE_CODES.INTEGER:
        return (
          <NumericSelector
            field={effectiveField}
            type="integer"
            readOnly={isReadOnly}
            data-testid="NumericSelector__6e80fa"
          />
        );
      case FIELD_REFERENCE_CODES.PATTRIBUTE:
        return (
          <AttributeSetInstanceSelector
            field={effectiveField}
            isReadOnly={isReadOnly}
            data-testid="AttributeSetInstanceSelector__6e80fa"
          />
        );
      case FIELD_REFERENCE_CODES.TEXT_LONG:
        return <TextLongSelector field={effectiveField} readOnly={isReadOnly} data-testid="TextLongSelector__6e80fa" />;
      default:
        return <StringSelector field={effectiveField} readOnly={isReadOnly} data-testid="StringSelector__6e80fa" />;
    }
  })();

  const { hasTableRelated, hasProcessDefinitionRelated } = effectiveField.selector || {};

  const handleSelect = (record: EntityData) => {
    if (record?.id) {
      const fieldName = getSelectorFieldName(effectiveField);
      updateSelectorValue(setValue, fieldName, record.id, record);
    }
  };

  return (
    <>
      <div className="flex w-full items-center gap-1">
        <div className="flex-grow min-w-0">{SelectorComponent}</div>
        {hasTableRelated && !isReadOnly && (
          <IconButton
            onClick={() => setIsSearchModalOpen(true)}
            className="w-8 h-8 flex-shrink-0"
            tooltip="Search"
            tooltipPosition="top"
            data-testid={`IconButton__${field.id}`}>
            <SearchIcon className="w-5 h-5 fill-current" data-testid={`SearchIcon__${field.id}`} />
          </IconButton>
        )}
        {hasProcessDefinitionRelated && !isReadOnly && (
          <IconButton
            onClick={() => console.log("Process clicked")}
            className="w-8 h-8 flex-shrink-0"
            tooltip="Add"
            tooltipPosition="top"
            data-testid={`IconButton__${field.id}`}>
            <PlusIcon className="w-5 h-5 fill-current" data-testid={`PlusIcon__${field.id}`} />
          </IconButton>
        )}
      </div>
      {isSearchModalOpen && (
        <SelectorModal
          field={effectiveField}
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          onSelect={handleSelect}
          data-testid={`SelectorModal__${field.id}`}
        />
      )}
    </>
  );
};

const GenericSelector = memo(GenericSelectorCmp);
export { GenericSelector };
export default GenericSelector;
