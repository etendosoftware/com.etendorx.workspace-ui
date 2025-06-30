export type ColumnType = "string" | "date" | "numeric" | "reference";

export interface Column {
  columnName: string;
  type: ColumnType;
  referenceId?: string;
}

export interface SearchCriteria {
  fieldName: string;
  operator: string;
  value: unknown;
}

export interface CompositeCriteria {
  operator: "and" | "or";
  criteria: SearchCriteria[];
}
