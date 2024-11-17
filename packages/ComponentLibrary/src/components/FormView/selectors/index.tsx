import React, { memo, useCallback, useEffect, useMemo } from 'react';
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
  const methods = useFormContext(); // retrieve all hook methods
  const { formState } = methods;

  useEffect(() => {
    console.debug(field.original?.fieldName);
  }, [field.original?.fieldName]);

  useEffect(() => {
    console.debug(formState);
  }, [formState]);

  switch (field.type) {
    case 'boolean':
      return <BooleanSelector label={field.label} readOnly={readOnly} />;
    case 'number':
      return (
        <NumberSelector name={field.label} value={field.value as number} onChange={onChange} readOnly={readOnly} />
      );
    case 'date':
      return <DateSelector name={field.name} value={field.value as string} onChange={onChange} readOnly={readOnly} />;
    case 'select':
      return <SelectSelector name={field.name} title={field.label} onChange={onChange} readOnly={readOnly} />;
    case 'search':
      return (
        <SearchSelector
          field={field}
          value={field.value}
          label={field.label}
          entity={field.original?.referencedEntity || ''}
          onChange={onChange}
        />
      );
    case 'tabledir':
      return (
        <TableDirSelector
          value={field.value}
          label={field.label}
          entity={field.original?.referencedEntity || ''}
          onChange={onChange}
        />
      );
    case 'quantity':
      return (
        <QuantitySelector
          value={field.value}
          maxLength={field.original?.column?.length}
          min={field.original?.column?.minValue ?? null}
          max={field.original?.column?.maxValue ?? null}
          onChange={value => onChange(field.label, value)}
          readOnly={readOnly}
        />
      );
    case 'list':
      return <ListSelector field={field} onChange={onChange} readOnly={readOnly} />;
    default:
      return (
        <TextInputBase
          margin="normal"
          onRightIconClick={() => alert('Icon clicked')}
          value={field.value as string}
          setValue={(value: FieldValue) => onChange(field.label, value)}
          placeholder={field.value ? String(field.value) : undefined}
          disabled={readOnly}
        />
      );
  }
};

const FormFieldGroup: React.FC<FormFieldGroupProps> = memo(({ field, onChange, readOnly }) => {
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
        <RenderField field={field} readOnly={readOnly} onChange={onChange} />
      </Box>
    </Box>
  );
});

export default FormFieldGroup;
