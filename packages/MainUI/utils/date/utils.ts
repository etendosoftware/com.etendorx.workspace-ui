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
 * Converts a UTC time string in "HH:MM:SS" format to the browser's local time "HH:MM:SS".
 * @param utcTime String in format "HH:MM:SS"
 * @returns Formatted local time string "HH:MM:SS"
 */
export const formatUTCTimeToLocal = (utcTime: string): string => {
  if (!utcTime || typeof utcTime !== "string") {
    return utcTime;
  }

  let date: Date;

  if (utcTime.includes("T")) {
    // Append Z if not present to ensure JavaScript parses it as UTC, not local
    const utcString = utcTime.endsWith("Z") ? utcTime : `${utcTime}Z`;
    date = new Date(utcString);
  } else {
    const parts = utcTime.split(":");
    if (parts.length < 2) {
      return utcTime;
    }

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    const seconds = Number(parts[2] || 0);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return utcTime;
    }

    date = new Date();
    date.setUTCHours(hours, minutes, seconds);
  }

  if (Number.isNaN(date.getTime())) {
    return utcTime;
  }

  const localHours = date.getHours().toString().padStart(2, "0");
  const localMinutes = date.getMinutes().toString().padStart(2, "0");
  const localSeconds = date.getSeconds().toString().padStart(2, "0");

  return `${localHours}:${localMinutes}:${localSeconds}`;
};

/**
 * Converts a local time string "HH:MM:SS" to a UTC ISO string "YYYY-MM-DDTHH:MM:SS" using today's date.
 * @param localTime String in format "HH:MM:SS"
 * @returns UTC formatted payload "YYYY-MM-DDTHH:MM:SS"
 */
export const formatLocalTimeToUTCPayload = (localTime: string): string => {
  if (!localTime || typeof localTime !== "string") {
    return localTime;
  }

  const parts = localTime.split(":");
  if (parts.length < 2) {
    return localTime;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  const seconds = Number(parts[2] || 0);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return localTime;
  }

  const now = new Date();
  const dateToSave = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, seconds);

  const isoString = dateToSave.toISOString();
  return isoString.split(".")[0];
};

/**
 * Normalizes an "Absolute Time" stored value to a "HH:MM:SS" wall-clock string
 * WITHOUT any timezone conversion. Absolute Time is stored/displayed exactly as
 * entered, so — unlike {@link formatUTCTimeToLocal} — this never builds a Date and
 * never shifts by the local offset.
 *
 * Accepts values like "2024-06-01T09:30:00", "09:30:00Z", "09:30", "09:30:00.123"
 * or "09:30:00+02:00" and returns "09:30:00".
 * @param stored Stored value (ISO datetime, or plain time, possibly with zone/millis)
 * @returns Wall-clock time "HH:MM:SS"
 */
export const formatAbsoluteTimeToDisplay = (stored: string): string => {
  if (!stored || typeof stored !== "string") {
    return stored;
  }

  // Keep only the time portion when an ISO date part is present.
  let time = stored.includes("T") ? stored.split("T")[1] : stored;

  // Drop a trailing "Z" or an explicit "+/-HH:MM" offset, plus any milliseconds.
  time = time.replace(/(?:Z|[+-]\d{2}:?\d{2})$/, "").split(".")[0];

  const parts = time.split(":");
  if (parts.length < 2) {
    return stored;
  }

  const hours = parts[0].padStart(2, "0");
  const minutes = parts[1].padStart(2, "0");
  const seconds = (parts[2] ?? "00").padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
};

/**
 * Builds the payload for an "Absolute Time" value from a "HH:MM:SS" (or "HH:MM")
 * display string, WITHOUT any timezone conversion. Prefixes today's LOCAL date so
 * the shape matches the classic payload ("YYYY-MM-DDTHH:MM:SS"); it deliberately
 * avoids {@link Date.prototype.toISOString} so the wall-clock time is preserved
 * exactly. The backend ignores the date part and stores the literal time.
 * @param display Time string "HH:MM:SS" or "HH:MM"
 * @returns Payload "YYYY-MM-DDTHH:MM:SS" carrying the literal time
 */
export const formatDisplayToAbsoluteTimePayload = (display: string): string => {
  if (!display || typeof display !== "string") {
    return display;
  }

  const parts = display.split(":");
  if (parts.length < 2) {
    return display;
  }

  const hours = parts[0].padStart(2, "0");
  const minutes = parts[1].padStart(2, "0");
  const seconds = (parts[2] ?? "00").padStart(2, "0");

  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

/** Number of hours after which the 12-hour clock switches from AM to PM. */
const NOON_HOUR = 12;

/**
 * Formats a 24-hour "HH:MM:SS" (or "HH:MM") wall-clock string into a 12-hour
 * "hh:mm:ss AM/PM" string for read-only display (e.g. grid cells). It is a pure
 * string transform: it never builds a Date, so it introduces no timezone shift and
 * is safe for both regular Time (already converted to local) and Absolute Time.
 * @param time Time string "HH:MM:SS" or "HH:MM" in 24-hour format
 * @returns 12-hour formatted string "hh:mm:ss AM/PM", or the input unchanged if invalid
 */
export const formatTimeTo12Hour = (time: string): string => {
  if (!time || typeof time !== "string") {
    return time;
  }

  const parts = time.split(":");
  if (parts.length < 2) {
    return time;
  }

  const hours24 = Number(parts[0]);
  if (Number.isNaN(hours24)) {
    return time;
  }

  const minutes = parts[1].padStart(2, "0");
  const seconds = (parts[2] ?? "00").padStart(2, "0");

  const period = hours24 < NOON_HOUR ? "AM" : "PM";
  const hours12 = hours24 % NOON_HOUR === 0 ? NOON_HOUR : hours24 % NOON_HOUR;
  const hours = hours12.toString().padStart(2, "0");

  return `${hours}:${minutes}:${seconds} ${period}`;
};

/**
 * Pair of converters used by the time inputs: `toDisplay` maps the stored value to
 * the "HH:MM:SS" shown in the field, `toPayload` maps the edited value back to what
 * is saved. Selecting the pair here keeps the components free of branching logic.
 */
export interface TimeFormatters {
  toDisplay: (value: string) => string;
  toPayload: (value: string) => string;
}

/**
 * Returns the converter pair for a time input. Absolute Time uses the pass-through
 * (no timezone conversion) formatters; regular Time uses the UTC round-trip pair.
 * @param absolute Whether the field is an "Absolute Time" reference
 * @returns The matching {@link TimeFormatters}
 */
export const getTimeFormatters = (absolute: boolean): TimeFormatters => {
  if (absolute) {
    return {
      toDisplay: formatAbsoluteTimeToDisplay,
      toPayload: formatDisplayToAbsoluteTimePayload,
    };
  }

  return {
    toDisplay: formatUTCTimeToLocal,
    toPayload: formatLocalTimeToUTCPayload,
  };
};
