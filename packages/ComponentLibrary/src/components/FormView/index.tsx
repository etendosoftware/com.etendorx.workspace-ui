import { useState } from 'react';
import {
  TextField,
  Switch,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Organization,
  FieldDefinition,
  Section,
  BaseFieldDefinition,
} from '../../../../storybook/src/stories/Components/Table/types';
import { FormViewProps } from './types';
import { Select, TextInputBase } from '..';
import { SearchOutlined } from '@mui/icons-material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { topFilms } from '../../../../storybook/src/stories/Components/Input/Select/mock';

const FormField: React.FC<{
  name: string;
  field: FieldDefinition;
  onChange: (name: string, value: FieldDefinition['value']) => void;
}> = ({ name, field, onChange }) => {
  const [value, setValue] = useState('');

  const renderField = () => {
    switch (field.type) {
      case 'boolean':
        return (
          <>
            <Switch
              name={name}
              checked={field.value as boolean}
              onChange={e => onChange(name, e.target.checked)}
            />
            <label>{field.label}</label>
          </>
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
            onChange={e => onChange(name, Number(e.target.value))}
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
            value={field.value as string}
            onChange={e => onChange(name, e.target.value)}
          />
        );
      case 'select':
        return (
          <Select
            iconLeft={<SearchOutlined sx={{ width: 24, height: 24 }} />}
            title="Películas"
            helperText={{
              label: 'Top 15',
              icon: <CheckCircleIcon sx={{ width: 16, height: 16 }} />,
            }}
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
            placeholder="Search"
          />
        );
    }
  };

  return (
    <Grid item xs={12} sm={6} md={4}>
      {renderField()}
    </Grid>
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
  };

  const renderSection = (
    sectionName: string,
    fields: [string, FieldDefinition][],
  ) => (
    <Accordion
      key={sectionName}
      sx={{
        width: '100%',
        marginTop: '0.5rem',
        borderRadius: '0.75rem',
        '&:before': {
          display: 'none',
        },
        '&:first-of-type': {
          borderRadius: '0.75rem',
        },
        '&:last-of-type': {
          borderRadius: '0.75rem',
        },
      }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          borderRadius: '0.75rem',
          '&.Mui-expanded': {
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          },
        }}>
        <Typography>{(formData[sectionName] as Section).label}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          {fields.map(([key, field]) => (
            <FormField
              key={key}
              name={key}
              field={field}
              onChange={handleInputChange}
            />
          ))}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );

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
      <form
        onSubmit={handleSubmit}
        style={{ height: '100%', overflow: 'hidden' }}>
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
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
