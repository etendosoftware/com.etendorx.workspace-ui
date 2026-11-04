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
import type { EntityData, Tab, TabPrintConfig } from "@workspaceui/api-client/src/api/types";
import { BUSINESS_PARTNER_TAB_ID } from "../print";

/** Shared fixtures for the Print / Email toolbar tests. */
export const ORDER_PRINT_CONFIG: TabPrintConfig = {
  url: "../orders/print.html",
  hasEmail: true,
  legacy: false,
  directPrint: false,
  keyParam: "inpcOrderId",
};

export const BPARTNER_PRINT_CONFIG: TabPrintConfig = {
  url: "../RptC_Bpartner.html",
  hasEmail: false,
  legacy: true,
  directPrint: false,
  keyParam: "inpcBpartnerId",
};

export const ORDER_TAB = { id: "186", window: "143", uIPattern: "STD", printConfig: ORDER_PRINT_CONFIG } as Tab;
export const BPARTNER_TAB = {
  id: BUSINESS_PARTNER_TAB_ID,
  window: "123",
  uIPattern: "STD",
  printConfig: BPARTNER_PRINT_CONFIG,
} as Tab;
/** A tab without print process (AD_Tab.AD_Process_ID empty), e.g. Product. */
export const NO_PRINT_TAB = { id: "180", window: "140", uIPattern: "STD", printConfig: null } as Tab;

export const SAVED_RECORD = { id: "rec-1" } as EntityData;
export const OTHER_SAVED_RECORD = { id: "rec-2" } as EntityData;
/** An inline grid row that is not saved yet. */
export const UNSAVED_ROW = { id: "new_1" } as EntityData;
