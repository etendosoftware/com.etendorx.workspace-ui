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
 * Props for the RecordCounterBar container component
 */
export interface RecordCounterBarProps {
  /** Total number of records available */
  totalRecords: number;
  /** Number of records currently loaded/displayed */
  loadedRecords: number;
  /** Number of currently selected records */
  selectedCount: number;
  /** Whether the data is currently loading */
  isLoading?: boolean;
  /** Text labels for internationalization */
  labels?: {
    /** Text for showing records count (e.g., "Showing {count} records") */
    showingRecords?: string;
    /** Text for showing partial records count (e.g., "Showing {loaded} of {total} records") */
    showingPartialRecords?: string;
    /** Text for selected records count (e.g., "{count} selected") */
    selectedRecords?: string;
    /** Text for loading state fallback */
    recordsLoaded?: string;
  };
}

/**
 * Props for the RecordCounter component
 */
export interface RecordCounterProps {
  /** Total number of records available */
  totalRecords: number;
  /** Number of records currently loaded/displayed */
  loadedRecords: number;
  /** Whether the data is currently loading */
  isLoading?: boolean;
  /** Text labels for internationalization */
  labels?: {
    /** Text for showing records count (e.g., "Showing {count} records") */
    showingRecords?: string;
    /** Text for showing partial records count (e.g., "Showing {loaded} of {total} records") */
    showingPartialRecords?: string;
    /** Text for loading state fallback */
    recordsLoaded?: string;
  };
}

/**
 * Props for the SelectionCounter component
 */
export interface SelectionCounterProps {
  /** Number of currently selected records */
  selectedCount: number;
  /** Text label for selected records (e.g., "{count} selected") */
  selectedLabel?: string;
}