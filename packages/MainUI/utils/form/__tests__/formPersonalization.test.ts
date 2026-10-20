import type { FormPersonalizationForm } from "@workspaceui/api-client/src/api/formPersonalization";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { applyFormPersonalization, STATUS_BAR_GROUP } from "../formPersonalization";

const makeField = (hqlName: string, extra: Partial<Field> = {}): Field =>
  ({
    id: `id-${hqlName}`,
    hqlName,
    name: hqlName,
    displayed: true,
    sequenceNumber: 10,
    fieldGroup: "g1",
    fieldGroup$_identifier: "Group 1",
    fieldGroupName: "Group 1",
    shownInStatusBar: false,
    startnewline: false,
    obuiappColspan: null,
    obuiappRowspan: null,
    isFirstFocusedField: false,
    ...extra,
  }) as unknown as Field;

const fieldsOf = (...fields: Field[]): Record<string, Field> => Object.fromEntries(fields.map((f) => [f.hqlName, f]));

const formOf = (...fields: FormPersonalizationForm["fields"]): FormPersonalizationForm => ({ fields });

describe("applyFormPersonalization", () => {
  it("returns the same fields when there is nothing to apply", () => {
    const fields = fieldsOf(makeField("a"));

    expect(applyFormPersonalization(fields, null)).toBe(fields);
    expect(applyFormPersonalization(fields, undefined)).toBe(fields);
    expect(applyFormPersonalization(fields, formOf())).toBe(fields);
  });

  it("does not modify the original fields", () => {
    const original = makeField("a");
    const fields = fieldsOf(original);

    applyFormPersonalization(fields, formOf({ name: "a", hiddenInForm: true, colSpan: 2 }));

    expect(original.displayed).toBe(true);
    expect(original.obuiappColspan).toBeNull();
  });

  it("orders the fields by their position in the personalization", () => {
    const fields = fieldsOf(makeField("a", { sequenceNumber: 10 }), makeField("b", { sequenceNumber: 20 }));

    const result = applyFormPersonalization(fields, formOf({ name: "b" }, { name: "a" }));

    expect(result.b.sequenceNumber).toBeLessThan(result.a.sequenceNumber as number);
  });

  it("returns the fields in the personalized order, which is the order the form draws them in", () => {
    const fields = fieldsOf(makeField("a"), makeField("b"), makeField("c"), makeField("d"));

    const result = applyFormPersonalization(fields, formOf({ name: "c" }, { name: "a" }));

    expect(Object.keys(result)).toEqual(["c", "a", "b", "d"]);
  });

  it("keeps the dictionary's order among the fields it does not mention", () => {
    const fields = fieldsOf(makeField("a"), makeField("b"), makeField("c"), makeField("d"));

    const result = applyFormPersonalization(fields, formOf({ name: "d" }));

    expect(Object.keys(result)).toEqual(["d", "a", "b", "c"]);
  });

  it("keeps the fields it does not mention after the personalized ones, in their own order", () => {
    const fields = fieldsOf(
      makeField("a", { sequenceNumber: 10 }),
      makeField("x", { sequenceNumber: 30 }),
      makeField("y", { sequenceNumber: 20 })
    );

    const result = applyFormPersonalization(fields, formOf({ name: "a" }));

    expect(result.a.sequenceNumber).toBeLessThan(result.y.sequenceNumber as number);
    expect(result.y.sequenceNumber).toBeLessThan(result.x.sequenceNumber as number);
  });

  it("hides a field the personalization hides", () => {
    const result = applyFormPersonalization(fieldsOf(makeField("a")), formOf({ name: "a", hiddenInForm: true }));

    expect(result.a.displayed).toBe(false);
  });

  it("never shows a field the dictionary does not display", () => {
    const fields = fieldsOf(makeField("a", { displayed: false }));

    const result = applyFormPersonalization(fields, formOf({ name: "a", hiddenInForm: false }));

    expect(result.a.displayed).toBe(false);
  });

  it("moves a field to another section, taking the label of the section", () => {
    const fields = fieldsOf(makeField("a"), makeField("b", { fieldGroup: "g2", fieldGroup$_identifier: "Group 2" }));

    const result = applyFormPersonalization(
      fields,
      formOf(
        { name: "g2", isSection: true, title: "Renamed" },
        { name: "a", parentName: "g2" },
        { name: "b", parentName: "g2" }
      )
    );

    expect(result.a.fieldGroup).toBe("g2");
    expect(result.a.fieldGroupName).toBe("Renamed");
    expect(result.a.fieldGroup$_identifier).toBe("Renamed");
  });

  it("takes the label of a section from the other fields when the personalization has no title", () => {
    const fields = fieldsOf(
      makeField("a"),
      makeField("b", { fieldGroup: "g2", fieldGroup$_identifier: "Group 2", fieldGroupName: "Group 2" })
    );

    const result = applyFormPersonalization(fields, formOf({ name: "a", parentName: "g2" }));

    expect(result.a.fieldGroupName).toBe("Group 2");
  });

  it("applies whether a section starts expanded", () => {
    const fields = fieldsOf(makeField("a"));

    const collapsed = applyFormPersonalization(
      fields,
      formOf({ name: "g1", isSection: true, sectionExpanded: false }, { name: "a", parentName: "g1" })
    );
    const expanded = applyFormPersonalization(
      fields,
      formOf({ name: "g1", isSection: true, sectionExpanded: true }, { name: "a", parentName: "g1" })
    );

    expect(collapsed.a.fieldGroupCollapsed).toBe(true);
    expect(expanded.a.fieldGroupCollapsed).toBe(false);
  });

  it("applies column span, row span and row start", () => {
    const result = applyFormPersonalization(
      fieldsOf(makeField("a")),
      formOf({ name: "a", colSpan: 2, rowSpan: 3, startRow: true })
    );

    expect(result.a.obuiappColspan).toBe(2);
    expect(result.a.obuiappRowspan).toBe(3);
    expect(result.a.startnewline).toBe(true);
  });

  it("keeps the dictionary values for the layout properties the personalization leaves out", () => {
    const fields = fieldsOf(makeField("a", { obuiappColspan: 2, startnewline: true }));

    const result = applyFormPersonalization(fields, formOf({ name: "a" }));

    expect(result.a.obuiappColspan).toBe(2);
    expect(result.a.startnewline).toBe(true);
  });

  it.each([
    [0, 1],
    [5, 3],
    [2.4, 2],
  ])("keeps a column span of %s within the columns the form has (%s)", (colSpan, expected) => {
    const result = applyFormPersonalization(fieldsOf(makeField("a")), formOf({ name: "a", colSpan }));

    expect(result.a.obuiappColspan).toBe(expected);
  });

  it("puts a field in the status bar, and takes it out when it is no longer there", () => {
    const fields = fieldsOf(makeField("a"), makeField("b", { shownInStatusBar: true }));

    const result = applyFormPersonalization(
      fields,
      formOf({ name: "a", isStatusBarField: true }, { name: "b", parentName: "g1" })
    );

    expect(result.a.shownInStatusBar).toBe(true);
    expect(result.b.shownInStatusBar).toBe(false);
  });

  it("treats the status bar group as the status bar", () => {
    const result = applyFormPersonalization(
      fieldsOf(makeField("a")),
      formOf({ name: "a", parentName: STATUS_BAR_GROUP })
    );

    expect(result.a.shownInStatusBar).toBe(true);
    expect(result.a.fieldGroup).toBe("g1");
  });

  it("moves the initial focus to the field marked in the personalization", () => {
    const fields = fieldsOf(makeField("a", { isFirstFocusedField: true }), makeField("b"));

    const result = applyFormPersonalization(fields, formOf({ name: "a" }, { name: "b", firstFocus: true }));

    expect(result.a.isFirstFocusedField).toBe(false);
    expect(result.b.isFirstFocusedField).toBe(true);
  });

  it("keeps the dictionary's initial focus when the personalization marks none", () => {
    const fields = fieldsOf(makeField("a", { isFirstFocusedField: true }), makeField("b"));

    const result = applyFormPersonalization(fields, formOf({ name: "a" }, { name: "b" }));

    expect(result.a.isFirstFocusedField).toBe(true);
    expect(result.b.isFirstFocusedField).toBe(false);
  });

  it("uses the first record when a field appears twice", () => {
    const result = applyFormPersonalization(
      fieldsOf(makeField("a")),
      formOf({ name: "a", colSpan: 2 }, { name: "a", colSpan: 3 })
    );

    expect(result.a.obuiappColspan).toBe(2);
  });

  it("ignores records of fields the tab does not have", () => {
    const result = applyFormPersonalization(
      fieldsOf(makeField("a")),
      formOf({ name: "gone", hiddenInForm: true }, { name: "a" })
    );

    expect(Object.keys(result)).toEqual(["a"]);
  });
});
