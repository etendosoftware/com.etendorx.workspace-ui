const ID_SEPARATOR = ",";
const IDENTIFIER_SEPARATOR = ", ";

export const parseCsvIds = (csv: unknown): string[] => {
  if (typeof csv !== "string" || csv.length === 0) return [];
  return csv.split(ID_SEPARATOR);
};

export const parseCsvIdentifiers = (csv: unknown): string[] => {
  if (typeof csv !== "string" || csv.length === 0) return [];
  return csv.split(IDENTIFIER_SEPARATOR);
};

export const toCsv = (ids: string[]): string => ids.join(ID_SEPARATOR);

export const toCsvIdentifiers = (identifiers: string[]): string => identifiers.join(IDENTIFIER_SEPARATOR);
