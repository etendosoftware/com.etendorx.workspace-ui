export interface SmartClientPayload {
  dataSource?: string;
  operationType?: string;
  componentId?: string;
  csrfToken?: string;
  data?: unknown;
  oldValues?: unknown;
}

export interface EncodedPayload {
  body: string;
  headers: Record<string, string>;
}

// Convert SmartClient JSON payload to application/x-www-form-urlencoded
export function encodeDatasourcePayload(json: SmartClientPayload): EncodedPayload {
  const form = new URLSearchParams();
  const headers: Record<string, string> = {
  };

  if (json.dataSource) form.set('dataSource', String(json.dataSource));
  if (json.operationType) form.set('operationType', String(json.operationType));
  if (json.componentId) form.set('componentId', String(json.componentId));
  if (json.csrfToken) {
    form.set('csrfToken', String(json.csrfToken));
    headers['X-CSRF-Token'] = String(json.csrfToken);
  }

  if (typeof json.data !== 'undefined') {
    form.set('data', JSON.stringify(json.data));
  }
  if (typeof json.oldValues !== 'undefined') {
    form.set('oldValues', JSON.stringify(json.oldValues));
  }

  return { body: form.toString(), headers };
}

