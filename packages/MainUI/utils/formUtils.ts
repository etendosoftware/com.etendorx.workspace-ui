import { EntityData, Field } from '@workspaceui/etendohookbinder/src/api/types';

/**
 * Formats date values to the format expected by Etendo backend
 * Converts from YYYY-MM-DD to DD-MM-YYYY
 */
export const formatDateForEtendo = (date: string | undefined | null) => {
  if (!date) return date;

  // Check if it's in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-');
    return `${day}-${month}-${year}`;
  }

  return date;
};

/**
 * Formats date values from Etendo backend format to the format used by the frontend
 * Converts from DD-MM-YYYY to YYYY-MM-DD
 */
export const formatDateFromEtendo = (date: string | undefined | null) => {
  if (!date) return null;

  if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
    const [day, month, year] = date.split('-');
    return `${year}-${month}-${day}`;
  }

  return date;
};

export const isDateField = (field?: Field) => {
  return field?.column?.reference === '15' || field?.column?.reference === '16';
};

export const formatDatesForEtendo = (data: EntityData, fields: Record<string, Field>) => {
  const result = { ...data };

  Object.entries(result).forEach(([key, value]) => {
    if (typeof value === 'string' && fields[key] && isDateField(fields[key])) {
      result[key] ? '' : formatDateForEtendo(value);
    }
  });

  return result;
};

/**
 * Transforms all date values in an object from Etendo format to frontend format
 */
export const formatDatesFromEtendo = (data: EntityData, fields: Record<string, Field>) => {
  const result = { ...data };

  Object.entries(result).forEach(([key, value]) => {
    if (typeof value === 'string' && fields[key] && isDateField(fields[key])) {
      result[key] ? '' : formatDateFromEtendo(value);
    }
  });

  return result;
};
