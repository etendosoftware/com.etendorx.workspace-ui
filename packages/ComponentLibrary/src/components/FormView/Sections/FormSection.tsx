import React from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Box, Grid, useTheme } from '@mui/material';
import ChevronDown from '../../../../ComponentLibrary/src/assets/icons/chevron-down.svg';
import { defaultFill, useStyle } from '../styles';
import IconButton from '@workspaceui/componentlibrary/components/IconButton';
import InfoIcon from '../../../../ComponentLibrary/src/assets/icons/info.svg';
import { FormSectionProps } from '../types';
import FormFieldGroup from '../selectors';

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
  gridItemProps = { xs: 12, sm: 6, md: 6 },
  dottedLineInterval = 2,
  readOnly = false,
  children,
}) => {
  const { sx, styles } = useStyle();
  const theme = useTheme();
  return (
    <Accordion
      sx={sx.accordion}
      expanded={isExpanded}
      onChange={(_, isExpanded) => onAccordionChange(sectionData.id, isExpanded)}
      ref={sectionRef}
      id={`section-${sectionData.id}`}>
      <AccordionSummary
        sx={sx.accordionSummary}
        onMouseEnter={() => onHover(sectionName)}
        onMouseLeave={() => onHover(null)}
        expandIcon={
          <IconButton size="small" hoverFill={theme.palette.baselineColor.neutral[80]} sx={sx.chevronButton}>
            <ChevronDown />
          </IconButton>
        }>
        <Box sx={sx.iconLabel}>
          <IconButton
            fill={defaultFill}
            sx={sx.iconButton}
            className="main-icon-button"
            height={16}
            width={16}
            isHovered={hoveredSection === sectionName}>
            {sectionData.icon || <InfoIcon />}
          </IconButton>
          <Typography>{sectionData.label}</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {children ? (
          children
        ) : (
          <Grid container>
            {fields.map(([key, field], index) => (
              <Grid item {...gridItemProps} key={key} sx={sx.gridItem}>
                <FormFieldGroup name={key} field={field} onChange={onInputChange} readOnly={readOnly} />
                {index < fields.length && (index + 1) % dottedLineInterval !== 0 && <Box sx={styles.dottedLine} />}
              </Grid>
            ))}
          </Grid>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default FormSection;
