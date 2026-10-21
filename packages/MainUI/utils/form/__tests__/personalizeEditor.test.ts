import type { Field } from "@workspaceui/api-client/src/api/types";
import { STATUS_BAR_GROUP } from "../formPersonalization";
import {
  buildEditorItems,
  canHideField,
  canShowInStatusBar,
  type EditorField,
  type EditorItem,
  editorItemsEqual,
  editorItemsToForm,
  moveEditorRow,
  MAIN_SECTION_ID,
  setFirstFocus,
  statusBarFields,
  updateEditorItem,
} from "../personalizeEditor";

const TITLES = { main: "Main Section", statusBar: "Status bar" };

const makeField = (hqlName: string, extra: Partial<Field> = {}): Field =>
  ({
    id: `id-${hqlName}`,
    hqlName,
    name: `Label ${hqlName}`,
    displayed: true,
    sequenceNumber: 10,
    shownInStatusBar: false,
    startnewline: false,
    obuiappColspan: null,
    obuiappRowspan: null,
    isFirstFocusedField: false,
    isMandatory: false,
    column: { reference: "10" },
    ...extra,
  }) as unknown as Field;

const fieldsOf = (...fields: Field[]): Record<string, Field> => Object.fromEntries(fields.map((f) => [f.hqlName, f]));

const ids = (items: EditorItem[]): string[] => items.map((item) => item.id);

const fieldItem = (items: EditorItem[], id: string): EditorField => {
  const found = items.find((item) => item.id === id);
  if (!found || found.kind !== "field") throw new Error(`no field ${id}`);
  return found;
};

describe("buildEditorItems", () => {
  it("lists the status bar first, then each section with its fields", () => {
    const fields = fieldsOf(
      makeField("a", { sequenceNumber: 10, fieldGroup: "g1", fieldGroupName: "Group 1" }),
      makeField("b", { sequenceNumber: 20, fieldGroup: "g2", fieldGroup$_identifier: "Group 2" }),
      makeField("c", { sequenceNumber: 30, shownInStatusBar: true })
    );

    const items = buildEditorItems(fields, null, TITLES);

    expect(ids(items)).toEqual([STATUS_BAR_GROUP, "c", "g1", "a", "g2", "b"]);
    expect(items.find((i) => i.id === "g1")).toMatchObject({ kind: "section", title: "Group 1", expanded: true });
  });

  it("puts the fields without a group in the main section", () => {
    const items = buildEditorItems(fieldsOf(makeField("a")), null, TITLES);

    expect(items[1]).toMatchObject({ kind: "section", id: MAIN_SECTION_ID, title: "Main Section" });
  });

  it("reports whether a section starts collapsed", () => {
    const items = buildEditorItems(
      fieldsOf(makeField("a", { fieldGroup: "g1", fieldGroupCollapsed: true })),
      null,
      TITLES
    );

    expect(items.find((i) => i.id === "g1")).toMatchObject({ expanded: false });
  });

  it("leaves out what the form does not offer: undisplayed fields, buttons and process actions", () => {
    const fields = fieldsOf(
      makeField("shown"),
      makeField("undisplayed", { displayed: false }),
      makeField("process", { processAction: {} as Field["processAction"] }),
      makeField("button", { column: { reference: "28" } as Field["column"] })
    );

    expect(ids(buildEditorItems(fields, null, TITLES))).toEqual([STATUS_BAR_GROUP, MAIN_SECTION_ID, "shown"]);
  });

  it("reads the layout of each field from the dictionary", () => {
    const fields = fieldsOf(
      makeField("a", {
        obuiappColspan: 2,
        obuiappRowspan: 3,
        startnewline: true,
        isFirstFocusedField: true,
        isMandatory: true,
      })
    );

    expect(fieldItem(buildEditorItems(fields, null, TITLES), "a")).toMatchObject({
      colSpan: 2,
      rowSpan: 3,
      startRow: true,
      firstFocus: true,
      mandatory: true,
      hidden: false,
      title: "Label a",
    });
  });

  it("reflects the personalization in effect, listing hidden fields as hidden", () => {
    const fields = fieldsOf(makeField("a"), makeField("b"));

    const items = buildEditorItems(
      fields,
      {
        fields: [
          { name: "b", parentName: MAIN_SECTION_ID },
          { name: "a", hiddenInForm: true, colSpan: 3 },
        ],
      },
      TITLES
    );

    expect(ids(items)).toEqual([STATUS_BAR_GROUP, MAIN_SECTION_ID, "b", "a"]);
    expect(fieldItem(items, "a")).toMatchObject({ hidden: true, colSpan: 3 });
    expect(fieldItem(items, "b").hidden).toBe(false);
  });
});

describe("buildEditorItems with a hidden status bar field", () => {
  it("lists the field in the status bar, hidden, so it can be shown again", () => {
    const fields = fieldsOf(
      makeField("a", { shownInStatusBar: true, displayed: false }),
      makeField("b", { shownInStatusBar: true, displayed: false })
    );
    const form = {
      fields: [
        { name: "a", parentName: STATUS_BAR_GROUP, isStatusBarField: true, hiddenInForm: true },
        { name: "b", parentName: STATUS_BAR_GROUP, isStatusBarField: true, hiddenInForm: true },
      ],
    };

    const items = buildEditorItems(fields, form, { main: "Main", statusBar: "Status bar" });

    expect(statusBarFields(items).map((f) => [f.id, f.hidden])).toEqual([
      ["a", true],
      ["b", true],
    ]);
  });
});

describe("buildEditorItems conditional fields", () => {
  it("flags the fields that have a display logic", () => {
    const fields = fieldsOf(makeField("a"), makeField("b", { displayLogic: "@x@='Y'" }));

    const items = buildEditorItems(fields, null, { main: "Main", statusBar: "Status bar" });

    expect(items.filter((i) => i.kind === "field").map((i) => [i.id, i.conditional])).toEqual([
      ["a", false],
      ["b", true],
    ]);
  });
});

describe("editorItemsToForm", () => {
  it("writes a section record for each section and the fields under it", () => {
    const items = buildEditorItems(
      fieldsOf(makeField("a", { fieldGroup: "g1", fieldGroupName: "Group 1" })),
      null,
      TITLES
    );

    expect(editorItemsToForm(items).fields).toEqual([
      { name: "g1", title: "Group 1", isSection: true, sectionExpanded: true },
      { name: "a", title: "Label a", parentName: "g1", hiddenInForm: false, colSpan: 1, startRow: false },
    ]);
  });

  it("writes the status bar fields as such, without a section for the bar", () => {
    const items = buildEditorItems(fieldsOf(makeField("s", { shownInStatusBar: true })), null, TITLES);

    expect(editorItemsToForm(items).fields).toEqual([
      {
        name: "s",
        title: "Label s",
        parentName: STATUS_BAR_GROUP,
        isStatusBarField: true,
        hiddenInForm: false,
        colSpan: 1,
        startRow: false,
      },
    ]);
  });

  it("keeps the row span and marks only the field that takes the focus", () => {
    const items = buildEditorItems(
      fieldsOf(makeField("a", { obuiappRowspan: 2 }), makeField("b", { isFirstFocusedField: true })),
      null,
      TITLES
    );

    const fields = editorItemsToForm(items).fields;

    expect(fields.find((f) => f.name === "a")).toMatchObject({ rowSpan: 2 });
    expect(fields.find((f) => f.name === "a")).not.toHaveProperty("firstFocus");
    expect(fields.find((f) => f.name === "b")).toMatchObject({ firstFocus: true });
  });

  it("assigns a field to the section above it, so moving it across a header moves it", () => {
    const items: EditorItem[] = [
      { kind: "section", id: STATUS_BAR_GROUP, title: "Status bar", expanded: true, statusBar: true },
      { kind: "section", id: "g1", title: "One", expanded: true },
      { kind: "section", id: "g2", title: "Two", expanded: false },
      { ...fieldItem(buildEditorItems(fieldsOf(makeField("a")), null, TITLES), "a") },
    ];

    const fields = editorItemsToForm(items).fields;

    expect(fields.find((f) => f.name === "a")).toMatchObject({ parentName: "g2" });
    expect(fields.find((f) => f.name === "g2")).toMatchObject({ sectionExpanded: false });
  });

  it("round-trips through the personalization: what it writes, it reads back the same", () => {
    const fields = fieldsOf(
      makeField("a", { fieldGroup: "g1", fieldGroupName: "G1", obuiappColspan: 2 }),
      makeField("b", { fieldGroup: "g1", fieldGroupName: "G1", startnewline: true }),
      makeField("c", { fieldGroup: "g2", fieldGroupName: "G2", shownInStatusBar: true }),
      makeField("d")
    );
    const first = buildEditorItems(fields, null, TITLES);
    const edited = setFirstFocus(updateEditorItem<EditorField>(first, "b", { hidden: true, colSpan: 3 }), "d");

    const form = editorItemsToForm(edited);
    const second = buildEditorItems(fields, form, TITLES);

    expect(editorItemsToForm(second)).toEqual(form);
  });
});

describe("editor row helpers", () => {
  const base = buildEditorItems(fieldsOf(makeField("a", { isFirstFocusedField: true }), makeField("b")), null, TITLES);

  it("moves the focus to one field and clears it on the others", () => {
    const items = setFirstFocus(base, "b");

    expect(fieldItem(items, "b").firstFocus).toBe(true);
    expect(fieldItem(items, "a").firstFocus).toBe(false);
  });

  it("updates one row without touching the rest, or the original list", () => {
    const items = updateEditorItem<EditorField>(base, "a", { hidden: true });

    expect(fieldItem(items, "a").hidden).toBe(true);
    expect(fieldItem(items, "b").hidden).toBe(false);
    expect(fieldItem(base, "a").hidden).toBe(false);
  });

  it("tells whether two lists would store the same personalization", () => {
    expect(editorItemsEqual(base, [...base])).toBe(true);
    expect(editorItemsEqual(base, updateEditorItem<EditorField>(base, "a", { colSpan: 2 }))).toBe(false);
    expect(editorItemsEqual(base, [...base].reverse())).toBe(false);
  });
});

describe("status bar rules", () => {
  const field = (extra: Partial<EditorField>): EditorField => ({
    kind: "field",
    id: "f",
    title: "F",
    hidden: false,
    colSpan: 1,
    startRow: false,
    firstFocus: false,
    mandatory: false,
    hasDefault: false,
    wasInStatusBar: false,
    conditional: false,
    ...extra,
  });

  it.each([
    [{}, true],
    [{ mandatory: true }, false],
    [{ mandatory: true, hasDefault: true }, true],
    [{ mandatory: true, wasInStatusBar: true }, true],
  ])("tells whether %j can be hidden or put in the status bar", (extra, expected) => {
    expect(canHideField(field(extra))).toBe(expected);
    expect(canShowInStatusBar(field(extra))).toBe(expected);
  });

  it("lists the fields between the status bar header and the first section", () => {
    const bar = field({ id: "bar" });
    const items: EditorItem[] = [
      { kind: "section", id: "_statusBar", title: "S", expanded: true, statusBar: true },
      bar,
      { kind: "section", id: "_main", title: "M", expanded: true },
      field({ id: "other" }),
    ];

    expect(statusBarFields(items)).toEqual([bar]);
  });
});

describe("moveEditorRow", () => {
  const sec = (id: string): EditorItem => ({ kind: "section", id, title: id, expanded: true });
  const fld = (id: string): EditorItem => ({
    kind: "field",
    id,
    title: id,
    hidden: false,
    colSpan: 1,
    startRow: false,
    firstFocus: false,
    mandatory: false,
    hasDefault: false,
    wasInStatusBar: false,
    conditional: false,
  });
  const ids = (rows: EditorItem[]) => rows.map((r) => r.id).join(",");
  // status bar field "s", then sections A (a1, a2), B (b1), C (c1, c2)
  const rows = [fld("s"), sec("A"), fld("a1"), fld("a2"), sec("B"), fld("b1"), sec("C"), fld("c1"), fld("c2")];

  it("moves a field alone", () => {
    expect(ids(moveEditorRow(rows, 2, 5))).toBe("s,A,a2,B,b1,a1,C,c1,c2");
  });

  it("moves a section with its fields, up", () => {
    // C (index 6) onto B's header (index 4)
    expect(ids(moveEditorRow(rows, 6, 4))).toBe("s,A,a1,a2,C,c1,c2,B,b1");
  });

  it("moves a section with its fields, down", () => {
    // A (index 1) onto B's field (index 5): after the whole of B
    expect(ids(moveEditorRow(rows, 1, 5))).toBe("s,B,b1,A,a1,a2,C,c1,c2");
  });

  it("sends a section up to before the section it was dropped inside of", () => {
    // C (index 6) onto A's field a2 (index 3)
    expect(ids(moveEditorRow(rows, 6, 3))).toBe("s,C,c1,c2,A,a1,a2,B,b1");
  });

  it("keeps a section out of the status bar", () => {
    // C (index 6) onto the status bar field (index 0)
    expect(ids(moveEditorRow(rows, 6, 0))).toBe("s,C,c1,c2,A,a1,a2,B,b1");
  });

  it("moves the only section without leaving the status bar fields", () => {
    const single = [fld("s"), sec("A"), fld("a1")];

    expect(ids(moveEditorRow(single, 1, 0))).toBe("s,A,a1");
  });

  it("leaves the rows alone when nothing moves", () => {
    expect(moveEditorRow(rows, 3, 3)).toBe(rows);
  });
});
