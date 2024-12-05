import React, { useCallback } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Box, Grid, useTheme } from '@mui/material';
import ChevronDown from '../../../assets/icons/chevron-down.svg';
import InfoIcon from '../../../assets/icons/info.svg';
import { defaultFill, useStyle } from '../styles';
import { FormSectionProps } from '../types';
import FormFieldGroup from '../selectors';
import IconButton from '../../IconButton';

const FormSection: React.FC<FormSectionProps> = ({
  sectionName,
  sectionData,
  fields,
  isExpanded,
  onAccordionChange,
  onHover,
  hoveredSection,
  sectionRef,
  gridItemProps = { xs: 12, sm: 6, md: 6 },
  dottedLineInterval = 2,
  readOnly = false,
  renderFieldValue,
  children,
  onLabelClick,
}) => {
  const { sx, styles } = useStyle();
  const theme = useTheme();
  const handleChange = useCallback(
    (_: unknown, isExpanded: boolean) => onAccordionChange(sectionData.id, isExpanded),
    [onAccordionChange, sectionData.id],
  );
  const handleMouseEnter = useCallback(() => onHover(sectionName), [onHover, sectionName]);
  const handleMouseLeave = useCallback(() => onHover(null), [onHover]);

  return (
    <Accordion
      sx={sx.accordion}
      expanded={isExpanded}
      onChange={handleChange}
      ref={sectionRef}
      id={`section-${sectionData.id}`}>
      <AccordionSummary
        sx={sx.accordionSummary}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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
                <FormFieldGroup
                  name={key}
                  field={field}
                  readOnly={readOnly}
                  renderFieldValue={renderFieldValue}
                  onLabelClick={onLabelClick}
                />
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
