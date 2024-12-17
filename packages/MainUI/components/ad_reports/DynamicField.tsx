import { memo } from 'react';
import { useFormContext } from 'react-hook-form';
import { TextField, MenuItem, Autocomplete } from '@mui/material';
import type { ReportField } from '../../reports/types';

interface DynamicFieldProps {
  field: ReportField;
}

function DynamicFieldComponent({ field }: DynamicFieldProps) {
  const { register } = useFormContext();

  switch (field.type) {
    case 'date':
      return (
        <TextField
          type="date"
          fullWidth
          label={field.label}
          required={field.required}
          variant="standard"
          InputLabelProps={{ shrink: true }}
          {...register(field.name)}
        />
      );

    case 'select':
      return (
        <TextField
          select
          fullWidth
          label={field.label}
          required={field.required}
          variant="standard"
          {...register(field.name)}>
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {field.lookupConfig?.values?.map(option => (
            <MenuItem key={option.id} value={option.id}>
              {option.name}
            </MenuItem>
          ))}
        </TextField>
      );

    case 'search':
    case 'multiselect':
      return (
        <Autocomplete
          multiple={field.type === 'multiselect'}
          options={field.lookupConfig?.values || []}
          getOptionLabel={option => option.name}
          fullWidth
          onChange={() => {}}
          renderInput={params => (
            <TextField {...params} variant="standard" label={field.label} required={field.required} />
          )}
        />
      );

    default:
      return <TextField fullWidth label={field.label} required={field.required} {...register(field.name)} />;
  }
}

export const DynamicField = memo(DynamicFieldComponent);

export default DynamicField;
