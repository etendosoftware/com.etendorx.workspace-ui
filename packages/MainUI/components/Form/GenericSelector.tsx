import { useCallback, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import type { FieldDefinition, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import type { FieldValue } from '@workspaceui/componentlibrary/src/components/FormView/types';
import BooleanSelector from '@workspaceui/componentlibrary/src/components/FormView/selectors/BooleanSelector';
import NumberSelector from '@workspaceui/componentlibrary/src/components/FormView/selectors/NumberSelector';
import DateSelector from '@workspaceui/componentlibrary/src/components/FormView/selectors/DateSelector';
import SelectSelector from '@workspaceui/componentlibrary/src/components/FormView/selectors/SelectSelector';
import QuantitySelector from '@workspaceui/componentlibrary/src/components/FormView/selectors/QuantitySelector';
import ListSelector from '@workspaceui/componentlibrary/src/components/FormView/selectors/ListSelector';
import SearchSelector from '@workspaceui/componentlibrary/src/components/FormView/selectors/SearchSelector';
import TableDirSelector from '@workspaceui/componentlibrary/src/components/FormView/selectors/TableDirSelector';
import { StringSelector } from '@workspaceui/componentlibrary/src/components/FormView/selectors/StringSelector';
import { useCallout } from '../../hooks/useCallout';
import { getFieldsByDBColumnName, getInputName } from '@workspaceui/etendohookbinder/src/utils/metadata';
import { CALLOUTS_ENABLED } from '../../constants/config';

export const GenericSelector = ({ field, tab }: { field: FieldDefinition; tab: Tab }) => {
  const { watch, setValue, getValues } = useFormContext();
  const name = useRef(getInputName(field.original));
  const value = watch(name.current, field.initialValue);
  const callout = useCallout({
    field: field.original,
    tab,
    payload: getValues(),
  });

  const applyCallout = useCallback(
    (data: { [key: string]: unknown }) => {
      const columns = getFieldsByDBColumnName(tab);
      const columnValues = data.columnValues as Record<string, { value: unknown; classicValue: unknown }>;

      Object.entries(columnValues).forEach(([column, valueObj]) => {
        const inputName = getInputName(columns[column]);
        setValue(inputName, valueObj.value);
      });
    },
    [setValue, tab],
  );

  const handleChange = useCallback(
    (value: FieldValue) => {
      const f = async () => {
        setValue(name.current, value);

        if (CALLOUTS_ENABLED && field.original?.column?.callout$_identifier) {
          const { data } = await callout();

          if (data.response?.status === -1) {
            console.warn('Callout execution error', data);
          } else {
            applyCallout(data);
          }
        }
      };

      return f();
    },
    [applyCallout, callout, field.original?.column?.callout$_identifier, setValue],
  );

  switch (field.type) {
    case 'boolean':
      return <BooleanSelector label={field.label} name={name.current} onChange={handleChange} checked={value} />;
    case 'number':
      return <NumberSelector name={name.current} value={Number(value)} onChange={handleChange} />;
    case 'date':
      return <DateSelector name={name.current} value={value as string} onChange={handleChange} />;
    case 'select':
      return <SelectSelector name={name.current} title={field.label} onChange={handleChange} />;
    case 'search':
      return (
        <SearchSelector
          field={field}
          value={value}
          label={field.label}
          entity={field.original?.referencedEntity || ''}
          onChange={handleChange}
          name={name.current}
        />
      );
    case 'tabledir':
      return (
        <TableDirSelector
          value={value}
          label={field.label}
          entity={field.original?.referencedEntity || ''}
          onChange={handleChange}
          name={name.current}
        />
      );
    case 'quantity':
      return (
        <QuantitySelector
          value={value}
          maxLength={field.original?.column?.length}
          min={field.original?.column?.minValue ?? null}
          max={field.original?.column?.maxValue ?? null}
          onChange={handleChange}
          name={name.current}
        />
      );
    case 'list':
      return <ListSelector name={name.current} value={value} field={field} onChange={handleChange} />;
    default:
      return (
        <StringSelector
          value={value as string}
          setValue={handleChange}
          placeholder={field.value ? String(field.value) : undefined}
          name={name.current}
        />
      );
  }
};
