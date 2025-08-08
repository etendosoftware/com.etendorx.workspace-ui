import type { ProcessDefaultsResponse } from "../components/ProcessModal/types/ProcessParameterExtensions";
import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";

export const createMockParameters = (): ProcessParameter[] => [
  {
    id: "1",
    name: "trxtype",
    reference: "String",
    mandatory: false,
    defaultValue: "",
    refList: [],
  } as unknown as ProcessParameter,
  {
    id: "2",
    name: "ad_org_id",
    reference: "Search",
    mandatory: true,
    defaultValue: "",
    refList: [],
  } as unknown as ProcessParameter,
  {
    id: "3",
    name: "actual_payment",
    reference: "Amount",
    mandatory: false,
    defaultValue: "",
    refList: [],
  } as unknown as ProcessParameter,
  {
    id: "4",
    name: "issotrx",
    reference: "Boolean",
    mandatory: false,
    defaultValue: "",
    refList: [],
  } as unknown as ProcessParameter,
];

export const createMockProcessDefaults = (): ProcessDefaultsResponse => ({
  defaults: {
    trxtype: "",
    ad_org_id: {
      value: "E443A31992CB4635AFCAEABE7183CE85",
      identifier: "F&B España - Región Norte",
    },
    bslamount: "",
    payment_documentno: "<1000373>",
    actual_payment: "1.85",
    issotrx: true,
    StdPrecision: "2",
    trxtype_display_logic: "N",
    ad_org_id_display_logic: "N",
    actual_payment_readonly_logic: "N",
    received_from_readonly_logic: "Y",
  },
  filterExpressions: {
    order_invoice: {
      paymentMethodName: "Transferencia",
    },
    glitem: {},
    credit_to_use: {},
  },
  refreshParent: true,
});

export const createBooleanDefaults = (field = "test_boolean"): ProcessDefaultsResponse => ({
  defaults: {
    [field]: "Y",
  },
  filterExpressions: {},
  refreshParent: false,
});

export const createMinimalDefaultsForForm = (): ProcessDefaultsResponse => ({
  defaults: {
    trxtype: "",
    ad_org_id: {
      value: "E443A31992CB4635AFCAEABE7183CE85",
      identifier: "F&B España - Región Norte",
    },
    actual_payment: "1.85",
    issotrx: true,
    trxtype_display_logic: "N",
    actual_payment_readonly_logic: "N",
  },
  filterExpressions: {},
  refreshParent: false,
});

