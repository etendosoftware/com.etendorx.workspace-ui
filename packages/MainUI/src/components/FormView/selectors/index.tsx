import React, { memo, useCallback } from 'react';
import { Box, Link } from '@mui/material';
import { TextInputBase } from '@workspaceui/componentlibrary/src/components';
import { styles, sx } from '../styles';
import { FieldLabelProps, FieldValue, FormFieldGroupProps } from '../types';
import TableDirSelector from './TableDirSelector';
import BooleanSelector from './BooleanSelector';
import NumberSelector from './NumberSelector';
import DateSelector from './DateSelector';
import SelectSelector from './SelectSelector';

const FieldLabel: React.FC<FieldLabelProps> = ({
  label,
  required,
  fieldType,
  onLinkClick,
}) => (
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

const FormFieldGroup: React.FC<FormFieldGroupProps> = memo(
  ({ field, onChange, readOnly }) => {
    const handleLinkClick = useCallback(() => {
      console.log(`Clicked on link for ${field.label}`);
    }, [field.label]);

    const renderField = () => {
      switch (field.type) {
        case 'boolean':
          return <BooleanSelector label={field.label} readOnly={readOnly} />;
        case 'number':
          return (
            <NumberSelector
              name={field.label}
              value={field.value as number}
              onChange={onChange}
              readOnly={readOnly}
            />
          );
        case 'date':
          return (
            <DateSelector
              name={field.name}
              value={field.value as string}
              onChange={onChange}
              readOnly={readOnly}
            />
          );
        case 'select':
          return (
            <SelectSelector
              name={field.name}
              title={field.label}
              onChange={onChange}
              readOnly={readOnly}
            />
          );
        case 'tabledir':
          return (
            <TableDirSelector
              value={field.value}
              label={field.label}
              entity={field.original.referencedEntity}
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
    };

    return (
      <Box style={styles.fieldContainer}>
        <Box sx={sx.labelBox}>
          <FieldLabel
            label={field.label}
            required={field.required}
            fieldType={field.type}
            onLinkClick={
              field.type === 'tabledir' ? handleLinkClick : undefined
            }
            readOnly={readOnly}
          />
        </Box>
        <Box sx={sx.inputBox}>{renderField()}</Box>
      </Box>
    );
  },
);

export default FormFieldGroup;
