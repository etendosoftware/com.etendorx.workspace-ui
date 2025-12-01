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

/**
 * Parses a date value from the Etendo Classic backend format
 * Supports both plain dates (yyyy-MM-dd) and ISO 8601 datetime format (2025-10-06T10:20:00-03:00)
 *
 * @param value - The date string to parse
 * @returns A Date object or null if the value is invalid
 */
const getStringValue = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  return null;
};

const parsePlainDate = (value: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseISODate = (value: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return null;
  try {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

const parseGeneralDate = (value: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    // Sanity check: year should be between 1900 and 2200
    if (date.getFullYear() < 1900 || date.getFullYear() > 2200) return null;
    return date;
  } catch {
    return null;
  }
};

export const parseOBDate = (value: unknown): Date | null => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const stringValue = getStringValue(value);
  if (!stringValue) return null;

  return parsePlainDate(stringValue) || parseISODate(stringValue) || parseGeneralDate(stringValue);
};

/**
 * Formats a Date object using the browser's locale
 * Replicates the behavior of Etendo Classic which reads the browser locale
 * Uses the locale-specific separator (e.g., "-" for Argentina, "." for Germany, "/" for USA)
 *
 * @param date - The Date object to format
 * @returns Formatted date string with locale-specific separator (e.g., "06-10-2025" or "06.10.2025")
 */
export const formatBrowserDate = (date: Date | null): string => {
  if (!date || Number.isNaN(date.getTime())) return "";

  try {
    const formatted = new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
    return formatted;
  } catch {
    return "";
  }
};

/**
 * Formats a datetime value using the browser's locale
 * Supports both date and time display
 * Uses the locale-specific separator (e.g., "-" for Argentina, "." for Germany, "/" for USA)
 *
 * @param date - The Date object to format
 * @param includeTime - Whether to include time in the output (default: false)
 * @returns Formatted date/datetime string with locale-specific separator and optional time (e.g., "06-10-2025 10:20:00" or "06.10.2025 10:20:00")
 */
export const formatBrowserDateTime = (date: Date | null, includeTime = false): string => {
  if (!date || Number.isNaN(date.getTime())) return "";

  try {
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    };

    if (includeTime) {
      options.hour = "2-digit";
      options.minute = "2-digit";
      options.second = "2-digit";
    }

    const formatted = new Intl.DateTimeFormat(undefined, options).format(date);
    return formatted;
  } catch {
    return "";
  }
};

/**
 * Combines parsing and formatting in a single function
 * This is the main function to use for displaying dates in tables
 *
 * @param value - The raw date value from the backend
 * @param includeTime - Whether to include time in the output (default: false)
 * @returns Formatted date string ready for display
 */
export const formatClassicDate = (value: unknown, includeTime = false): string => {
  const date = parseOBDate(value);
  return includeTime ? formatBrowserDateTime(date, true) : formatBrowserDate(date);
};

/**
 * Checks if a value looks like a date (used for automatic detection)
 *
 * @param value - The value to check
 * @returns True if the value appears to be a date
 */
export const isDateLike = (value: unknown): boolean => {
  if (!value) return false;

  const stringValue = String(value);

  // Plain date format (yyyy-MM-dd)
  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) return true;

  // ISO datetime format (2025-10-06T10:20:00-03:00)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(stringValue)) return true;

  return false;
};

/**
 * List of common audit date column names that should always be formatted
 */
export const AUDIT_DATE_FIELD_NAMES = [
  "creationDate",
  "updated",
  "recordTime",
  "modifiedDate",
  "lastModifiedDate",
  "createdOn",
  "updatedOn",
];

/**
 * Checks if a column name is a known date field
 *
 * @param columnName - The column name to check
 * @returns True if the column is a known date field
 */
export const isKnownDateField = (columnName: string): boolean => {
  return (
    AUDIT_DATE_FIELD_NAMES.includes(columnName) ||
    columnName.toLowerCase().includes("date") ||
    columnName.toLowerCase().includes("time")
  );
};

/**
 * Generates a date format placeholder based on the browser's locale
 * For example: "dd.mm.yyyy" for Germany, "dd/mm/yyyy" for Spain, etc.
 */
export const getLocaleDatePlaceholder = (): string => {
  try {
    // Use a sample date (1st of February, 2034) to determine the format
    const sampleDate = new Date(2034, 1, 1); // Month is 0-indexed
    const formatted = new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(sampleDate);

    // Replace actual numbers with pattern characters to show the format
    // "01.02.2034" -> "dd.mm.yyyy"
    const placeholder = formatted
      .replace(/\b01\b/g, "dd")
      .replace(/\b02\b/g, "mm")
      .replace(/2034/g, "yyyy");

    return placeholder;
  } catch {
    return "dd.mm.yyyy"; // Fallback
  }
};

/**
 * Generates a datetime format placeholder based on the browser's locale
 * For example: "dd.mm.yyyy hh:mm:ss" for Germany, "dd/mm/yyyy hh:mm:ss" for Spain, etc.
 */
export const getLocaleDatetimePlaceholder = (): string => {
  try {
    // Use a sample date (1st of February, 2034 at 15:30:45)
    const sampleDate = new Date(2034, 1, 1, 15, 30, 45);
    const dateFormatted = new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(sampleDate);

    const timeFormatted = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(sampleDate);

    // Replace actual numbers with pattern characters
    const datePlaceholder = dateFormatted
      .replace(/\b01\b/g, "dd")
      .replace(/\b02\b/g, "mm")
      .replace(/2034/g, "yyyy");

    const timePlaceholder = timeFormatted.replace(/15/g, "hh").replace(/30/g, "mm").replace(/45/g, "ss");

    return `${datePlaceholder} ${timePlaceholder}`;
  } catch {
    return "dd.mm.yyyy hh:mm:ss"; // Fallback
  }
};
