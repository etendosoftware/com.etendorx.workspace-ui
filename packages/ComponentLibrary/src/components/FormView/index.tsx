import React, { useState } from 'react';
import { Box, TextField, Switch, MenuItem } from '@mui/material';
import {
  Organization,
  FieldDefinition,
} from '../../../../storybook/src/stories/Components/Table/types';
import { FormViewProps } from './types';

const FormView: React.FC<FormViewProps> = ({ data }) => {
  const [formData, setFormData] = useState<Organization>(data);

  const handleInputChange = (
    name: keyof Organization,
    value: FieldDefinition<any>['value'],
  ) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: {
        ...prevData[name],
        value: value,
      },
    }));
  };

  const renderInput = (
    name: keyof Organization,
    field: FieldDefinition<any>,
  ) => {
    switch (field.type) {
      case 'boolean':
        return (
          <Box sx={{ my: 2 }}>
            <Switch
              name={name}
              checked={field.value as boolean}
              onChange={e => handleInputChange(name, e.target.checked)}
            />
            <label>{field.label}</label>
          </Box>
        );
      case 'number':
        return (
          <TextField
            fullWidth
            margin="normal"
            name={name}
            label={field.label}
            type="number"
            value={field.value as number}
            onChange={e => handleInputChange(name, Number(e.target.value))}
          />
        );
      case 'date':
        return (
          <TextField
            fullWidth
            margin="normal"
            name={name}
            label={field.label}
            type="date"
            value={
              field.value instanceof Date
                ? field.value.toISOString().split('T')[0]
                : (field.value as string)
            }
            onChange={e => handleInputChange(name, e.target.value)}
          />
        );
      case 'select':
        return (
          <TextField
            select
            fullWidth
            margin="normal"
            name={name}
            label={field.label}
            value={field.value as string}
            onChange={e => handleInputChange(name, e.target.value)}>
            {Array.isArray(field.value) &&
              (field.value as string[]).map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
          </TextField>
        );
      default:
        return (
          <TextField
            fullWidth
            margin="normal"
            name={name}
            label={field.label}
            value={field.value as string}
            onChange={e => handleInputChange(name, e.target.value)}
          />
        );
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box
        component="form"
        onSubmit={e => {
          e.preventDefault();
        }}>
        {(
          Object.entries(formData) as [
            keyof Organization,
            FieldDefinition<any>,
          ][]
        ).map(([key, field]) => (
          <React.Fragment key={key}>{renderInput(key, field)}</React.Fragment>
        ))}
      </Box>
    </Box>
  );
};

export default FormView;
