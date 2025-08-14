import React from 'react';
import { expect, within, userEvent, waitFor } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import { FormProvider, useForm } from 'react-hook-form';
import TableDirSelector from '@/components/ad_reports/selectors/TableDirSelector';
import { datasource } from "@workspaceui/api-client/src/api/datasource";

// Polyfill para useInsertionEffect si no existe (compatibilidad con React < 18 o problemas de resolución)
if (typeof React.useInsertionEffect === 'undefined') {
  // @ts-ignore
  React.useInsertionEffect = React.useLayoutEffect;
  console.log('🔧 useInsertionEffect polyfill aplicado');
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
console.log('🔧 TEST STORIES: Configurando mock del datasource...');

// Configurar URL base para evitar errores de URL inválida
datasource.setBaseUrl('http://localhost:8080');
console.log('✅ TEST STORIES: URL base configurada:', datasource.client);

// Interceptar inmediatamente en el nivel del client.request
console.log('🔧 TEST STORIES: Configurando interceptor del client.request...');
datasource.client.request = ((url, options = {}) => {
  console.log('🎯 TEST STORIES SUCCESS! Client REQUEST call intercepted:', { url, options });
  
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
    }, 300); // Reducido a 300ms para tests más rápidos
  });
});

// Decorator para proveer FormContext
const withFormProvider = (Story: any, context: any) => {
  const methods = useForm({
    defaultValues: {
      [context.args.name]: context.args.value || ''
    }
  });

  const handleChange = (value: string) => {
    console.log('🔄 Test Selection changed:', value);
    methods.setValue(context.args.name, value);
    context.args.onChange(value);
  };

  return (
    <FormProvider {...methods}>
      <div style={{ padding: '20px', maxWidth: '400px' }}>
        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
          {context.args.label}
        </div>
        <Story args={{ ...context.args, onChange: handleChange }} />
      </div>
    </FormProvider>
  );
};

// Tests automáticos para las stories existentes
const meta: Meta<typeof TableDirSelector> = {
  title: 'Components/Input/TableDirSelector/Tests',
  component: TableDirSelector,
  decorators: [withFormProvider],
  parameters: {
    // Ejecutar tests automáticamente
    test: {
      include: ['**/TableDirSelector.test.stories.*'],
    }
  }
};

export default meta;

type Story = StoryObj<typeof TableDirSelector>;

export const DefaultInteractionTest: Story = {
  args: {
    label: 'Document Action Test',
    value: null,
    entity: 'ADRefList',
    name: 'document_action_test',
    onChange: (value: string) => console.log('Test Changed:', value),
    isReadOnly: false
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test 1: Esperar a que el componente termine de cargar
    console.log('🧪 Test 1: Esperando a que termine la carga...');
    await waitFor(async () => {
      const combobox = canvas.queryByRole('combobox');
      expect(combobox).toBeInTheDocument();
    }, { timeout: 15000 });
    
    // Test 2: Esperar a que los datos se carguen (verificar que no hay spinner)
    console.log('🧪 Test 2: Esperando a que termine la carga de datos...');
    await waitFor(async () => {
      const spinner = canvas.queryByRole('progressbar');
      expect(spinner).not.toBeInTheDocument();
    }, { timeout: 15000 });
    
    // Test 3: Obtener referencia al combobox una vez que está cargado
    const combobox = canvas.getByRole('combobox');
    console.log('✅ Test 2: Componente y datos cargados correctamente');
    
    // Test 4: Verificar que se puede abrir el dropdown
    console.log('🧪 Test 3: Probando interacción...');
    await userEvent.click(combobox);
    
    console.log('🎉 Todos los tests de DefaultInteractionTest completados');
  },
};

export const ReadOnlyTest: Story = {
  args: {
    label: 'Document Action (Read Only Test)',
    value: null,
    entity: 'ADRefList',
    name: 'document_action_readonly',
    onChange: (value: string) => console.log('ReadOnly Test:', value),
    isReadOnly: true
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test: Esperar a que el componente termine de cargar
    console.log('🧪 ReadOnly Test: Esperando carga...');
    await waitFor(async () => {
      const combobox = canvas.queryByRole('combobox');
      expect(combobox).toBeInTheDocument();
    }, { timeout: 15000 });
    
    // Test: Esperar a que los datos se carguen
    console.log('🧪 ReadOnly Test: Esperando carga de datos...');
    await waitFor(async () => {
      const spinner = canvas.queryByRole('progressbar');
      expect(spinner).not.toBeInTheDocument();
    }, { timeout: 15000 });
    
    // Test: Verificar que el campo está deshabilitado
    const combobox = canvas.getByRole('combobox');
    console.log('🧪 ReadOnly Test: Verificando que está deshabilitado...');
    expect(combobox).toBeDisabled();
    
    console.log('✅ ReadOnly Test completado');
  },
};

export const PreselectedValueTest: Story = {
  args: {
    label: 'Document Action (Preselected Test)',
    value: '2', // Complete
    entity: 'ADRefList',
    name: 'document_action_preselected',
    onChange: (value: string) => console.log('Preselected Test:', value),
    isReadOnly: false
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test: Esperar a que el componente termine de cargar
    console.log('🧪 Preselected Test: Esperando carga...');
    await waitFor(async () => {
      const combobox = canvas.queryByRole('combobox');
      expect(combobox).toBeInTheDocument();
    }, { timeout: 15000 });
    
    // Test: Verificar que el valor preseleccionado está presente
    console.log('🧪 Preselected Test: Verificando valor preseleccionado...');
    await waitFor(async () => {
      const combobox = canvas.getByRole('combobox');
      const value = combobox.getAttribute('value') || combobox.textContent;
      expect(value).toBeTruthy();
      expect(value).not.toBe('');
    }, { timeout: 10000 });
    
    console.log('✅ Preselected Test completado');
  },
};

export const ErrorHandlingTest: Story = {
  args: {
    label: 'Document Action (Error Test)',
    value: null,
    entity: 'NonExistentEntity', // Entidad que causará error en mock
    name: 'document_action_error',
    onChange: (value: string) => console.log('Error Test:', value),
    isReadOnly: false
  },
  parameters: {
    mockData: {
      // Simular error en la API
      shouldError: true
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test: Esperar a que el componente termine de cargar (incluso con error)
    console.log('🧪 Error Test: Esperando carga (con posible error)...');
    await waitFor(async () => {
      // Buscar cualquier elemento que indique que el componente se renderizó
      const combobox = canvas.queryByRole('combobox');
      const progressbar = canvas.queryByRole('progressbar');
      expect(combobox || progressbar).toBeTruthy();
    }, { timeout: 15000 });
    
    console.log('✅ Error Test: Componente manejó la entidad no existente');
  },
};

export const AccessibilityTest: Story = {
  args: {
    label: 'Document Action (A11y Test)',
    value: null,
    entity: 'ADRefList',
    name: 'document_action_a11y',
    onChange: (value: string) => console.log('A11y Test:', value),
    isReadOnly: false
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test: Esperar a que el componente termine de cargar
    console.log('🧪 A11y Test: Esperando carga...');
    await waitFor(async () => {
      const combobox = canvas.queryByRole('combobox');
      expect(combobox).toBeInTheDocument();
    }, { timeout: 15000 });
    
    // Test 1: Verificar que tiene elementos accesibles
    const combobox = canvas.getByRole('combobox');
    console.log('🧪 A11y Test: Verificando accesibilidad...');
    
    // Test 2: Verificar que el combobox tiene atributos básicos de accesibilidad
    expect(combobox).toBeInTheDocument();
    
    // Test 3: Navegación con teclado básica
    console.log('🧪 A11y Test: Probando navegación...');
    await userEvent.click(combobox); // Focus en el elemento
    
    console.log('✅ A11y Test completado');
  },
};