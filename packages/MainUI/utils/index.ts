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

export const sanitizeValue = (value: unknown) => {
  const stringValue = String(value);
  const safeValue =
    stringValue === 'true' ? 'Y' : stringValue === 'false' ? 'N' : stringValue === 'null' ? null : value;

  return safeValue;
};

export const buildInitialFormState = (
  formInitialization: FormInitializationResponse,
  fieldsByColumnName: Record<string, Field>,
) => {
  const acc = { ...formInitialization.sessionAttributes } as Record<string, string | boolean | null>;

  Object.entries(formInitialization.auxiliaryInputValues).forEach(([key, { value }]) => {
    const newKey = fieldsByColumnName?.[key]?.hqlName ?? key;
    acc[newKey] = value;
  });

  Object.entries(formInitialization.columnValues).forEach(([key, { value, identifier }]) => {
    const newKey = fieldsByColumnName?.[key]?.hqlName ?? key;
    acc[newKey] = value;

    if (identifier) {
      acc[newKey + '_identifier'] = identifier;
    }
  });

  return acc;
};

export const buildPayloadByInputName = (values: Record<string, unknown>, fields?: Record<string, Field>) => {
  return Object.entries(values).reduce(
    (acc, [key, value]) => {
      const newKey = fields?.[key]?.inputName ?? key;
      acc[newKey] = sanitizeValue(value);

      return acc;
    },
    {} as Record<string, unknown>,
  );
};

export const parseDynamicExpression = (expr: string) => {
  return (
    expr
      // Reemplaza OB.Utilities.getValue(currentValues, 'prop') -> currentValues["PROP"]
      .replace(/OB\.Utilities\.getValue\((\w+),\s*["']([^"']+)["']\)/g, (_, obj, prop) => {
        return `${obj}["${prop}"]`;
      })

      // Reemplaza context.PROP -> context.PROP (en mayúsculas)
      .replace(/context\.(\$?\w+)/g, (_, prop) => {
        return `context.${prop}`;
      })

      // Reemplaza context["prop"] y context['prop'] (claves estáticas)
      .replace(/context\[\s*(['"])([^"'\]]+)\1\s*\]/g, (_, quote, prop) => {
        return `context[${quote}${prop}${quote}]`;
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
    return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(match) ? match : match;
  });
};
