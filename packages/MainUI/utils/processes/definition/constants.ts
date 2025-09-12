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

export const COPY_FROM_ORDER_PROCESS_ID = "8B81D80B06364566B87853FEECAB5DE0";
export const CREATE_LINES_FROM_ORDER_PROCESS_ID = "AB2EFCAABB7B4EC0A9B30CFB82963FB6";
export const SERVERS_WINDOW_ID = "97A1BDAE0C074F2EB76B195ACA03E9AF";

/**
 * Configuración de procesos Java y ventanas especiales.
 * Esto permite centralizar toda la lógica dinámica
 * que se utiliza en la construcción de payloads.
 */
type ProcessDefinition = {
  inpColumnId: string;
  inpPrimaryKeyColumnId: string;
  defaultKeys: Record<string, string>;
  dynamicKeys: Record<string, string>;
  staticOptions: Record<string, unknown>;
};

type WindowDefinition = {
  key: string;
  value: (record: { id?: string } | null | undefined) => string | null;
};

export const PROCESS_DEFINITION_DATA: Record<string, ProcessDefinition> = {
  [COPY_FROM_ORDER_PROCESS_ID]: {
    inpColumnId: "C_Order_ID",
    inpPrimaryKeyColumnId: "inpcOrderId",
    defaultKeys: {
      ad_org_id: "org",
    },
    dynamicKeys: {},
    staticOptions: {},
  },
  [CREATE_LINES_FROM_ORDER_PROCESS_ID]: {
    inpColumnId: "C_Invoice_ID",
    inpPrimaryKeyColumnId: "inpcInvoiceId",
    defaultKeys: {},
    dynamicKeys: {
      invoiceClient: "@Invoice.client@",
      invoiceBusinessPartner: "@Invoice.businessPartner@",
      invoicePriceList: "@Invoice.priceList@",
      invoiceCurrency: "@Invoice.currency@",
    },
    staticOptions: {
      "@Invoice.salesTransaction@": true,
    },
  },
};

/**
 * Configuración de claves dinámicas asociadas a ventanas.
 */
export const WINDOW_SPECIFIC_KEYS: Record<string, WindowDefinition> = {
  [SERVERS_WINDOW_ID]: {
    key: "Smfsch_Servers_ID",
    value: (record) => record?.id || null,
  },
};
