import { EntityData, Field, FieldType, FormInitializationResponse } from '@workspaceui/etendohookbinder/src/api/types';

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

  const valueMap = {
    true: 'Y',
    false: 'N',
    null: null,
  } as const;

  const safeValue = Object.prototype.hasOwnProperty.call(valueMap, stringValue)
    ? valueMap[stringValue as keyof typeof valueMap]
    : value;

  return safeValue;
};

export const buildInitialFormState = (
  record: EntityData | undefined,
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

  const result = { ...acc, ...record };

  console.debug("buildInitialFormState");

  return result;
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
  return expr
    .replace(/OB\.Utilities\.getValue\((\w+),\s*["']([^"']+)["']\)/g, (_, obj, prop) => {
      return `${obj}["${prop}"]`;
    })

    .replace(/context\.(\$?\w+)/g, (_, prop) => {
      return `context.${prop}`;
    })

    .replace(/context\[\s*(['"])([^"'\]]+)\1\s*\]/g, (_, quote, prop) => {
      return `context[${quote}${prop}${quote}]`;
    })

    .replace(/context\[\s*(['"])(.*?)\1\s*\]/g, (_, quote, key) => {
      const transformedKey = transformDynamicKey(key);
      return `context[${quote}${transformedKey}${quote}]`;
    });
};

const transformDynamicKey = (key: string): string => {
  return key.replace(/\b([A-Z_$][A-Z0-9_$]*)\b/gi, (match: string) => {
    return match === 'currentValues' ? match : match;
  });
};
