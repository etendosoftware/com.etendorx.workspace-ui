import { FieldType } from '../screens/Form/types';
import { Column, MappedData, MappedTab, WindowMetadata } from '@workspaceui/etendohookbinder/api/types';

export function mapColumnTypeToFieldType(column: Column): FieldType {
  if (!column || !column?.reference) {
    console.warn('Invalid column data:', column);
    return 'text';
  }
  switch (column?.reference) {
    case '19':
      return 'tabledir';
    case '15':
    case '16':
      return 'date';
    case '20':
      return 'boolean';
    case '12':
    case '17':
    case '30':
      return 'search';
    case '18':
    case '11':
    case '29':
    case '22':
    default:
      return 'text';
  }
}

export function mapWindowMetadata(windowData: WindowMetadata): MappedData {
  const mappedData: MappedData = {
    name: windowData.name,
    id: windowData.id,
    tabs: windowData.tabs.map(tab => {
      const mappedTab: MappedTab = {
        id: tab.id,
        name: tab._identifier,
        fields: {},
      };

      Object.entries(tab.fields).forEach(([fieldName, fieldInfo]) => {
        const column = fieldInfo.column as unknown as Column;
        mappedTab.fields[fieldName] = {
          name: fieldName,
          label: column.name,
          type: mapColumnTypeToFieldType(column),
          referencedTable: column.reference,
          required: column.isMandatory,
        };
      });

      return mappedTab;
    }),
  };

  return mappedData;
}
