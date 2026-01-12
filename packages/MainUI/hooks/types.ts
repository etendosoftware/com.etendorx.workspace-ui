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

import type { EntityData, Field, Tab } from "@workspaceui/api-client/src/api/types";
import type {
  TranslationKeys,
  Translations,
  TranslateFunction as TranslateFunctionType,
} from "@workspaceui/componentlibrary/src/locales/types";

export type TranslateFunction = TranslateFunctionType;

export type { TranslationKeys, Translations };

export enum FieldName {
  INPUT_NAME = "inputName",
  HQL_NAME = "hqlName",
  COLUMN_NAME = "columnName",
}

export interface UseTableDirDatasourceParams {
  field: Field;
  tab?: Tab;
  pageSize?: number;
  initialPageSize?: number;
  isProcessModal?: boolean;
  staticOptions?: Array<{ id: string; name: string; [key: string]: unknown }>;
}

export interface ContextItem {
  id: string;
  label: string;
  contextString: string;
  recordId: string;
}

export interface RecordContextData {
  selectedRecords: EntityData[];
  hasSelectedRecords: boolean;
  contextString: string;
  contextItems: ContextItem[];
}
