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

import { useEffect, useState, useRef } from "react";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import type { EntityValue, Field, Tab } from "@workspaceui/api-client/src/api/types";
import { NEW_RECORD_ID } from "@/utils/url/constants";
import { useSelected } from "./useSelected";

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
}

export const useCurrentRecord = ({ tab, recordId }: UseCurrentRecordOptions): UseCurrentRecordReturn => {
  const [record, setRecord] = useState<Record<string, Field>>({});
  // Initialize loading=true whenever we have a real record to fetch.
  // This prevents a race condition where useFormInitialization fires the FIC
  // on the very first render (before any effect has run) with an empty record,
  // because React effects run after paint and loading starts false by default.
  // By starting in loading=true, useFormInitialization will wait until
  // useCurrentRecord has either resolved from the graph cache or completed
  // its async datasource fetch before calling the FIC.
  const [loading, setLoading] = useState(() => Boolean(tab && recordId && recordId !== NEW_RECORD_ID));
  const fetchInProgressRef = useRef(false);
  const lastFetchParamsRef = useRef<string | null>(null);

  const { graph } = useSelected();

  useEffect(() => {
    if (!tab || !recordId || recordId === NEW_RECORD_ID) {
      setRecord({});
      setLoading(false);
      lastFetchParamsRef.current = null; // Prepare for next valid fetch
      return;
    }

    // Identify displayed property fields early — before the cache check — because
    // the graph cache is populated by the grid WITHOUT _extraProperties and therefore
    // lacks property field values (e.g. file.type → file$type = "RF").
    // If this tab has property fields we must bypass the cache and always fetch
    // from the datasource so that _extraProperties is included and we get those values.
    const propertyFieldEntries = Object.values(tab.fields ?? {})
      .filter((f) => f.displayed && f.column?.propertyPath)
      .map((f) => ({
        hqlName: f.hqlName,
        propertyPath: f.column.propertyPath, // e.g. "file.type"
        dollarKey: f.column.propertyPath.replace(/\./g, "$"), // e.g. "file$type"
      }));

    // Build reverse map: datasource response key → field hqlName
    // e.g. "file$type" → "type"
    const dollarKeyToHqlName: Record<string, string> = {};
    for (const { hqlName, dollarKey } of propertyFieldEntries) {
      dollarKeyToHqlName[dollarKey] = hqlName;
    }

    const extraProperties = propertyFieldEntries.map((e) => e.propertyPath).join(",");

    // Only use the graph cache when the tab has no property fields.
    // When there are property fields, the cache is stale (missing those values)
    // and we must go to the datasource to get a complete record.
    if (!extraProperties) {
      const cachedRecord = graph.getRecord(tab, recordId);
      if (cachedRecord) {
        setRecord(cachedRecord as unknown as Record<string, Field>);
        setLoading(false);
        return;
      }
    }

    // Create unique key for current fetch params
    const paramsKey = `${tab.entityName}-${tab.window}-${tab.id}-${recordId}`;

    // Prevent duplicate fetches for the same parameters
    if (fetchInProgressRef.current || lastFetchParamsRef.current === paramsKey) {
      return;
    }

    let cancelled = false;

    const fetchRecord = async () => {
      if (cancelled) return;

      fetchInProgressRef.current = true;
      lastFetchParamsRef.current = paramsKey;
      setLoading(true);

      try {
        const result = (await datasource.get(tab.entityName, {
          criteria: [{ fieldName: "id", operator: "equals", value: recordId }],
          windowId: tab.window,
          tabId: tab.id,
          pageSize: 1,
          // Request property field values via _extraProperties. The backend returns them
          // under "$"-format keys (e.g. "file$type").
          ...(extraProperties && { extraProperties }),
        })) as DatasourceResponse;

        if (cancelled) return;

        const responseData = result.data.response?.data;

        if (responseData?.length > 0) {
          const fetchedRecord = responseData[0];
          setRecord(fetchedRecord);
          // Ensure the graph knows about this record so components like Process Buttons can read it
          const entityDataRecord = fetchedRecord as unknown as Record<string, EntityValue>;
          graph.setSelected(tab, entityDataRecord);
          graph.setSelectedMultiple(tab, [entityDataRecord]);
          // Normalize property field keys from "$"-format to hqlName so that
          // buildPayloadByInputName can look them up in tab.fields (indexed by hqlName).
          // e.g. { "file$type": "RF" } → { "type": "RF" }
          const rawRecord = responseData[0] as Record<string, unknown>;
          const normalizedRecord = Object.entries(rawRecord).reduce(
            (acc, [k, v]) => {
              acc[dollarKeyToHqlName[k] ?? k] = v;
              return acc;
            },
            {} as Record<string, unknown>
          );
          setRecord(normalizedRecord as Record<string, Field>);
        } else {
          setRecord({});
        }
      } catch (err) {
        if (cancelled) return;

        console.error(err);
        setRecord({});
      } finally {
        if (!cancelled) {
          setLoading(false);
          fetchInProgressRef.current = false;
        }
      }
    };

    fetchRecord();

    return () => {
      cancelled = true;
      fetchInProgressRef.current = false;
    };
  }, [tab?.entityName, tab?.window, tab?.id, recordId, graph, tab]);

  return {
    record,
    loading,
  };
};
