export const COPY_FROM_ORDER_PROCESS_ID = "8B81D80B06364566B87853FEECAB5DE0";
export const CREATE_LINES_FROM_ORDER_PROCESS_ID = "AB2EFCAABB7B4EC0A9B30CFB82963FB6";

export const PROCESS_DEFINITION_DATA = {
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
