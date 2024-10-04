import React, { memo, useCallback } from 'react';
import { Box, Link } from '@mui/material';
import { TextInputBase } from '@workspaceui/componentlibrary/components';
import { styles, sx } from '../styles';
import { FieldLabelProps, FieldValue, FormFieldGroupProps } from '../types';
import TableDirSelector from './TableDirSelector';
import BooleanSelector from './BooleanSelector';
import NumberSelector from './NumberSelector';
import DateSelector from './DateSelector';
import SelectSelector from './SelectSelector';
import SearchSelector from './SearchSelector';
import { FieldDefinition } from 'src/screens/Form/types';

const isReferenceField = (fieldType: FieldDefinition['type']) => ['tabledir', 'search'].includes(fieldType);

const FieldLabel: React.FC<FieldLabelProps> = ({ label, required, fieldType, onLinkClick }) => (
  <Box sx={styles.labelWrapper}>
    {isReferenceField(fieldType) ? (
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

const FormFieldGroup: React.FC<FormFieldGroupProps> = memo(({ field, onChange, readOnly }) => {
  const handleLinkClick = useCallback(() => {
    if (field.type === 'tabledir' && field.value && typeof field.value === 'object' && 'id' in field.value) {
      const recordId = field.value.id;
      const windowId = field.original?.referencedWindowId;
      location.href = `/window/${windowId}/${recordId}`;
    }
  }, [field]);

  const Field = useCallback(() => {
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
      default:
        return (
          <TextInputBase
            onRightIconClick={() => alert('Icon clicked')}
            value={field.value as string}
            setValue={(value: FieldValue) => onChange(field.label, value)}
            placeholder={field.value ? String(field.value) : undefined}
            disabled={readOnly}
          />
        );
    }
  }, [field.label, field.name, field.original?.referencedEntity, field.type, field.value, onChange, readOnly]);

  return (
    <Box style={styles.fieldContainer}>
      <Box sx={sx.labelBox}>
        <FieldLabel
          label={field.label}
          required={field.required}
          fieldType={field.type}
          onLinkClick={field.type === 'tabledir' || field.type === 'search' ? handleLinkClick : undefined}
          readOnly={readOnly}
        />
      </Box>
      <Box sx={sx.inputBox}>
        <Field />
      </Box>
    </Box>
  );
});

export default FormFieldGroup;
