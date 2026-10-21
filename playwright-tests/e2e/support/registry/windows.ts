/**
 * Window registry: how to reach every window the specs open from the sidebar.
 *
 * `menuId` is the AD_Menu_ID rendered as `data-testid="MenuTitle__<menuId>"`, a stable domain
 * id. `search` is the text typed in the sidebar search box to make the entry visible.
 * `landing` is what proves the window opened: its name in the breadcrumb (the default) or,
 * for list-only views without a form tab, the grid header.
 */
export type WindowLanding = "breadcrumb" | "grid";

export interface WindowEntry {
  /** Text typed in the sidebar search box. */
  search: string;
  /** AD_Menu_ID of the menu entry. */
  menuId: string;
  /** Breadcrumb text of the opened window. */
  breadcrumb: RegExp;
  /** UI state that proves the window opened. Defaults to "breadcrumb". */
  landing?: WindowLanding;
}

export const WINDOWS = {
  // ── Master data ──────────────────────────────────────────────────────────
  attributeSet: { search: "att", menuId: "353", breadcrumb: /Attribute Set/i },
  businessPartner: { search: "busi", menuId: "110", breadcrumb: /Business Partner/i },
  businessPartnerCategory: { search: "busine", menuId: "232", breadcrumb: /Business Partner Category/i },
  client: { search: "client", menuId: "148", breadcrumb: /Client/i },
  invoiceSchedule: { search: "invoi", menuId: "133", breadcrumb: /Invoice Schedule/i },
  paymentTerm: { search: "paym", menuId: "127", breadcrumb: /Payment Term/i },
  priceList: { search: "price", menuId: "132", breadcrumb: /Price List/i },
  priceListSchema: { search: "price", menuId: "310", breadcrumb: /Price List Schema/i },
  product: { search: "produ", menuId: "126", breadcrumb: /Product/i },
  productCategory: { search: "produc", menuId: "130", breadcrumb: /Product Category/i },
  taxCategory: { search: "tax", menuId: "124", breadcrumb: /Tax Category/i },
  unitOfMeasure: { search: "unit", menuId: "107", breadcrumb: /Unit of Measure/i },
  user: { search: "us", menuId: "147", breadcrumb: /User/i },

  // ── Sales ────────────────────────────────────────────────────────────────
  salesOrder: { search: "sales", menuId: "129", breadcrumb: /Sales Order/i },
  goodsShipment: { search: "goods S", menuId: "180", breadcrumb: /Goods Shipment/i },
  salesInvoice: { search: "sales i", menuId: "178", breadcrumb: /Sales Invoice/i },

  // ── Procurement ──────────────────────────────────────────────────────────
  purchaseOrder: { search: "purcha", menuId: "205", breadcrumb: /Purchase Order/i },
  goodsReceipt: { search: "goods r", menuId: "204", breadcrumb: /Goods Receipt/i },
  purchaseInvoice: { search: "purcha", menuId: "206", breadcrumb: /Purchase Invoice/i },
  requisition: { search: "requi", menuId: "800216", breadcrumb: /Requisition/i },
  manageRequisitions: { search: "requi", menuId: "1004400000", breadcrumb: /Manage Requisitions/i, landing: "grid" },
  landedCost: { search: "lande", menuId: "D0EB635DAB004B16B636122FEA516898", breadcrumb: /Landed Cost/i },

  // ── Pricing ──────────────────────────────────────────────────────────────
  discountsAndPromotions: { search: "discoun", menuId: "800117", breadcrumb: /Discounts and Promotions/i },

  // ── Financial ────────────────────────────────────────────────────────────
  paymentIn: { search: "payment", menuId: "DB84EB9507F34D9B802DDA0B1041B602", breadcrumb: /Payment In/i },
  paymentOut: { search: "payment", menuId: "C3BEE7BF3F5B44C3A24D24E3DC4870EC", breadcrumb: /Payment Out/i },
  paymentProposal: {
    search: "payment prop",
    menuId: "125E6EAD650841F69E2601C78F558AA1",
    breadcrumb: /Payment Proposal/i,
  },
  financialAccount: { search: "finan", menuId: "65C70CA5BB3A4F67B6B456C90F907917", breadcrumb: /Financial Account/i },

  // ── Financial setup ──────────────────────────────────────────────────────
  periodControl: {
    search: "open/close",
    menuId: "75B726735EA7497C9DB06E35B1CBFD86",
    breadcrumb: /Open\/Close Period Control/i,
    landing: "grid",
  },

  // ── General setup ────────────────────────────────────────────────────────
  currency: { search: "currency", menuId: "102", breadcrumb: /Currency/i },
  countryAndRegion: { search: "country", menuId: "109", breadcrumb: /Country and Region/i },
  processRequest: {
    search: "Process",
    menuId: "BE86736DF4AB4568A316A3922E6D6B7B",
    breadcrumb: /Process Request/i,
    landing: "grid",
  },
} as const satisfies Record<string, WindowEntry>;

export type WindowKey = keyof typeof WINDOWS;

/** AD_Window_ID of the windows whose metadata a spec intercepts (`support/processOverrides.ts`). */
export const WINDOW_IDS = {
  PAYMENT_IN: "E547CE89D4C04429B6340FFA44E70716",
  PERIOD_CONTROL: "E66E701CCBA14B8BA480CBDE37C50D7A",
  COUNTRY_AND_REGION: "122",
  SALES_ORDER: "143",
} as const;

/**
 * AD_Tab_ID of the tabs the specs scope their toolbar to (`toolbar.inTab`), where a header and
 * a child tab are on screen at once.
 */
export const TABS = {
  SALES_ORDER_HEADER: "186",
  SALES_ORDER_LINES: "187",
  FINANCIAL_ACCOUNT_TRANSACTION: "23691259D1BD4496BCC5F32645BCA4B9",
  PROCESS_REQUEST_MONITOR: "A22C68A803DA43D3AE1FFD51BBA3234A",
} as const;
