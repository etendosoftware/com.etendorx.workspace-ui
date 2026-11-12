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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

/**
 * Maximum size of the files uploaded by a process, mirroring Classic's `OBProcessFileUpload` item
 * (`ob-formitem-processfileupload.js`): the selected files are checked before the process runs, so a file
 * above the limit is never sent.
 */

import { getStoredPreference } from "@/utils/propertyStore";

/** Preference holding the maximum size, in MB, of a file uploaded by a process. */
export const PROCESS_FILE_UPLOAD_MAX_SIZE_PREFERENCE = "OBUIAPP_ProcessFileUploadMaxSize";

/** Message shown when a file exceeds the maximum size: `%0` is the file name, `%1` the size in MB. */
export const PROCESS_FILE_MAX_SIZE_EXCEEDED_MESSAGE = "OBUIAPP_ProcessFileMaxSizeExceeded";

/** Size the server applies when the preference is not set (`BaseProcessActionHandler`). */
export const DEFAULT_PROCESS_FILE_UPLOAD_MAX_SIZE_MB = 10;

const BYTES_IN_A_MEGABYTE = 1024 * 1024;

/**
 * Reads the maximum size of the files uploaded by a process.
 *
 * As in Classic, a value that is not a number or is negative sets no limit. When the preference is not set,
 * the server's default applies.
 *
 * @returns The maximum size in MB, or `null` when there is no limit
 */
export const getProcessFileUploadMaxSize = (): number | null => {
  const storedValue = getStoredPreference(PROCESS_FILE_UPLOAD_MAX_SIZE_PREFERENCE);
  if (storedValue === undefined) return DEFAULT_PROCESS_FILE_UPLOAD_MAX_SIZE_MB;

  const maxSize = Number(storedValue);
  if (Number.isNaN(maxSize) || maxSize < 0) return null;
  return maxSize;
};

/**
 * Finds the first file larger than the maximum size.
 *
 * @param files - Selected files by parameter name
 * @param maxSizeMb - Maximum size in MB, or `null` when there is no limit
 * @returns The first file above the limit, or `undefined` when every file fits
 */
export const findOversizedFile = (files: Record<string, File>, maxSizeMb: number | null): File | undefined => {
  if (maxSizeMb === null) return undefined;
  return Object.values(files).find((file) => file.size / BYTES_IN_A_MEGABYTE > maxSizeMb);
};
