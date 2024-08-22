import { useCallback, useMemo, useState } from 'react';
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
import ChevronDown from '../../assets/icons/chevron-down.svg';
import { SearchOutlined } from '@mui/icons-material';
import { Select, TextInputBase, theme } from '..';
import { topFilms } from '../../../../storybook/src/stories/Components/Input/Select/mock';
import {
  Organization,
  FieldDefinition,
  Section,
  BaseFieldDefinition,
} from '../../../../storybook/src/stories/Components/Table/types';
import { FormViewProps } from './types';
import { defaultFill, styles, sx } from './styles';
import IconButton from '../IconButton';
import InfoIcon from '@mui/icons-material/Info';
import PrimaryTabs from '../PrimaryTab';
import { TabItem } from '../PrimaryTab/types';

const defaultIcon = (
  <ChevronDown fill={theme.palette.baselineColor.neutral[80]} />
);

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
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const tabs: TabItem[] = useMemo(() => {
    return Object.values(formData)
      .filter((field): field is Section => field.type === 'section')
      .map(section => ({
        id: section.id,
        icon: section.icon,
        label: section.label,
        fill: section.fill,
        hoverFill: section.hoverFill,
        showInTab: section.showInTab,
        href: `#section-${section.id}`,
      }));
  }, [formData]);

  const handleTabChange = useCallback((newTabId: string) => {
    setExpandedSections(prev => {
      if (prev.includes(newTabId)) {
        return prev;
      }
      return [...prev, newTabId];
    });
  }, []);

  const handleAccordionChange = useCallback(
    (sectionId: string, isExpanded: boolean) => {
      setExpandedSections(prev => {
        if (isExpanded) {
          return [...prev, sectionId];
        }
        return prev.filter(id => id !== sectionId);
      });
    },
    [],
  );

  const handleInputChange = useCallback(
    (name: string, value: BaseFieldDefinition<any>['value']) => {
      setFormData(prevData => ({
        ...prevData,
        [name]: {
          ...prevData[name],
          value: value,
        },
      }));
    },
    [],
  );

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
  }, []);

  const renderSection = (
    sectionName: string,
    fields: [string, FieldDefinition][],
  ) => {
    const sectionData = formData[sectionName] as Section;
    if (!sectionData || sectionData.type !== 'section') {
      console.warn(`Section ${sectionName} is not properly defined`);
      return null;
    }

    return (
      <Accordion
        key={sectionName}
        sx={sx.accordion}
        expanded={expandedSections.includes(sectionData.id)}
        onChange={(_, isExpanded) =>
          handleAccordionChange(sectionData.id, isExpanded)
        }
        id={`section-${sectionData.id}`}>
        <AccordionSummary
          sx={sx.accordionSummary}
          onMouseEnter={() => setHoveredSection(sectionName)}
          onMouseLeave={() => setHoveredSection(null)}
          expandIcon={
            <IconButton
              size="small"
              hoverFill={theme.palette.baselineColor.neutral[80]}
              sx={sx.chevronButton}>
              <ChevronDown />
            </IconButton>
          }>
          <Box sx={sx.iconLabel}>
            <IconButton
              fill={defaultFill}
              sx={sx.iconButton}
              className="main-icon-button"
              isHovered={hoveredSection === sectionName}>
              {sectionData.icon || <InfoIcon />}
            </IconButton>
            <Typography>{sectionData.label}</Typography>
          </Box>
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
      <Box
        sx={{
          position: 'sticky',
        }}>
        <PrimaryTabs
          tabs={tabs}
          onChange={handleTabChange}
          icon={defaultIcon}
        />
      </Box>
      <form onSubmit={handleSubmit}>
        <Box>
          <Grid container>
            {Object.entries(groupedFields).map(([sectionName, fields]) => {
              return renderSection(sectionName, fields);
            })}
          </Grid>
        </Box>
      </form>
    </Box>
  );
};

export default FormView;
