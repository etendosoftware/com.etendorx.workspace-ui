import { BaseCriteria, Column, CompositeCriteria } from '../api/types';

interface ColumnsByType {
  string?: Column[];
  date?: Column[];
  numeric?: Column[];
  reference?: Column[];
}

const REFERENCE_FIELDS = [
  'organization',
  'transactionDocument',
  'businessPartner',
  'partnerAddress',
  'currency',
  'warehouse',
];

const NUMERIC_FIELDS = [
  'amount',
  'price',
  'quantity',
  'total',
  'paid',
  'percentage',
  'outstanding',
  'days',
  'grandTotalAmount',
];

const STATUS_FIELDS = ['documentStatus'];

export class SearchUtils {
  private static readonly FULL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
  private static readonly YEAR_PATTERN = /^\d{4}$/;
  private static readonly YEAR_MONTH_PATTERN = /^\d{4}-\d{2}$/;
  private static readonly YEAR_PARTIAL_PATTERN = /^\d{4}-$/;
  private static readonly NUMERIC_PATTERN = /^-?\d*\.?\d+$/;

  private static detectValueType(value: string): keyof ColumnsByType {
    if (
      this.FULL_DATE_PATTERN.test(value) ||
      this.YEAR_PATTERN.test(value) ||
      this.YEAR_MONTH_PATTERN.test(value) ||
      this.YEAR_PARTIAL_PATTERN.test(value)
    ) {
      return 'date';
    }
    if (this.NUMERIC_PATTERN.test(value)) return 'numeric';
    return 'string';
  }

  private static getColumnType(column: Column): keyof ColumnsByType {
    const columnName = column.columnName.toLowerCase();

    // Check if it's a reference field
    if (REFERENCE_FIELDS.includes(column.columnName)) {
      return 'reference';
    }

    // Check if it's a date field
    if (columnName.includes('date')) {
      return 'date';
    }

    // Check if it's a numeric field
    if (NUMERIC_FIELDS.includes(columnName)) {
      return 'numeric';
    }

    return 'string';
  }

  private static getDateCriteria(fieldName: string, searchQuery: string): BaseCriteria[] {
    const criteria: BaseCriteria[] = [];

    if (this.FULL_DATE_PATTERN.test(searchQuery)) {
      criteria.push({
        fieldName,
        operator: 'equals',
        value: searchQuery,
      });
    } else if (this.YEAR_MONTH_PATTERN.test(searchQuery)) {
      criteria.push({
        fieldName,
        operator: 'greaterOrEqual',
        value: `${searchQuery}-01`,
      });
      criteria.push({
        fieldName,
        operator: 'lessOrEqual',
        value: `${searchQuery}-31`,
      });
    } else if (this.YEAR_PATTERN.test(searchQuery)) {
      criteria.push({
        fieldName,
        operator: 'greaterOrEqual',
        value: `${searchQuery}-01-01`,
      });
      criteria.push({
        fieldName,
        operator: 'lessOrEqual',
        value: `${searchQuery}-12-31`,
      });
    } else if (this.YEAR_PARTIAL_PATTERN.test(searchQuery)) {
      // For partial year (2014-), search the entire year
      const year = searchQuery.slice(0, -1); // Remove the trailing hyphen
      criteria.push({
        fieldName,
        operator: 'greaterOrEqual',
        value: `${year}-01-01`,
      });
      criteria.push({
        fieldName,
        operator: 'lessOrEqual',
        value: `${year}-12-31`,
      });
    }

    return criteria;
  }

  static createSearchCriteria(columns: Column[], searchQuery: string): CompositeCriteria[] {
    if (!searchQuery || !columns.length) return [];

    const queryType = this.detectValueType(searchQuery);
    const compositeCriteria: CompositeCriteria[] = [];

    // Group columns by type
    const columnsByType = columns.reduce<ColumnsByType>((acc, column) => {
      const type = this.getColumnType(column);
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type]?.push(column);
      return acc;
    }, {});

    // Handle date search first
    if (queryType === 'date' && columnsByType.date?.length) {
      const dateCriteria: BaseCriteria[] = [];
      columnsByType.date.forEach(column => {
        dateCriteria.push(...this.getDateCriteria(column.columnName, searchQuery));
      });

      if (dateCriteria.length) {
        compositeCriteria.push({
          operator: 'or',
          criteria: dateCriteria,
        });
      }
      return compositeCriteria;
    }

    // Handle numeric search
    if (queryType === 'numeric') {
      // First group: Numeric fields
      const numericCriteria: BaseCriteria[] = [];
      if (columnsByType.numeric?.length) {
        numericCriteria.push({
          fieldName: 'grandTotalAmount',
          operator: 'equals',
          value: searchQuery,
        });
      }

      if (numericCriteria.length) {
        compositeCriteria.push({
          operator: 'or',
          criteria: numericCriteria,
        });
      }

      // Second group: Text fields and references
      const textSearchCriteria: BaseCriteria[] = [];

      // Add document number
      textSearchCriteria.push({
        fieldName: 'documentNo',
        operator: 'iContains',
        value: searchQuery,
      });

      // Add reference fields
      REFERENCE_FIELDS.forEach(field => {
        if (columnsByType.reference?.some(col => col.columnName === field)) {
          textSearchCriteria.push({
            fieldName: `${field}$_identifier`,
            operator: 'iContains',
            value: searchQuery,
          });
        }
      });

      // Add status fields
      STATUS_FIELDS.forEach(field => {
        if (columns.some(col => col.columnName === field)) {
          textSearchCriteria.push({
            fieldName: field,
            operator: 'iContains',
            value: searchQuery,
          });
        }
      });

      if (textSearchCriteria.length) {
        compositeCriteria.push({
          operator: 'or',
          criteria: textSearchCriteria,
        });
      }
    } else {
      // Handle text search
      const textSearchCriteria: BaseCriteria[] = [];

      // Add document number
      textSearchCriteria.push({
        fieldName: 'documentNo',
        operator: 'iContains',
        value: searchQuery,
      });

      // Add reference fields in specific order
      REFERENCE_FIELDS.forEach(field => {
        if (columnsByType.reference?.some(col => col.columnName === field)) {
          textSearchCriteria.push({
            fieldName: `${field}$_identifier`,
            operator: 'iContains',
            value: searchQuery,
          });
        }
      });

      // Add status fields
      STATUS_FIELDS.forEach(field => {
        if (columns.some(col => col.columnName === field)) {
          textSearchCriteria.push({
            fieldName: field,
            operator: 'iContains',
            value: searchQuery,
          });
        }
      });

      if (textSearchCriteria.length) {
        compositeCriteria.push({
          operator: 'or',
          criteria: textSearchCriteria,
        });
      }
    }

    return compositeCriteria;
  }
}
