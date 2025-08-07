import React from 'react';
import { Story, Meta } from '@storybook/react';
import { FormProvider, useForm } from 'react-hook-form';
import TableDirSelector from '@/components/ad_reports/selectors/TableDirSelector';
import { Field, FieldValue } from "@workspaceui/api-client/src/api/types";
import { datasource } from "@workspaceui/api-client/src/api/datasource";

interface TableDirSelectorProps {
  label: string;
  value: FieldValue;
  entity: string;
  name: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  isReadOnly?: boolean;
}

// Mock data para simular respuestas del backend
const mockDataByEntity: Record<string, any[]> = {
  ADRefList: [
    { id: '1', _identifier: 'Draft', name: 'Draft', description: 'Document is in draft state' },
    { id: '2', _identifier: 'Complete', name: 'Complete', description: 'Document is completed' },
    { id: '3', _identifier: 'Void', name: 'Void', description: 'Document is voided' },
    { id: '4', _identifier: 'Reverse - Accrual', name: 'Reverse - Accrual', description: 'Reverse document with accrual' },
    { id: '5', _identifier: 'Reverse - Correct', name: 'Reverse - Correct', description: 'Reverse document with correction' },
    { id: '6', _identifier: 'Close', name: 'Close', description: 'Close the document' },
    { id: '7', _identifier: 'Prepare', name: 'Prepare', description: 'Prepare the document' },
    { id: '8', _identifier: 'Invalidate', name: 'Invalidate', description: 'Invalidate the document' }
  ],
  Organization: [
    { id: 'ORG1', _identifier: 'Main Organization', name: 'Main Organization' },
    { id: 'ORG2', _identifier: 'Sales Department', name: 'Sales Department' },
    { id: 'ORG3', _identifier: 'Marketing Department', name: 'Marketing Department' },
    { id: 'ORG4', _identifier: 'IT Department', name: 'IT Department' },
    { id: 'ORG5', _identifier: 'HR Department', name: 'HR Department' }
  ]
};

// Mock del datasource para simular llamadas al backend
console.log('🔧 Configurando mock del datasource...');

// Configurar URL base para evitar errores de URL inválida
datasource.setBaseUrl('http://localhost:8080');
console.log('✅ URL base configurada:', datasource.client);

// Guardar referencia original (para posible restauración futura)
// const originalClientRequest = datasource.client.request;

// Interceptar inmediatamente en el nivel del client.request
console.log('🔧 Configurando interceptor del client.request...');
datasource.client.request = ((url, options = {}) => {
  console.log('🎯 SUCCESS! Client REQUEST call intercepted:', { url, options });
  
  // Obtener datos mock basados en la URL (entidad)
  const mockData = mockDataByEntity[url] || [
    { id: '1', _identifier: `Mock ${url} 1`, name: `Mock ${url} 1` },
    { id: '2', _identifier: `Mock ${url} 2`, name: `Mock ${url} 2` }
  ];
  
  // Simular delay del backend y retornar estructura correcta
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        data: {
          response: {
            data: mockData,
            totalRows: mockData.length
          }
        }
      } as any;
      resolve(mockResponse);
    }, 800); // 800ms delay para simular red
  });
});

export default {
  title: 'Components/Input/TableDirSelector',
  component: TableDirSelector
} as Meta;

const Template: Story<TableDirSelectorProps> = (args: TableDirSelectorProps) => {
  const methods = useForm({
    defaultValues: {
      [args.name]: args.value || ''
    }
  });
  
  const handleChange = (value: string) => {
    console.log('🔄 Selection changed:', value);
    methods.setValue(args.name, value);
    args.onChange(value);
  };
  
  return (
    <FormProvider {...methods}>
      <div style={{ padding: '20px', maxWidth: '400px' }}>
        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
          {args.label}
        </div>
        <TableDirSelector {...args} onChange={handleChange} />
      </div>
    </FormProvider>
  );
};

export const Default = Template.bind({});
Default.args = {
  label: 'Document Action',
  value: null,
  entity: 'ADRefList',
  name: 'document_action',
  onChange: (value: string) => console.log('Changed:', value),
  isReadOnly: false
};

export const ReadOnly = Template.bind({});
ReadOnly.args = {
  ...Default.args,
  label: 'Document Action (Read Only)',
  isReadOnly: true
};

export const WithPreselectedValue = Template.bind({});
WithPreselectedValue.args = {
  ...Default.args,
  label: 'Document Action (Preselected)',
  value: '2' // Complete
};

export const DifferentEntity = Template.bind({});
DifferentEntity.args = {
  ...Default.args,
  label: 'Organization',
  entity: 'Organization',
  name: 'organization_id'
};

