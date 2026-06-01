import { buildProcessSelectorOverlay } from "../useTableDirDatasource";

const FIELD_ID = "F572144B1ABF4C31B971DC0B0108F91B";
const PROCESS_ID = "60F1E2DEB1B544908CDD4CF99ACA80EB";
const COLUMN_NAME = "payment_method";

const baseField = {
  id: FIELD_ID,
  hqlName: COLUMN_NAME,
  columnName: COLUMN_NAME,
  name: "Payment Method",
} as any;

describe("buildProcessSelectorOverlay", () => {
  it("forwards raw process-parameter keys verbatim", () => {
    const overlay = buildProcessSelectorOverlay(baseField, {
      processId: PROCESS_ID,
      values: {
        payment_method: "X",
        received_in: true,
        paid_out: false,
        ad_org_id: "0",
      },
    });

    expect(overlay.payment_method).toBe("X");
    expect(overlay.received_in).toBe(true);
    expect(overlay.paid_out).toBe(false);
    expect(overlay.ad_org_id).toBe("0");
  });

  it("adds the four meta keys Classic emits in prepareDSRequest", () => {
    const overlay = buildProcessSelectorOverlay(baseField, {
      processId: PROCESS_ID,
      values: {},
    });

    expect(overlay._processDefinitionId).toBe(PROCESS_ID);
    expect(overlay._selectorFieldId).toBe(FIELD_ID);
    expect(overlay.columnName).toBe(COLUMN_NAME);
    expect(overlay.IsSelectorItem).toBe(true);
  });

  it("derives _org and inpadOrgId from ad_org_id when present", () => {
    const overlay = buildProcessSelectorOverlay(baseField, {
      processId: PROCESS_ID,
      values: { ad_org_id: "0" },
    });

    expect(overlay._org).toBe("0");
    expect(overlay.inpadOrgId).toBe("0");
  });

  it("omits _org / inpadOrgId when ad_org_id is missing", () => {
    const overlay = buildProcessSelectorOverlay(baseField, {
      processId: PROCESS_ID,
      values: { payment_method: "X" },
    });

    expect(overlay).not.toHaveProperty("_org");
    expect(overlay).not.toHaveProperty("inpadOrgId");
  });

  it("omits _org / inpadOrgId when ad_org_id is an empty string", () => {
    const overlay = buildProcessSelectorOverlay(baseField, {
      processId: PROCESS_ID,
      values: { ad_org_id: "" },
    });

    expect(overlay).not.toHaveProperty("_org");
    expect(overlay).not.toHaveProperty("inpadOrgId");
  });

  it("prefers field.columnName (dBColumnName) over field.hqlName (display name) for columnName meta key", () => {
    // ProcessParameterMapper assigns the display name to `field.hqlName` and
    // the dBColumnName to `field.columnName`. Classic always sends the raw
    // dBColumnName, so the overlay must too.
    const overlay = buildProcessSelectorOverlay(baseField, {
      processId: PROCESS_ID,
      values: {},
    });
    expect(overlay.columnName).toBe(COLUMN_NAME);
  });

  it("falls back to hqlName when columnName is absent", () => {
    const fieldWithoutDbColumn = {
      id: FIELD_ID,
      hqlName: "fallback_hql",
      columnName: undefined,
      name: "Whatever",
    } as any;
    const overlay = buildProcessSelectorOverlay(fieldWithoutDbColumn, {
      processId: PROCESS_ID,
      values: {},
    });

    expect(overlay.columnName).toBe("fallback_hql");
  });

  it("uses field.name when both columnName and hqlName are absent", () => {
    const fieldOnlyName = {
      id: FIELD_ID,
      hqlName: undefined,
      columnName: undefined,
      name: "Only Name",
    } as any;
    const overlay = buildProcessSelectorOverlay(fieldOnlyName, {
      processId: PROCESS_ID,
      values: {},
    });

    expect(overlay.columnName).toBe("Only Name");
  });

  it("lets meta keys win over user-supplied collisions with the same name", () => {
    // Defensive check: if the form ever has a field literally named
    // `_processDefinitionId`, the meta key must override it.
    const overlay = buildProcessSelectorOverlay(baseField, {
      processId: PROCESS_ID,
      values: { _processDefinitionId: "SHOULD_NOT_LEAK" } as any,
    });

    expect(overlay._processDefinitionId).toBe(PROCESS_ID);
  });
});
