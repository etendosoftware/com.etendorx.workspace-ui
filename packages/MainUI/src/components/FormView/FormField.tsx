import {
  TextField,
  Box,
  FormControl,
  FormControlLabel,
  Checkbox,
  styled,
} from '@mui/material';
import SearchOutlined from '../../../../ComponentLibrary/src/assets/icons/search.svg';
import {
  TextInputBase,
  theme,
} from '@workspaceui/componentlibrary/src/components';
import { topFilms } from '../../../../storybook/src/stories/Components/Input/Select/mock';
import { styles, sx } from './styles';
import {
  FieldLabelProps,
  FieldValue,
  FormFieldGroupProps,
  FormFieldProps,
} from './types';
import { memo, useState } from 'react';
import TableDirSelector from './TableDirSelector';
import Select from '../../../../ComponentLibrary/src/components/Input/Select';

const FieldLabel: React.FC<FieldLabelProps> = ({ label, required }) => (
  <Box sx={styles.labelWrapper}>
    <span style={styles.labelText}>{label}</span>
    {required && <span style={styles.requiredAsterisk}>*</span>}
    <span style={styles.dottedSpacing} />
  </Box>
);

const CustomCheckbox = styled(Checkbox)(() => ({
  '&.Mui-checked': {
    color: theme.palette.dynamicColor.main,
  },
}));

const FormField: React.FC<FormFieldProps> = memo(
  ({ name, field, onChange, windowMetadata, columnsData }) => {
    const [value, setValue] = useState<FieldValue>(field.value);

    const renderField = () => {
      switch (field.type) {
        case 'boolean':
          return (
            <FormControl fullWidth margin="normal">
              <Box sx={sx.checkboxContainer}>
                <FormControlLabel
                  control={<CustomCheckbox size="small" />}
                  label={field.label}
                />
              </Box>
            </FormControl>
          );
        case 'number':
          return (
            <TextField
              fullWidth
              margin="normal"
              name={name}
              type="number"
              value={field.value as number}
              onChange={e => onChange(name, Number(e.target.value))}
            />
          );
        case 'date':
          return (
            <TextField
              fullWidth
              margin="normal"
              name={name}
              type="date"
              variant="standard"
              value={field.value as string}
              onChange={e => onChange(name, e.target.value)}
            />
          );
        case 'select':
          return (
            <Select
              iconLeft={
                <SearchOutlined
                  fill={theme.palette.baselineColor.neutral[90]}
                />
              }
              title={field.value as string}
              options={topFilms}
              getOptionLabel={option => option.title}
            />
          );
        case 'tabledir':
          return (
            <TableDirSelector
              name={name}
              field={field}
              onChange={onChange}
              windowMetadata={windowMetadata}
              columnsData={columnsData}
            />
          );
        default:
          return (
            <TextInputBase
              onRightIconClick={() => alert('Icon clicked')}
              value={value as string}
              setValue={setValue}
              placeholder={field.value ? String(field.value) : undefined}
            />
          );
      }
    };

    return (
      <Box style={styles.fieldContainer}>
        <Box sx={sx.labelBox}>
          <FieldLabel label={field.label} required={field.required} />
        </Box>
        <Box sx={sx.inputBox}>{renderField()}</Box>
      </Box>
    );
  },
);

const FormFieldGroup: React.FC<FormFieldGroupProps> = ({
  name,
  field,
  onChange,
  windowMetadata,
  columnsData,
}) => {
  return (
    <FormField
      name={name}
      field={field}
      onChange={onChange}
      windowMetadata={windowMetadata}
      columnsData={columnsData}
    />
  );
};

export default FormFieldGroup;
