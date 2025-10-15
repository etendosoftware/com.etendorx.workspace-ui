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

  let response: Response;
  try {
    response = await client.post("utility/UsedByLink.html", body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  } catch (error) {
    throw new Error(`Error fetching linked item categories: ${error instanceof Error ? error.message : String(error)}`);
  }

  const data = (await response.json()) as LinkedItemsResponse;
  return (data?.usedByLinkData || []) as LinkedItemCategory[];
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

  let response: Response;
  try {
    response = await client.post("utility/UsedByLink.html", body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  } catch (error) {
    throw new Error(`Error fetching linked items: ${error instanceof Error ? error.message : String(error)}`);
  }

  const data = (await response.json()) as LinkedItemsResponse;
  return (data?.usedByLinkData || []) as LinkedItem[];
}
