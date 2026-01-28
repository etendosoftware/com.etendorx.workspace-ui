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
