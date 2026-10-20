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
  BUSINESS_PARTNER_CATEGORY: { entity: "BusinessPartnerCategory", windowId: "192", tabId: "322" },
} as const satisfies Record<string, DatasourceTarget>;
