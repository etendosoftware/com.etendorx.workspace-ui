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
import { memo, useCallback, useState } from "react";
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
import ProcessDefinitionModal from "@/components/ProcessModal/ProcessDefinitionModal";
import type { ProcessDefinitionButton } from "@/components/ProcessModal/types";
import { PROCESS_TYPES } from "@/utils/processes/definition/constants";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { useFormContext } from "react-hook-form";

export type GenericSelectorProps = {
  field: Field;
  isReadOnly: boolean;
};

const GenericSelectorCmp = ({ field, isReadOnly }: GenericSelectorProps) => {
  const { getValues, setValue } = useFormContext();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [processButtonData, setProcessButtonData] = useState<ProcessDefinitionButton | null>(null);

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
      case FIELD_REFERENCE_CODES.PASSWORD.id:
        return <PasswordSelector field={effectiveField} readOnly={isReadOnly} data-testid="PasswordSelector__6e80fa" />;
      case FIELD_REFERENCE_CODES.PRODUCT.id: // Product reference to datasource
      case FIELD_REFERENCE_CODES.SELECTOR.id: // Generic selector (includes Product)
      case FIELD_REFERENCE_CODES.TABLE_DIR_19.id:
      case FIELD_REFERENCE_CODES.TABLE_DIR_18.id:
        return (
          <TableDirSelector field={effectiveField} isReadOnly={isReadOnly} data-testid="TableDirSelector__6e80fa" />
        );
      case FIELD_REFERENCE_CODES.DATE.id:
        return <DateSelector field={effectiveField} isReadOnly={isReadOnly} data-testid="DateSelector__6e80fa" />;
      case FIELD_REFERENCE_CODES.DATETIME.id:
        return (
          <DatetimeSelector field={effectiveField} isReadOnly={isReadOnly} data-testid="DatetimeSelector__6e80fa" />
        );
      case FIELD_REFERENCE_CODES.BOOLEAN.id:
        return <BooleanSelector field={effectiveField} isReadOnly={isReadOnly} data-testid="BooleanSelector__6e80fa" />;
      case FIELD_REFERENCE_CODES.QUANTITY_29.id:
      case FIELD_REFERENCE_CODES.QUANTITY_22.id:
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
      case FIELD_REFERENCE_CODES.TIME.id:
        return <TimeSelector field={field} isReadOnly={isReadOnly} data-testid={`TimeSelector__${field.id}`} />;
      case FIELD_REFERENCE_CODES.LIST_17.id:
      case FIELD_REFERENCE_CODES.LIST_13.id:
        return <ListSelector field={effectiveField} isReadOnly={isReadOnly} data-testid="ListSelector__6e80fa" />;
      case FIELD_REFERENCE_CODES.SELECT_30.id:
        if (
          effectiveField.column.referenceSearchKey === FIELD_REFERENCE_CODES.LOCATION_21.id ||
          effectiveField.column.referenceSearchKey$_identifier === CUSTOM_SELECTORS_IDENTIFIERS.LOCATION
        ) {
          return (
            <LocationSelector field={effectiveField} isReadOnly={isReadOnly} data-testid="LocationSelector__6e80fa" />
          );
        }
        return <SelectSelector field={effectiveField} isReadOnly={isReadOnly} data-testid="SelectSelector__6e80fa" />;
      case FIELD_REFERENCE_CODES.DECIMAL.id:
      case FIELD_REFERENCE_CODES.NUMERIC.id:
      case FIELD_REFERENCE_CODES.RATE.id:
        return (
          <NumericSelector
            field={effectiveField}
            type="decimal"
            readOnly={isReadOnly}
            data-testid="NumericSelector__6e80fa"
          />
        );
      case FIELD_REFERENCE_CODES.INTEGER.id:
        return (
          <NumericSelector
            field={effectiveField}
            type="integer"
            readOnly={isReadOnly}
            data-testid="NumericSelector__6e80fa"
          />
        );
      case FIELD_REFERENCE_CODES.PATTRIBUTE.id:
        return (
          <AttributeSetInstanceSelector
            field={effectiveField}
            isReadOnly={isReadOnly}
            data-testid="AttributeSetInstanceSelector__6e80fa"
          />
        );
      case FIELD_REFERENCE_CODES.TEXT_LONG.id:
        return <TextLongSelector field={effectiveField} readOnly={isReadOnly} data-testid="TextLongSelector__6e80fa" />;
      default:
        return <StringSelector field={effectiveField} readOnly={isReadOnly} data-testid="StringSelector__6e80fa" />;
    }
  })();

  const { hasTableRelated, hasProcessDefinitionRelated } = effectiveField.selector || {};

  const handleProcessClick = useCallback(async () => {
    const processId = effectiveField.selector?.processDefinitionId as string | undefined;
    if (!processId) return;

    try {
      const response = await Metadata.client.post(`meta/process/${processId}`);
      if (response.ok && response.data) {
        const processData = response.data;
        const name = processData.name || effectiveField.name || "";

        const button = {
          ...effectiveField,
          id: effectiveField.id,
          name,
          action: "P",
          enabled: true,
          visible: true,
          processId,
          buttonText: name,
          buttonRefList: [],
          processInfo: {
            loadFunction: processData.loadFunction || "",
            searchKey: processData.searchKey || "",
            clientSideValidation: processData.clientSideValidation || "",
            _entityName: processData._entityName || "OBUIAPP_Process",
            id: processId,
            name,
            javaClassName: processData.javaClassName || "",
            parameters: [],
          },
          processDefinition: {
            id: processId,
            name,
            description: processData.description || "",
            javaClassName: processData.javaClassName || "",
            parameters: processData.parameters || {},
            onLoad: processData.onLoad || "",
            onProcess: processData.onProcess || "",
            ...processData,
          },
        } as unknown as ProcessDefinitionButton;

        setProcessButtonData(button);
        setIsProcessModalOpen(true);
      }
    } catch (error) {
      console.error("Failed to load process definition:", error);
    }
  }, [effectiveField]);

  const handleSelect = (record: EntityData) => {
    // Dynamic extraction: The selector metadata explicitly defines which column holds the true ID
    const valueField = effectiveField.selector?.valueField as string | undefined;
    const resolvedId = (valueField ? record[valueField] : record.id) as string;

    if (resolvedId) {
      const fieldName = getSelectorFieldName(effectiveField);
      const displayField = effectiveField.selector?.displayField as string | undefined;
      updateSelectorValue(setValue, fieldName, resolvedId, record, displayField);
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
            onClick={handleProcessClick}
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
          currentDisplayValue={getValues(`${getSelectorFieldName(effectiveField)}$_identifier`)}
          data-testid={`SelectorModal__${field.id}`}
        />
      )}
      {isProcessModalOpen && processButtonData && (
        <ProcessDefinitionModal
          type={PROCESS_TYPES.PROCESS_DEFINITION}
          open={isProcessModalOpen}
          onClose={() => {
            setIsProcessModalOpen(false);
            setProcessButtonData(null);
          }}
          button={processButtonData}
          contextRecord={getValues()}
          onSuccess={() => {
            setIsProcessModalOpen(false);
            setProcessButtonData(null);
          }}
        />
      )}
    </>
  );
};

const GenericSelector = memo(GenericSelectorCmp);
export { GenericSelector };
export default GenericSelector;
