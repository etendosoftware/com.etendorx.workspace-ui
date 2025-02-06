import { memo, useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import { useStyle } from '../styles';
import { FormFieldGroupProps } from '../types';
import { GenericSelector } from '@workspaceui/mainui/components/Form/GenericSelector';
import { useMetadataContext } from '@workspaceui/mainui/hooks/useMetadataContext';
import { FieldLabel } from '../Sections/FieldLabel';
import { isEntityReference } from '@workspaceui/etendohookbinder/src/utils/metadata';
import { useFormContext } from 'react-hook-form';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';

const FormFieldGroup: React.FC<FormFieldGroupProps> = memo(({ tab, field, onLabelClick }) => {
  const { styles, sx } = useStyle();
  const form = useFormContext();
  const { fieldsByInputName } = useMetadataContext();

  const isVisible = useMemo(() => {
    const expr = field.original.displayLogicState?.displayLogicExpr;
    const sessionAttrs = field.original.displayLogicState?.sessionAttributes;
    if (!expr) return true;

    try {
      const context = { ...sessionAttrs };
      const values = Object.entries(form.getValues()).reduce((acc, [inputName, inputValue]) => {
        const field = fieldsByInputName[inputName];
        if (field) {
          if (field.column.dBColumnName === 'C_DocType_ID' || field.column.dBColumnName === 'C_DocTypeTarget_ID') {
            acc['DOCBASETYPE'] = 'SOO'; // Por ahora hardcodeamos SOO
          }
          acc[field.column.dBColumnName] = inputValue;
        }
        return acc;
      }, {} as Record<string, unknown>);

      console.log('Evaluating display logic:', {
        field: field.name,
        expr,
        values,
        context,
      });

      if (expr.includes('$IsAcctDimCentrally')) {
        const isAcctDimCentrally = context.$IsAcctDimCentrally === 'Y';
        console.log('Accounting dimension check:', {
          field: field.name,
          isAcctDimCentrally,
          values,
          context,
        });

        if (isAcctDimCentrally) {
          let elementType = '';
          if (expr.includes('$Element_OO')) elementType = 'OO';
          else if (expr.includes('$Element_BP')) elementType = 'BP';
          else if (expr.includes('$Element_U1')) elementType = 'U1';
          else if (expr.includes('$Element_U2')) elementType = 'U2';

          const dynamicKey = `$Element_${elementType}_SOO_H`;
          console.log('Dynamic key check:', {
            field: field.name,
            elementType,
            dynamicKey,
            value: context[dynamicKey],
          });

          return context[dynamicKey] === 'Y';
        }
      }

      return Metadata.evaluateExpression(expr, values, context);
    } catch (error) {
      console.error('Error evaluating display logic:', error);
      return true;
    }
  }, [field.original.displayLogicState, fieldsByInputName, form, field.name]);

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

  const isReadOnly = useMemo(() => {
    return field.readOnlyState?.readOnly ?? false;
  }, [field.readOnlyState?.readOnly]);

  if (!isVisible) return null;

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
        <GenericSelector tab={tab} field={field} readOnly={isReadOnly} />
      </Box>
    </Box>
  );
});

export default FormFieldGroup;
