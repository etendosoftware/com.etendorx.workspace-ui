import React, { useState } from 'react';
import {
  TextField,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  FormControl,
  FormControlLabel,
  Checkbox,
  styled,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { SearchOutlined } from '@mui/icons-material';
import { Select, TextInputBase } from '..';
import { topFilms } from '../../../../storybook/src/stories/Components/Input/Select/mock';
import {
  Organization,
  FieldDefinition,
  Section,
  BaseFieldDefinition,
} from '../../../../storybook/src/stories/Components/Table/types';
import { FormViewProps } from './types';
import { styles, sx } from './styles';

const FieldLabel: React.FC<{ label: string; required?: boolean }> = ({
  label,
  required,
}) => (
  <Box sx={styles.labelWrapper}>
    <span style={styles.labelText}>{label}</span>
    {required ?? <span style={styles.requiredAsterisk}>*</span>}
    <span style={styles.dottedSpacing} />
  </Box>
);

const FormField: React.FC<{
  name: string;
  field: FieldDefinition;
  onChange: (name: string, value: FieldDefinition['value']) => void;
}> = ({ name, field, onChange }) => {
  const CustomCheckbox = styled(Checkbox)(({ theme }) => ({
    '&.Mui-checked': {
      color: theme.palette.dynamicColor.main,
    },
  }));

  const [value, setValue] = useState(field.label);

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
            title={field.label}
            options={topFilms}
            getOptionLabel={option => option.title}
          />
        );
      default:
        return (
          <TextInputBase
            onRightIconClick={() => alert('Icon clicked')}
            value={value}
            setValue={setValue}
            placeholder={field.label}
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

const FormView: React.FC<FormViewProps> = ({ data }) => {
  const [formData, setFormData] = useState<Organization>(data);

  const handleInputChange = (
    name: string,
    value: BaseFieldDefinition<any>['value'],
  ) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: {
        ...prevData[name],
        value: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form data:', formData);
  };

  const renderSection = (
    sectionName: string,
    fields: [string, FieldDefinition][],
  ) => {
    const sectionData = formData[sectionName];
    if (!sectionData || !('label' in sectionData)) {
      console.warn(`Section ${sectionName} is not properly defined`);
      return null;
    }

    return (
      <Accordion key={sectionName} sx={sx.accordion}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={sx.accordionSummary}>
          <Typography>{(sectionData as Section).label}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container>
            {fields.map(([key, field], index) => (
              <Grid item xs={12} sm={6} md={4} key={key} sx={sx.gridItem}>
                <FormField
                  name={key}
                  field={field}
                  onChange={handleInputChange}
                />
                {index + 1 !== 0 && index !== fields.length && (
                  <Box sx={styles.dottedLine} />
                )}
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  const groupedFields = Object.entries(formData).reduce(
    (acc, [key, value]) => {
      if ('section' in value) {
        const section = value.section ?? '_mainSection';
        if (!acc[section]) acc[section] = [];
        acc[section].push([key, value]);
      }
      return acc;
    },
    {} as { [key: string]: [string, FieldDefinition][] },
  );

  return (
    <Box>
      <form onSubmit={handleSubmit}>
        <Box>
          <Grid container>
            {Object.entries(groupedFields).map(([sectionName, fields]) =>
              renderSection(sectionName, fields),
            )}
          </Grid>
        </Box>
      </form>
    </Box>
  );
};

export default FormView;
