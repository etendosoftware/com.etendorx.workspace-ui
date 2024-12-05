import { useCallback, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { getInputName } from '@workspaceui/etendohookbinder/src/utils/form';
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

export const GenericSelector = ({ field, tab }: { field: FieldDefinition; tab: Tab }) => {
  const { watch, setValue, getValues } = useFormContext();
  const name = useRef(getInputName(field.original));
  const value = watch(name.current, field.initialValue);
  const callout = useCallout({
    field: field.original,
    tab,
    payload: getValues(),
  });

  const handleChange = useCallback(
    (value: FieldValue) => {
      const f = async () => {
        if (field.original?.column?.callout$_identifier) {
          // TODO: Handle callout response
          console.debug('Calling callout...');
          await callout();
          console.debug('After returning callout...');
        }

        setValue(name.current, value);
      };

      return f();
    },
    [callout, field.original?.column?.callout$_identifier, setValue],
  );

  switch (field.type) {
    case 'boolean':
      return <BooleanSelector label={field.label} name={name.current} onChange={handleChange} checked={value} />;
    case 'number':
      return <NumberSelector name={name.current} value={Number(value)} onChange={handleChange} />;
    case 'date':
      return <DateSelector name={name.current} value={value as string} onChange={handleChange} />;
    case 'select':
      return <SelectSelector name={field.name} title={field.label} onChange={handleChange} />;
    case 'search':
      return (
        <SearchSelector
          field={field}
          value={field.value}
          label={field.label}
          entity={field.original?.referencedEntity || ''}
          onChange={handleChange}
        />
      );
    case 'tabledir':
      return (
        <TableDirSelector
          value={value}
          label={field.label}
          entity={field.original?.referencedEntity || ''}
          onChange={handleChange}
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
        />
      );
    case 'list':
      return <ListSelector field={field} onChange={handleChange} />;
    default:
      return (
        <StringSelector
          value={value as string}
          setValue={handleChange}
          placeholder={field.value ? String(field.value) : undefined}
        />
      );
  }
};
