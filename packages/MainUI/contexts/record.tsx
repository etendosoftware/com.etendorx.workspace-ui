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

"use client";

import { useState, useMemo, useCallback } from "react";
import { ensureString } from "@workspaceui/componentlibrary/src/helpers/ensureString";
import translations from "@workspaceui/componentlibrary/src/locales";
import { createContext } from "react";
import type { Organization } from "../../storybook/src/stories/Components/Table/types";

export interface RecordContextType {
  selectedRecord: Organization | null;
  setSelectedRecord: (record: Organization | null) => void;
  getFormattedRecord: (record: Organization | null) => { identifier: string; type: string } | null;
}

export const RecordContext = createContext({} as RecordContextType);

export function RecordProvider({ children }: React.PropsWithChildren) {
  const [selectedRecord, setSelectedRecord] = useState<Organization | null>(null);

  const getFormattedRecord: RecordContextType["getFormattedRecord"] = useCallback((record: Organization | null) => {
    if (!record) return null;
    return {
      identifier: ensureString(record.documentNo?.value) || translations.en_US.table.labels.noIdentifier,
      type: ensureString(record.transactionDocument?.value) || translations.en_US.table.labels.noType,
    };
  }, []);

  const value: RecordContextType = useMemo(
    () => ({
      selectedRecord,
      setSelectedRecord,
      getFormattedRecord,
    }),
    [getFormattedRecord, selectedRecord]
  );

  return <RecordContext.Provider value={value}>{children}</RecordContext.Provider>;
}
