import type { Field } from "@workspaceui/api-client/src/api/types";
import { FIELD_REFERENCE_CODES } from "./form/constants";

/**
 * Formats a cell value based on its field metadata
 * Only applies formatting to specific field types that need it
 */
export function formatCellValue(value: unknown, field: Field): string {
  if (value === null || value === undefined) return "";

  // Handle date/datetime fields (including audit fields)
  if (isDateTimeField(field)) {
    return formatDateTime(value as string, field);
  }

  // Handle user references (createdBy, updatedBy)
  if (isUserReference(field)) {
    return formatUserReference(value);
  }

  // Handle numeric fields (but not if they're already formatted)
  if (isNumericField(field) && typeof value === "number") {
    return formatNumeric(value, field);
  }

  // Handle reference fields (foreign keys) - only if value is an object
  if (isReferenceField(field) && typeof value === "object") {
    return formatReference(value);
  }

  // For everything else, return as-is (this preserves existing behavior)
  // This includes: strings, booleans, lists, and already-formatted values
  return String(value);
}

/**
 * Checks if a field is a date/datetime type
 */
function isDateTimeField(field: Field): boolean {
  const dateReferences = [
    FIELD_REFERENCE_CODES.DATE,
    FIELD_REFERENCE_CODES.DATETIME,
    FIELD_REFERENCE_CODES.ABSOLUTE_DATETIME,
  ];

  const hasDateReference =
    field.column?.reference && dateReferences.includes(field.column.reference as (typeof dateReferences)[number]);
  const isAuditDateField = field.hqlName && ["creationDate", "updated"].includes(field.hqlName);
  const isSyntheticAuditField = field.id && typeof field.id === "string" && field.id.startsWith("audit_");
  const hasDatePattern = field.columnName && /Date|date|Time|time|Created|Updated/.test(field.columnName);

  return Boolean(hasDateReference || isAuditDateField || isSyntheticAuditField || hasDatePattern);
}

/**
 * Checks if a field is a user reference
 */
function isUserReference(field: Field): boolean {
  const isAdUserReference = field.referencedEntity === "ADUser";
  const isAuditUserField = field.hqlName && ["createdBy", "updatedBy"].includes(field.hqlName);
  return Boolean(isAdUserReference || isAuditUserField);
}

/**
 * Checks if a field is numeric
 */
function isNumericField(field: Field): boolean {
  const numericReferences = [
    FIELD_REFERENCE_CODES.INTEGER,
    FIELD_REFERENCE_CODES.NUMERIC,
    FIELD_REFERENCE_CODES.QUANTITY_22,
    FIELD_REFERENCE_CODES.QUANTITY_29,
    FIELD_REFERENCE_CODES.DECIMAL,
  ];

  return field.column?.reference
    ? numericReferences.includes(field.column.reference as (typeof numericReferences)[number])
    : false;
}

/**
 * Checks if a field is a reference to another entity
 */
function isReferenceField(field: Field): boolean {
  const referenceTypes = [FIELD_REFERENCE_CODES.TABLE_DIR_19, FIELD_REFERENCE_CODES.TABLE_DIR_18];

  return field.column?.reference
    ? referenceTypes.includes(field.column.reference as (typeof referenceTypes)[number])
    : false;
}

/**
 * Formats a date/datetime value with support for audit fields
 */
function formatDateTime(isoString: string, field: Field): string {
  if (!isoString) return "";

  try {
    const date = new Date(isoString);

    // Check if it's invalid date
    if (Number.isNaN(date.getTime())) {
      return isoString;
    }

    // Check if it's a Date field (no time) or DateTime field
    const isDateOnly = field.column?.reference === FIELD_REFERENCE_CODES.DATE;

    // Special handling for audit fields - these are typically timestamps
    const isAuditField = field.hqlName && ["creationDate", "updated"].includes(field.hqlName);

    if (isDateOnly) {
      return formatDateOnly(date);
    }

    // For audit fields, show a more compact format
    if (isAuditField) {
      return formatAuditDateTime(date);
    }

    return formatAuditDateTime(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return isoString;
  }
}

/**
 * Formats a date without time (DD-MM-YYYY)
 */
function formatDateOnly(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .format(date)
    .replace(/\//g, "-");
}

/**
 * Formats audit field timestamps (DD-MM-YYYY HH:mm:ss)
 */
function formatAuditDateTime(date: Date): string {
  const dateStr = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .format(date)
    .replace(/\//g, "-");

  const timeStr = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);

  return `${dateStr} ${timeStr}`;
}

/**
 * Formats a user reference object (for createdBy/updatedBy audit fields)
 */
function formatUserReference(value: unknown): string {
  if (typeof value === "object" && value !== null) {
    const user = value as Record<string, unknown>;
    // Handle user objects with various identifier patterns
    return String(user._identifier || user.name || user.username || user.firstName || user.id || "");
  }
  return String(value);
}

/**
 * Formats a numeric value
 */
function formatNumeric(value: unknown, field: Field): string {
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);

  // You can customize precision based on field type
  const isDecimal = field.column?.reference === FIELD_REFERENCE_CODES.DECIMAL;
  const decimals = isDecimal ? 2 : 0;

  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Formats a reference field (foreign key)
 */
function formatReference(value: unknown): string {
  if (typeof value === "object" && value !== null) {
    const ref = value as Record<string, unknown>;
    return String(ref._identifier || ref.name || ref.id || "");
  }
  return String(value);
}
