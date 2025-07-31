import {
  type EntityData,
  type Field,
  FieldType,
  FormMode,
  type Tab,
  type WindowMetadata,
} from "@workspaceui/api-client/src/api/types";

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getFieldReference = (reference?: string): FieldType => {
  switch (reference) {
    case "10":
      return FieldType.DATETIME;
    case "19":
    case "95E2A8B50A254B2AAE6774B8C2F28120":
    case "18":
      return FieldType.TABLEDIR;
    case "15":
    case "16":
      return FieldType.DATE;
    case "20":
      return FieldType.BOOLEAN;
    case "29":
      return FieldType.QUANTITY;
    case "17":
    case "13":
      return FieldType.LIST;
    case "28":
      return FieldType.BUTTON;
    case "30":
      return FieldType.SELECT;
    case "FF80818132D8F0F30132D9BC395D0038":
      return FieldType.WINDOW;
    default:
      return FieldType.TEXT;
  }
};

export const sanitizeValue = (value: unknown, field?: Field) => {
  const reference = getFieldReference(field?.column?.reference);

  if (reference === FieldType.DATE) {
    return value ? String(value).split("-").toReversed().join("-") : null;
  }

  const stringValue = String(value);

  const valueMap = {
    true: "Y",
    false: "N",
    null: null,
  } as const;

  const safeValue = Object.prototype.hasOwnProperty.call(valueMap, stringValue)
    ? valueMap[stringValue as keyof typeof valueMap]
    : value;

  return safeValue;
};

export const buildPayloadByInputName = (values?: Record<string, unknown> | null, fields?: Record<string, Field>) => {
  if (!values) return null;

  return Object.entries(values).reduce(
    (acc, [key, value]) => {
      const field = fields?.[key];
      const newKey = field?.inputName ?? key;

      acc[newKey] = sanitizeValue(value, field);

      return acc;
    },
    {} as Record<string, unknown>
  );
};

export const parseDynamicExpression = (expr: string) => {
  const expr1 = expr.replace(/OB\.Utilities\.getValue\((\w+),\s*["']([^"']+)["']\)/g, (_, obj, prop) => {
    return `${obj}["${prop}"]`;
  });

  const expr2 = expr1.replace(/context\.(\$?\w+)/g, (_, prop) => {
    return `context.${prop}`;
  });

  const expr3 = expr2.replace(/context\[\s*(['"])([^"'\]]+)\1\s*\]/g, (_, quote, prop) => {
    return `context[${quote}${prop}${quote}]`;
  });

  const expr4 = expr3.replace(/context\[\s*(['"])(.*?)\1\s*\]/g, (_, quote, key) => {
    return `context[${quote}${key}${quote}]`;
  });

  return expr4;
};

export const buildQueryString = ({
  mode,
  windowMetadata,
  tab,
}: {
  windowMetadata?: WindowMetadata;
  tab: Tab;
  mode: FormMode;
}) =>
  new URLSearchParams({
    windowId: String(windowMetadata?.id || ""),
    tabId: String(tab.id),
    moduleId: String(tab.module),
    _operationType: mode === FormMode.NEW ? "add" : "update",
    _noActiveFilter: String(true),
    sendOriginalIDBack: String(true),
    _extraProperties: "",
    Constants_FIELDSEPARATOR: "$",
    _className: "OBViewDataSource",
    Constants_IDENTIFIER: "_identifier",
    isc_dataFormat: "json",
  });

export const buildFormPayload = ({
  values,
  oldValues,
  mode,
  csrfToken,
}: {
  values: EntityData;
  oldValues?: EntityData;
  mode: FormMode;
  csrfToken: string;
}) => ({
  dataSource: "isc_OBViewDataSource_0",
  operationType: mode === FormMode.NEW ? "add" : "update",
  componentId: "isc_OBViewForm_0",
  data: {
    accountingDate: new Date(),
    ...values,
  },
  oldValues,
  csrfToken,
});

export const buildRequestOptions = (
  values: EntityData,
  initialState: EntityData,
  mode: FormMode,
  userId: string,
  signal: AbortSignal
) => ({
  signal,
  method: "POST",
  body: buildFormPayload({ values, oldValues: initialState, mode, csrfToken: userId }),
});

export const formatNumber = (value: number) => new Intl.NumberFormat(navigator.language).format(value);

export const formatTime = (input: string | Date): string => {
  const date = typeof input === "string" ? new Date(input) : input;
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const hoursStr = hours < 10 ? `0${hours}` : hours.toString();
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes.toString();

  return `${hoursStr}:${minutesStr}`;
};

export const getMessageType = (sender: string) => {
  if (sender === "error") {
    return "error";
  }
  if (sender === "user") {
    return "right-user";
  }
  return "left-user";
};

export const formatLabel = (label: string, count?: number): string | undefined => {
  if (label.includes("%s") && count !== undefined) {
    return label.replace("%s", String(count));
  }
  return undefined;
};

export { shouldShowTab, type TabWithParentInfo } from "./tabUtils";
