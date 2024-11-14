import { FormData, Section } from '@workspaceui/componentlibrary/src/components/FormView/types';
import { Tab } from '@workspaceui/etendohookbinder/src/api/types';

export function adaptInitialData(tab: Tab, initialData: Record<string, any>): FormData {
  const formData: FormData = {};
  const sections = new Set<string>(['Main']);

  Object.values(tab.fields).forEach(field => {
    const sectionName = field.fieldGroup$_identifier;
    if (sectionName) sections.add(sectionName);
  });

  sections.forEach(sectionName => {
    formData[sectionName] = {
      name: sectionName,
      label: sectionName === 'Main' ? tab.title : sectionName,
      type: 'section',
      personalizable: false,
      id: sectionName,
      showInTab: 'both',
    } as Section;
  });

  Object.entries(tab.fields).forEach(([fieldName, fieldInfo]) => {
    const sectionName = fieldInfo.fieldGroup$_identifier || 'Main';
    const value = initialData[fieldName];
    const identifier = initialData[`${fieldName}$_identifier`];

    formData[fieldName] = {
      value: identifier
        ? {
            id: value,
            title: identifier,
            value: value,
          }
        : value,
      type: fieldInfo.column.reference === '19' ? 'tabledir' : 'text', // Ajusta según tus tipos
      label: fieldInfo.column.name,
      section: sectionName,
      required: fieldInfo.column.isMandatory ?? true,
      referencedTable: fieldInfo.column.reference,
      original: {
        ...fieldInfo,
        fieldName,
      },
    };
  });

  return formData;
}
