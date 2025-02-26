import { BaseCriteria, Column, CompositeCriteria, MRT_ColumnFiltersState } from '../api/types';

type FormattedValue = string | number | null;

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

  public static getDateCriteria(fieldName: string, searchQuery: string): BaseCriteria[] {
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

export class ColumnFilterUtils {
  static isNumericField(column: Column): boolean {
    if (column.type && typeof column.type === 'string') {
      const lowerType = column.type.toLowerCase();

      if (
        lowerType.includes('amount') ||
        lowerType.includes('price') ||
        lowerType.includes('quantity') ||
        lowerType === 'number' ||
        lowerType === 'costnumber' ||
        lowerType === 'numeric' ||
        lowerType === 'float' ||
        lowerType === 'integer' ||
        lowerType === 'decimal' ||
        lowerType === 'long' ||
        lowerType === 'bigdecimal'
      ) {
        return true;
      }
    }

    return false;
  }

  static formatValueForType(value: unknown, column: Column): FormattedValue {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (this.isNumericField(column)) {
      const numValue = parseFloat(String(value).replace(',', '.'));
      if (!isNaN(numValue)) {
        return numValue;
      }
      return null;
    }

    return String(value);
  }

  private static handleRangeFilter(
    fieldName: string,
    rangeFilter: { from: FormattedValue; to: FormattedValue },
    column: Column,
  ): BaseCriteria[] {
    const result: BaseCriteria[] = [];

    if (rangeFilter.from !== null && rangeFilter.from !== undefined) {
      const formattedValue = this.formatValueForType(rangeFilter.from, column);
      if (formattedValue !== null) {
        result.push({
          fieldName,
          operator: 'greaterOrEqual',
          value: formattedValue,
        });
      }
    }

    if (rangeFilter.to !== null && rangeFilter.to !== undefined) {
      const formattedValue = this.formatValueForType(rangeFilter.to, column);
      if (formattedValue !== null) {
        result.push({
          fieldName,
          operator: 'lessOrEqual',
          value: formattedValue,
        });
      }
    }

    return result;
  }

  private static handleArrayFilter(fieldName: string, values: unknown[], column: Column): BaseCriteria[] {
    if (values.length === 0) return [];

    const validCriteria: BaseCriteria[] = [];

    for (const val of values) {
      const formattedValue = this.formatValueForType(val, column);
      if (formattedValue === null) continue;

      validCriteria.push({
        fieldName,
        operator: 'equals',
        value: String(formattedValue),
      });
    }

    if (validCriteria.length === 0) return [];

    return [
      {
        operator: 'or',
        criteria: validCriteria,
      } as unknown as BaseCriteria,
    ];
  }

  private static handleSingleValueFilter(fieldName: string, value: unknown, column: Column): BaseCriteria[] {
    const formattedValue = this.formatValueForType(value, column);
    if (formattedValue === null) return [];

    if (REFERENCE_FIELDS.includes(fieldName)) {
      return [
        {
          fieldName: `${fieldName}$_identifier`,
          operator: 'iContains',
          value: String(formattedValue),
        },
      ];
    }

    if (fieldName.toLowerCase().includes('date')) {
      return SearchUtils.getDateCriteria(fieldName, String(formattedValue));
    }

    if (this.isNumericField(column)) {
      return [
        {
          fieldName,
          operator: 'equals',
          value: formattedValue,
        },
      ];
    }

    return [
      {
        fieldName,
        operator: 'iContains',
        value: String(formattedValue),
      },
    ];
  }

  static createColumnFilterCriteria(columnFilters: MRT_ColumnFiltersState, columns: Column[]): BaseCriteria[] {
    if (!columnFilters.length) return [];

    const allCriteria: BaseCriteria[] = [];

    for (const filter of columnFilters) {
      const column = columns.find(col => col.id === filter.id || col.columnName === filter.id);
      if (!column) continue;

      const fieldName = column.columnName;
      if (filter.value === undefined || filter.value === null) continue;

      let filterCriteria: BaseCriteria[] = [];

      if (typeof filter.value === 'object' && filter.value !== null && 'from' in filter.value && 'to' in filter.value) {
        filterCriteria = this.handleRangeFilter(
          fieldName,
          filter.value as { from: FormattedValue; to: FormattedValue },
          column,
        );
      } else if (Array.isArray(filter.value)) {
        filterCriteria = this.handleArrayFilter(fieldName, filter.value, column);
      } else {
        filterCriteria = this.handleSingleValueFilter(fieldName, filter.value, column);
      }

      allCriteria.push(...filterCriteria);
    }

    return allCriteria;
  }
}
