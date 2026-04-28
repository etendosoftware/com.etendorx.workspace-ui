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

import { extractValue } from "@/utils/commons";
import {
  DEFAULT_DOCUMENTS_KEYS,
  DEFAULT_PROCESS_KEYS,
  DEFAULT_AD_CLIENT_ID_KEYS,
  DEFAULT_AD_ORG_ID_KEYS,
  DEFAULT_DOC_STATUS,
  DEFAULT_IS_PROCESSING,
  DEFAULT_AD_CLIENT_ID,
  DEFAULT_AD_ORG_ID,
  DEFAULT_POSTED_KEYS,
  REQUIRED_PARAMS_KEYS,
  DEFAULT_REQUIRED_PARAMS_KEYS,
  DEFAULT_BUSINESS_PARTNER_ID_KEYS,
  DEFAULT_BUSINESS_PARTNER_ID,
  DEFAULT_POSTED,
} from "@/utils/processes/manual/constants";
import type {
  GetParamsProps,
  KeyMapConfig,
  MappedValue,
  NestedObject,
  ProcessActionData,
  SelectionItem,
  SourceObject,
  TargetObject,
  TransformableValue,
} from "@/utils/processes/manual/types";
import type { ProcessActionButton } from "@/components/ProcessModal/types";
import type { ProcessAction } from "@workspaceui/api-client/src/api/types";

/**
 * Resolves the {@link ProcessActionData} needed to launch a legacy iframe process.
 *
 * Resolution order:
 * 1. Backend params — if the API returned `url`, `command`, `keyColumnName`, and
 *    `inpkeyColumnId` inside `button.processAction`, use those.
 * 2. data.json fallback — look up `button.id` in the static mapping.
 * 3. column-name fallback — search data.json for an entry whose `command` contains
 *    the button's column name (existing heuristic).
 * 4. Unresolvable — return `null`; callers should throw {@link LegacyProcessUnresolvedError}.
 */
export function resolveLegacyProcessData(
  button: ProcessActionButton,
  fallbackData: Record<string, ProcessActionData>
): ProcessActionData | null {
  const fromApi = tryResolveFromApi(button.processAction);
  if (fromApi) {
    return fromApi;
  }

  const fromJson = fallbackData[button.id];
  if (fromJson) {
    return fromJson;
  }

  const columnNameMatch = tryFallbackByColumnName(button, fallbackData);
  if (columnNameMatch) {
    return columnNameMatch;
  }

  return null;
}

function tryResolveFromApi(processAction: ProcessAction | undefined): ProcessActionData | null {
  if (!processAction) {
    return null;
  }
  const { url, command, keyColumnName, inpkeyColumnId, additionalParameters } = processAction;
  if (url && command && keyColumnName && inpkeyColumnId) {
    return { url, command, keyColumnName, inpkeyColumnId, additionalParameters };
  }
  return null;
}

function tryFallbackByColumnName(
  button: ProcessActionButton,
  fallbackData: Record<string, ProcessActionData>
): ProcessActionData | null {
  if (!button.columnName) {
    return null;
  }
  const fallbackKey = Object.keys(fallbackData).find(
    (key) => (fallbackData[key] as ProcessActionData).command?.includes(button.columnName as string)
  );
  return fallbackKey ? fallbackData[fallbackKey] : null;
}

export const getDocumentStatus = (record: Record<string, unknown>) => {
  return extractValue(record, DEFAULT_DOCUMENTS_KEYS, DEFAULT_DOC_STATUS);
};

export const getProcessing = (record: Record<string, unknown>) => {
  return extractValue(record, DEFAULT_PROCESS_KEYS, DEFAULT_IS_PROCESSING);
};

export const getAdClientId = (record: Record<string, unknown>) => {
  return extractValue(record, DEFAULT_AD_CLIENT_ID_KEYS, DEFAULT_AD_CLIENT_ID);
};

export const getAdOrgId = (record: Record<string, unknown>) => {
  return extractValue(record, DEFAULT_AD_ORG_ID_KEYS, DEFAULT_AD_ORG_ID);
};

export const getBusinessPartnerId = (record: Record<string, unknown>) => {
  return extractValue(record, DEFAULT_BUSINESS_PARTNER_ID_KEYS, DEFAULT_BUSINESS_PARTNER_ID);
};

export const checkIfRecordIsPosted = (record: Record<string, unknown>) => {
  return extractValue(record, DEFAULT_POSTED_KEYS, DEFAULT_POSTED);
};

/**
 * Converts a DB column name to Classic's inp* parameter name.
 * e.g. "Fin_Payment_Proposal_ID" → "inpfinPaymentProposalId"
 *      "C_Order_ID"              → "inpcOrderId"
 */
export const columnNameToInpKey = (columnName: string): string => {
  const camel = columnName
    .split("_")
    .map((segment, i) => {
      const lower = segment.toLowerCase();
      if (i === 0) return lower;
      // Capitalize first letter; keep "id" as "Id"
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
  return `inp${camel}`;
};

const RECORD_PLACEHOLDER_PREFIX = "$record.";
const COERCION_SEPARATOR = "!";

type Coercion = "yn" | "date";

/**
 * Parses a `$record.<property>[!coercion]` placeholder. Returns the property name and
 * optional coercion hint emitted by the backend (`!yn` for boolean Y/N columns,
 * `!date` for pure-date columns). Pass-through everything else.
 */
function parseRecordPlaceholder(raw: string): { property: string; coercion?: Coercion } | null {
  if (!raw.startsWith(RECORD_PLACEHOLDER_PREFIX)) return null;
  const body = raw.slice(RECORD_PLACEHOLDER_PREFIX.length);
  const sepIdx = body.indexOf(COERCION_SEPARATOR);
  if (sepIdx < 0) return { property: body };
  return { property: body.slice(0, sepIdx), coercion: body.slice(sepIdx + 1) as Coercion };
}

/**
 * Coerces a record value into the form Etendo Classic's WAD servlet expects.
 * Returns {@code null} when no value can be derived — callers MUST treat this as
 * "leave the previously-set URL param untouched" to avoid wiping hardcoded values.
 */
function coerceRecordValue(value: unknown, coercion: Coercion | undefined): string | null {
  if (value === undefined || value === null) return null;
  if (coercion === "yn") {
    if (typeof value === "boolean") return value ? "Y" : "N";
    if (value === "Y" || value === "N") return value;
    return null;
  }
  if (coercion === "date") {
    const s = String(value);
    if (!s) return null;
    // SmartClient ships dates as "YYYY-MM-DD" or full ISO "YYYY-MM-DDTHH:..."; classic
    // expects dd-mm-yyyy. Bail out unchanged if no recognisable ISO prefix.
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    return match ? `${match[3]}-${match[2]}-${match[1]}` : s;
  }
  if (value === "") return null;
  return String(value);
}

export const getParams = ({
  processAction,
  record,
  recordId,
  windowId,
  tabId,
  tableId,
  token,
  isPostedProcess,
}: GetParamsProps & { processAction?: ProcessActionData }): URLSearchParams => {
  const processActionData = processAction;

  if (!processActionData) {
    return new URLSearchParams();
  }

  const commandAction = processActionData.command;
  const docStatus = getDocumentStatus(record);
  const isProcessing = getProcessing(record);
  const adClientId = getAdClientId(record);
  const adOrgId = getAdOrgId(record);
  const businessPartnerId = getBusinessPartnerId(record);
  const isPostedRecord = checkIfRecordIsPosted(record);

  const params = new URLSearchParams();

  params.append(REQUIRED_PARAMS_KEYS.isPopUpCall, DEFAULT_REQUIRED_PARAMS_KEYS.isPopUpCall);
  params.append(REQUIRED_PARAMS_KEYS.command, commandAction);
  const inpKeyName = processActionData.inpKeyName ?? columnNameToInpKey(processActionData.inpkeyColumnId);
  params.append(inpKeyName, recordId);
  params.append(REQUIRED_PARAMS_KEYS.inpKey, recordId);
  params.append(REQUIRED_PARAMS_KEYS.inpWindowId, windowId);
  params.append(REQUIRED_PARAMS_KEYS.inpwindowId, windowId);
  params.append(REQUIRED_PARAMS_KEYS.inpTabId, tabId);
  params.append(REQUIRED_PARAMS_KEYS.inpTableId, tableId);
  params.append(REQUIRED_PARAMS_KEYS.inpcBpartnerId, businessPartnerId);
  params.append(REQUIRED_PARAMS_KEYS.inpadClientId, adClientId);
  params.append(REQUIRED_PARAMS_KEYS.inpadOrgId, adOrgId);
  params.append(REQUIRED_PARAMS_KEYS.inpkeyColumnId, processActionData.inpkeyColumnId);
  params.append(REQUIRED_PARAMS_KEYS.keyColumnName, processActionData.keyColumnName);
  params.append(REQUIRED_PARAMS_KEYS.inpdocstatus, docStatus);
  params.append(REQUIRED_PARAMS_KEYS.inpprocessing, isProcessing);
  params.append(REQUIRED_PARAMS_KEYS.inpposted, isPostedRecord);

  if (processActionData.additionalParameters) {
    const literalPlaceholders: Record<string, string> = {
      $recordId: recordId,
      $windowId: windowId,
      $tabId: tabId,
      $tableId: tableId,
    };

    for (const [key, raw] of Object.entries(processActionData.additionalParameters)) {
      let resolved: string | null;
      if (raw in literalPlaceholders) {
        resolved = literalPlaceholders[raw];
      } else {
        const parsed = parseRecordPlaceholder(raw);
        resolved = parsed
          ? coerceRecordValue(record[parsed.property], parsed.coercion)
          : raw;
      }
      // Only override when we actually resolved a value. When the placeholder cannot
      // resolve (record property missing, value null, coercion impossible), preserve
      // whatever the hardcoded block above already set — that's the correct value
      // (e.g. inpadClientId, inpfinFinaccTransactionId).
      if (resolved !== null) params.set(key, resolved);
    }
  }

  if (isPostedProcess) {
    params.append(REQUIRED_PARAMS_KEYS.inpdocaction, DEFAULT_REQUIRED_PARAMS_KEYS.inpodcStatusPosted);
  } else {
    params.append(REQUIRED_PARAMS_KEYS.inpdocaction, DEFAULT_REQUIRED_PARAMS_KEYS.inpdocStatus);
  }

  if (token) {
    params.append(REQUIRED_PARAMS_KEYS.token, token);
  }

  return params;
};

const KEY_MAP: KeyMapConfig = {
  inpporeference: { target: "POReference", default: "" },
  inpcCurrencyId: { target: "c_currency_id", default: null },
  inpcBpartnerId: { target: "received_from", default: null },
  "Payment Document No": { target: "payment_documentno", default: null },
  "Payment Document No.": { target: "payment_documentno", default: null },
  "Actual Payment": { target: "actual_payment", default: 0 },
  "Conversion Rate": { target: "conversion_rate", default: 0 },
  "Overpayment Action": { target: "overpayment_action", default: null },
  "Received From": { target: "received_from", default: null },
  "Payment Method": { target: "fin_paymentmethod_id", default: null },
  Currency: { target: "c_currency_id", default: null },
  "Sales Transaction": { target: "issotrx", default: false },
  "Payment Date": { target: "payment_date", default: undefined },
  inpfinPaymentmethodId: { target: "fin_paymentmethod_id", default: null },
  fin_payment_id: { target: "fin_payment_id", default: null },
  inpgrandtotal: { target: "actual_payment", default: 0 },
  inppaymentdate: { target: "payment_date", default: undefined },
  inpPaymentDate: { target: "payment_date", default: undefined },
  inpdateacct: { target: "payment_date", default: undefined },
  inptotallines: { target: "amount_inv_ords", default: 0 },
  inpissotrx: { target: "issotrx", default: false },
  inpcOrderId: { target: "c_order_id", default: null },
  DOCBASETYPE: { target: "DOCBASETYPE", default: "ARR" },
  inpadOrgId: { target: "ad_org_id", default: null },
  converted_amount: { target: "conversion_rate", default: 0 },
  conversion_rate: { target: "conversion_rate", default: 0 },
  "Action Regarding Document": { target: "document_action", default: null },
  reference_no: { target: "reference_no", default: "" },
  POReference: { target: "POReference", default: "" },
  "Converted Amount": { target: "converted_amount", default: null },
  "Deposit To": { target: "fin_financial_account_id", default: null },
  "Invoice Date": { target: "invoiceDate", default: undefined },
  "Lines Include Taxes": { target: "linesIncludeTaxes", default: false },
  overpayment_action: { target: "overpayment_action", default: null },
};

function resolveRawValue(key: string, value: MappedValue): MappedValue {
  const resolved = value !== "" && value !== undefined ? value : KEY_MAP[key]?.default;
  if (resolved === "Y") return true;
  if (resolved === "N") return false;
  return resolved;
}

// Skip date fields that have no valid value — the server cannot parse "" or null as a date
const DATE_TARGETS = new Set(["payment_date", "invoiceDate"]);
function isEmptyDateField(target: string, value: MappedValue): boolean {
  return DATE_TARGETS.has(target) && (value === "" || value === undefined);
}

function recursiveUpdateSelection(obj: NestedObject, parentActualPayment?: number): void {
  if (!obj || typeof obj !== "object") return;

  const currentActualPayment = obj.actual_payment ?? parentActualPayment;

  for (const [key, value] of Object.entries(obj)) {
    if (key === "_selection" && Array.isArray(value)) {
      obj[key] = value.map((item: SelectionItem) => ({
        ...item,
        amount: item.amount ?? currentActualPayment ?? 0,
      }));
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      recursiveUpdateSelection(value as NestedObject, currentActualPayment);
    }
  }
}

export function mapKeysWithDefaults(source: SourceObject): TargetObject {
  const result: TargetObject = {};

  for (const [key, value] of Object.entries(source)) {
    const mappedValue = resolveRawValue(key, value);
    if (KEY_MAP[key]) {
      if (!isEmptyDateField(KEY_MAP[key].target, mappedValue)) {
        result[KEY_MAP[key].target] = mappedValue;
      }
    } else {
      result[key] = mappedValue;
    }
  }

  for (const { target, default: defaultValue } of Object.values(KEY_MAP)) {
    if (!(target in result) && defaultValue !== undefined) {
      result[target] = defaultValue;
    }
  }

  recursiveUpdateSelection(result as NestedObject);

  return transformDates(result) as TargetObject;
}

export function transformDates(obj: TransformableValue): TransformableValue {
  if (typeof obj === "string") {
    const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
    return dateRegex.test(obj) ? obj.replace(dateRegex, "$3-$2-$1") : obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(transformDates) as SelectionItem[];
  }
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, transformDates(value as TransformableValue)])
    ) as NestedObject;
  }
  return obj;
}
