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

import { useEffect, useState } from "react";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import type { Field, Tab } from "@workspaceui/api-client/src/api/types";
import { NEW_RECORD_ID } from "@/utils/url/constants";

interface DatasourceResponse {
  data: {
    response: {
      data: Record<string, Field>[];
      totalResults: number;
      startRow: number;
      endRow: number;
    };
    status: number;
  };
}

interface UseCurrentRecordOptions {
  tab?: Tab;
  recordId?: string;
}

interface UseCurrentRecordReturn {
  record: Record<string, Field>;
  loading: boolean;
  error: string | null;
}

export const useCurrentRecord = ({ tab, recordId }: UseCurrentRecordOptions): UseCurrentRecordReturn => {
  const [record, setRecord] = useState<Record<string, Field>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tab || !recordId || recordId === NEW_RECORD_ID) {
      setRecord({});
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchRecord = async () => {
      if (cancelled) return;

      setLoading(true);
      setError(null);

      try {
        const result = (await datasource.get(tab.entityName, {
          criteria: [{ fieldName: "id", operator: "equals", value: recordId }],
          windowId: tab.window,
          tabId: tab.id,
          pageSize: 1,
        })) as DatasourceResponse;

        if (cancelled) return;

        const responseData = result.data.response?.data;

        if (responseData?.length > 0) {
          setRecord(responseData[0]);
        } else {
          setRecord({});
          setError("Registro no encontrado");
        }
      } catch (err) {
        if (cancelled) return;

        console.error("Error fetching record:", err);
        setRecord({});
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRecord();

    return () => {
      cancelled = true;
    };
  }, [tab?.entityName, tab?.window, tab?.id, recordId, tab]);

  return {
    record,
    loading,
    error,
  };
};
