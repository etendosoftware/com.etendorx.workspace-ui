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

    // Get reference from the correct location in the column structure (most reliable)
    const columnReference = column.reference || (column as any).column?.reference;

    // PRIMARY CHECK: Use reference codes for accurate date field identification
    // If reference explicitly says it's NOT a date (e.g., "10" = String), return false immediately
    if (columnReference && !DATE_REFERENCE_CODES.includes(columnReference)) {
      // Reference explicitly says this is NOT a date field (e.g., "10" = String)
      // Don't trust column.type if reference says otherwise
      return false;
    }

    // If reference code says it IS a date, trust that
    if (columnReference && DATE_REFERENCE_CODES.includes(columnReference)) {
      return true;
    }

    // Check for type field as secondary indicator
    if (column.type === "date" || column.type === "datetime") {
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

  static isBooleanField(column: Column): boolean {
    return (
      column.type === "boolean" ||
      column.column?._identifier === "YesNo" ||
      column.column?.reference === "20"
    );
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

    if (LegacyColumnFilterUtils.isBooleanField(column)) {
      const strValue = String(value).toLowerCase().trim();
      if (strValue === "true" || strValue === "yes" || strValue === "si" || strValue === "sí") {
        return "true";
      }
      if (strValue === "false" || strValue === "no") {
        return "false";
      }
      // If it's not a clear boolean value, return as is (might be a partial search?)
      // But for boolean fields, we usually want exact match or nothing.
      // Let's return the string so it can be used in "equals" if needed,
      // but typically boolean filters are strict.
      return String(value);
    }

    return String(value);
  }

  /**
   * Detects the date format order from the browser's locale
   * Returns the order of date parts (day, month, year)
   * @returns 'dd-mm-yyyy' | 'mm-dd-yyyy' | 'yyyy-mm-dd'
   */
  private static getLocaleDateFormatOrder(): "dd-mm-yyyy" | "mm-dd-yyyy" | "yyyy-mm-dd" {
    try {
      // Use a sample date (1st of February, 2034) to determine the format
      const sampleDate = new Date(2034, 1, 1); // Month is 0-indexed
      const formatted = new Intl.DateTimeFormat(undefined, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(sampleDate);

      // Check if starts with year (2034)
      if (formatted.includes("2034") && formatted.indexOf("2034") === 0) {
        return "yyyy-mm-dd";
      }

      // Check if month comes before day (02 before 01)
      // If formatted string has "02" before "01", it's MM-DD-YYYY
      const indexOf02 = formatted.indexOf("02");
      const indexOf01 = formatted.indexOf("01");

      if (indexOf02 !== -1 && indexOf01 !== -1 && indexOf02 < indexOf01) {
        return "mm-dd-yyyy";
      }

      // Default to DD-MM-YYYY (most locales)
      return "dd-mm-yyyy";
    } catch {
      return "dd-mm-yyyy";
    }
  }

  /**
   * Converts date format from browser locale format to YYYY-MM-DD for backend compatibility
   * Supports multiple formats:
   * - DD-MM-YYYY, DD.MM.YYYY, DD/MM/YYYY (any separator)
   * - MM-DD-YYYY, MM/DD/YYYY, MM.DD.YYYY (USA format)
   * - YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD (ISO and variants)
   * Also handles ISO 8601 format (YYYY-MM-DDTHH:MM:SS)
   */
  static convertDateFormatForBackend(dateValue: string): string {
    if (!dateValue) return dateValue;

    // Pattern for YYYY-MM-DD format (backend expected)
    const yyyyMmDdPattern = /^\d{4}-\d{2}-\d{2}$/;

    // If it's already in YYYY-MM-DD format, return as-is
    if (yyyyMmDdPattern.test(dateValue)) {
      return dateValue;
    }

    // Pattern for ISO 8601 format (YYYY-MM-DDTHH:MM:SS)
    const isoPattern = /^(\d{4})-(\d{2})-(\d{2})T/;
    if (isoPattern.test(dateValue)) {
      // Extract just the date part
      const [datePart] = dateValue.split("T");
      return datePart;
    }

    // Pattern for YYYY/MM/DD, YYYY.MM.DD, or YYYY-MM-DD format (4+2+2)
    const yyyyMmDdAlternativePattern = /^(\d{4})[-./](\d{2})[-./](\d{2})$/;
    const yyyyMatch = dateValue.match(yyyyMmDdAlternativePattern);

    if (yyyyMatch) {
      const [, year, month, day] = yyyyMatch;
      return `${year}-${month}-${day}`;
    }

    // Pattern for dates with 2+2+4 format (could be DD-MM-YYYY or MM-DD-YYYY)
    const twoTwoFourPattern = /^(\d{2})[-./](\d{2})[-./](\d{4})$/;
    const match = dateValue.match(twoTwoFourPattern);

    if (match) {
      const [, first, second, year] = match;
      const localeFormat = LegacyColumnFilterUtils.getLocaleDateFormatOrder();

      if (localeFormat === "mm-dd-yyyy") {
        // User's locale is MM/DD/YYYY, so first is month, second is day
        return `${year}-${first}-${second}`;
      }

      // Default to DD-MM-YYYY (first is day, second is month)
      return `${year}-${second}-${first}`;
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
      let formattedValue = LegacyColumnFilterUtils.formatValueForType(rangeFilter.from, column);

      // For date fields, convert to backend format (YYYY-MM-DD)
      if (formattedValue !== null && LegacyColumnFilterUtils.isDateField(fieldName, column)) {
        formattedValue = LegacyColumnFilterUtils.convertDateFormatForBackend(String(formattedValue));
      }

      if (formattedValue !== null) {
        result.push({
          fieldName,
          operator: "greaterOrEqual",
          value: formattedValue,
        });
      }
    }

    if (rangeFilter.to !== null && rangeFilter.to !== undefined) {
      let formattedValue = LegacyColumnFilterUtils.formatValueForType(rangeFilter.to, column);

      // For date fields, convert to backend format (YYYY-MM-DD)
      if (formattedValue !== null && LegacyColumnFilterUtils.isDateField(fieldName, column)) {
        formattedValue = LegacyColumnFilterUtils.convertDateFormatForBackend(String(formattedValue));
      }

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

    // Extract actual values from FilterOption objects if present
    // This supports both new format (FilterOption[]) and legacy format (string[])
    let isTextSearch = false;
    const actualValues = values.map((val) => {
      // If it's a FilterOption object with a value property, extract it
      if (typeof val === "object" && val !== null && "value" in val) {
        if ((val as any).isTextSearch) isTextSearch = true;
        return (val as { value: unknown }).value;
      }
      // Otherwise use the value as-is (backward compatibility with string[])
      return val;
    });

    // For TABLEDIR columns, use the $_identifier field and iEquals operator (like Etendo Classic)
    const actualFieldName = ColumnFilterUtils.isTableDirColumn(column) ? `${fieldName}$_identifier` : fieldName;

    if (isTextSearch && actualValues.length === 1) {
      const parsed = LegacyColumnFilterUtils.parseLogicalFilter(actualFieldName, String(actualValues[0]), column);
      if (parsed) {
        return [parsed as BaseCriteria];
      }
    }

    let operator: "iContains" | "iEquals" | "equals";
    if (isTextSearch) {
      operator = "iContains";
    } else if (ColumnFilterUtils.isTableDirColumn(column)) {
      operator = "iEquals";
    } else {
      operator = "equals";
    }

    if (actualValues.length === 1) {
      // Single value - direct criteria (no OR wrapper)
      return [
        {
          fieldName: actualFieldName,
          operator,
          value: String(actualValues[0]),
        },
      ];
    }

    // Multiple values - OR criteria
    const orCriteria = actualValues.map((value) => ({
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

  /**
   * Detects if a date string contains a range (e.g., "09-20-2025 - 09-30-2025")
   * and parses it into {from, to} format
   */
  private static parseDateRangeIfExists(
    value: unknown,
    column: Column
  ): { from: FormattedValue | null; to: FormattedValue | null } | null {
    if (!LegacyColumnFilterUtils.isDateField(column.columnName, column)) {
      return null;
    }

    const stringValue = String(value);

    // FIX: Use string search instead of Regex to prevent ReDoS.
    // This looks for " -" (space followed by dash), which matches the intent
    // of the original regex `\s+-\s*`.
    // The check ensures we don't split on the hyphens INSIDE a date (e.g., 2025-01-01)
    // because those do not have a preceding space.
    const separatorIndex = stringValue.indexOf(" -");

    if (separatorIndex === -1) {
      return null;
    }

    const fromStr = stringValue.substring(0, separatorIndex);
    // +2 skips the " -" characters. trim() handles the rest of the spacing.
    const toStr = stringValue.substring(separatorIndex + 2);

    const fromTrimmed = fromStr.trim();
    const toTrimmed = toStr.trim();

    // At least one of them must look like a date
    const fromIsDate = LegacyColumnFilterUtils.looksLikeDateInput(fromTrimmed);
    const toIsDate = LegacyColumnFilterUtils.looksLikeDateInput(toTrimmed);

    if (!fromIsDate && !toIsDate) {
      return null;
    }

    // Both from and to are optional, but at least one must be a date
    return {
      from: fromIsDate ? fromTrimmed : null,
      to: toIsDate ? toTrimmed : null,
    };
  }

  /**
   * Checks if a string looks like a date input with proper format (2 digits, separator, 2 digits, separator, 4 digits)
   */
  private static looksLikeDateInput(value: string): boolean {
    if (!value) return false;

    // Match patterns:
    // DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY format (2+2+4 with separator)
    // MM-DD-YYYY format (2+2+4 with separator)
    // YYYY-MM-DD format (4+2+2 with separator)
    const datePatterns = [
      /^\d{2}[-\/\.]\d{2}[-\/\.]\d{4}$/, // DD-MM-YYYY or MM-DD-YYYY
      /^\d{4}[-\/\.]\d{2}[-\/\.]\d{2}$/, // YYYY-MM-DD
    ];

    return datePatterns.some((pattern) => pattern.test(value));
  }

  /**
   * Parses a filter value string into a Criteria object, supporting logical operators:
   * - OR: '|' or ' or '
   * - AND: '&' or ' and '
   * - NOT: '!' (prefix)
   */
  private static parseLogicalFilter(
    fieldName: string,
    value: string,
    column: Column
  ): BaseCriteria | CompositeCriteria | null {
    const trimmedValue = value.trim();
    if (!trimmedValue) return null;

    // Try each handler in order
    const orResult = LegacyColumnFilterUtils.handleOrCondition(fieldName, trimmedValue, column);
    if (orResult) return orResult;

    const andResult = LegacyColumnFilterUtils.handleAndCondition(fieldName, trimmedValue, column);
    if (andResult) return andResult;

    const notResult = LegacyColumnFilterUtils.handleNotCondition(fieldName, trimmedValue, column);
    if (notResult) return notResult;

    const comparisonResult = LegacyColumnFilterUtils.handleComparisonOperators(fieldName, trimmedValue, column);
    if (comparisonResult) return comparisonResult;

    // Fallback to standard single value filter
    const result = LegacyColumnFilterUtils.handleSingleValueFilter(fieldName, trimmedValue, column);
    const finalResult = result.length > 0 ? result[0] : null;
    return finalResult;
  }

  private static handleOrCondition(fieldName: string, trimmedValue: string, column: Column): CompositeCriteria | null {
    // Prevent ReDoS by limiting length
    if (trimmedValue.length > 2000) return null;

    // Normalize whitespace to single spaces to avoid catastrophic backtracking in regex
    const normalizedValue = trimmedValue.replace(/\s+/g, " ");

    // Split by '|' or ' or ' (case insensitive)
    // Since whitespace is normalized, we can use a simple space check
    const orParts = normalizedValue.split(/\|| or /i);

    if (orParts.length <= 1) return null;

    const criteriaList: BaseCriteria[] = [];
    for (const part of orParts) {
      const parsed = LegacyColumnFilterUtils.parseLogicalFilter(fieldName, part, column);
      if (parsed) {
        criteriaList.push(parsed as unknown as BaseCriteria);
      }
    }

    return criteriaList.length > 0
      ? {
          operator: "or",
          criteria: criteriaList,
        }
      : null;
  }

  private static handleAndCondition(fieldName: string, trimmedValue: string, column: Column): CompositeCriteria | null {
    // Prevent ReDoS by limiting length
    if (trimmedValue.length > 2000) return null;

    // Normalize whitespace to single spaces to avoid catastrophic backtracking in regex
    const normalizedValue = trimmedValue.replace(/\s+/g, " ");

    // Split by '&' or ' and ' (case insensitive)
    // Since whitespace is normalized, we can use a simple space check
    const andParts = normalizedValue.split(/&| and /i);

    if (andParts.length <= 1) return null;

    const criteriaList: BaseCriteria[] = [];
    for (const part of andParts) {
      const parsed = LegacyColumnFilterUtils.parseLogicalFilter(fieldName, part, column);
      if (parsed) {
        criteriaList.push(parsed as unknown as BaseCriteria);
      }
    }

    return criteriaList.length > 0
      ? {
          operator: "and",
          criteria: criteriaList,
        }
      : null;
  }

  private static handleNotCondition(fieldName: string, trimmedValue: string, column: Column): BaseCriteria | null {
    if (!trimmedValue.startsWith("!")) return null;

    const innerValue = trimmedValue.substring(1).trim();
    const simpleCriteria = LegacyColumnFilterUtils.handleSingleValueFilter(fieldName, innerValue, column);

    if (simpleCriteria.length === 0) return null;

    const base = simpleCriteria[0];

    return {
      ...base,
      operator: LegacyColumnFilterUtils.invertOperator(base.operator),
    };
  }

  private static invertOperator(operator: string): string {
    const operatorMap: Record<string, string> = {
      equals: "notEquals",
      iContains: "notContains",
      contains: "notContains",
      greaterThan: "lessOrEqual",
      lessThan: "greaterOrEqual",
      greaterOrEqual: "lessThan",
      lessOrEqual: "greaterThan",
    };
    return operatorMap[operator] || "notEquals";
  }

  private static handleComparisonOperators(
    fieldName: string,
    trimmedValue: string,
    column: Column
  ): BaseCriteria | null {
    const comparisonOperators = [
      { prefix: ">=", operator: "greaterOrEqual" },
      { prefix: "<=", operator: "lessOrEqual" },
      { prefix: ">", operator: "greaterThan" },
      { prefix: "<", operator: "lessThan" },
      { prefix: "==", operator: "equals" },
      { prefix: "=", operator: "equals" },
    ];

    for (const op of comparisonOperators) {
      if (trimmedValue.startsWith(op.prefix)) {
        const val = trimmedValue.substring(op.prefix.length).trim();
        const finalValue = LegacyColumnFilterUtils.formatAndConvertValue(val, fieldName, column);

        if (finalValue !== null) {
          return {
            fieldName,
            operator: op.operator,
            value: finalValue,
          };
        }
      }
    }

    return null;
  }

  private static formatAndConvertValue(value: string, fieldName: string, column: Column): FormattedValue {
    let formattedValue = LegacyColumnFilterUtils.formatValueForType(value, column);

    if (formattedValue !== null && LegacyColumnFilterUtils.isDateField(fieldName, column)) {
      formattedValue = LegacyColumnFilterUtils.convertDateFormatForBackend(String(formattedValue));
    }

    return formattedValue;
  }

  static createColumnFilterCriteria(columnFilters: MRT_ColumnFiltersState, columns: Column[]): BaseCriteria[] {
    if (!columnFilters.length) return [];

    const allCriteria: BaseCriteria[] = [];

    for (const filter of columnFilters) {
      const column = columns.find((col) => col.id === filter.id || col.columnName === filter.id);
      if (!column) continue;

      const fieldName = (column as any).filterFieldName || column.columnName;
      if (filter.value === undefined || filter.value === null) continue;

      const filterCriteria = LegacyColumnFilterUtils.processFilterValue(fieldName, filter.value, column);
      allCriteria.push(...filterCriteria);
    }

    return allCriteria;
  }

  private static processFilterValue(fieldName: string, value: unknown, column: Column): BaseCriteria[] {
    if (LegacyColumnFilterUtils.isRangeObject(value)) {
      return LegacyColumnFilterUtils.handleRangeFilter(
        fieldName,
        value as { from: FormattedValue; to: FormattedValue },
        column
      );
    }

    if (Array.isArray(value)) {
      return LegacyColumnFilterUtils.handleArrayFilter(fieldName, value, column);
    }

    return LegacyColumnFilterUtils.processStringValue(fieldName, value, column);
  }

  private static isRangeObject(value: unknown): boolean {
    return typeof value === "object" && value !== null && "from" in value && "to" in value;
  }

  private static processStringValue(fieldName: string, value: unknown, column: Column): BaseCriteria[] {
    const dateRange = LegacyColumnFilterUtils.parseDateRangeIfExists(value, column);

    if (dateRange) {
      return LegacyColumnFilterUtils.handleRangeFilter(fieldName, dateRange, column);
    }

    const parsed = LegacyColumnFilterUtils.parseLogicalFilter(fieldName, String(value), column);
    return parsed ? [parsed as BaseCriteria] : [];
  }
}
