import { memo, useCallback, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useRouter } from 'next/navigation';
import { adaptFormData } from '../../utils/FormUtils';
import { useForm, FormProvider } from 'react-hook-form';
import { buildFormState, getFieldsByName } from '@workspaceui/etendohookbinder/src/utils/metadata';
import { FormInitializationResponse } from '../../hooks/useFormInitialValues';
import FormView from '@/components/Form/FormView';
import { FormData } from '@/components/Form/FormView/types';
import { useFormSave } from '@/hooks/Toolbar/useFormSave';

const DynamicFormView = forwardRef(
  (
    {
      tab,
      record,
      formState,
      windowId,
      tabId,
    }: {
      tab: Tab;
      record: Record<string, unknown>;
      formState?: FormInitializationResponse;
      windowId: string;
      tabId: string;
    },
    ref,
  ) => {
    const navigate = useRouter().push;
    const [formData] = useState<FormData | null>(adaptFormData(tab, record));
    const fieldsByInputName = useMemo(() => getFieldsByName(tab), [tab]);

    const { saveForm } = useFormSave({
      windowId,
      tabId,
      recordId: record.id as string,
    });

    const transformFormData = useCallback(
      (data: Record<string, unknown>) => {
        console.log('Starting data transformation. Initial data:', data);
        const transformedData: Record<string, unknown> = {};
        const validColumnNames = new Set(Object.values(tab.fields).map(field => field.columnName));
        const processedFields = new Set<string>();

        // Procesar valores del formulario actual
        Object.entries(data).forEach(([key, value]) => {
          const field = fieldsByInputName[key];
          if (field) {
            const columnName = field.columnName;
            if (validColumnNames.has(columnName) && !processedFields.has(columnName)) {
              if (typeof value === 'object' && value !== null && 'id' in value) {
                transformedData[columnName] = (value as { id: string }).id;
              } else {
                transformedData[columnName] = value;
              }
              processedFields.add(columnName);
            }
          } else if (!processedFields.has(key)) {
            transformedData[key] = value;
            processedFields.add(key);
          }
        });

        // Valores por defecto para campos requeridos
        if (!transformedData.active && !processedFields.has('active')) {
          transformedData.active = true;
        }
        if (!transformedData.recordTime && !processedFields.has('recordTime')) {
          transformedData.recordTime = Date.now();
        }

        return transformedData;
      },
      [fieldsByInputName, tab],
    );

    const handleSave = useCallback(
      async (formValues: Record<string, unknown>) => {
        try {
          const transformedData = transformFormData(formValues);
          const response = await saveForm(transformedData);

          if (!response.success) {
            throw new Error(response.message || 'Failed to save form');
          }

          return response;
        } catch (error) {
          console.error('Error saving form:', error);
          throw error;
        }
      },
      [transformFormData, saveForm],
    );

    useImperativeHandle(ref, () => ({
      handleSave: async () => {
        const formValues = methods.getValues();
        return handleSave(formValues);
      },
    }));

    const handleCancel = useCallback(() => navigate('/'), [navigate]);
    const handleLabelClick = useCallback((path: string) => navigate(path), [navigate]);

    const formOptions = useMemo(
      () => ({
        defaultValues: buildFormState(tab.fields, record, formState as never),
        criteriaMode: 'all',
        mode: 'onSubmit',
        reValidateMode: 'onSubmit',
        progressive: true,
      }),
      [formState, record, tab.fields],
    );

    const methods = useForm(formOptions);

    if (!formData) return <div>No form data available</div>;

    return (
      <FormProvider {...methods}>
        <FormView
          data={formData}
          onSave={handleSave}
          onCancel={handleCancel}
          initialValues
          tab={tab}
          onLabelClick={handleLabelClick}
          readOnly={formState?._readOnly}
          sessionAttributes={formState?.sessionAttributes}
          auxiliaryInputValues={formState?.auxiliaryInputValues}
        />
      </FormProvider>
    );
  },
);

DynamicFormView.displayName = 'DynamicFormView';

export default memo(DynamicFormView, () => true);
