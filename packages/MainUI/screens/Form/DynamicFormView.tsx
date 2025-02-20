import { memo, useCallback, useMemo, useState, useEffect } from 'react';
import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useRouter } from 'next/navigation';
import { adaptFormData } from '../../utils/FormUtils';
import { useForm, FormProvider, UseFormProps } from 'react-hook-form';
import { buildFormState, getFieldsByName } from '@workspaceui/etendohookbinder/src/utils/metadata';
import { FormInitializationResponse } from '../../hooks/useFormInitialValues';
import FormView from '@/components/Form/FormView';
import { FormData } from '@/components/Form/FormView/types';

function DynamicFormView({
  tab,
  record,
  formState,
}: {
  tab: Tab;
  record: Record<string, unknown>;
  formState?: FormInitializationResponse;
}) {
  const navigate = useRouter().push;
  const [formData] = useState<FormData | null>(adaptFormData(tab, record));
  const fieldsByInputName = useMemo(() => getFieldsByName(tab), [tab]);

  // Función para obtener el conjunto de columnas válidas
  const getValidColumnNames = useMemo(() => {
    return new Set(Object.values(tab.fields).map(field => field.columnName));
  }, [tab.fields]);

  const getAdditionalFields = useCallback((originalRecord: Record<string, unknown>) => {
    const additionalFields = [
      'accountingDate',
      'active',
      'calculatePromotions',
      'chargeAmount',
      'createdBy',
      'creationDate',
      'deliveryStatus',
      'deliveryTerms',
      'formOfPayment',
      'freightAmount',
      'generateTemplate',
      'invoiceStatus',
      'print',
      'printDiscount',
      'priority',
      'processNow',
      'recordTime',
      'reinvoice',
      'reservationStatus',
      'selected',
      'selfService',
      'summedLineAmount',
      'updated',
      'updatedBy',
    ];

    return additionalFields.reduce((acc, field) => {
      if (originalRecord[field] !== undefined) {
        acc[field] = originalRecord[field];
      }
      return acc;
    }, {} as Record<string, unknown>);
  }, []);

  const transformFormData = useCallback(
    (data: Record<string, unknown>) => {
      console.log('Starting data transformation. Initial data:', data);
      const transformedData: Record<string, unknown> = {};
      const validColumnNames = getValidColumnNames;
      const processedFields = new Set<string>();

      const additionalFields = getAdditionalFields(record);
      Object.entries(additionalFields).forEach(([key, value]) => {
        transformedData[key] = value;
        processedFields.add(key);
        console.log(`Added additional field: ${key}:`, value);
      });

      if (formState?.auxiliaryInputValues) {
        Object.entries(formState.auxiliaryInputValues).forEach(([key, value]) => {
          transformedData[key] = value.value;
          processedFields.add(key);
        });
      }

      // Procesar valores del formulario actual
      Object.entries(data).forEach(([key, value]) => {
        const field = fieldsByInputName[key];
        if (field) {
          const columnName = field.columnName;
          if (validColumnNames.has(columnName)) {
            if (typeof value === 'object' && value !== null && 'id' in value) {
              transformedData[columnName] = (value as { id: string }).id;
            } else {
              transformedData[columnName] = value;
            }
            processedFields.add(columnName);
            console.log(`Transformed field: ${key} -> ${columnName}:`, transformedData[columnName]);
          }
        }
      });

      // Agregar valores no procesados de columnValues manteniendo solo los columnNames válidos
      if (formState?.columnValues) {
        Object.entries(formState.columnValues).forEach(([columnName, val]) => {
          if (validColumnNames.has(columnName) && !processedFields.has(columnName)) {
            transformedData[columnName] = val.value;
            console.log(`Added from columnValues: ${columnName}:`, val.value);
          }
        });
      }

      // Agregar metadata necesaria
      const finalData = {
        ...transformedData,
        _entityName: tab.entityName,
        id: record.id || transformedData['C_Order_ID'] || formState?.columnValues?.C_Order_ID?.value,
      };

      console.log('Final transformed data:', finalData);
      return finalData;
    },
    [
      getValidColumnNames,
      getAdditionalFields,
      record,
      formState?.auxiliaryInputValues,
      formState?.columnValues,
      tab.entityName,
      fieldsByInputName,
    ],
  );

  const handleSave = useCallback(
    async (formValues: Record<string, unknown>) => {
      try {
        console.log('Starting save process with values:', formValues);
        const transformedData = transformFormData(formValues);

        const payload = {
          operationType: 'update',
          data: transformedData,
        };

        console.log('Save payload prepared:', payload);
        // await saveRecord(payload);

        // Comentado temporalmente para debug
        // navigate('/');
      } catch (error) {
        console.error('Error saving form:', error);
      }
    },
    [transformFormData],
  );

  const handleCancel = useCallback(() => navigate('/'), [navigate]);
  const handleLabelClick = useCallback((path: string) => navigate(path), [navigate]);

  const formOptions = useMemo<UseFormProps>(
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

  // Debug useEffect para forzar guardado automático
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Debug: Triggering automatic save after 10 seconds');
      const currentValues = methods.getValues();
      handleSave(currentValues);
    }, 10000);

    return () => clearTimeout(timer);
  }, [methods, handleSave]);

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
}

export default memo(DynamicFormView, () => true);
