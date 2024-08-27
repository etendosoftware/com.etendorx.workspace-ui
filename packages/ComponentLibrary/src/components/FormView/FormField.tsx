import {
  TextField,
  Box,
  FormControl,
  FormControlLabel,
  Checkbox,
  styled,
} from '@mui/material';
import { SearchOutlined } from '@mui/icons-material';
import { Select, TextInputBase } from '..';
import { topFilms } from '../../../../storybook/src/stories/Components/Input/Select/mock';
import { styles, sx } from './styles';
import { FieldLabelProps, FormFieldGroupProps, FormFieldProps } from './types';

const FieldLabel: React.FC<FieldLabelProps> = ({ label, required }) => (
  <Box sx={styles.labelWrapper}>
    <span style={styles.labelText}>{label}</span>
    {required ?? <span style={styles.requiredAsterisk}>*</span>}
    <span style={styles.dottedSpacing} />
  </Box>
);

const FormField: React.FC<FormFieldProps> = ({ name, field, onChange }) => {
  const CustomCheckbox = styled(Checkbox)(({ theme }) => ({
    '&.Mui-checked': {
      color: theme.palette.dynamicColor.main,
    },
  }));

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
            iconLeft={<SearchOutlined sx={{ width: 24, height: 24 }} />}
            title={field.value as string}
            options={topFilms}
            getOptionLabel={option => option.title}
          />
        );
      default:
        return (
          <TextInputBase
            onRightIconClick={() => alert('Icon clicked')}
            value={field.value as string}
            placeholder={field.value as string}
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
};

const FormFieldGroup: React.FC<FormFieldGroupProps> = ({
  name,
  field,
  onChange,
}) => {
  return <FormField name={name} field={field} onChange={onChange} />;
};

export default FormFieldGroup;
