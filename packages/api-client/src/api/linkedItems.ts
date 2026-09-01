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

import { Metadata } from "./metadata";
import type {
  FetchCategoriesParams,
  LinkedItemCategory,
  LinkedItemsResponse,
  FetchLinkedItemsParams,
  LinkedItem,
} from "./types";

function parseLinkedItemsResponse(data: LinkedItemsResponse | string): LinkedItemsResponse {
  if (typeof data === "string") {
    return JSON.parse(data) as LinkedItemsResponse;
  }

  return data;
}

/**
 * Fetches the categories of linked items for a given record
 */
export async function fetchLinkedItemCategories(params: FetchCategoriesParams): Promise<LinkedItemCategory[]> {
  const client = Metadata.client;

  const body = new URLSearchParams();
  body.append("Command", "JSONCategory");
  body.append("windowId", params.windowId);
  body.append("entityName", params.entityName);
  body.append(`inpkey${params.windowId}`, params.recordId);
  body.append("recordId", params.recordId);

  let responseData: LinkedItemsResponse;

  try {
    const response = (await client.post("meta/legacy/utility/UsedByLink.html", body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })) as { data: LinkedItemsResponse | string; ok: boolean; status: number };

    responseData = parseLinkedItemsResponse(response.data);

    if (!response.ok) {
      throw new Error(`API call failed with status ${response.status}`);
    }
  } catch (error) {
    throw new Error(`Error fetching linked item categories: ${error instanceof Error ? error.message : String(error)}`);
  }

  // TEMP DEBUG - remove after diagnosis (ETP-4625 linked-items regression)
  console.debug("[DEBUG-LINKEDITEMS] fetchLinkedItemCategories", {
    requestWindowId: params.windowId,
    entityName: params.entityName,
    recordId: params.recordId,
    categories: (responseData?.usedByLinkData || []).map((c) => ({
      adWindowId: (c as unknown as LinkedItemCategory).adWindowId,
      adTabId: (c as unknown as LinkedItemCategory).adTabId,
      fullElementName: (c as unknown as LinkedItemCategory).fullElementName,
      tableName: (c as unknown as LinkedItemCategory).tableName,
      columnName: (c as unknown as LinkedItemCategory).columnName,
      total: (c as unknown as LinkedItemCategory).total,
    })),
  });

  return (responseData?.usedByLinkData || []) as LinkedItemCategory[];
}

/**
 * Fetches the linked items for a specific category
 */
export async function fetchLinkedItems(params: FetchLinkedItemsParams): Promise<LinkedItem[]> {
  const client = Metadata.client;

  const body = new URLSearchParams();
  body.append("Command", "JSONLinkedItem");
  body.append("windowId", params.windowId);
  body.append("entityName", params.entityName);
  body.append("adTabId", params.adTabId);
  body.append("tableName", params.tableName);
  body.append("columnName", params.columnName);
  body.append("recordId", params.recordId);

  let responseData: LinkedItemsResponse;

  try {
    const response = (await client.post("meta/legacy/utility/UsedByLink.html", body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })) as { data: LinkedItemsResponse | string; ok: boolean; status: number };

    if (!response.ok) {
      throw new Error(`API call failed with status ${response.status}`);
    }

    responseData = parseLinkedItemsResponse(response.data);
  } catch (error) {
    throw new Error(`Error fetching linked items: ${error instanceof Error ? error.message : String(error)}`);
  }

  // TEMP DEBUG - remove after diagnosis (ETP-4625 linked-items regression)
  console.debug("[DEBUG-LINKEDITEMS] fetchLinkedItems", {
    requestWindowId: params.windowId,
    entityName: params.entityName,
    adTabId: params.adTabId,
    tableName: params.tableName,
    columnName: params.columnName,
    recordId: params.recordId,
    items: (responseData?.usedByLinkData || []).map((i) => ({
      id: (i as unknown as LinkedItem).id,
      adWindowId: (i as unknown as LinkedItem).adWindowId,
      adTabId: (i as unknown as LinkedItem).adTabId,
      adMenuName: (i as unknown as LinkedItem).adMenuName,
      name: (i as unknown as LinkedItem).name,
    })),
  });

  return (responseData?.usedByLinkData || []) as LinkedItem[];
}
