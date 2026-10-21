/**
 * Test data catalog.
 *
 * Records a spec creates must not collide with the ones a previous run left in the database:
 * locally the database is reused, and `--repeat-each` runs a spec several times against the
 * same database. Every key or name a spec creates goes through {@link uniqueValue}.
 */

/** Workers run in parallel and may start in the same millisecond, so the worker index is part of the id. */
const MAX_WORKERS = 100;
const WORKER_INDEX = Number(process.env.TEST_WORKER_INDEX ?? 0) % MAX_WORKERS;

/** Identifies this run and worker; combined with a counter it makes every generated value unique. */
const RUN_ID = (Date.now() * MAX_WORKERS + WORKER_INDEX).toString(36);
let sequence = 0;

/**
 * Returns `base` with a suffix that is unique across runs and calls, e.g. `60d/10-2xk4m8q1za1`.
 * Keep `base` short: the suffix adds about 12 characters and search keys are usually limited to 40.
 * @param base - readable prefix that identifies the record in screenshots and traces.
 */
export function uniqueValue(base: string): string {
  sequence += 1;
  return `${base}-${RUN_ID}${sequence.toString(36)}`;
}

/** A record of the QA_Testing sample data: `id` feeds `OptionItem__<id>`, `name` is its display text. */
export interface SampleRecord {
  readonly id: string;
  readonly name: string;
}

/**
 * Records of the QA_Testing sample data the specs rely on. They exist in every freshly
 * installed database (`referencedata/sampledata/QA_Testing`); use them instead of inline ids.
 */
export const BUSINESS_PARTNER = {
  VENDOR_A: { id: "4028E6C72959682B01295F40BDDF02E3", name: "Vendor A" },
  VENDOR_B: { id: "4028E6C72959682B01295F40C2A202E7", name: "Vendor B" },
  CUSTOMER_A: { id: "4028E6C72959682B01295F40C3CB02EC", name: "Customer A" },
  CUSTOMER_BARCELONA: { id: "4028E6C72959682B01295F40CFE1031B", name: "Customer Barcelona" },
  EMPLOYEE_A: { id: "4028E6C72959682B01295F40C5CF02F5", name: "Employee A" },
} as const satisfies Record<string, SampleRecord>;

export const PRODUCT = {
  RAW_MATERIAL_A: { id: "4028E6C72959682B01295ADC1AD40222", name: "Raw material A" },
  RAW_MATERIAL_B: { id: "4028E6C72959682B01295ADC1B800224", name: "Raw material B" },
  FINAL_GOOD_A: { id: "4028E6C72959682B01295ADC1D07022A", name: "Final good A" },
  DISTRIBUTION_GOOD_A: { id: "4028E6C72959682B01295ADC2340023D", name: "Spain-Distribution good A" },
} as const satisfies Record<string, SampleRecord>;

export const PAYMENT_METHOD = {
  SPAIN_1: { id: "42E87E97974E4B35849A430B8F6F2884", name: "1 (Spain)" },
  SPAIN_4: { id: "BC79E3E914CF471C91AE183FC5311BE7", name: "4 (Spain)" },
} as const satisfies Record<string, SampleRecord>;

/** Discount/promotion types (M_Offer_Type) of the core. */
export const OFFER_TYPE = {
  PRICE_ADJUSTMENT: { id: "5D4BAF6BB86D4D2C9ED3D5A6FC051579", name: "Price Adjustment" },
} as const satisfies Record<string, SampleRecord>;

export const DOCUMENT_TYPE = {
  STANDARD_ORDER: { id: "FF8080812C2ABFC6012C2B3BDF4D005A", name: "Standard Order" },
} as const satisfies Record<string, SampleRecord>;

export const ROLE = {
  QA_TESTING_ADMIN: { id: "4028E6C72959682B01295A071429011E", name: "QA Testing Admin" },
  QA_TESTING_SALES_ADMIN: { id: "FA057013C10148828D2430F66F42EF1A", name: "QA Testing Sales Admin" },
} as const satisfies Record<string, SampleRecord>;

/** List values of process parameters (AD_Ref_List). */
export const LIST_VALUE = {
  PROCESS_MADE_PAYMENTS: { id: "DDCDE32A9FC046E694D5074144DD6AFF", name: "Process Made Payment(s)" },
  PROCESS_RECEIVED_PAYMENTS: { id: "7AC4F4FF644247B7BD320BBF67C4F066", name: "Process Received Payment(s)" },
} as const satisfies Record<string, SampleRecord>;

/** Process definitions (OBUIAPP_Process_ID) whose definition a spec overrides. */
export const PROCESS = {
  ADD_PAYMENT: "9BED7889E1034FE68BD85D5D16857320",
  /** Manual (client-side JS) process of the core: its classic handler is `OB.OpenClose.openClose`. */
  OPEN_CLOSE_PERIODS: "A832A5DA28FB4BB391BDE883E928DFC5",
} as const;

/**
 * Documents of the sample data a spec only reads, by document number. Each one stays in the
 * state described in every freshly installed database: no spec processes it.
 */
export const SAMPLE_DOCUMENT = {
  /** Sales invoice of Customer A, organization Spain, payment method "1 (Spain)", 4290.00 pending. */
  SALES_INVOICE_PENDING: "I/25",
  /** Accounting period of the sample calendar (Open/Close Period Control). */
  PERIOD_JAN_2011: "Jan-11",
  /** Sales order in Draft with four lines; specs clone it instead of changing it. */
  SALES_ORDER_DRAFT_WITH_LINES: "50014",
  /** Sales order in Draft with six lines (one of them "Transportation"). */
  SALES_ORDER_DRAFT_WITH_MORE_LINES: "50013",
  /** Sales order in Draft (two lines). */
  SALES_ORDER_DRAFT: "50015",
  /** Booked (Completed) sales order. */
  SALES_ORDER_COMPLETED: "50017",
} as const;

export const ORGANIZATION = {
  SPAIN: "Spain",
} as const;

/** AD_Org_ID of the sample organizations, for records the `api` fixture creates. */
export const ORGANIZATION_ID = {
  SPAIN: "357947E87C284935AD1D783CF6F099A1",
} as const;

/** A storage bin (locator): `id` is the M_Locator_ID, `value` its search key. */
export interface StorageBin {
  readonly id: string;
  readonly value: string;
}

/** Storage bins of the sample data. */
export const LOCATOR = {
  /** Spain warehouse (organization Spain). */
  L01: { id: "193476BDD14E4A11B651B4E3E8D767C8", value: "L01" },
} as const satisfies Record<string, StorageBin>;

/**
 * AD_Field_ID of the fields the specs reach by id (`TextInput__<id>`, `ChevronDown__<id>`), used
 * where a label repeats on screen, e.g. a line quantity while the header is shown.
 */
export const FIELD = {
  SALES_ORDER_LINE_QUANTITY: "1130",
  SALES_INVOICE_LINE_PRODUCT: "2996",
  SALES_INVOICE_LINE_QUANTITY: "2999",
  PURCHASE_ORDER_LINE_QUANTITY: "3389",
  PURCHASE_INVOICE_LINE_PRODUCT: "3371",
  PURCHASE_INVOICE_LINE_QUANTITY: "3374",
  PURCHASE_INVOICE_PAYMENT_METHOD: "830698140BCD4AC3E040007F01000289",
  PAYMENT_IN_RECEIVED_FROM: "7C541AC0C75CFDD7E040007F01016B4D",
  FINANCIAL_ACCOUNT_TRANSACTION_TYPE: "7019E1AFE07B44309AE2F0C6629C1251",
  LANDED_COST_AMOUNT: "0056819E516C679FE050007F01000569",
  LANDED_COST_RECEIPT_GOODS_RECEIPT: "00E613F204372E40E050007F01002A87",
  GOODS_RECEIPT_LINE_ATTRIBUTE_SET_VALUE: "6536",
} as const;
