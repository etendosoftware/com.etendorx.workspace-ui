import { TABS, WINDOW_IDS } from "./windows";

/**
 * Datasources the `api` fixture writes to: the entity of a tab and the window/tab ids its
 * datasource request carries (the backend applies the tab's rules to the write).
 */
export interface DatasourceTarget {
  /** Entity name (`AD_Table.Name`), the last segment of `/api/datasource/<entity>`. */
  entity: string;
  /** AD_Window_ID of the window the tab belongs to. */
  windowId: string;
  /** AD_Tab_ID of the tab. */
  tabId: string;
}

export const DATASOURCE = {
  COUNTRY: {
    entity: "Country",
    windowId: WINDOW_IDS.COUNTRY_AND_REGION,
    tabId: TABS.COUNTRY,
  },
  BANK_STATEMENT: {
    entity: "FIN_BankStatement",
    windowId: WINDOW_IDS.FINANCIAL_ACCOUNT,
    tabId: TABS.FINANCIAL_ACCOUNT_BANK_STATEMENT,
  },
  BANK_STATEMENT_LINE: {
    entity: "FIN_BankStatementLine",
    windowId: WINDOW_IDS.FINANCIAL_ACCOUNT,
    tabId: TABS.FINANCIAL_ACCOUNT_BANK_STATEMENT_LINE,
  },
  FINANCIAL_ACCOUNT_TRANSACTION: {
    entity: "FIN_Finacc_Transaction",
    windowId: WINDOW_IDS.FINANCIAL_ACCOUNT,
    tabId: TABS.FINANCIAL_ACCOUNT_TRANSACTION,
  },
  BUSINESS_PARTNER_CATEGORY: { entity: "BusinessPartnerCategory", windowId: "192", tabId: "322" },
  PREFERENCE: { entity: "ADPreference", windowId: "129", tabId: "156" },
  PRODUCT_CATEGORY: { entity: "ProductCategory", windowId: "144", tabId: "189" },
  SALES_ORDER: { entity: "Order", windowId: WINDOW_IDS.SALES_ORDER, tabId: TABS.SALES_ORDER_HEADER },
  PURCHASE_ORDER: { entity: "Order", windowId: "181", tabId: "294" },
  SALES_INVOICE: { entity: "Invoice", windowId: WINDOW_IDS.SALES_INVOICE, tabId: TABS.SALES_INVOICE_HEADER },
  SALES_INVOICE_LINE: { entity: "InvoiceLine", windowId: WINDOW_IDS.SALES_INVOICE, tabId: TABS.SALES_INVOICE_LINES },
  PRODUCT: { entity: "Product", windowId: WINDOW_IDS.PRODUCT, tabId: TABS.PRODUCT_HEADER },
  /** A value of a product characteristic, what the characteristics filter of the grid reads. */
  PRODUCT_CHARACTERISTIC_VALUE: {
    entity: "ProductCharacteristicValue",
    windowId: WINDOW_IDS.PRODUCT,
    tabId: TABS.PRODUCT_CHARACTERISTIC_VALUES,
  },
  /** A characteristic of a product (`M_Product_Ch`), which its characteristic description is built from. */
  PRODUCT_CHARACTERISTIC: {
    entity: "ProductCharacteristic",
    windowId: WINDOW_IDS.PRODUCT,
    tabId: TABS.PRODUCT_CHARACTERISTICS,
  },
  CHARACTERISTIC: {
    entity: "Characteristic",
    windowId: WINDOW_IDS.PRODUCT_CHARACTERISTIC,
    tabId: TABS.CHARACTERISTIC_HEADER,
  },
  CHARACTERISTIC_VALUE: {
    entity: "CharacteristicValue",
    windowId: WINDOW_IDS.PRODUCT_CHARACTERISTIC,
    tabId: TABS.CHARACTERISTIC_VALUE,
  },
} as const satisfies Record<string, DatasourceTarget>;
