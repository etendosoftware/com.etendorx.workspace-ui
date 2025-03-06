import { Field, FieldType, FormInitializationResponse } from '@workspaceui/etendohookbinder/src/api/types';

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getFieldReference = (field?: Field): FieldType => {
  switch (field?.column?.reference) {
    case '19':
    case '95E2A8B50A254B2AAE6774B8C2F28120':
    case '18':
      return FieldType.TABLEDIR;
    case '15':
    case '16':
      return FieldType.DATE;
    case '20':
      return FieldType.BOOLEAN;
    case '29':
      return FieldType.QUANTITY;
    case '17':
    case '13':
      return FieldType.LIST;
    case '30':
      return FieldType.SELECT;
    case '12':
    case '11':
    case '22':
    default:
      return FieldType.TEXT;
  }
};

export const sanitizeValue = (field: Field | undefined, value: unknown) => {
  const reference = getFieldReference(field);

  if (reference === FieldType.BOOLEAN) {
    return value ? 'Y' : 'N';
  }

  if (reference === FieldType.QUANTITY) {
    return value;
  }

  if (value == null) {
    return '';
  }

  return value;
};

export const getCombinedEntries = (formInitialization: FormInitializationResponse) => [
  ...Object.entries(formInitialization.auxiliaryInputValues),
  ...Object.entries(formInitialization.columnValues),
];

export const buildUpdatedValues = (
  entries: [string, { value: string; identifier?: string }][],
  fieldsByColumnName: Record<string, Field>,
) => {
  return entries.reduce(
    (acc, [columnName, { value }]) => {
      const field = fieldsByColumnName[columnName];
      const key = field?.hqlName ?? columnName;
      acc[key] = sanitizeValue(field, value);
      return acc;
    },
    {} as Record<string, unknown>,
  );
};

export const buildPayloadByInputName = (values: Record<string, unknown>, fields?: Record<string, Field>) =>
  Object.entries(values).reduce(
    (acc, [key, value]) => {
      const newKey = fields?.[key]?.inputName;

      if (newKey) {
        acc[newKey] = value;
      }

      return acc;
    },
    {} as Record<string, unknown>,
  );

export const parseDynamicExpression = (expr: string) => {
  return (
    expr
      // Reemplaza OB.Utilities.getValue(currentValues, 'prop') -> currentValues["PROP"]
      .replace(/OB\.Utilities\.getValue\((\w+),\s*["']([^"']+)["']\)/g, (_, obj, prop) => {
        return `${obj}["${prop}"]`;
      })

      // Reemplaza context.PROP -> context.PROP (en mayúsculas)
      .replace(/context\.(\$?\w+)/g, (_, prop) => {
        return `context.${prop.toUpperCase()}`;
      })

      // Reemplaza context["prop"] y context['prop'] (claves estáticas)
      .replace(/context\[\s*(['"])([^"'\]]+)\1\s*\]/g, (_, quote, prop) => {
        return `context[${quote}${prop.toUpperCase()}${quote}]`;
      })

      // Reemplaza partes fijas en claves dinámicas dentro de context["..."], EXCLUYE currentValues
      .replace(/context\[\s*(['"])(.*?)\1\s*\]/g, (_, quote, key) => {
        // Excluye 'currentValues' de la transformación a mayúsculas
        const transformedKey = transformDynamicKey(key);
        return `context[${quote}${transformedKey}${quote}]`;
      })
  );
};

// Función auxiliar para transformar las claves dinámicas
const transformDynamicKey = (key: string): string => {
  return key.replace(/\b([A-Z_$][A-Z0-9_$]*)\b/gi, (match: string) => {
    // No convertir 'currentValues'
    if (match === 'currentValues') return match;
    // Convierte a mayúsculas las claves que no sean identificadores reservados
    return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(match) ? match.toUpperCase() : match;
  });
};
