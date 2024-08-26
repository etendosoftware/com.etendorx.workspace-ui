import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Grid,
} from '@mui/material';
import ChevronDown from '../../assets/icons/chevron-down.svg';
import { theme } from '..';
import {
  FieldDefinition,
  Section,
} from '../../../../storybook/src/stories/Components/Table/types';
import { defaultFill, styles, sx } from './styles';
import IconButton from '../IconButton';
import InfoIcon from '@mui/icons-material/Info';
import FormFieldGroup from './FormField';

interface FormSectionProps {
  sectionName: string;
  sectionData: Section;
  fields: [string, FieldDefinition][];
  isExpanded: boolean;
  onAccordionChange: (sectionId: string, isExpanded: boolean) => void;
  onHover: (sectionName: string | null) => void;
  hoveredSection: string | null;
  onInputChange: (
    name: string,
    value: string | number | boolean | string[] | Date,
  ) => void;
  sectionRef: React.Ref<HTMLDivElement>;
}

const FormSection: React.FC<FormSectionProps> = ({
  sectionName,
  sectionData,
  fields,
  isExpanded,
  onAccordionChange,
  onHover,
  hoveredSection,
  onInputChange,
  sectionRef,
}) => {
  return (
    <Accordion
      sx={sx.accordion}
      expanded={isExpanded}
      onChange={(_, isExpanded) =>
        onAccordionChange(sectionData.id, isExpanded)
      }
      ref={sectionRef}
      id={`section-${sectionData.id}`}>
      <AccordionSummary
        sx={sx.accordionSummary}
        onMouseEnter={() => onHover(sectionName)}
        onMouseLeave={() => onHover(null)}
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
                onChange={onInputChange}
              />
              {index < fields.length - 1 && (index + 1) % 3 !== 0 && (
                <Box sx={styles.dottedLine} />
              )}
            </Grid>
          ))}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default FormSection;
