import { BaseCriteria, Column, CompositeCriteria } from '../api/types';

interface ColumnsByType {
  string?: Column[];
  date?: Column[];
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

const EXCLUDED_NUMERIC_FIELDS = [
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

  private static detectValueType(value: string): keyof ColumnsByType {
    if (
      this.FULL_DATE_PATTERN.test(value) ||
      this.YEAR_PATTERN.test(value) ||
      this.YEAR_MONTH_PATTERN.test(value) ||
      this.YEAR_PARTIAL_PATTERN.test(value)
    ) {
      return 'date';
    }
    return 'string';
  }

  private static getColumnType(column: Column): keyof ColumnsByType {
    const columnName = column.columnName.toLowerCase();

    if (EXCLUDED_NUMERIC_FIELDS.includes(columnName)) {
      return 'string';
    }

    if (REFERENCE_FIELDS.includes(column.columnName)) {
      return 'reference';
    }

    if (columnName.includes('date')) {
      return 'date';
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
      const year = searchQuery.slice(0, -1);
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

    const columnsByType = columns.reduce<ColumnsByType>((acc, column) => {
      const type = this.getColumnType(column);
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type]?.push(column);
      return acc;
    }, {});

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

    const textSearchCriteria: BaseCriteria[] = [];

    textSearchCriteria.push({
      fieldName: 'documentNo',
      operator: 'iContains',
      value: searchQuery,
    });

    REFERENCE_FIELDS.forEach(field => {
      if (columnsByType.reference?.some(col => col.columnName === field)) {
        textSearchCriteria.push({
          fieldName: `${field}$_identifier`,
          operator: 'iContains',
          value: searchQuery,
        });
      }
    });

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

    return compositeCriteria;
  }
}
