import React, { memo, useCallback, useMemo, useRef } from 'react';
import { Box, Link } from '@mui/material';
import { useStyle } from '../styles';
import { FieldLabelProps, FieldValue, FormFieldGroupProps } from '../types';
import TableDirSelector from './TableDirSelector';
import BooleanSelector from './BooleanSelector';
import NumberSelector from './NumberSelector';
import DateSelector from './DateSelector';
import SelectSelector from './SelectSelector';
import QuantitySelector from './QuantitySelector';
import ListSelector from './ListSelector';
import TextInputBase from '../../Input/TextInput/TextInputBase';
import SearchSelector from './SearchSelector';
import { useFormContext } from 'react-hook-form';
import { getInputName } from '@workspaceui/etendohookbinder/src/utils/form';

const FieldLabel: React.FC<FieldLabelProps> = ({ isEntityReference, label, required, onLinkClick }) => {
  const { styles, sx } = useStyle();

  return (
    <Box sx={styles.labelWrapper}>
      {isEntityReference ? (
        <Link onClick={onLinkClick} sx={sx.linkStyles}>
          {label}
        </Link>
      ) : (
        <span style={styles.labelText}>{label}</span>
      )}
      {required && <span style={styles.requiredAsterisk}>*</span>}
      <span style={styles.dottedSpacing} />
    </Box>
  );
};

const RenderField = ({ field, onChange, readOnly }: FormFieldGroupProps) => {
  const { watch, setValue } = useFormContext();
  const name = useRef(getInputName(field.original));
  const value = watch(name.current, field.initialValue);

  const handleChange = useCallback(
    (value: FieldValue) => {
      if (field.original?.column?.callout$_identifier) {
        // TODO: Execute callout
      }

      setValue(name.current, value);
    },
    [field.original?.column?.callout$_identifier, setValue],
  );

  switch (field.type) {
    case 'boolean':
      return <BooleanSelector checked={value} label={field.label} readOnly={readOnly} />;
    case 'number':
      return <NumberSelector name={name.current} value={Number(value)} onChange={handleChange} readOnly={readOnly} />;
    case 'date':
      return <DateSelector name={name.current} value={value as string} onChange={handleChange} readOnly={readOnly} />;
    case 'select':
      return <SelectSelector name={field.name} title={field.label} onChange={handleChange} readOnly={readOnly} />;
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
          onChange={value => onChange(field.label, value)}
          readOnly={readOnly}
        />
      );
    case 'list':
      return <ListSelector field={field} onChange={handleChange} readOnly={readOnly} />;
    default:
      return (
        <TextInputBase
          value={value as string}
          setValue={handleChange}
          placeholder={field.value ? String(field.value) : undefined}
          disabled={readOnly}
        />
      );
  }
};

const FormFieldGroup: React.FC<FormFieldGroupProps> = memo(({ field, onChange, readOnly, renderFieldValue }) => {
  const { styles, sx } = useStyle();

  const isEntityReference = useMemo(() => ['tabledir', 'search'].includes(field.type), [field.type]);

  const handleLinkClick = useCallback(() => {
    if (isEntityReference && typeof field.value === 'object' && 'id' in field.value) {
      const recordId = field.value.id;
      const windowId = field.original?.referencedWindowId;
      const tabId = field.original?.referencedTabId;
      location.href = `/window/${windowId}/${tabId}/${recordId}`;
    }
  }, [field.original?.referencedTabId, field.original?.referencedWindowId, field.value, isEntityReference]);

  return (
    <Box style={styles.fieldContainer}>
      <Box sx={sx.labelBox}>
        <FieldLabel
          label={field.label}
          required={field.required}
          fieldType={field.type}
          isEntityReference={isEntityReference}
          onLinkClick={handleLinkClick}
          readOnly={readOnly}
        />
      </Box>
      <Box sx={sx.inputBox}>
        <RenderField field={field} onChange={onChange} readOnly={readOnly} renderFieldValue={renderFieldValue} />
      </Box>
    </Box>
  );
});

export default FormFieldGroup;
