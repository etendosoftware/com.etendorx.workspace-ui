import React, { useCallback, useMemo, useState } from 'react';
import {
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
} from '@mui/material';
import ChevronDown from '../../assets/icons/chevron-down.svg';
import { theme } from '..';
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
import FormFieldGroup from './FormField';

const defaultIcon = (
  <ChevronDown fill={theme.palette.baselineColor.neutral[80]} />
);

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
    (name: string, value: BaseFieldDefinition<string>['value']) => {
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
                <FormFieldGroup
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
