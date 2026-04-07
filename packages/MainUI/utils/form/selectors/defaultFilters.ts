import { Metadata } from "@workspaceui/api-client/src/api/metadata";

const KERNEL_ACTION_URL =
  "api/erp/org.openbravo.client.kernel?_action=org.openbravo.userinterface.selector.SelectorDefaultFilterActionHandler";

export interface SelectorCriteria {
  fieldName: string;
  operator: string;
  value: unknown;
}

export interface IdFilter {
  fieldName: string;
  id: string;
  _identifier: string;
}

export interface DefaultFilterResponse {
  idFilters?: IdFilter[];
  [key: string]: string | IdFilter[] | undefined;
}

/**
 * Fetches default filter values from SelectorDefaultFilterActionHandler.
 * Replicates the Classic two-step flow: fetch defaults → build criteria → datasource fetch.
 */
export async function fetchSelectorDefaultFilters(
  selectorDefinitionId: string,
  context: Record<string, unknown>
): Promise<DefaultFilterResponse> {
  const response = await Metadata.client.request(KERNEL_ACTION_URL, {
    method: "POST",
    body: {
      _selectorDefinitionId: selectorDefinitionId,
      ...context,
    },
  });

  return (response?.data ?? {}) as DefaultFilterResponse;
}

/**
 * Builds criteria array from SelectorDefaultFilterActionHandler response.
 *
 * For each non-empty field in the response:
 * - "filterExpression" → { operator: "iContains", fieldName: "filterExpression", value }
 * - other fields       → { fieldName, operator: "equals", value } (with "true"/"false" parsed to booleans)
 *
 * The _selectorDefinitionId criteria is always appended.
 */
export function buildCriteriaFromDefaults(
  defaults: DefaultFilterResponse,
  selectorDefinitionId: string
): SelectorCriteria[] {
  const criteria: SelectorCriteria[] = [];

  for (const [fieldName, rawValue] of Object.entries(defaults)) {
    if (fieldName === "idFilters") continue;
    if (rawValue === null || rawValue === undefined || rawValue === "") continue;

    if (fieldName === "filterExpression") {
      criteria.push({
        operator: "iContains",
        fieldName: "filterExpression",
        value: rawValue,
      });
    } else {
      let value: unknown = rawValue;
      if (rawValue === "true") value = true;
      else if (rawValue === "false") value = false;

      criteria.push({
        fieldName,
        operator: "equals",
        value,
      });
    }
  }

  // idFilters: each entry becomes an equals criteria using its id
  if (Array.isArray(defaults.idFilters)) {
    for (const filter of defaults.idFilters) {
      criteria.push({
        fieldName: filter.fieldName,
        operator: "equals",
        value: filter.id,
      });
    }
  }

  criteria.push({
    operator: "iContains",
    fieldName: "_selectorDefinitionId",
    value: selectorDefinitionId,
  });

  return criteria;
}
