import React, { memo, useCallback } from 'react';
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

const FieldLabel: React.FC<FieldLabelProps> = ({ label, required, fieldType, onLinkClick }) => {
  const { styles, sx } = useStyle();

  return (
    <Box sx={styles.labelWrapper}>
      {fieldType === 'tabledir' ? (
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

const FormFieldGroup: React.FC<FormFieldGroupProps> = memo(({ field, onChange, readOnly, renderFieldValue }) => {
  const value = renderFieldValue ? renderFieldValue(field) : field.value ?? '';

  const { styles, sx } = useStyle();
  const handleLinkClick = useCallback(() => {
    if (field.type === 'tabledir' && field.value && typeof field.value === 'object' && 'id' in field.value) {
      const recordId = field.value.id;
      const windowId = field.original?.referencedWindowId;
      const tabId = field.original?.referencedTabId;
      location.href = `/window/${windowId}/${tabId}/${recordId}`;
    }
  }, [field]);

  const renderField = useCallback(() => {
    switch (field.type) {
      case 'boolean':
        return <BooleanSelector label={field.label} readOnly={readOnly} />;
      case 'number':
        return <NumberSelector name={field.label} value={Number(value)} onChange={onChange} readOnly={readOnly} />;
      case 'date':
        return <DateSelector name={field.name} value={value as string} onChange={onChange} readOnly={readOnly} />;
      case 'select':
        return <SelectSelector name={field.name} title={field.label} onChange={onChange} readOnly={readOnly} />;
      case 'tabledir':
        return (
          <TableDirSelector
            value={value}
            label={field.label}
            entity={field.original?.referencedEntity || ''}
            onChange={onChange}
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
        return <ListSelector field={field} onChange={onChange} readOnly={readOnly} />;
      default:
        return (
          <TextInputBase
            onRightIconClick={() => alert('Icon clicked')}
            value={value as string}
            setValue={(value: FieldValue) => onChange(field.label, value)}
            placeholder={field.value ? String(field.value) : undefined}
            disabled={readOnly}
          />
        );
    }
  }, [field, onChange, readOnly, value]);

  return (
    <Box style={styles.fieldContainer}>
      <Box sx={sx.labelBox}>
        <FieldLabel
          label={field.label}
          required={field.required}
          fieldType={field.type}
          onLinkClick={field.type === 'tabledir' ? handleLinkClick : undefined}
          readOnly={readOnly}
        />
      </Box>
      <Box sx={sx.inputBox}>{renderField()}</Box>
    </Box>
  );
});

export default FormFieldGroup;
