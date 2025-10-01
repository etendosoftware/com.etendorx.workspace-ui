/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type { BaseCriteria, Column, CompositeCriteria, MRT_ColumnFiltersState } from "../api/types";
import type { ColumnFilterState } from "./column-filter-utils";
import { ColumnFilterUtils } from "./column-filter-utils";

type FormattedValue = string | number | null;

interface ColumnsByType {
  string?: Column[];
  date?: Column[];
  reference?: Column[];
}

const REFERENCE_FIELDS = [
  "organization",
  "transactionDocument",
  "businessPartner",
  "partnerAddress",
  "currency",
  "warehouse",
];

const EXCLUDED_NUMERIC_FIELDS = [
  "amount",
  "price",
  "quantity",
  "total",
  "paid",
  "percentage",
  "outstanding",
  "days",
  "grandTotalAmount",
];

const STATUS_FIELDS = ["documentStatus"];

export class SearchUtils {
  private static readonly FULL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
  private static readonly YEAR_PATTERN = /^\d{4}$/;
  private static readonly YEAR_MONTH_PATTERN = /^\d{4}-\d{2}$/;
  private static readonly YEAR_PARTIAL_PATTERN = /^\d{4}-$/;

  private static detectValueType(value: string): keyof ColumnsByType {
    if (
      SearchUtils.FULL_DATE_PATTERN.test(value) ||
      SearchUtils.YEAR_PATTERN.test(value) ||
      SearchUtils.YEAR_MONTH_PATTERN.test(value) ||
      SearchUtils.YEAR_PARTIAL_PATTERN.test(value)
    ) {
      return "date";
    }
    return "string";
  }

  private static getColumnType(column: Column): keyof ColumnsByType {
    const columnName = column.columnName.toLowerCase();

    if (EXCLUDED_NUMERIC_FIELDS.includes(columnName)) {
      return "string";
    }

    if (REFERENCE_FIELDS.includes(column.columnName)) {
      return "reference";
    }

    if (columnName.includes("date")) {
      return "date";
    }

    return "string";
  }

  public static getDateCriteria(fieldName: string, searchQuery: string): BaseCriteria[] {
    const criteria: BaseCriteria[] = [];

    if (SearchUtils.FULL_DATE_PATTERN.test(searchQuery)) {
      criteria.push({
        fieldName,
        operator: "equals",
        value: searchQuery,
      });
    } else if (SearchUtils.YEAR_MONTH_PATTERN.test(searchQuery)) {
      criteria.push({
        fieldName,
        operator: "greaterOrEqual",
        value: `${searchQuery}-01`,
      });
      criteria.push({
        fieldName,
        operator: "lessOrEqual",
        value: `${searchQuery}-31`,
      });
    } else if (SearchUtils.YEAR_PATTERN.test(searchQuery)) {
      criteria.push({
        fieldName,
        operator: "greaterOrEqual",
        value: `${searchQuery}-01-01`,
      });
      criteria.push({
        fieldName,
        operator: "lessOrEqual",
        value: `${searchQuery}-12-31`,
      });
    } else if (SearchUtils.YEAR_PARTIAL_PATTERN.test(searchQuery)) {
      const year = searchQuery.slice(0, -1);
      criteria.push({
        fieldName,
        operator: "greaterOrEqual",
        value: `${year}-01-01`,
      });
      criteria.push({
        fieldName,
        operator: "lessOrEqual",
        value: `${year}-12-31`,
      });
    }

    return criteria;
  }

  static createSearchCriteria(columns: Column[], searchQuery: string): CompositeCriteria[] {
    if (!searchQuery || !columns.length) return [];

    const queryType = SearchUtils.detectValueType(searchQuery);
    const compositeCriteria: CompositeCriteria[] = [];

    const columnsByType = columns.reduce<ColumnsByType>((acc, column) => {
      const type = SearchUtils.getColumnType(column);
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type]?.push(column);
      return acc;
    }, {});

    if (queryType === "date" && columnsByType.date?.length) {
      const dateCriteria: BaseCriteria[] = [];

      for (const column of columnsByType.date) {
        dateCriteria.push(...SearchUtils.getDateCriteria(column.columnName, searchQuery));
      }

      if (dateCriteria.length) {
        compositeCriteria.push({
          operator: "or",
          criteria: dateCriteria,
        });
      }
      return compositeCriteria;
    }

    const textSearchCriteria: BaseCriteria[] = [];

    textSearchCriteria.push({
      fieldName: "documentNo",
      operator: "iContains",
      value: searchQuery,
    });

    for (const field of REFERENCE_FIELDS) {
      if (columnsByType.reference?.some((col) => col.columnName === field)) {
        textSearchCriteria.push({
          fieldName: `${field}$_identifier`,
          operator: "iContains",
          value: searchQuery,
        });
      }
    }

    for (const field of STATUS_FIELDS) {
      if (columns.some((col) => col.columnName === field)) {
        textSearchCriteria.push({
          fieldName: field,
          operator: "iContains",
          value: searchQuery,
        });
      }
    }

    if (textSearchCriteria.length) {
      compositeCriteria.push({
        operator: "or",
        criteria: textSearchCriteria,
      });
    }

    return compositeCriteria;
  }

  /**
   * Combine global search criteria with column filter criteria
   */
  static combineSearchAndColumnFilters(
    columns: Column[],
    searchQuery: string,
    columnFilters: ColumnFilterState[]
  ): CompositeCriteria[] {
    const searchCriteria = SearchUtils.createSearchCriteria(columns, searchQuery);
    const columnFilterCriteria = ColumnFilterUtils.createColumnFilterCriteria(columnFilters);

    const allCriteria: CompositeCriteria[] = [];

    // Add search criteria (OR conditions for matching text across columns)
    if (searchCriteria.length > 0) {
      allCriteria.push(...searchCriteria);
    }

    // Add column filter criteria (AND conditions for specific column values)
    if (columnFilterCriteria.length > 0) {
      // Convert BaseCriteria to CompositeCriteria format
      const compositeColumnFilters: CompositeCriteria[] = columnFilterCriteria.map((criteria) => {
        if ("criteria" in criteria && criteria.criteria) {
          // Already a composite criteria (OR group)
          return criteria as CompositeCriteria;
        }

        // Single criteria - wrap it
        return {
          operator: "and",
          criteria: [criteria],
        } as CompositeCriteria;
      });

      allCriteria.push(...compositeColumnFilters);
    }

    return allCriteria;
  }
}

export class LegacyColumnFilterUtils {
  /**
   * Determines if a field is a date/datetime field
   */
  static isDateField(fieldName: string, column: Column): boolean {
    // Use field reference codes to accurately determine date fields
    // Reference codes for date/datetime fields from FIELD_REFERENCE_CODES
    const DATE_REFERENCE_CODES = [
      "15", // DATE
      "16", // DATETIME
      "478169542A1747BD942DD70C8B45089C", // ABSOLUTE_DATETIME
    ];

    // Get reference from the correct location in the column structure
    const columnReference = column.reference || (column as any).column?.reference;

    // Primary check: Use reference codes for accurate date field identification
    if (columnReference && DATE_REFERENCE_CODES.includes(columnReference)) {
      return true;
    }

    // Check for known audit date fields only (these are definitely dates)
    const isAuditDateField = ["creationDate", "updated", "created"].includes(fieldName);

    return isAuditDateField;
  }

  static isNumericField(column: Column): boolean {
    if (column.type && typeof column.type === "string") {
      const lowerType = column.type.toLowerCase();

      if (
        lowerType.includes("amount") ||
        lowerType.includes("price") ||
        lowerType.includes("quantity") ||
        lowerType === "number" ||
        lowerType === "costnumber" ||
        lowerType === "numeric" ||
        lowerType === "float" ||
        lowerType === "integer" ||
        lowerType === "decimal" ||
        lowerType === "long" ||
        lowerType === "bigdecimal"
      ) {
        return true;
      }
    }

    return false;
  }

  static formatValueForType(value: unknown, column: Column): FormattedValue {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    if (LegacyColumnFilterUtils.isNumericField(column)) {
      const numValue = Number.parseFloat(String(value).replace(",", "."));
      if (!Number.isNaN(numValue)) {
        return numValue;
      }
      return null;
    }

    return String(value);
  }

  /**
   * Converts date format from DD-MM-YYYY to YYYY-MM-DD for backend compatibility
   */
  static convertDateFormatForBackend(dateValue: string): string {
    // Pattern for YYYY-MM-DD format (backend expected)
    const yyyyMmDdPattern = /^\d{4}-\d{2}-\d{2}$/;

    // If it's already in YYYY-MM-DD format, return as-is
    if (yyyyMmDdPattern.test(dateValue)) {
      return dateValue;
    }

    // Pattern for DD-MM-YYYY format
    const ddMmYyyyPattern = /^(\d{2})-(\d{2})-(\d{4})$/;
    const match = dateValue.match(ddMmYyyyPattern);

    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month}-${day}`;
    }

    // If no pattern matches, return as-is (let backend handle validation)
    return dateValue;
  }

  private static handleRangeFilter(
    fieldName: string,
    rangeFilter: { from: FormattedValue; to: FormattedValue },
    column: Column
  ): BaseCriteria[] {
    const result: BaseCriteria[] = [];

    if (rangeFilter.from !== null && rangeFilter.from !== undefined) {
      const formattedValue = LegacyColumnFilterUtils.formatValueForType(rangeFilter.from, column);
      if (formattedValue !== null) {
        result.push({
          fieldName,
          operator: "greaterOrEqual",
          value: formattedValue,
        });
      }
    }

    if (rangeFilter.to !== null && rangeFilter.to !== undefined) {
      const formattedValue = LegacyColumnFilterUtils.formatValueForType(rangeFilter.to, column);
      if (formattedValue !== null) {
        result.push({
          fieldName,
          operator: "lessOrEqual",
          value: formattedValue,
        });
      }
    }

    return result;
  }

  private static handleArrayFilter(fieldName: string, values: unknown[], column: Column): BaseCriteria[] {
    if (values.length === 0) return [];

    // For TABLEDIR columns, use the $_identifier field and iEquals operator (like Etendo Classic)
    const actualFieldName = ColumnFilterUtils.isTableDirColumn(column) ? `${fieldName}$_identifier` : fieldName;

    const operator = ColumnFilterUtils.isTableDirColumn(column) ? "iEquals" : "equals";

    if (values.length === 1) {
      // Single value - direct criteria (no OR wrapper)
      return [
        {
          fieldName: actualFieldName,
          operator,
          value: String(values[0]),
        },
      ];
    }

    // Multiple values - OR criteria
    const orCriteria = values.map((value) => ({
      fieldName: actualFieldName,
      operator,
      value: String(value),
    }));

    return [
      {
        operator: "or",
        criteria: orCriteria,
      } as unknown as BaseCriteria,
    ];
  }

  private static handleSingleValueFilter(fieldName: string, value: unknown, column: Column): BaseCriteria[] {
    const formattedValue = LegacyColumnFilterUtils.formatValueForType(value, column);
    if (formattedValue === null) return [];

    if (REFERENCE_FIELDS.includes(fieldName)) {
      return [
        {
          fieldName: `${fieldName}$_identifier`,
          operator: "iContains",
          value: String(formattedValue),
        },
      ];
    }

    if (LegacyColumnFilterUtils.isDateField(fieldName, column)) {
      // Convert DD-MM-YYYY format to YYYY-MM-DD format for backend
      const dateValue = String(formattedValue);
      const convertedDate = LegacyColumnFilterUtils.convertDateFormatForBackend(dateValue);
      return SearchUtils.getDateCriteria(fieldName, convertedDate);
    }

    if (LegacyColumnFilterUtils.isNumericField(column)) {
      return [
        {
          fieldName,
          operator: "equals",
          value: formattedValue,
        },
      ];
    }

    return [
      {
        fieldName,
        operator: "iContains",
        value: String(formattedValue),
      },
    ];
  }

  static createColumnFilterCriteria(columnFilters: MRT_ColumnFiltersState, columns: Column[]): BaseCriteria[] {
    if (!columnFilters.length) return [];

    const allCriteria: BaseCriteria[] = [];

    for (const filter of columnFilters) {
      const column = columns.find((col) => col.id === filter.id || col.columnName === filter.id);

      if (!column) {
        continue;
      }

      // Use filterFieldName if available (for WindowReferenceGrid), otherwise use columnName
      const fieldName = (column as any).filterFieldName || column.columnName;
      if (filter.value === undefined || filter.value === null) continue;

      let filterCriteria: BaseCriteria[] = [];

      if (typeof filter.value === "object" && filter.value !== null && "from" in filter.value && "to" in filter.value) {
        filterCriteria = LegacyColumnFilterUtils.handleRangeFilter(
          fieldName,
          filter.value as { from: FormattedValue; to: FormattedValue },
          column
        );
      } else if (Array.isArray(filter.value)) {
        // Handle dropdown filters (our new implementation)
        filterCriteria = LegacyColumnFilterUtils.handleArrayFilter(fieldName, filter.value, column);
      } else {
        filterCriteria = LegacyColumnFilterUtils.handleSingleValueFilter(fieldName, filter.value, column);
      }

      allCriteria.push(...filterCriteria);
    }

    return allCriteria;
  }
}
