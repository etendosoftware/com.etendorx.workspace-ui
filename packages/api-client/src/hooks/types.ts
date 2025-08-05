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

export interface ReportColumn {
  header: string;
  accessorKey: string;
}

export interface ReportField {
  id: string;
  name: string;
  label: string;
  type: "date" | "select" | "multiselect" | "search" | "string";
  required: boolean;
  gridWidth?: 1 | 2 | 3;
  entity?: string;
  columnName?: string;
  identifierField?: string;
  columns?: ReportColumn[];
  original?: {
    referencedEntity?: string;
    referencedWindowId?: string;
    referencedTabId?: string;
    column?: {
      callout$_identifier?: string;
    };
  };
  lookupConfig?: {
    url?: string;
    values?: Array<{ id: string; name: string }>;
    multiple?: boolean;
    selector?: {
      icon?: string;
      title?: string;
    };
  };
  validation?: {
    lowerThan?: string;
    greaterThan?: string;
  };
}

export interface ReportResponse {
  url?: string;
  blob?: Blob;
}

export interface ReportMetadata {
  id: string;
  title: string;
  sourcePath: string;
  sections: Array<{
    id: string;
    title: string;
    fields: ReportField[];
  }>;
  actions: Array<{
    id: string;
    name: string;
    format: string;
    command: string;
  }>;
}

export interface ReportMetadataHook {
  metadata: ReportMetadata | null;
  loading: boolean;
  error: string | null;
}
