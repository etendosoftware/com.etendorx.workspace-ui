import { memo } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { TextField, MenuItem, Autocomplete } from '@mui/material';
import DateSelector from '@workspaceui/componentlibrary/src/components/FormView/selectors/DateSelector';
import { ReportField } from '@workspaceui/etendohookbinder/src/hooks/types';
import MultiSelect from '@workspaceui/componentlibrary/src/components/FormView/selectors/MultiSelector';

interface DynamicFieldProps {
  field: ReportField;
}

function DynamicFieldComponent({ field }: DynamicFieldProps) {
  const { control } = useFormContext();

  switch (field.type) {
    case 'date':
      return (
        <Controller
          name={field.name}
          control={control}
          rules={{ required: field.required }}
          render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
            <DateSelector
              label={field.label}
              name={field.name}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              required={field.required}
              error={!!error}
              helperText={error?.message}
            />
          )}
        />
      );

    case 'select':
      return (
        <Controller
          name={field.name}
          control={control}
          render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
            <TextField
              select
              fullWidth
              label={field.label}
              value={value || ''}
              onChange={onChange}
              onBlur={onBlur}
              required={field.required}
              error={!!error}
              helperText={error?.message}
              variant="standard">
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {field.lookupConfig?.values?.map(option => (
                <MenuItem key={option.id} value={option.id}>
                  {option.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      );
    case 'search':
      return (
        <Controller
          name={field.name}
          control={control}
          rules={{ required: field.required }}
          render={({ field: { onChange, value } }) => (
            <Autocomplete
              options={field.lookupConfig?.values || []}
              value={value || null}
              getOptionLabel={option => option?.name || ''}
              onChange={(_, newValue) => onChange(newValue)}
              fullWidth
              renderInput={params => (
                <TextField {...params} variant="standard" label={field.label} required={field.required} />
              )}
            />
          )}
        />
      );
    case 'multiselect':
      return (
        <Controller
          name={field.name}
          control={control}
          render={({ field: { onChange, value } }) => (
            <MultiSelect
              value={value || []}
              onChange={onChange}
              title={field.label}
              entity={field.entity || ''}
              columnName={field.columnName || ''}
              identifierField={field.identifierField || ''}
              columns={field.columns}
            />
          )}
        />
      );
    default:
      return (
        <Controller
          name={field.name}
          control={control}
          rules={{ required: field.required }}
          render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
            <TextField
              fullWidth
              label={field.label}
              value={value || ''}
              onChange={onChange}
              onBlur={onBlur}
              required={field.required}
              error={!!error}
              helperText={error?.message}
            />
          )}
        />
      );
  }
}

export const DynamicField = memo(DynamicFieldComponent);

export default DynamicField;
