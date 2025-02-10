import { useCallback, useContext, useMemo } from 'react';
import { Box } from '@mui/material';
import { isEntityReference } from '@workspaceui/etendohookbinder/src/utils/metadata';
import { getMappedValues, parseDynamicExpression } from '@/utils/FormUtils';
import { GenericSelector } from './GenericSelector';
import { useMetadataContext } from '@/hooks/useMetadataContext';
import { useFormContext } from 'react-hook-form';
import { useStyle } from './FormView/styles';
import { FormFieldGroupProps } from './FormView/types';
import { FieldLabel } from './FormView/Sections/FieldLabel';
import { FormViewContext } from './FormView';

export default function FormFieldGroup({ tab, field, onLabelClick }: FormFieldGroupProps) {
  const { styles, sx } = useStyle();
  const { fieldsByInputName } = useMetadataContext();
  const form = useFormContext();

  const handleLinkClick = useCallback(() => {
    if (isEntityReference(field.type) && field.value && typeof field.value === 'object' && 'id' in field.value) {
      const recordId = field.value.id;
      const windowId = field.original?.referencedWindowId;
      const tabId = field.original?.referencedTabId;

      if (recordId && windowId && tabId && onLabelClick) {
        const path = `/window/${windowId}/${tabId}/${recordId}`;
        onLabelClick(path);
      }
    }
  }, [field, onLabelClick]);

  const { sessionAttributes } = useContext(FormViewContext);

  const isDisplayed = useMemo(() => {
    if (!field.original.displayLogicExpression) return true;

    const expr = field.original.displayLogicExpression;
    const result = parseDynamicExpression(expr);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const context = sessionAttributes; // Is actually used by the when executing "eval"
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const currentValues = getMappedValues(fieldsByInputName, form); // Is actually used by the when executing "eval"

    return eval(result);
  }, [field.original.displayLogicExpression, fieldsByInputName, form, sessionAttributes]);

  const isReadOnly = useMemo(() => {
    if (!field.original.readOnlyLogicExpression) return true;

    const expr = field.original.readOnlyLogicExpression;
    const result = parseDynamicExpression(expr);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const context = sessionAttributes; // Is actually used by the when executing "eval"
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const currentValues = getMappedValues(fieldsByInputName, form); // Is actually used by the when executing "eval"

    return eval(result);
  }, [field.original.readOnlyLogicExpression, fieldsByInputName, form, sessionAttributes]);

  return (
    <Box style={styles.fieldContainer}>
      <Box sx={sx.labelBox}>
        <FieldLabel
          label={field.label}
          required={field.required}
          fieldType={field.type}
          isEntityReference={isEntityReference(field.type)}
          onLinkClick={handleLinkClick}
          readOnly={isReadOnly}
        />
      </Box>
      <Box sx={sx.inputBox}>
        <GenericSelector tab={tab} field={field} isReadOnly={isReadOnly} isDisplayed={isDisplayed} />
      </Box>
    </Box>
  );
}
